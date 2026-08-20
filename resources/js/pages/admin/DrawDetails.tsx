import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    Link,
    useParams,
} from 'react-router-dom';

import StatusBadge from '../../components/StatusBadge';

import api from '../../services/api';

import type {
    ApiError,
} from '../../types/api';

import {
    formatDateTime,
    toDateTimeLocal,
} from '../../utils/date';

type Prize = {
    id: number;
    name: string;
    type: string;
    value: number | null;
    currency: string | null;
    total_quantity: number;
};

type DrawPrize = {
    id: number;
    draw_id: number;
    prize_id: number;
    quantity: number;
    prize: Prize;
};

type DrawEntry = {
    id: number;
    draw_id: number;
    receipt_id: number;
    entry_number: number;
    created_at: string;
    updated_at: string;
};

type WinnerParticipant = {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
};

type WinnerReceipt = {
    id: number;
    participant_id: number;
    receipt_number: string;
    status: string;
    participant?: WinnerParticipant;
};

type DrawWinner = {
    id: number;
    draw_id: number;
    draw_prize_id: number;
    receipt_id: number;
    entry_number: number;
    status: string;

    selected_at: string;
    confirmed_at: string | null;
    cancelled_at: string | null;

    cancellation_reason: string | null;
    replaced_winner_id: number | null;

    receipt: WinnerReceipt;
};

type Draw = {
    id: number;
    week_number: number;
    draw_date: string | null;
    status: string;

    started_at: string | null;
    completed_at: string | null;
    snapshot_at: string | null;

    random_provider: string | null;
    random_request_id: string | null;

    random_request: {
        entries: number[];
        entry_count: number;
    } | null;

    random_response: {
        values: number[];
    } | null;

    randomized_at: string | null;

    created_at: string;
    updated_at: string;

    eligible_entries_count: number;
    required_winners: number;
    can_prepare: boolean;

    draw_prizes: DrawPrize[];
    entries: DrawEntry[];
    winners: DrawWinner[];
};

type DrawResponse = {
    data: Draw;
};

type AvailablePrize = {
    id: number;
    name: string;
    type: string;
    value: number | null;
    currency: string | null;

    total_quantity: number;

    allocated_quantity:
        | number
        | string;

    available_quantity: number;
};

function getApiMessage(
    error: unknown,
    fallback: string
): string {
    const apiError =
        error as ApiError;

    return (
        apiError.response?.data
            ?.message ??
        fallback
    );
}

export default function DrawDetails() {
    const {
        id,
    } = useParams();

    const [
        draw,
        setDraw,
    ] = useState<Draw | null>(
        null
    );

    const [
        availablePrizes,
        setAvailablePrizes,
    ] = useState<
        AvailablePrize[]
    >([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState<
        string | null
    >(null);

    const [
        actionLoading,
        setActionLoading,
    ] = useState(false);

    const [
        actionError,
        setActionError,
    ] = useState<
        string | null
    >(null);

    const [
        actionSuccess,
        setActionSuccess,
    ] = useState<
        string | null
    >(null);

    /*
     * Settings
     */

    const [
        editingSettings,
        setEditingSettings,
    ] = useState(false);

    const [
        drawDate,
        setDrawDate,
    ] = useState('');

    const [
        drawStatus,
        setDrawStatus,
    ] = useState<
        'draft' | 'scheduled'
    >('draft');

    /*
     * Prize form
     */

    const [
        showPrizeForm,
        setShowPrizeForm,
    ] = useState(false);

    const [
        selectedPrizeId,
        setSelectedPrizeId,
    ] = useState<
        number | ''
    >('');

    const [
        prizeQuantity,
        setPrizeQuantity,
    ] = useState(1);

    /*
     * Permissions / lifecycle
     */

    const isEditableDraw =
        draw !== null &&
        (
            draw.status ===
            'draft' ||
            draw.status ===
            'scheduled'
        ) &&
        !draw.snapshot_at;

    const canPrepare =
        draw !== null &&
        draw.can_prepare;

    const canExecute =
        draw !== null &&
        draw.status ===
        'running' &&
        Boolean(
            draw.snapshot_at
        ) &&
        !draw.randomized_at;

    /*
     * Load
     */

    const loadDraw =
        async () => {
            if (!id) {
                setError(
                    'Draw ID is missing.'
                );

                setLoading(
                    false
                );

                return;
            }

            try {
                const response =
                    await api.get<DrawResponse>(
                        `/admin/draws/${id}`
                    );

                const loadedDraw =
                    response.data.data;

                setDraw(
                    loadedDraw
                );

                setDrawDate(
                    toDateTimeLocal(
                        loadedDraw.draw_date
                    )
                );

                if (
                    loadedDraw.status ===
                    'draft' ||
                    loadedDraw.status ===
                    'scheduled'
                ) {
                    setDrawStatus(
                        loadedDraw.status
                    );
                }
            } catch (
                error: unknown
                ) {
                console.error(
                    error
                );

                setError(
                    'Unable to load draw.'
                );
            }
        };

    const loadAvailablePrizes =
        async () => {
            try {
                const response =
                    await api.get(
                        '/admin/prizes'
                    );

                const prizes =
                    (
                        response.data
                            .data ?? []
                    ).map(
                        (
                            prize:
                            AvailablePrize
                        ) => ({
                            ...prize,

                            allocated_quantity:
                                Number(
                                    prize.allocated_quantity
                                ),

                            available_quantity:
                                Number(
                                    prize.available_quantity
                                ),
                        })
                    );

                setAvailablePrizes(
                    prizes
                );
            } catch (
                error: unknown
                ) {
                console.error(
                    'Unable to load prizes:',
                    error
                );
            }
        };

    const reloadAll =
        async () => {
            await Promise.all([
                loadDraw(),
                loadAvailablePrizes(),
            ]);
        };

    useEffect(() => {
        const load =
            async () => {
                setLoading(
                    true
                );

                setError(
                    null
                );

                await reloadAll();

                setLoading(
                    false
                );
            };

        load();
    }, [
        id,
    ]);

    /*
     * Settings
     */

    const saveSettings =
        async () => {
            if (
                !draw ||
                !isEditableDraw ||
                !drawDate
            ) {
                return;
            }

            setActionLoading(
                true
            );

            setActionError(
                null
            );

            setActionSuccess(
                null
            );

            try {
                const response =
                    await api.put(
                        `/admin/draws/${draw.id}`,
                        {
                            draw_date:
                            drawDate,

                            status:
                            drawStatus,
                        }
                    );

                setActionSuccess(
                    response.data
                        .message ??
                    'Draw updated successfully.'
                );

                setEditingSettings(
                    false
                );

                await loadDraw();
            } catch (
                error: unknown
                ) {
                setActionError(
                    getApiMessage(
                        error,
                        'Unable to update draw.'
                    )
                );
            } finally {
                setActionLoading(
                    false
                );
            }
        };

    /*
     * Prizes
     */

    const addPrize =
        async () => {
            if (
                !draw ||
                !isEditableDraw ||
                selectedPrizeId ===
                ''
            ) {
                return;
            }

            const prize =
                availablePrizes.find(
                    (
                        item
                    ) =>
                        item.id ===
                        selectedPrizeId
                );

            if (!prize) {
                return;
            }

            if (
                !Number.isInteger(
                    prizeQuantity
                ) ||
                prizeQuantity < 1
            ) {
                setActionError(
                    'Quantity must be at least 1.'
                );

                return;
            }

            if (
                prizeQuantity >
                prize.available_quantity
            ) {
                setActionError(
                    `Only ${prize.available_quantity} ${prize.name} prize(s) are available.`
                );

                return;
            }

            setActionLoading(
                true
            );

            setActionError(
                null
            );

            setActionSuccess(
                null
            );

            try {
                const response =
                    await api.post(
                        `/admin/draws/${draw.id}/prizes`,
                        {
                            prize_id:
                            selectedPrizeId,

                            quantity:
                            prizeQuantity,
                        }
                    );

                setActionSuccess(
                    response.data
                        .message ??
                    'Prize added successfully.'
                );

                setSelectedPrizeId(
                    ''
                );

                setPrizeQuantity(
                    1
                );

                setShowPrizeForm(
                    false
                );

                await reloadAll();
            } catch (
                error: unknown
                ) {
                setActionError(
                    getApiMessage(
                        error,
                        'Unable to add prize.'
                    )
                );
            } finally {
                setActionLoading(
                    false
                );
            }
        };

    const removePrize =
        async (
            drawPrizeId: number
        ) => {
            if (
                !draw ||
                !isEditableDraw
            ) {
                return;
            }

            if (
                !window.confirm(
                    'Remove this prize allocation from the draw?'
                )
            ) {
                return;
            }

            setActionLoading(
                true
            );

            setActionError(
                null
            );

            setActionSuccess(
                null
            );

            try {
                const response =
                    await api.delete(
                        `/admin/draws/${draw.id}/prizes/${drawPrizeId}`
                    );

                setActionSuccess(
                    response.data
                        .message ??
                    'Prize removed successfully.'
                );

                await reloadAll();
            } catch (
                error: unknown
                ) {
                setActionError(
                    getApiMessage(
                        error,
                        'Unable to remove prize.'
                    )
                );
            } finally {
                setActionLoading(
                    false
                );
            }
        };

    /*
     * Prepare
     */

    const prepareDraw =
        async () => {
            if (
                !draw ||
                !canPrepare
            ) {
                return;
            }

            const confirmed =
                window.confirm(
                    `Prepare Week ${draw.week_number} draw?\n\n` +
                    'The current eligible receipts will be frozen for this draw.\n\n' +
                    'Draw settings and prize allocation cannot be changed afterward.'
                );

            if (!confirmed) {
                return;
            }

            setActionLoading(
                true
            );

            setActionError(
                null
            );

            setActionSuccess(
                null
            );

            try {
                const response =
                    await api.post(
                        `/admin/draws/${draw.id}/snapshot`
                    );

                setActionSuccess(
                    response.data
                        .message ??
                    'Draw prepared successfully.'
                );

                setEditingSettings(
                    false
                );

                setShowPrizeForm(
                    false
                );

                await loadDraw();
            } catch (
                error: unknown
                ) {
                setActionError(
                    getApiMessage(
                        error,
                        'Unable to prepare draw.'
                    )
                );
            } finally {
                setActionLoading(
                    false
                );
            }
        };

    /*
     * Execute
     */

    const executeDraw =
        async () => {
            if (
                !draw ||
                !canExecute
            ) {
                return;
            }

            const confirmed =
                window.confirm(
                    `Execute Week ${draw.week_number} draw now?\n\n` +
                    `${draw.entries.length} frozen entries will participate.\n\n` +
                    'Winner selection cannot be undone.'
                );

            if (!confirmed) {
                return;
            }

            setActionLoading(
                true
            );

            setActionError(
                null
            );

            setActionSuccess(
                null
            );

            try {
                const response =
                    await api.post(
                        `/admin/draws/${draw.id}/execute`
                    );

                setActionSuccess(
                    response.data
                        .message ??
                    'Draw executed successfully.'
                );

                await loadDraw();
            } catch (
                error: unknown
                ) {
                setActionError(
                    getApiMessage(
                        error,
                        'Unable to execute draw.'
                    )
                );
            } finally {
                setActionLoading(
                    false
                );
            }
        };

    /*
     * Winner stats
     */

    const winnerStats =
        useMemo(() => {
            if (!draw) {
                return {
                    total: 0,
                    needsAction: 0,
                    confirmed: 0,
                    cancelled: 0,
                };
            }

            return {
                total:
                draw.winners.length,

                needsAction:
                draw.winners.filter(
                    (
                        winner
                    ) =>
                        winner.status ===
                        'selected' ||
                        winner.status ===
                        'contacting'
                ).length,

                confirmed:
                draw.winners.filter(
                    (
                        winner
                    ) =>
                        winner.status ===
                        'confirmed'
                ).length,

                cancelled:
                draw.winners.filter(
                    (
                        winner
                    ) =>
                        winner.status ===
                        'cancelled'
                ).length,
            };
        }, [
            draw,
        ]);

    if (
        loading
    ) {
        return (
            <div className="flex min-h-64 items-center justify-center text-sm text-gray-500">
                Loading draw...
            </div>
        );
    }

    if (
        error ||
        !draw
    ) {
        return (
            <div className="space-y-4">
                <Link
                    to="/admin/draws"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to Draws
                </Link>

                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error ??
                        'Draw not found.'}
                </div>
            </div>
        );
    }

    /*
     * Derived values
     */

    const totalPrizeQuantity =
        draw.draw_prizes.reduce(
            (
                total,
                item
            ) =>
                total +
                item.quantity,
            0
        );

    const selectedPrize =
        selectedPrizeId !==
        ''
            ? availablePrizes.find(
                (
                    prize
                ) =>
                    prize.id ===
                    selectedPrizeId
            )
            : null;

    const configureComplete =
        draw.draw_prizes.length >
        0;

    const prepareComplete =
        Boolean(
            draw.snapshot_at
        );

    const executionComplete =
        draw.status ===
        'completed' ||
        Boolean(
            draw.randomized_at
        );

    const reserveCount =
        executionComplete &&
        draw.random_response
            ? Math.max(
                0,
                draw.random_response
                    .values.length -
                winnerStats.total
            )
            : 0;

    const currentStep =
        !configureComplete
            ? 'configure'
            : !prepareComplete
                ? 'prepare'
                : !executionComplete
                    ? 'execute'
                    : 'winners';

    return (
        <div className="space-y-6">
            {/* Header */}

            <header>
                <Link
                    to="/admin/draws"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to Draws
                </Link>

                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Week{' '}
                                {
                                    draw.week_number
                                }{' '}
                                Draw
                            </h1>

                            <StatusBadge
                                status={
                                    draw.status
                                }
                            />
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                            {formatDateTime(
                                draw.draw_date
                            )}

                            {' · '}

                            Draw #
                            {
                                draw.id
                            }
                        </p>
                    </div>

                    {isEditableDraw && (
                        <button
                            type="button"
                            onClick={() =>
                                setEditingSettings(
                                    (
                                        current
                                    ) =>
                                        !current
                                )
                            }
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            {editingSettings
                                ? 'Close Settings'
                                : 'Edit Draw'}
                        </button>
                    )}
                </div>
            </header>

            {/* Feedback */}

            {actionSuccess && (
                <FeedbackAlert
                    type="success"
                    onClose={() =>
                        setActionSuccess(
                            null
                        )
                    }
                >
                    {
                        actionSuccess
                    }
                </FeedbackAlert>
            )}

            {actionError && (
                <FeedbackAlert
                    type="error"
                    onClose={() =>
                        setActionError(
                            null
                        )
                    }
                >
                    {
                        actionError
                    }
                </FeedbackAlert>
            )}

            {/* Summary */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Prize Quantity"
                    value={
                        totalPrizeQuantity
                    }
                />

                <SummaryCard
                    label={
                        prepareComplete
                            ? 'Frozen Entries'
                            : 'Eligible Entries'
                    }
                    value={
                        prepareComplete
                            ? draw.entries
                                .length
                            : draw.eligible_entries_count
                    }
                />

                <SummaryCard
                    label="Required Winners"
                    value={
                        draw.required_winners
                    }
                />

                <SummaryCard
                    label={
                        executionComplete
                            ? 'Selected Winners'
                            : 'Winner Selection'
                    }
                    value={
                        executionComplete
                            ? winnerStats.total
                            : 'Pending'
                    }
                />
            </div>

            {/* Current Step */}

            <section
                className={[
                    'overflow-hidden rounded-xl border shadow-sm',
                    currentStep ===
                    'winners'
                        ? 'border-green-200 bg-green-50'
                        : currentStep ===
                        'execute'
                            ? 'border-red-200 bg-red-50'
                            : 'border-blue-200 bg-blue-50',
                ].join(
                    ' '
                )}
            >
                <div className="p-5 sm:p-6">
                    {currentStep ===
                        'configure' && (
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                        Current Step
                                    </div>

                                    <h2 className="mt-1 text-xl font-semibold text-gray-900">
                                        Configure Prizes
                                    </h2>

                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                                        Add the prizes and
                                        quantities that will
                                        be awarded in this
                                        weekly draw.
                                    </p>
                                </div>

                                {isEditableDraw && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPrizeForm(
                                                true
                                            )
                                        }
                                        className="shrink-0 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                                    >
                                        Add Prize
                                    </button>
                                )}
                            </div>
                        )}

                    {currentStep ===
                        'prepare' && (
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                        Ready to Prepare
                                    </div>

                                    <h2 className="mt-1 text-xl font-semibold text-gray-900">
                                        Freeze Eligible Entries
                                    </h2>

                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                                        {
                                            draw.eligible_entries_count
                                        }{' '}
                                        approved receipts
                                        are currently
                                        eligible.{' '}
                                        {
                                            totalPrizeQuantity
                                        }{' '}
                                        winners are
                                        required.
                                    </p>

                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                                        Preparing the draw
                                        freezes the current
                                        eligible receipt list
                                        and locks draw
                                        settings and prize
                                        allocation.
                                    </p>

                                    {!canPrepare && (
                                        <div className="mt-4 rounded-lg border border-red-200 bg-white/70 p-3 text-sm text-red-700">
                                            Not enough
                                            eligible receipts
                                            to prepare this
                                            draw.
                                        </div>
                                    )}
                                </div>

                                {canPrepare && (
                                    <button
                                        type="button"
                                        onClick={
                                            prepareDraw
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                        className="shrink-0 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        {actionLoading
                                            ? 'Preparing...'
                                            : 'Prepare Draw'}
                                    </button>
                                )}
                            </div>
                        )}

                    {currentStep ===
                        'execute' && (
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-red-700">
                                        Ready to Execute
                                    </div>

                                    <h2 className="mt-1 text-xl font-semibold text-gray-900">
                                        Execute Winner Selection
                                    </h2>

                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                                        {
                                            draw.entries
                                                .length
                                        }{' '}
                                        frozen entries will
                                        participate and{' '}
                                        {
                                            totalPrizeQuantity
                                        }{' '}
                                        winner
                                        {totalPrizeQuantity ===
                                        1
                                            ? ''
                                            : 's'}{' '}
                                        will be selected.
                                    </p>

                                    <p className="mt-2 max-w-2xl text-sm font-medium text-red-700">
                                        Execution is
                                        irreversible.
                                    </p>
                                </div>

                                {canExecute && (
                                    <button
                                        type="button"
                                        onClick={
                                            executeDraw
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                        className="shrink-0 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {actionLoading
                                            ? 'Executing...'
                                            : 'Execute Draw'}
                                    </button>
                                )}
                            </div>
                        )}

                    {currentStep ===
                        'winners' && (
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-green-700">
                                        Draw Executed
                                    </div>

                                    <h2 className="mt-1 text-xl font-semibold text-gray-900">
                                        Winner Selection Complete
                                    </h2>

                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                                        {
                                            winnerStats.total
                                        }{' '}
                                        winners were
                                        selected.{' '}
                                        {
                                            winnerStats.needsAction
                                        }{' '}
                                        currently require
                                        organizer follow-up.
                                    </p>
                                </div>

                                <Link
                                    to={`/admin/winners?draw_id=${draw.id}`}
                                    className="shrink-0 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                                >
                                    Manage Winners →
                                </Link>
                            </div>
                        )}
                </div>
            </section>

            {/* Workflow */}

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900">
                    Draw Progress
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Configure prizes, freeze
                    eligible receipts, execute
                    winner selection, then manage
                    winners.
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <WorkflowStep
                        number={
                            1
                        }
                        title="Configure"
                        complete={
                            configureComplete
                        }
                        active={
                            currentStep ===
                            'configure'
                        }
                    >
                        {configureComplete
                            ? `${totalPrizeQuantity} winner${totalPrizeQuantity === 1 ? '' : 's'} configured`
                            : 'Configure prize allocation'}
                    </WorkflowStep>

                    <WorkflowStep
                        number={
                            2
                        }
                        title="Prepare"
                        complete={
                            prepareComplete
                        }
                        active={
                            currentStep ===
                            'prepare'
                        }
                    >
                        {prepareComplete
                            ? `${draw.entries.length} entries frozen`
                            : 'Freeze eligible receipts'}
                    </WorkflowStep>

                    <WorkflowStep
                        number={
                            3
                        }
                        title="Execute"
                        complete={
                            executionComplete
                        }
                        active={
                            currentStep ===
                            'execute'
                        }
                    >
                        {executionComplete
                            ? `${winnerStats.total} winners selected`
                            : 'Run winner selection'}
                    </WorkflowStep>

                    <WorkflowStep
                        number={
                            4
                        }
                        title="Winners"
                        complete={
                            executionComplete &&
                            winnerStats.needsAction ===
                            0
                        }
                        active={
                            currentStep ===
                            'winners'
                        }
                    >
                        {executionComplete
                            ? `${winnerStats.needsAction} need action`
                            : 'Available after execution'}
                    </WorkflowStep>
                </div>
            </section>

            {/* Settings */}

            {editingSettings &&
                isEditableDraw && (
                    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <SectionHeader
                            title="Draw Settings"
                            description="Change the draw date or planning status before the participant snapshot is created."
                        />

                        <div className="grid gap-4 p-5 md:grid-cols-[280px_200px_auto] md:items-end">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Draw Date
                                </label>

                                <input
                                    type="datetime-local"
                                    value={
                                        drawDate
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setDrawDate(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Status
                                </label>

                                <select
                                    value={
                                        drawStatus
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setDrawStatus(
                                            event
                                                .target
                                                .value as
                                                | 'draft'
                                                | 'scheduled'
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                                >
                                    <option value="draft">
                                        Draft
                                    </option>

                                    <option value="scheduled">
                                        Scheduled
                                    </option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={
                                        saveSettings
                                    }
                                    disabled={
                                        actionLoading ||
                                        !drawDate
                                    }
                                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                >
                                    Save
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setEditingSettings(
                                            false
                                        )
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </section>
                )}

            {/* Prize Allocation */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Prize Allocation
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Configure the prizes
                            awarded in this draw.
                        </p>
                    </div>

                    {isEditableDraw ? (
                        <button
                            type="button"
                            onClick={() =>
                                setShowPrizeForm(
                                    (
                                        current
                                    ) =>
                                        !current
                                )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            {showPrizeForm
                                ? 'Close'
                                : 'Add Prize'}
                        </button>
                    ) : (
                        <span className="self-start rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
                            Allocation locked
                        </span>
                    )}
                </div>

                {showPrizeForm &&
                    isEditableDraw && (
                        <div className="border-b border-gray-200 bg-gray-50 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                                <div className="flex-1">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Prize
                                    </label>

                                    <select
                                        value={
                                            selectedPrizeId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSelectedPrizeId(
                                                event
                                                    .target
                                                    .value
                                                    ? Number(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                    : ''
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                                    >
                                        <option value="">
                                            Select
                                            prize
                                        </option>

                                        {availablePrizes.map(
                                            (
                                                prize
                                            ) => (
                                                <option
                                                    key={
                                                        prize.id
                                                    }
                                                    value={
                                                        prize.id
                                                    }
                                                    disabled={
                                                        prize.available_quantity <=
                                                        0
                                                    }
                                                >
                                                    {
                                                        prize.name
                                                    }{' '}
                                                    —
                                                    available:{' '}
                                                    {
                                                        prize.available_quantity
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div className="w-full lg:w-32">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Quantity
                                    </label>

                                    <input
                                        type="number"
                                        min={
                                            1
                                        }
                                        value={
                                            prizeQuantity
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setPrizeQuantity(
                                                Number(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={
                                            addPrize
                                        }
                                        disabled={
                                            actionLoading ||
                                            selectedPrizeId ===
                                            ''
                                        }
                                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        Add
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPrizeForm(
                                                false
                                            );

                                            setSelectedPrizeId(
                                                ''
                                            );

                                            setPrizeQuantity(
                                                1
                                            );
                                        }}
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>

                            {selectedPrize && (
                                <div className="mt-3 text-xs text-gray-500">
                                    Total:{' '}
                                    <strong>
                                        {
                                            selectedPrize.total_quantity
                                        }
                                    </strong>

                                    {' · '}

                                    Allocated:{' '}
                                    <strong>
                                        {
                                            selectedPrize.allocated_quantity
                                        }
                                    </strong>

                                    {' · '}

                                    Available:{' '}
                                    <strong>
                                        {
                                            selectedPrize.available_quantity
                                        }
                                    </strong>
                                </div>
                            )}
                        </div>
                    )}

                {draw.draw_prizes
                    .length ===
                0 ? (
                    <div className="p-6 text-sm text-gray-400">
                        No prizes
                        configured.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {draw.draw_prizes.map(
                            (
                                drawPrize
                            ) => (
                                <div
                                    key={
                                        drawPrize.id
                                    }
                                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {
                                                drawPrize
                                                    .prize
                                                    .name
                                            }
                                        </div>

                                        {drawPrize.prize.value != null && (
                                            <div className="mt-1 text-xs text-gray-500">
                                                {Number(drawPrize.prize.value).toLocaleString()}{' '}
                                                {drawPrize.prize.currency ?? ''}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-5">
                                        <div className="text-right">
                                            <div className="text-lg font-semibold text-gray-900">
                                                ×{' '}
                                                {
                                                    drawPrize.quantity
                                                }
                                            </div>

                                            <div className="text-xs text-gray-400">
                                                winner
                                                {drawPrize.quantity ===
                                                1
                                                    ? ''
                                                    : 's'}
                                            </div>
                                        </div>

                                        {isEditableDraw && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removePrize(
                                                        drawPrize.id
                                                    )
                                                }
                                                disabled={
                                                    actionLoading
                                                }
                                                className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        )}

                        <div className="flex items-center justify-between bg-gray-50 px-5 py-4">
                            <span className="text-sm font-medium text-gray-700">
                                Total
                                winners
                            </span>

                            <span className="text-lg font-bold text-gray-900">
                                {
                                    totalPrizeQuantity
                                }
                            </span>
                        </div>
                    </div>
                )}
            </section>

            {/* Snapshot */}

            {prepareComplete && (
                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <SectionHeader
                        title="Participant Snapshot"
                        description="The eligible receipt list for this draw is frozen and cannot change."
                    />

                    <div className="grid gap-5 p-5 sm:grid-cols-3">
                        <InfoItem
                            label="Frozen Entries"
                            value={
                                draw.entries
                                    .length
                            }
                        />

                        <InfoItem
                            label="Prepared At"
                            value={formatDateTime(
                                draw.snapshot_at
                            )}
                        />

                        <InfoItem
                            label="Required Winners"
                            value={
                                totalPrizeQuantity
                            }
                        />
                    </div>
                </section>
            )}

            {/* Winners */}

            {executionComplete && (
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-900">
                                Draw Results
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Winner follow-up is
                                handled in the
                                Winners workspace.
                            </p>
                        </div>

                        <Link
                            to={`/admin/winners?draw_id=${draw.id}`}
                            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                        >
                            Manage Winners
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-gray-200 md:grid-cols-5">
                        <ResultStat
                            label="Selected"
                            value={
                                winnerStats.total
                            }
                        />

                        <ResultStat
                            label="Needs Action"
                            value={
                                winnerStats.needsAction
                            }
                            valueClassName="text-blue-700"
                        />

                        <ResultStat
                            label="Confirmed"
                            value={
                                winnerStats.confirmed
                            }
                            valueClassName="text-green-700"
                        />

                        <ResultStat
                            label="Cancelled"
                            value={
                                winnerStats.cancelled
                            }
                            valueClassName="text-red-700"
                        />

                        <ResultStat
                            label="Reserve Entries"
                            value={
                                reserveCount
                            }
                        />
                    </div>

                    {draw.winners.length >
                        0 && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Winner
                                        </th>

                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Prize
                                        </th>

                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Entry
                                        </th>

                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Status
                                        </th>

                                        <th className="px-5 py-3" />
                                    </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                    {draw.winners
                                        .slice(
                                            0,
                                            5
                                        )
                                        .map(
                                            (
                                                winner
                                            ) => {
                                                const drawPrize =
                                                    draw.draw_prizes.find(
                                                        (
                                                            item
                                                        ) =>
                                                            item.id ===
                                                            winner.draw_prize_id
                                                    );

                                                const participant =
                                                    winner
                                                        .receipt
                                                        ?.participant;

                                                return (
                                                    <tr
                                                        key={
                                                            winner.id
                                                        }
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <div className="font-medium text-gray-900">
                                                                {participant
                                                                    ? `${participant.first_name} ${participant.last_name}`
                                                                    : `Winner #${winner.id}`}
                                                            </div>

                                                            <div className="mt-1 text-xs text-gray-500">
                                                                Receipt{' '}
                                                                {winner
                                                                        .receipt
                                                                        ?.receipt_number ??
                                                                    '-'}
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4 text-gray-700">
                                                            {drawPrize
                                                                    ?.prize
                                                                    .name ??
                                                                '-'}
                                                        </td>

                                                        <td className="px-5 py-4 text-gray-700">
                                                            #
                                                            {
                                                                winner.entry_number
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <StatusBadge
                                                                status={
                                                                    winner.status
                                                                }
                                                            />
                                                        </td>

                                                        <td className="px-5 py-4 text-right">
                                                            <Link
                                                                to={`/admin/winners/${winner.id}`}
                                                                state={{
                                                                    from:
                                                                        `/admin/winners?draw_id=${draw.id}`,
                                                                }}
                                                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                                            >
                                                                View
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>

                                {draw.winners
                                        .length >
                                    5 && (
                                        <div className="border-t border-gray-200 px-5 py-4 text-center">
                                            <Link
                                                to={`/admin/winners?draw_id=${draw.id}`}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                View all{' '}
                                                {
                                                    draw
                                                        .winners
                                                        .length
                                                }{' '}
                                                winners →
                                            </Link>
                                        </div>
                                    )}
                            </div>
                        )}
                </section>
            )}

            {/* Technical / Audit */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <SectionHeader
                    title="Technical & Audit Details"
                    description="Draw lifecycle and randomization information."
                />

                <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoItem
                        label="Draw ID"
                        value={`#${draw.id}`}
                    />

                    <InfoItem
                        label="Draw Date"
                        value={formatDateTime(
                            draw.draw_date
                        )}
                    />

                    <InfoItem
                        label="Prepared"
                        value={formatDateTime(
                            draw.snapshot_at
                        )}
                    />

                    <InfoItem
                        label="Executed"
                        value={formatDateTime(
                            draw.randomized_at
                        )}
                    />

                    <InfoItem
                        label="Completed"
                        value={formatDateTime(
                            draw.completed_at
                        )}
                    />

                    <InfoItem
                        label="Provider"
                        value={
                            draw.random_provider ??
                            '-'
                        }
                    />

                    <InfoItem
                        label="Entry Count"
                        value={
                            draw.random_request
                                ?.entry_count ??
                            '-'
                        }
                    />

                    <InfoItem
                        label="Request ID"
                        value={
                            draw.random_request_id ??
                            '-'
                        }
                    />
                </div>

                {draw.random_response && (
                    <div className="border-t border-gray-100 p-5">
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Randomized Order
                        </div>

                        <div className="mt-2 max-h-48 overflow-auto rounded-lg bg-gray-50 p-4 font-mono text-xs leading-6 text-gray-700">
                            {draw.random_response.values.join(
                                ', '
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

function SectionHeader({
                           title,
                           description,
                       }: {
    title: string;
    description?: string;
}) {
    return (
        <div className="border-b border-gray-200 px-5 py-4">
            <h3 className="font-semibold text-gray-900">
                {
                    title
                }
            </h3>

            {description && (
                <p className="mt-1 text-sm text-gray-500">
                    {
                        description
                    }
                </p>
            )}
        </div>
    );
}

function SummaryCard({
                         label,
                         value,
                     }: {
    label: string;
    value:
        | string
        | number;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">
                {
                    label
                }
            </div>

            <div className="mt-2 text-2xl font-bold text-gray-900">
                {
                    value
                }
            </div>
        </div>
    );
}

function ResultStat({
                        label,
                        value,
                        valueClassName =
                        'text-gray-900',
                    }: {
    label: string;
    value: number;
    valueClassName?: string;
}) {
    return (
        <div className="bg-white p-5">
            <div className="text-sm text-gray-500">
                {
                    label
                }
            </div>

            <div
                className={`mt-1 text-2xl font-bold ${valueClassName}`}
            >
                {
                    value
                }
            </div>
        </div>
    );
}

function InfoItem({
                      label,
                      value,
                  }: {
    label: string;
    value:
        | string
        | number;
}) {
    return (
        <div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {
                    label
                }
            </div>

            <div className="mt-1 break-all text-sm text-gray-700">
                {
                    value
                }
            </div>
        </div>
    );
}

function WorkflowStep({
                          number,
                          title,
                          complete,
                          active,
                          children,
                      }: {
    number: number;
    title: string;
    complete: boolean;
    active: boolean;
    children: React.ReactNode;
}) {
    let className =
        'rounded-xl border border-gray-200 bg-gray-50 p-4';

    if (complete) {
        className =
            'rounded-xl border border-green-200 bg-green-50 p-4';
    } else if (active) {
        className =
            'rounded-xl border border-blue-200 bg-blue-50 p-4';
    }

    return (
        <div
            className={
                className
            }
        >
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                    STEP{' '}
                    {
                        number
                    }
                </span>

                {complete && (
                    <span className="text-xs font-semibold text-green-700">
                        ✓ Done
                    </span>
                )}
            </div>

            <div className="mt-1 font-semibold text-gray-900">
                {
                    title
                }
            </div>

            <div className="mt-2 text-sm text-gray-600">
                {
                    children
                }
            </div>
        </div>
    );
}

function FeedbackAlert({
                           type,
                           children,
                           onClose,
                       }: {
    type:
        | 'success'
        | 'error';

    children:
        React.ReactNode;

    onClose:
        () => void;
}) {
    const className =
        type ===
        'success'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-red-200 bg-red-50 text-red-700';

    return (
        <div
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${className}`}
        >
            <span>
                {
                    children
                }
            </span>

            <button
                type="button"
                onClick={
                    onClose
                }
                className="ml-4 font-medium"
            >
                ×
            </button>
        </div>
    );
}
