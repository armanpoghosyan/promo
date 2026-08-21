import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';

import api from '../../services/api';

import type {
    CreateDrawResponse,
    Draw,
    DrawListResponse,
} from '../../types/draw';

import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';

const PROMOTION_WEEKS = [1, 2, 3, 4, 5];

interface DrawProgress {
    label: string;
    description: string;
    tone: string;
}

function totalPrizeQuantity(draw: Draw): number {
    return (draw.draw_prizes ?? []).reduce(
        (total, drawPrize) => total + drawPrize.quantity,
        0
    );
}

function drawProgress(draw: Draw): DrawProgress {
    if (draw.status === 'completed') {
        return {
            label: 'Draw completed',
            description: 'Winner selection has been completed.',
            tone: 'text-green-700',
        };
    }

    if (draw.snapshot_at) {
        return {
            label: 'Ready to execute',
            description: 'Eligible entries are locked.',
            tone: 'text-blue-700',
        };
    }

    if ((draw.draw_prizes ?? []).length === 0) {
        return {
            label: 'Configure prizes',
            description: 'Add prizes before preparing the draw.',
            tone: 'text-amber-700',
        };
    }

    if (draw.can_prepare === false) {
        return {
            label: 'Not ready to prepare',
            description:
                draw.blocking_reason ??
                'The draw requirements have not been met.',
            tone: 'text-amber-700',
        };
    }

    return {
        label: 'Ready to prepare',
        description: 'Prize allocation is configured.',
        tone: 'text-gray-700',
    };
}

export default function Draws() {
    const [draws, setDraws] = useState<Draw[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [createSuccess, setCreateSuccess] = useState<string | null>(null);

    const [newWeekNumber, setNewWeekNumber] = useState<number | ''>('');
    const [newDrawDate, setNewDrawDate] = useState('');

    const loadDraws = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<DrawListResponse>(
                '/admin/draws'
            );

            setDraws(response.data.data ?? []);
        } catch (error: unknown) {
            setError(
                getApiErrorMessage(error, 'Unable to load draws.')
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDraws();
    }, [loadDraws]);

    const availableWeeks = useMemo(() => {
        const usedWeeks = new Set(
            draws.map((draw) => draw.week_number)
        );

        return PROMOTION_WEEKS.filter(
            (week) => !usedWeeks.has(week)
        );
    }, [draws]);

    const closeCreateForm = () => {
        setShowCreateForm(false);
        setCreateError(null);
        setNewWeekNumber('');
        setNewDrawDate('');
    };

    const createDraw = async () => {
        if (newWeekNumber === '' || !newDrawDate) {
            return;
        }

        setCreateLoading(true);
        setCreateError(null);
        setCreateSuccess(null);

        try {
            const response = await api.post<CreateDrawResponse>(
                '/admin/draws',
                {
                    week_number: newWeekNumber,
                    draw_date: newDrawDate,
                }
            );

            setCreateSuccess(
                response.data.message ??
                'Draw created successfully.'
            );

            closeCreateForm();
            await loadDraws();
        } catch (error: unknown) {
            setCreateError(
                getApiErrorMessage(
                    error,
                    'Unable to create draw.'
                )
            );
        } finally {
            setCreateLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Draws"
                description="Create, configure and execute weekly promotion draws."
                action={
                    <button
                        type="button"
                        onClick={() => {
                            setShowCreateForm((current) => !current);
                            setCreateError(null);
                        }}
                        disabled={availableWeeks.length === 0}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Create Draw
                    </button>
                }
            />

            {createSuccess && (
                <Alert
                    variant="success"
                    onDismiss={() => setCreateSuccess(null)}
                >
                    {createSuccess}
                </Alert>
            )}

            {showCreateForm && (
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h2 className="font-semibold text-gray-900">
                            Create Draw
                        </h2>

                        <p className="mt-0.5 text-sm text-gray-500">
                            Create a weekly draw. Prize allocation can
                            be configured afterward.
                        </p>
                    </div>

                    <div className="p-4">
                        {createError && (
                            <div className="mb-4">
                                <Alert
                                    variant="error"
                                    onDismiss={() =>
                                        setCreateError(null)
                                    }
                                >
                                    {createError}
                                </Alert>
                            </div>
                        )}

                        <div className="grid gap-3 md:grid-cols-[180px_250px_auto] md:items-end">
                            <div>
                                <label
                                    htmlFor="draw-week"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Week
                                </label>

                                <select
                                    id="draw-week"
                                    value={newWeekNumber}
                                    onChange={(event) =>
                                        setNewWeekNumber(
                                            event.target.value
                                                ? Number(
                                                    event.target.value
                                                )
                                                : ''
                                        )
                                    }
                                    disabled={createLoading}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                >
                                    <option value="">
                                        Select week
                                    </option>

                                    {availableWeeks.map((week) => (
                                        <option
                                            key={week}
                                            value={week}
                                        >
                                            Week {week}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="draw-date"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Draw Date
                                </label>

                                <input
                                    id="draw-date"
                                    type="datetime-local"
                                    value={newDrawDate}
                                    onChange={(event) =>
                                        setNewDrawDate(
                                            event.target.value
                                        )
                                    }
                                    disabled={createLoading}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={createDraw}
                                    disabled={
                                        createLoading ||
                                        newWeekNumber === '' ||
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
                                    onClick={closeCreateForm}
                                    disabled={createLoading}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {draws.length > 0 && (
                <section className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">
                                Promotion Schedule
                            </h2>

                            <p className="mt-0.5 text-xs text-gray-500">
                                {draws.length} of {PROMOTION_WEEKS.length}{' '}
                                weekly draws created.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            {PROMOTION_WEEKS.map((week) => {
                                const draw = draws.find(
                                    (item) =>
                                        item.week_number === week
                                );

                                return (
                                    <div
                                        key={week}
                                        title={
                                            draw
                                                ? `Week ${week}: ${draw.status}`
                                                : `Week ${week}: not created`
                                        }
                                        className={
                                            draw
                                                ? 'flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-sm font-semibold text-white'
                                                : 'flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm font-medium text-gray-400'
                                        }
                                    >
                                        {week}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {error && (
                <Alert
                    variant="error"
                    onDismiss={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {loading ? (
                    <LoadingState message="Loading draws..." />
                ) : draws.length === 0 ? (
                    <EmptyState
                        title="No draws created."
                        description="Create the first promotion draw to get started."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[960px] text-left text-sm">
                            <thead className="bg-gray-50">
                            <tr>
                                <TableHeader>Draw</TableHeader>
                                <TableHeader>Prizes</TableHeader>
                                <TableHeader>Entries</TableHeader>
                                <TableHeader>Next Step</TableHeader>
                                <th className="px-4 py-2.5" />
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                            {draws.map((draw) => {
                                const prizes =
                                    draw.draw_prizes ?? [];

                                const prizeQuantity =
                                    totalPrizeQuantity(draw);

                                const progress =
                                    drawProgress(draw);

                                const entriesLabel = draw.snapshot_at
                                    ? `${draw.entries_count ?? 0} frozen`
                                    : `${
                                        draw.eligible_entries_count ??
                                        0
                                    } eligible`;

                                return (
                                    <tr
                                        key={draw.id}
                                        className="transition hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold text-gray-900">
                                                        Week{' '}
                                                        {draw.week_number}
                                                    </span>

                                                <StatusBadge
                                                    status={
                                                        draw.status
                                                    }
                                                />
                                            </div>

                                            <div className="mt-1 text-xs text-gray-500">
                                                {formatDateTime(
                                                    draw.draw_date
                                                )}
                                            </div>

                                            <div className="mt-0.5 text-[11px] text-gray-400">
                                                Draw #{draw.id}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 align-top">
                                            <div className="font-medium text-gray-900">
                                                {prizeQuantity}{' '}
                                                winner
                                                {prizeQuantity === 1
                                                    ? ''
                                                    : 's'}
                                            </div>

                                            {prizes.length > 0 ? (
                                                <div className="mt-1 max-w-[330px] text-xs text-gray-500">
                                                    {prizes
                                                        .map(
                                                            (
                                                                item
                                                            ) =>
                                                                `${
                                                                    item
                                                                        .prize
                                                                        ?.name ??
                                                                    'Prize'
                                                                } × ${
                                                                    item.quantity
                                                                }`
                                                        )
                                                        .join(' · ')}
                                                </div>
                                            ) : (
                                                <div className="mt-1 text-xs text-gray-400">
                                                    No prizes
                                                    configured
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 align-top">
                                            <div className="font-medium text-gray-900">
                                                {entriesLabel}
                                            </div>

                                            {!draw.snapshot_at && (
                                                <div className="mt-1 text-xs text-gray-500">
                                                    {draw.required_winners ??
                                                        prizeQuantity}{' '}
                                                    required
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 align-top">
                                            <div
                                                className={`font-medium ${progress.tone}`}
                                            >
                                                {progress.label}
                                            </div>

                                            <div className="mt-1 max-w-[260px] text-xs text-gray-400">
                                                {
                                                    progress.description
                                                }
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-right align-top">
                                            <Link
                                                to={`/admin/draws/${draw.id}`}
                                                className="inline-flex rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                                            >
                                                Manage →
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

function TableHeader({
                         children,
                     }: {
    children: React.ReactNode;
}) {
    return (
        <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {children}
        </th>
    );
}
