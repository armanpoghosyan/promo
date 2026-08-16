import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    Link,
} from 'react-router-dom';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

import type {
    ApiError,
} from '../../types/api';

import {
    formatDateTime,
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

type Draw = {
    id: number;
    week_number: number;
    draw_date: string | null;
    status: string;

    started_at: string | null;
    completed_at: string | null;
    snapshot_at: string | null;

    random_provider: string | null;
    randomized_at: string | null;

    eligible_entries_count: number;
    required_winners: number;
    can_prepare: boolean;

    draw_prizes: DrawPrize[];
};

type DrawListResponse = {
    data: Draw[];
};

type CreateDrawResponse = {
    message?: string;
    data: Draw;
};

export default function Draws() {
    const [
        draws,
        setDraws,
    ] = useState<Draw[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );

    const [
        showCreateForm,
        setShowCreateForm,
    ] = useState(false);

    const [
        createLoading,
        setCreateLoading,
    ] = useState(false);

    const [
        createError,
        setCreateError,
    ] = useState<string | null>(
        null
    );

    const [
        createSuccess,
        setCreateSuccess,
    ] = useState<string | null>(
        null
    );

    const [
        newWeekNumber,
        setNewWeekNumber,
    ] = useState<number | ''>(
        ''
    );

    const [
        newDrawDate,
        setNewDrawDate,
    ] = useState('');

    const loadDraws =
        async () => {
            setLoading(true);
            setError(null);

            try {
                const response =
                    await api.get<DrawListResponse>(
                        '/admin/draws'
                    );

                setDraws(
                    response.data
                        .data ?? []
                );
            } catch (err) {
                console.error(err);

                setError(
                    'Unable to load draws.'
                );
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        loadDraws();
    }, []);

    const usedWeeks =
        useMemo(
            () =>
                new Set(
                    draws.map(
                        (draw) =>
                            draw.week_number
                    )
                ),
            [draws]
        );

    const availableWeeks =
        useMemo(
            () =>
                [
                    1,
                    2,
                    3,
                    4,
                    5,
                ].filter(
                    (week) =>
                        !usedWeeks.has(
                            week
                        )
                ),
            [usedWeeks]
        );

    const createDraw =
        async () => {
            if (
                newWeekNumber === '' ||
                !newDrawDate
            ) {
                return;
            }

            setCreateLoading(true);
            setCreateError(null);
            setCreateSuccess(null);

            try {
                const response =
                    await api.post<CreateDrawResponse>(
                        '/admin/draws',
                        {
                            week_number:
                            newWeekNumber,

                            draw_date:
                            newDrawDate,
                        }
                    );

                setCreateSuccess(
                    response.data
                        .message ??
                    'Draw created successfully.'
                );

                setNewWeekNumber(
                    ''
                );

                setNewDrawDate(
                    ''
                );

                setShowCreateForm(
                    false
                );

                await loadDraws();
            } catch (err) {
                console.error(err);

                const apiError =
                    err as ApiError;

                const validationErrors =
                    apiError.response
                        ?.data
                        ?.errors;

                if (
                    validationErrors
                ) {
                    const firstMessage =
                        Object.values(
                            validationErrors
                        )[0]?.[0];

                    setCreateError(
                        firstMessage ??
                        'Unable to create draw.'
                    );
                } else {
                    setCreateError(
                        apiError.response
                            ?.data
                            ?.message ??
                        'Unable to create draw.'
                    );
                }
            } finally {
                setCreateLoading(
                    false
                );
            }
        };

    const getTotalPrizes = (
        draw: Draw
    ) =>
        draw.draw_prizes.reduce(
            (
                total,
                drawPrize
            ) =>
                total +
                drawPrize.quantity,
            0
        );

    const getProgress = (
        draw: Draw
    ) => {
        if (
            draw.status ===
            'completed'
        ) {
            return {
                label:
                    'Draw completed',

                description:
                    'Winner selection has been completed.',

                tone:
                    'text-green-700',
            };
        }

        if (
            draw.status ===
            'running' &&
            draw.snapshot_at
        ) {
            return {
                label:
                    'Ready to execute',

                description:
                    `${draw.eligible_entries_count} frozen entries.`,

                tone:
                    'text-blue-700',
            };
        }

        if (
            draw.draw_prizes
                .length ===
            0
        ) {
            return {
                label:
                    'Configure prizes',

                description:
                    'Add prizes before preparing the draw.',

                tone:
                    'text-amber-700',
            };
        }

        if (
            draw.eligible_entries_count <
            draw.required_winners
        ) {
            return {
                label:
                    'Not enough entries',

                description:
                    `${draw.eligible_entries_count} eligible / ${draw.required_winners} required.`,

                tone:
                    'text-red-700',
            };
        }

        if (
            draw.can_prepare
        ) {
            return {
                label:
                    'Ready to prepare',

                description:
                    `${draw.eligible_entries_count} eligible / ${draw.required_winners} required.`,

                tone:
                    'text-green-700',
            };
        }

        return {
            label:
                'Review draw',

            description:
                'Open the draw to review its current state.',

            tone:
                'text-gray-700',
        };
    };

    return (
        <div className="space-y-6">

            {/* Header */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>

                    <h2 className="text-2xl font-bold text-gray-900">
                        Draws
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Create, configure and execute weekly promotion draws.
                    </p>

                </div>

                <button
                    type="button"
                    onClick={() => {
                        setShowCreateForm(
                            (current) =>
                                !current
                        );

                        setCreateError(
                            null
                        );
                    }}
                    disabled={
                        availableWeeks
                            .length ===
                        0
                    }
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Create Draw
                </button>

            </div>

            {/* Success */}

            {createSuccess && (
                <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

                    <span>
                        {createSuccess}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setCreateSuccess(
                                null
                            )
                        }
                        className="font-medium"
                    >
                        ×
                    </button>

                </div>
            )}

            {/* Create draw */}

            {showCreateForm && (

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="border-b border-gray-200 px-5 py-4">

                        <h3 className="font-semibold text-gray-900">
                            Create Draw
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Create a weekly draw. Prize allocation can be configured afterward.
                        </p>

                    </div>

                    <div className="p-5">

                        {createError && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {createError}
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-[200px_260px_auto] md:items-end">

                            <div>

                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Week
                                </label>

                                <select
                                    value={
                                        newWeekNumber
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setNewWeekNumber(
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
                                    disabled={
                                        createLoading
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                >

                                    <option value="">
                                        Select week
                                    </option>

                                    {availableWeeks.map(
                                        (week) => (
                                            <option
                                                key={
                                                    week
                                                }
                                                value={
                                                    week
                                                }
                                            >
                                                Week{' '}
                                                {week}
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                            <div>

                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Draw Date
                                </label>

                                <input
                                    type="datetime-local"
                                    value={
                                        newDrawDate
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setNewDrawDate(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    disabled={
                                        createLoading
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                />

                            </div>

                            <div className="flex gap-2">

                                <button
                                    type="button"
                                    onClick={
                                        createDraw
                                    }
                                    disabled={
                                        createLoading ||
                                        newWeekNumber ===
                                        '' ||
                                        !newDrawDate
                                    }
                                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {createLoading
                                        ? 'Creating...'
                                        : 'Create Draw'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateForm(
                                            false
                                        );

                                        setCreateError(
                                            null
                                        );

                                        setNewWeekNumber(
                                            ''
                                        );

                                        setNewDrawDate(
                                            ''
                                        );
                                    }}
                                    disabled={
                                        createLoading
                                    }
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>

                            </div>

                        </div>

                    </div>

                </section>
            )}

            {/* Error */}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Draw list */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                {loading ? (

                    <div className="flex min-h-64 items-center justify-center text-sm text-gray-500">
                        Loading draws...
                    </div>

                ) : draws.length ===
                0 ? (

                    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

                        <div className="text-sm font-medium text-gray-700">
                            No draws created.
                        </div>

                        <p className="mt-1 text-sm text-gray-400">
                            Create the first promotion draw to get started.
                        </p>

                    </div>

                ) : (

                    <div className="divide-y divide-gray-100">

                        {draws.map(
                            (draw) => {
                                const progress =
                                    getProgress(
                                        draw
                                    );

                                const totalPrizes =
                                    getTotalPrizes(
                                        draw
                                    );

                                return (
                                    <div
                                        key={
                                            draw.id
                                        }
                                        className="p-5 transition hover:bg-gray-50"
                                    >

                                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                                            {/* Draw */}

                                            <div className="min-w-0 flex-1">

                                                <div className="flex flex-wrap items-center gap-3">

                                                    <div className="text-lg font-semibold text-gray-900">
                                                        Week{' '}
                                                        {draw.week_number}
                                                    </div>

                                                    <StatusBadge
                                                        status={
                                                            draw.status
                                                        }
                                                    />

                                                </div>

                                                <div className="mt-1 text-sm text-gray-500">
                                                    {formatDateTime(
                                                        draw.draw_date
                                                    )}

                                                    {' · '}

                                                    Draw #
                                                    {draw.id}
                                                </div>

                                            </div>

                                            {/* Prize allocation */}

                                            <div className="lg:w-80">

                                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                    Prize Allocation
                                                </div>

                                                <div className="mt-1 text-sm font-medium text-gray-900">
                                                    {totalPrizes}{' '}
                                                    winner
                                                    {totalPrizes ===
                                                    1
                                                        ? ''
                                                        : 's'}
                                                </div>

                                                {draw.draw_prizes
                                                        .length >
                                                    0 && (

                                                        <div className="mt-1 text-xs text-gray-500">

                                                            {draw.draw_prizes
                                                                .map(
                                                                    (
                                                                        item
                                                                    ) =>
                                                                        `${item.prize.name} × ${item.quantity}`
                                                                )
                                                                .join(
                                                                    ' · '
                                                                )}

                                                        </div>
                                                    )}

                                                {!draw.snapshot_at &&
                                                    draw.draw_prizes
                                                        .length >
                                                    0 && (

                                                        <div className="mt-2 text-xs text-gray-500">

                                                            Eligible:{' '}

                                                            <span
                                                                className={
                                                                    draw.eligible_entries_count <
                                                                    draw.required_winners
                                                                        ? 'font-semibold text-red-700'
                                                                        : 'font-semibold text-gray-700'
                                                                }
                                                            >
                                                            {draw.eligible_entries_count}
                                                        </span>

                                                            {' · '}

                                                            Required:{' '}

                                                            <span className="font-semibold text-gray-700">
                                                            {draw.required_winners}
                                                        </span>

                                                        </div>
                                                    )}

                                                {draw.snapshot_at && (

                                                    <div className="mt-2 text-xs text-gray-500">
                                                        Frozen entries:{' '}

                                                        <span className="font-semibold text-gray-700">
                                                            {draw.eligible_entries_count}
                                                        </span>
                                                    </div>
                                                )}

                                            </div>

                                            {/* Next step */}

                                            <div className="lg:w-56">

                                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                    Next Step
                                                </div>

                                                <div
                                                    className={`mt-1 text-sm font-medium ${progress.tone}`}
                                                >
                                                    {progress.label}
                                                </div>

                                                <div className="mt-1 text-xs text-gray-400">
                                                    {progress.description}
                                                </div>

                                            </div>

                                            {/* Action */}

                                            <div className="lg:w-28 lg:text-right">

                                                <Link
                                                    to={`/admin/draws/${draw.id}`}
                                                    className="inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                                                >
                                                    Manage
                                                </Link>

                                            </div>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </section>

            {/* Promotion schedule */}

            {draws.length > 0 && (

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <h3 className="font-semibold text-gray-900">
                                Promotion Schedule
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                {draws.length} of 5 weekly draws have been created.
                            </p>

                        </div>

                        <div className="flex gap-2">

                            {[
                                1,
                                2,
                                3,
                                4,
                                5,
                            ].map(
                                (week) => {
                                    const draw =
                                        draws.find(
                                            (
                                                item
                                            ) =>
                                                item.week_number ===
                                                week
                                        );

                                    return (
                                        <div
                                            key={
                                                week
                                            }
                                            title={
                                                draw
                                                    ? `Week ${week}: ${draw.status}`
                                                    : `Week ${week}: not created`
                                            }
                                            className={
                                                draw
                                                    ? 'flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-sm font-semibold text-white'
                                                    : 'flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm font-medium text-gray-400'
                                            }
                                        >
                                            {week}
                                        </div>
                                    );
                                }
                            )}

                        </div>

                    </div>

                </section>
            )}

        </div>
    );
}
