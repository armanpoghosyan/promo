import { useCallback, useEffect, useState } from 'react';
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
import WorkQueueTabs from '../../components/admin/WorkQueueTabs';

import api from '../../services/api';

import type { PaginatedResponse } from '../../types/api';
import type {
    WinnerDetail,
} from '../../types/winner';

import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';
import { positiveIntegerParam } from '../../utils/query';

type WinnerQueue =
    | 'needs_action'
    | 'confirmed'
    | 'cancelled'
    | 'all';

interface WinnerCounts {
    needs_action: number;
    confirmed: number;
    cancelled: number;
    all: number;
}

interface WinnerListResponse
    extends PaginatedResponse<WinnerDetail> {
    counts: WinnerCounts;
}

const emptyCounts: WinnerCounts = {
    needs_action: 0,
    confirmed: 0,
    cancelled: 0,
    all: 0,
};

function winnerQueueParam(
    queueValue: string | null,
    statusValue: string | null
): WinnerQueue {
    if (
        queueValue === 'needs_action' ||
        queueValue === 'confirmed' ||
        queueValue === 'cancelled' ||
        queueValue === 'all'
    ) {
        return queueValue;
    }

    if (statusValue === 'confirmed' || statusValue === 'cancelled') {
        return statusValue;
    }

    return 'needs_action';
}

export default function Winners() {
    const location = useLocation();
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    const queue = winnerQueueParam(
        searchParams.get('queue'),
        searchParams.get('status')
    );
    const page = positiveIntegerParam(searchParams.get('page'));

    const [winners, setWinners] = useState<WinnerDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [counts, setCounts] = useState<WinnerCounts>(emptyCounts);

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    const updateUrl = useCallback(
        (nextQueue: WinnerQueue, nextPage: number) => {
            const params = new URLSearchParams();

            if (nextQueue !== 'needs_action') {
                params.set('queue', nextQueue);
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
                WinnerListResponse
            >('/admin/winners', {
                params: {
                    queue,
                    page,
                    per_page: 20,
                },
            });

            setWinners(response.data.data ?? []);
            setCounts(response.data.counts ?? emptyCounts);

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
    }, [queue, page]);

    useEffect(() => {
        loadWinners();
    }, [loadWinners]);

    const tabs = [
        {
            value: 'needs_action',
            label: 'Needs Action',
            count: counts.needs_action,
            attention: true,
        },
        {
            value: 'confirmed',
            label: 'Confirmed',
            count: counts.confirmed,
        },
        {
            value: 'cancelled',
            label: 'Cancelled',
            count: counts.cancelled,
        },
        {
            value: 'all',
            label: 'All',
            count: counts.all,
        },
    ];

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
                description="Start with winners needing contact or confirmation, then manage completed outcomes."
            />

            <WorkQueueTabs
                active={queue}
                ariaLabel="Winner work queues"
                tabs={tabs}
                onChange={(value) =>
                    updateUrl(value as WinnerQueue, 1)
                }
            />

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
                            queue === 'needs_action'
                                ? 'No winners currently need administrator action.'
                                : queue === 'all'
                                    ? 'Winners will appear here after a draw is executed.'
                                    : 'No winners are in this queue.'
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
                                updateUrl(queue, nextPage)
                            }
                        />
                    </>
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
