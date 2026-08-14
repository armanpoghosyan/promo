import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

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

type WinnerReceipt = {
    id: number;
    participant_id: number;
    receipt_number: string;
    status: string;
};

type ContactAttempt = {
    id: number;
    created_by: number | null;
    attempted_at: string;
    result: string;
    notes: string | null;
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
    contact_attempts: ContactAttempt[];
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
    allocated_quantity: number | string;
    available_quantity: number;
};

type ContactAttemptResult =
    | 'no_answer'
    | 'busy'
    | 'wrong_number'
    | 'contacted'
    | 'confirmed'
    | 'declined'
    | 'other';

type ApiError = {
    response?: {
        data?: {
            message?: string;
        };
    };
};

export default function DrawDetails() {
    const { id } = useParams();

    const [draw, setDraw] = useState<Draw | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const [selectedPrizeId, setSelectedPrizeId] =
        useState<number | ''>('');
    const [prizeQuantity, setPrizeQuantity] = useState(1);
    const [prizeActionLoading, setPrizeActionLoading] = useState(false);
    const [prizeActionError, setPrizeActionError] =
        useState<string | null>(null);
    const [prizeActionMessage, setPrizeActionMessage] =
        useState<string | null>(null);

    const [availablePrizes, setAvailablePrizes] =
        useState<AvailablePrize[]>([]);

    const [executeLoading, setExecuteLoading] = useState(false);
    const [executeError, setExecuteError] = useState<string | null>(null);
    const [executeMessage, setExecuteMessage] =
        useState<string | null>(null);

    const [contactWinnerId, setContactWinnerId] =
        useState<number | null>(null);
    const [contactResult, setContactResult] = useState('');
    const [contactNotes, setContactNotes] = useState('');

    /*
     * This is a winner ID while an action is running.
     * null means no winner action is currently running.
     */
    const [winnerActionLoading, setWinnerActionLoading] =
        useState<number | null>(null);

    const [winnerActionError, setWinnerActionError] =
        useState<string | null>(null);

    const [winnerActionMessage, setWinnerActionMessage] =
        useState<string | null>(null);

    const isEditableDraw =
        draw !== null &&
        ['draft', 'scheduled'].includes(draw.status);

    const loadAvailablePrizes = async () => {
        try {
            const response = await api.get('/admin/prizes');

            setAvailablePrizes(
                (response.data.data ?? []).map(
                    (prize: AvailablePrize) => ({
                        ...prize,
                        allocated_quantity: Number(
                            prize.allocated_quantity
                        ),
                        available_quantity: Number(
                            prize.available_quantity
                        ),
                    })
                )
            );
        } catch (err) {
            console.error('Unable to load prizes:', err);
        }
    };

    const loadDraw = async () => {
        if (!id) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response =
                await api.get<DrawResponse>(
                    `/admin/draws/${id}`
                );

            setDraw(response.data.data);
        } catch (err) {
            console.error(err);

            setError(
                'Unable to load draw.'
            );
        } finally {
            setLoading(false);
        }
    };

    const createSnapshot = async () => {
        if (!draw) {
            return;
        }

        setActionLoading(true);
        setActionMessage(null);
        setActionError(null);

        try {
            const response = await api.post(
                `/admin/draws/${draw.id}/snapshot`
            );

            setActionMessage(
                response.data.message ??
                'Snapshot created successfully.'
            );

            await loadDraw();
        } catch (err) {
            console.error(err);

            const apiError = err as ApiError;

            setActionError(
                apiError.response?.data?.message ??
                'Unable to create snapshot.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const addPrize = async () => {
        if (!draw || selectedPrizeId === '') {
            return;
        }

        const prize = availablePrizes.find(
            (item) => item.id === selectedPrizeId
        );

        if (!prize) {
            return;
        }

        if (prizeQuantity < 1) {
            setPrizeActionError(
                'Quantity must be at least 1.'
            );
            return;
        }

        if (
            prizeQuantity >
            prize.available_quantity
        ) {
            setPrizeActionError(
                `Only ${prize.available_quantity} ${prize.name} prize(s) are available.`
            );
            return;
        }

        setPrizeActionLoading(true);
        setPrizeActionError(null);
        setPrizeActionMessage(null);

        try {
            const response = await api.post(
                `/admin/draws/${draw.id}/prizes`,
                {
                    prize_id: selectedPrizeId,
                    quantity: prizeQuantity,
                }
            );

            setPrizeActionMessage(
                response.data.message ??
                'Prize added successfully.'
            );

            setSelectedPrizeId('');
            setPrizeQuantity(1);

            await Promise.all([
                loadDraw(),
                loadAvailablePrizes(),
            ]);
        } catch (err) {
            console.error(err);

            const apiError = err as ApiError;

            setPrizeActionError(
                apiError.response?.data?.message ??
                'Unable to add prize.'
            );
        } finally {
            setPrizeActionLoading(false);
        }
    };

    const removePrize = async (
        drawPrizeId: number
    ) => {
        if (!draw || !isEditableDraw) {
            return;
        }

        const confirmed = window.confirm(
            'Remove this prize from the draw?'
        );

        if (!confirmed) {
            return;
        }

        setPrizeActionLoading(true);
        setPrizeActionError(null);
        setPrizeActionMessage(null);

        try {
            const response = await api.delete(
                `/admin/draws/${draw.id}/prizes/${drawPrizeId}`
            );

            setPrizeActionMessage(
                response.data.message ??
                'Prize removed successfully.'
            );

            await Promise.all([
                loadDraw(),
                loadAvailablePrizes(),
            ]);
        } catch (err) {
            console.error(err);

            const apiError = err as ApiError;

            setPrizeActionError(
                apiError.response?.data?.message ??
                'Unable to remove prize.'
            );
        } finally {
            setPrizeActionLoading(false);
        }
    };

    const executeDraw = async () => {
        if (!draw) {
            return;
        }

        const confirmed = window.confirm(
            'Are you sure you want to execute this draw? This action cannot be undone.'
        );

        if (!confirmed) {
            return;
        }

        setExecuteLoading(true);
        setExecuteError(null);
        setExecuteMessage(null);

        try {
            const response = await api.post(
                `/admin/draws/${draw.id}/execute`
            );

            setExecuteMessage(
                response.data.message ??
                'Draw executed successfully.'
            );

            await loadDraw();
        } catch (err) {
            console.error(err);

            const apiError = err as ApiError;

            setExecuteError(
                apiError.response?.data?.message ??
                'Unable to execute draw.'
            );
        } finally {
            setExecuteLoading(false);
        }
    };

    const openContactAttempt = (
        winnerId: number
    ) => {
        setContactWinnerId(winnerId);
        setContactResult('');
        setContactNotes('');
        setWinnerActionError(null);
        setWinnerActionMessage(null);
    };

    const closeContactAttempt = () => {
        if (winnerActionLoading !== null) {
            return;
        }

        setContactWinnerId(null);
        setContactResult('');
        setContactNotes('');
    };

    const addContactAttempt = async () => {
        if (
            !draw ||
            contactWinnerId === null
        ) {
            return;
        }

        if (!contactResult.trim()) {
            setWinnerActionError(
                'Please select the contact result.'
            );
            return;
        }

        setWinnerActionLoading(
            contactWinnerId
        );
        setWinnerActionError(null);
        setWinnerActionMessage(null);

        try {
            const response = await api.post(
                `/admin/winners/${contactWinnerId}/contact-attempts`,
                {
                    result: contactResult.trim(),
                    notes:
                        contactNotes.trim() ||
                        null,
                }
            );

            setWinnerActionMessage(
                response.data.message ??
                'Contact attempt recorded.'
            );

            setContactWinnerId(null);
            setContactResult('');
            setContactNotes('');

            await loadDraw();
        } catch (err) {
            console.error(err);

            const apiError = err as ApiError;

            setWinnerActionError(
                apiError.response?.data?.message ??
                'Unable to record contact attempt.'
            );
        } finally {
            setWinnerActionLoading(null);
        }
    };

    const confirmWinner = async (
        winnerId: number
    ) => {
        const confirmed = window.confirm(
            'Confirm this winner?'
        );

        if (!confirmed) {
            return;
        }

        setWinnerActionLoading(winnerId);
        setWinnerActionError(null);
        setWinnerActionMessage(null);

        try {
            const response = await api.post(
                `/admin/winners/${winnerId}/confirm`
            );

            setWinnerActionMessage(
                response.data.message ??
                'Winner confirmed successfully.'
            );

            await loadDraw();
        } catch (err) {
            console.error(err);

            const apiError = err as ApiError;

            setWinnerActionError(
                apiError.response?.data?.message ??
                'Unable to confirm winner.'
            );
        } finally {
            setWinnerActionLoading(null);
        }
    };

    const cancelWinner = async (
        winnerId: number
    ) => {
        const reason = window.prompt(
            'Cancellation reason:'
        );

        if (!reason?.trim()) {
            return;
        }

        setWinnerActionLoading(winnerId);
        setWinnerActionError(null);
        setWinnerActionMessage(null);

        try {
            const response = await api.post(
                `/admin/winners/${winnerId}/cancel`,
                {
                    reason: reason.trim(),
                }
            );

            setWinnerActionMessage(
                response.data.message ??
                'Winner cancelled successfully.'
            );

            await loadDraw();
        } catch (err) {
            console.error(err);

            const apiError = err as ApiError;

            setWinnerActionError(
                apiError.response?.data?.message ??
                'Unable to cancel winner.'
            );
        } finally {
            setWinnerActionLoading(null);
        }
    };

    const replaceWinner = async (
        winnerId: number
    ) => {
        const confirmed = window.confirm(
            'Select a replacement winner for this cancelled winner?'
        );

        if (!confirmed) {
            return;
        }

        setWinnerActionLoading(winnerId);
        setWinnerActionError(null);
        setWinnerActionMessage(null);

        try {
            const response = await api.post(
                `/admin/winners/${winnerId}/replace`
            );

            setWinnerActionMessage(
                response.data.message ??
                'Replacement winner selected successfully.'
            );

            await loadDraw();
        } catch (err) {
            console.error(err);

            const apiError = err as ApiError;

            setWinnerActionError(
                apiError.response?.data?.message ??
                'Unable to select replacement winner.'
            );
        } finally {
            setWinnerActionLoading(null);
        }
    };

    const contactAttemptResults: Array<{
        value: ContactAttemptResult;
        label: string;
    }> = [
        {
            value: 'no_answer',
            label: 'No answer',
        },
        {
            value: 'busy',
            label: 'Busy',
        },
        {
            value: 'wrong_number',
            label: 'Wrong number',
        },
        {
            value: 'contacted',
            label: 'Contacted',
        },
        {
            value: 'confirmed',
            label: 'Confirmed',
        },
        {
            value: 'declined',
            label: 'Declined',
        },
        {
            value: 'other',
            label: 'Other',
        },
    ];

    useEffect(() => {
        loadDraw();
        loadAvailablePrizes();
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">
                Loading draw...
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Link
                    to="/admin/draws"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to draws
                </Link>

                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            </div>
        );
    }

    if (!draw) {
        return null;
    }

    const totalPrizeQuantity =
        draw.draw_prizes.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );

    const confirmedWinners =
        draw.winners.filter(
            (winner) =>
                winner.status === 'confirmed'
        ).length;

    const cancelledWinners =
        draw.winners.filter(
            (winner) =>
                winner.status === 'cancelled'
        ).length;

    const selectedWinners =
        draw.winners.filter(
            (winner) =>
                winner.status === 'selected' ||
                winner.status === 'contacting'
        ).length;

    return (
        <div className="space-y-6">

            {/* Header */}

            <div className="flex items-start justify-between">

                <div>

                    <Link
                        to="/admin/draws"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        ← Back to draws
                    </Link>

                    <div className="mt-3 flex items-center gap-3">

                        <h2 className="text-2xl font-bold text-gray-900">
                            Week {draw.week_number}
                        </h2>

                        <StatusBadge
                            status={draw.status}
                        />

                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                        Draw #{draw.id}
                    </p>

                </div>

            </div>

            {/* Draw Actions */}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                <div className="flex flex-wrap items-center justify-between gap-4">

                    <div>
                        <h3 className="font-semibold text-gray-900">
                            Draw Actions
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Prepare and execute this draw.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">

                        {!draw.snapshot_at && (
                            <button
                                type="button"
                                onClick={createSnapshot}
                                disabled={
                                    actionLoading
                                }
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {actionLoading
                                    ? 'Creating...'
                                    : 'Create Snapshot'}
                            </button>
                        )}

                        {draw.snapshot_at && (
                            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                                Snapshot created
                            </div>
                        )}

                        {draw.status === 'running' && (
                            <button
                                type="button"
                                onClick={executeDraw}
                                disabled={
                                    executeLoading
                                }
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {executeLoading
                                    ? 'Executing...'
                                    : 'Execute Draw'}
                            </button>
                        )}

                    </div>

                </div>

                {actionMessage && (
                    <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        {actionMessage}
                    </div>
                )}

                {actionError && (
                    <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {actionError}
                    </div>
                )}

                {executeMessage && (
                    <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        {executeMessage}
                    </div>
                )}

                {executeError && (
                    <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {executeError}
                    </div>
                )}

            </div>

            {/* Summary */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="text-sm text-gray-500">
                        Eligible entries
                    </div>

                    <div className="mt-2 text-2xl font-bold text-gray-900">
                        {draw.entries.length}
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="text-sm text-gray-500">
                        Prize quantity
                    </div>

                    <div className="mt-2 text-2xl font-bold text-gray-900">
                        {totalPrizeQuantity}
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="text-sm text-gray-500">
                        Selected / contacting
                    </div>

                    <div className="mt-2 text-2xl font-bold text-blue-700">
                        {selectedWinners}
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="text-sm text-gray-500">
                        Confirmed / cancelled
                    </div>

                    <div className="mt-2 text-2xl font-bold text-gray-900">
                        {confirmedWinners}
                        <span className="mx-2 text-gray-300">
                            /
                        </span>
                        <span className="text-red-700">
                            {cancelledWinners}
                        </span>
                    </div>
                </div>

            </div>

            {/* Draw Information */}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">
                    <h3 className="font-semibold text-gray-900">
                        Draw Information
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-3">

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Status
                        </div>

                        <div className="mt-1">
                            <StatusBadge
                                status={draw.status}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Snapshot
                        </div>

                        <div className="mt-1 text-sm text-gray-700">
                            {draw.snapshot_at
                                ? new Date(
                                    draw.snapshot_at
                                ).toLocaleString()
                                : 'Not created'}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Randomization
                        </div>

                        <div className="mt-1 text-sm text-gray-700">
                            {draw.randomized_at
                                ? `${draw.random_provider ?? 'Unknown'} — ${new Date(
                                    draw.randomized_at
                                ).toLocaleString()}`
                                : 'Not randomized'}
                        </div>
                    </div>

                </div>

            </div>

            {/* Prizes */}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">

                    <div className="flex items-center justify-between">

                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Prizes
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Configure prizes for this draw.
                            </p>
                        </div>

                        {!isEditableDraw && (
                            <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
                                Editing disabled
                            </span>
                        )}

                    </div>

                </div>

                {prizeActionMessage && (
                    <div className="m-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        {prizeActionMessage}
                    </div>
                )}

                {prizeActionError && (
                    <div className="m-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {prizeActionError}
                    </div>
                )}

                <div className="divide-y divide-gray-100">

                    {draw.draw_prizes.map(
                        (drawPrize) => (

                            <div
                                key={drawPrize.id}
                                className="flex items-center justify-between px-5 py-4"
                            >

                                <div>

                                    <div className="font-medium text-gray-900">
                                        {drawPrize.prize.name}
                                    </div>

                                    <div className="mt-1 text-xs text-gray-500">
                                        Type:{' '}
                                        {drawPrize.prize.type}
                                    </div>

                                </div>

                                <div className="flex items-center gap-4">

                                    <div className="text-right">

                                        <div className="font-semibold text-gray-900">
                                            ×{' '}
                                            {
                                                drawPrize.quantity
                                            }
                                        </div>

                                        {drawPrize.prize.value !==
                                            null && (
                                                <div className="text-xs text-gray-500">
                                                    {
                                                        drawPrize.prize
                                                            .value
                                                    }{' '}
                                                    {
                                                        drawPrize.prize
                                                            .currency
                                                    }
                                                </div>
                                            )}

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
                                                prizeActionLoading
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

                    {isEditableDraw && (
                        <div className="border-t border-gray-200 p-5">

                            <h4 className="mb-4 text-sm font-semibold text-gray-900">
                                Add Prize
                            </h4>

                            <div className="flex flex-wrap items-end gap-3">

                                <div className="min-w-64">
                                    <label className="mb-1 block text-xs font-medium text-gray-600">
                                        Prize
                                    </label>

                                    <select
                                        value={
                                            selectedPrizeId
                                        }
                                        onChange={(e) =>
                                            setSelectedPrizeId(
                                                e.target.value
                                                    ? Number(
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                    : ''
                                            )
                                        }
                                        disabled={
                                            prizeActionLoading
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                                    >
                                        <option value="">
                                            Select prize
                                        </option>

                                        {availablePrizes.map(
                                            (prize) => (
                                                <option
                                                    key={
                                                        prize.id
                                                    }
                                                    value={
                                                        prize.id
                                                    }
                                                    disabled={
                                                        prize.available_quantity ===
                                                        0
                                                    }
                                                >
                                                    {
                                                        prize.name
                                                    }{' '}
                                                    — available:{' '}
                                                    {
                                                        prize.available_quantity
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div className="w-32">
                                    <label className="mb-1 block text-xs font-medium text-gray-600">
                                        Quantity
                                    </label>

                                    <input
                                        type="number"
                                        min={1}
                                        value={
                                            prizeQuantity
                                        }
                                        onChange={(e) =>
                                            setPrizeQuantity(
                                                Number(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            )
                                        }
                                        disabled={
                                            prizeActionLoading
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={addPrize}
                                    disabled={
                                        prizeActionLoading ||
                                        selectedPrizeId ===
                                        ''
                                    }
                                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {prizeActionLoading
                                        ? 'Saving...'
                                        : 'Add Prize'}
                                </button>

                            </div>

                            {selectedPrizeId !== '' && (
                                <div className="mt-3 text-xs text-gray-500">

                                    {(() => {
                                        const prize =
                                            availablePrizes.find(
                                                (item) =>
                                                    item.id ===
                                                    selectedPrizeId
                                            );

                                        if (!prize) {
                                            return null;
                                        }

                                        return (
                                            <>
                                                Total available:{' '}
                                                <span className="font-medium text-gray-700">
                                                    {
                                                        prize.total_quantity
                                                    }
                                                </span>

                                                {' · '}

                                                Already allocated:{' '}
                                                <span className="font-medium text-gray-700">
                                                    {
                                                        prize.allocated_quantity
                                                    }
                                                </span>

                                                {' · '}

                                                Remaining:{' '}
                                                <span className="font-medium text-gray-700">
                                                    {
                                                        prize.available_quantity
                                                    }
                                                </span>
                                            </>
                                        );
                                    })()}

                                </div>
                            )}

                        </div>
                    )}

                    {draw.draw_prizes.length ===
                        0 && (
                            <div className="p-5 text-sm text-gray-400">
                                No prizes configured.
                            </div>
                        )}

                </div>

            </div>

            {/* Winners */}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">

                    <h3 className="font-semibold text-gray-900">
                        Winners
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Manage selected winners,
                        contact attempts,
                        confirmation and
                        replacements.
                    </p>

                </div>

                {winnerActionMessage && (
                    <div className="m-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        {winnerActionMessage}
                    </div>
                )}

                {winnerActionError && (
                    <div className="m-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {winnerActionError}
                    </div>
                )}

                {draw.winners.length === 0 ? (
                    <div className="p-5 text-sm text-gray-400">
                        No winners yet.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">

                        {draw.winners.map(
                            (winner) => {

                                const drawPrize =
                                    draw.draw_prizes.find(
                                        (item) =>
                                            item.id ===
                                            winner.draw_prize_id
                                    );

                                const isWinnerLoading =
                                    winnerActionLoading ===
                                    winner.id;

                                return (
                                    <div
                                        key={
                                            winner.id
                                        }
                                        className="p-5"
                                    >

                                        <div className="flex flex-wrap items-start justify-between gap-4">

                                            <div>

                                                <div className="font-semibold text-gray-900">
                                                    {
                                                        drawPrize
                                                            ?.prize
                                                            .name
                                                    }
                                                </div>

                                                <div className="mt-1 text-sm text-gray-500">
                                                    Entry #
                                                    {
                                                        winner.entry_number
                                                    }

                                                    {' · '}

                                                    Receipt{' '}
                                                    {
                                                        winner
                                                            .receipt
                                                            ?.receipt_number
                                                    }
                                                </div>

                                                <div className="mt-1 text-xs text-gray-400">
                                                    Winner ID #
                                                    {
                                                        winner.id
                                                    }
                                                </div>

                                            </div>

                                            <StatusBadge
                                                status={
                                                    winner.status
                                                }
                                            />

                                        </div>

                                        {winner.replaced_winner_id !==
                                            null && (
                                                <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                                                    Replacement for
                                                    winner #
                                                    {
                                                        winner.replaced_winner_id
                                                    }
                                                </div>
                                            )}

                                        {winner.status ===
                                            'cancelled' &&
                                            winner.cancellation_reason && (
                                                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                                                <span className="font-medium">
                                                    Cancellation reason:
                                                </span>{' '}
                                                    {
                                                        winner.cancellation_reason
                                                    }
                                                </div>
                                            )}

                                        <div className="mt-4 flex flex-wrap gap-2">

                                            {(winner.status ===
                                                'selected' ||
                                                winner.status ===
                                                'contacting') && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openContactAttempt(
                                                                winner.id
                                                            )
                                                        }
                                                        disabled={
                                                            winnerActionLoading !==
                                                            null
                                                        }
                                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Add Contact Attempt
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            confirmWinner(
                                                                winner.id
                                                            )
                                                        }
                                                        disabled={
                                                            winnerActionLoading !==
                                                            null
                                                        }
                                                        className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {isWinnerLoading
                                                            ? 'Processing...'
                                                            : 'Confirm Winner'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            cancelWinner(
                                                                winner.id
                                                            )
                                                        }
                                                        disabled={
                                                            winnerActionLoading !==
                                                            null
                                                        }
                                                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}

                                            {winner.status ===
                                                'cancelled' && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            replaceWinner(
                                                                winner.id
                                                            )
                                                        }
                                                        disabled={
                                                            winnerActionLoading !==
                                                            null
                                                        }
                                                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {isWinnerLoading
                                                            ? 'Selecting...'
                                                            : 'Select Replacement'}
                                                    </button>
                                                )}

                                        </div>

                                        {/* Contact Attempts */}

                                        {winner.contact_attempts &&
                                            winner
                                                .contact_attempts
                                                .length > 0 && (
                                                <div className="mt-4">

                                                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                        Contact Attempts
                                                    </div>

                                                    <div className="space-y-2">

                                                        {winner.contact_attempts.map(
                                                            (
                                                                attempt
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        attempt.id
                                                                    }
                                                                    className="rounded-lg bg-gray-50 p-3"
                                                                >

                                                                    <div className="flex flex-wrap items-center justify-between gap-2">

                                                                        <span className="text-sm font-medium text-gray-800">
                                                                            {
                                                                                contactAttemptResults.find(
                                                                                    (
                                                                                        item
                                                                                    ) =>
                                                                                        item.value ===
                                                                                        attempt.result
                                                                                )
                                                                                    ?.label ??
                                                                                attempt.result
                                                                            }
                                                                        </span>

                                                                        <span className="text-xs text-gray-400">
                                                                            {new Date(
                                                                                attempt.attempted_at
                                                                            ).toLocaleString()}
                                                                        </span>

                                                                    </div>

                                                                    {attempt.notes && (
                                                                        <div className="mt-1 text-sm text-gray-600">
                                                                            {
                                                                                attempt.notes
                                                                            }
                                                                        </div>
                                                                    )}

                                                                </div>
                                                            )
                                                        )}

                                                    </div>

                                                </div>
                                            )}

                                        {/* Contact Attempt Form */}

                                        {contactWinnerId ===
                                            winner.id && (
                                                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">

                                                    <div className="mb-3 font-medium text-gray-900">
                                                        Contact Attempt
                                                    </div>

                                                    <div>

                                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                                            Result
                                                        </label>

                                                        <select
                                                            value={
                                                                contactResult
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                setContactResult(
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            disabled={
                                                                winnerActionLoading !==
                                                                null
                                                            }
                                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                                                        >
                                                            <option value="">
                                                                Select result
                                                            </option>

                                                            {contactAttemptResults.map(
                                                                (
                                                                    item
                                                                ) => (
                                                                    <option
                                                                        key={
                                                                            item.value
                                                                        }
                                                                        value={
                                                                            item.value
                                                                        }
                                                                    >
                                                                        {
                                                                            item.label
                                                                        }
                                                                    </option>
                                                                )
                                                            )}

                                                        </select>

                                                    </div>

                                                    <div className="mt-3">

                                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                                            Notes
                                                        </label>

                                                        <textarea
                                                            value={
                                                                contactNotes
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                setContactNotes(
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            maxLength={
                                                                5000
                                                            }
                                                            rows={
                                                                3
                                                            }
                                                            placeholder="Optional notes..."
                                                            disabled={
                                                                winnerActionLoading !==
                                                                null
                                                            }
                                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                                                        />

                                                        <div className="mt-1 text-right text-xs text-gray-400">
                                                            {
                                                                contactNotes.length
                                                            }
                                                            /5000
                                                        </div>

                                                    </div>

                                                    <div className="mt-3 flex gap-2">

                                                        <button
                                                            type="button"
                                                            onClick={
                                                                addContactAttempt
                                                            }
                                                            disabled={
                                                                winnerActionLoading !==
                                                                null ||
                                                                !contactResult
                                                            }
                                                            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {winnerActionLoading ===
                                                            winner.id
                                                                ? 'Saving...'
                                                                : 'Save Attempt'}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={
                                                                closeContactAttempt
                                                            }
                                                            disabled={
                                                                winnerActionLoading !==
                                                                null
                                                            }
                                                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                                                        >
                                                            Cancel
                                                        </button>

                                                    </div>

                                                </div>
                                            )}

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </div>

            {/* Randomization */}

            {draw.random_response && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="border-b border-gray-200 px-5 py-4">
                        <h3 className="font-semibold text-gray-900">
                            Randomization
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">

                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Provider
                            </div>

                            <div className="mt-1 text-sm text-gray-900">
                                {draw.random_provider ??
                                    '-'}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Entry count
                            </div>

                            <div className="mt-1 text-sm text-gray-900">
                                {
                                    draw.random_request
                                        ?.entry_count
                                }
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Randomized at
                            </div>

                            <div className="mt-1 text-sm text-gray-900">
                                {draw.randomized_at
                                    ? new Date(
                                        draw.randomized_at
                                    ).toLocaleString()
                                    : '-'}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Request ID
                            </div>

                            <div className="mt-1 text-sm text-gray-900">
                                {
                                    draw.random_request_id ??
                                    '-'
                                }
                            </div>
                        </div>

                        <div className="md:col-span-2">

                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Randomized order
                            </div>

                            <div className="mt-2 rounded-lg bg-gray-50 p-4 font-mono text-sm text-gray-700">
                                {draw.random_response.values.join(
                                    ', '
                                )}
                            </div>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}
