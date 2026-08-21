import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    useLocation,
    useNavigate,
    useSearchParams,
} from 'react-router-dom';

import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';

import api from '../../services/api';

import type { PaginatedResponse } from '../../types/api';
import type {
    WinnerDetail,
    WinnerStatus,
} from '../../types/winner';

import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';
import { positiveIntegerParam } from '../../utils/query';

const WINNER_STATUSES: Array<{
    value: WinnerStatus;
    label: string;
}> = [
    {
        value: 'selected',
        label: 'Selected',
    },
    {
        value: 'contacting',
        label: 'Contacting',
    },
    {
        value: 'confirmed',
        label: 'Confirmed',
    },
    {
        value: 'cancelled',
        label: 'Cancelled',
    },
];

function winnerStatusParam(value: string | null): WinnerStatus | '' {
    return WINNER_STATUSES.some(
        (option) => option.value === value
    )
        ? (value as WinnerStatus)
        : '';
}

export default function Winners() {
    const location = useLocation();
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    const status = winnerStatusParam(searchParams.get('status'));
    const page = positiveIntegerParam(searchParams.get('page'));

    const [winners, setWinners] = useState<WinnerDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    const updateUrl = useCallback(
        (nextStatus: WinnerStatus | '', nextPage: number) => {
            const params = new URLSearchParams();

            if (nextStatus) {
                params.set('status', nextStatus);
            }

            if (nextPage > 1) {
                params.set('page', String(nextPage));
            }

            setSearchParams(params, {
                replace: true,
            });
        },
        [setSearchParams]
    );

    const loadWinners = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<
                PaginatedResponse<WinnerDetail>
            >('/admin/winners', {
                params: {
                    status: status || undefined,
                    page,
                    per_page: 20,
                },
            });

            setWinners(response.data.data ?? []);

            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                per_page: response.data.per_page,
                total: response.data.total,
            });
        } catch (error: unknown) {
            setError(
                getApiErrorMessage(
                    error,
                    'Unable to load winners.'
                )
            );
        } finally {
            setLoading(false);
        }
    }, [status, page]);

    useEffect(() => {
        loadWinners();
    }, [loadWinners]);

    const stats = useMemo(
        () => ({
            needsAction: winners.filter(
                (winner) =>
                    winner.status === 'selected' ||
                    winner.status === 'contacting'
            ).length,
            confirmed: winners.filter(
                (winner) => winner.status === 'confirmed'
            ).length,
            cancelled: winners.filter(
                (winner) => winner.status === 'cancelled'
            ).length,
        }),
        [winners]
    );

    const currentListUrl =
        `${location.pathname}${location.search}`;

    const openWinner = (winnerId: number) => {
        navigate(`/admin/winners/${winnerId}`, {
            state: {
                from: currentListUrl,
            },
        });
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Winners"
                description="Contact selected winners, confirm eligibility and manage replacements."
            />

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="w-full sm:max-w-xs">
                        <label
                            htmlFor="winner-status"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Status
                        </label>

                        <select
                            id="winner-status"
                            value={status}
                            onChange={(event) =>
                                updateUrl(
                                    event.target
                                        .value as WinnerStatus | '',
                                    1
                                )
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                        >
                            <option value="">All statuses</option>

                            {WINNER_STATUSES.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="text-xs text-gray-500">
                        {pagination.total} winner
                        {pagination.total === 1 ? '' : 's'}
                    </div>
                </div>
            </section>

            {!loading && winners.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-3">
                    <SummaryCard
                        label="Needs Action"
                        value={stats.needsAction}
                        valueClassName="text-blue-700"
                    />

                    <SummaryCard
                        label="Confirmed"
                        value={stats.confirmed}
                        valueClassName="text-green-700"
                    />

                    <SummaryCard
                        label="Cancelled"
                        value={stats.cancelled}
                        valueClassName="text-red-700"
                    />
                </div>
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
                    <LoadingState message="Loading winners..." />
                ) : winners.length === 0 ? (
                    <EmptyState
                        title="No winners found."
                        description={
                            status
                                ? 'No winners match the selected status.'
                                : 'Winners will appear here after a draw is executed.'
                        }
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] text-left text-sm">
                                <thead className="bg-gray-50">
                                <tr>
                                    <TableHeader>
                                        Winner
                                    </TableHeader>

                                    <TableHeader>
                                        Prize
                                    </TableHeader>

                                    <TableHeader>
                                        Draw
                                    </TableHeader>

                                    <TableHeader>
                                        Status
                                    </TableHeader>

                                    <TableHeader>
                                        Contact
                                    </TableHeader>

                                    <TableHeader>
                                        Selected
                                    </TableHeader>

                                    <th className="px-4 py-2.5" />
                                </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                {winners.map((winner) => {
                                    const participant =
                                        winner.receipt
                                            .participant;

                                    const attempts =
                                        winner.contact_attempts ??
                                        [];

                                    const latestAttempt =
                                        attempts.reduce(
                                            (latest, attempt) => {
                                                if (!latest) {
                                                    return attempt;
                                                }

                                                return new Date(
                                                    attempt.attempted_at
                                                ).getTime() >
                                                new Date(
                                                    latest.attempted_at
                                                ).getTime()
                                                    ? attempt
                                                    : latest;
                                            },
                                            attempts[0] ?? null
                                        );

                                    return (
                                        <tr
                                            key={winner.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 align-top">
                                                <div className="font-semibold text-gray-900">
                                                    {
                                                        participant.first_name
                                                    }{' '}
                                                    {
                                                        participant.last_name
                                                    }
                                                </div>

                                                <div className="mt-0.5 text-xs text-gray-500">
                                                    {
                                                        participant.phone
                                                    }
                                                </div>

                                                <div className="mt-0.5 max-w-[250px] truncate text-xs text-gray-400">
                                                    {
                                                        participant.email
                                                    }
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <div className="font-medium text-gray-900">
                                                    {
                                                        winner
                                                            .draw_prize
                                                            .prize
                                                            .name
                                                    }
                                                </div>

                                                <div className="mt-0.5 text-xs text-gray-400">
                                                    Entry #
                                                    {
                                                        winner.entry_number
                                                    }
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <div className="font-medium text-gray-700">
                                                    Week{' '}
                                                    {
                                                        winner.draw
                                                            .week_number
                                                    }
                                                </div>

                                                <div className="mt-0.5 text-xs text-gray-400">
                                                    Draw #
                                                    {
                                                        winner.draw
                                                            .id
                                                    }
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <StatusBadge
                                                    status={
                                                        winner.status
                                                    }
                                                />

                                                {winner.status ===
                                                    'cancelled' &&
                                                    winner.replacement_winner && (
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            Replacement
                                                            selected
                                                        </div>
                                                    )}
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <div className="font-medium text-gray-700">
                                                    {attempts.length}{' '}
                                                    attempt
                                                    {attempts.length ===
                                                    1
                                                        ? ''
                                                        : 's'}
                                                </div>

                                                <div className="mt-0.5 text-xs text-gray-400">
                                                    {latestAttempt
                                                        ? `Last: ${formatDateTime(
                                                            latestAttempt.attempted_at
                                                        )}`
                                                        : 'Not contacted yet'}
                                                </div>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 align-top text-gray-500">
                                                {formatDateTime(
                                                    winner.selected_at
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right align-top">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openWinner(
                                                            winner.id
                                                        )
                                                    }
                                                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                                                >
                                                    Manage →
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={pagination.current_page}
                            lastPage={pagination.last_page}
                            perPage={pagination.per_page}
                            total={pagination.total}
                            loading={loading}
                            onPageChange={(nextPage) =>
                                updateUrl(status, nextPage)
                            }
                        />
                    </>
                )}
            </section>
        </div>
    );
}

function SummaryCard({
                         label,
                         value,
                         valueClassName = 'text-gray-900',
                     }: {
    label: string;
    value: number;
    valueClassName?: string;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {label}
            </div>

            <div
                className={`mt-1 text-2xl font-bold ${valueClassName}`}
            >
                {value}
            </div>

            <div className="mt-0.5 text-xs text-gray-400">
                On this page
            </div>
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
