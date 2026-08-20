import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    Link,
} from 'react-router-dom';

import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';

import api from '../../services/api';

import type {
    DashboardActivity,
    DashboardData,
    DashboardResponse,
} from '../../types/dashboard';

import {
    getApiErrorMessage,
} from '../../utils/apiError';

import {
    formatDateTime,
} from '../../utils/date';

import {
    formatNumber,
} from '../../utils/format';

function ActivityItem({
                          activity,
                          resource,
                      }: {
    activity: DashboardActivity;
    resource: 'receipt' | 'winner';
}) {
    const resourceUrl =
        resource === 'receipt'
            ? `/admin/receipts/${activity.resource_id}`
            : `/admin/winners/${activity.resource_id}`;

    const content = (
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">
                    {activity.title}
                </div>

                {activity.description && (
                    <div className="mt-1 truncate text-xs text-gray-500">
                        {activity.description}
                    </div>
                )}
            </div>

            <div className="shrink-0 text-right text-xs text-gray-400">
                {formatDateTime(
                    activity.occurred_at
                )}
            </div>
        </div>
    );

    if (!activity.resource_id) {
        return (
            <div className="px-5 py-3.5">
                {content}
            </div>
        );
    }

    return (
        <Link
            to={resourceUrl}
            className="block px-5 py-3.5 transition hover:bg-gray-50"
        >
            {content}
        </Link>
    );
}

export default function Dashboard() {
    const [
        dashboard,
        setDashboard,
    ] = useState<DashboardData | null>(
        null
    );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );

    const loadDashboard =
        useCallback(
            async (
                background = false
            ) => {
                if (background) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError(null);

                try {
                    const response =
                        await api.get<DashboardResponse>(
                            '/admin/dashboard'
                        );

                    setDashboard(
                        response.data.data
                    );
                } catch (
                    error: unknown
                    ) {
                    setError(
                        getApiErrorMessage(
                            error,
                            'Unable to load dashboard data.'
                        )
                    );
                } finally {
                    if (background) {
                        setRefreshing(false);
                    } else {
                        setLoading(false);
                    }
                }
            },
            []
        );

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    if (loading) {
        return (
            <LoadingState
                message="Loading dashboard..."
            />
        );
    }

    if (
        error &&
        !dashboard
    ) {
        return (
            <div className="space-y-4">
                <Alert variant="error">
                    {error}
                </Alert>

                <button
                    type="button"
                    onClick={() =>
                        loadDashboard()
                    }
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!dashboard) {
        return (
            <EmptyState
                title="Dashboard data unavailable."
                description="Unable to display the promotion overview."
            />
        );
    }

    const {
        kpis,
        current_draw: currentDraw,
        receipt_activity:
            receiptActivity,
        winner_activity:
            winnerActivity,
        prizes,
    } = dashboard;

    /*
     * Receipts:
     * submitted / approved / rejected
     */
    const rejectedReceipts =
        Math.max(
            0,
            kpis.total_receipts -
            kpis.approved_receipts -
            kpis.pending_receipts
        );

    const handledReceipts =
        kpis.approved_receipts +
        rejectedReceipts;

    /*
     * Winners:
     * selected / contacting /
     * confirmed / cancelled
     */
    const resolvedWinners =
        kpis.confirmed_winners +
        kpis.cancelled_winners;

    const hasReceiptAttention =
        kpis.pending_receipts > 0;

    const hasWinnerAttention =
        kpis.awaiting_winners > 0;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Dashboard"
                description="Daily promotion operations."
                actions={
                    <button
                        type="button"
                        disabled={
                            refreshing
                        }
                        onClick={() =>
                            loadDashboard(
                                true
                            )
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {refreshing
                            ? 'Refreshing...'
                            : 'Refresh'}
                    </button>
                }
            />

            {error && (
                <Alert
                    variant="error"
                    onDismiss={() =>
                        setError(null)
                    }
                >
                    {error}
                </Alert>
            )}

            {/* Daily workflows */}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Participation workflow */}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 bg-gray-50/70 px-5 py-4">
                        <h2 className="font-semibold text-gray-900">
                            Participation / Next Draw
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Review incoming
                            receipts and prepare
                            participation for the
                            next draw.
                        </p>
                    </div>

                    {/* Receipt status */}

                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500">
                                    Receipts
                                </div>

                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold tracking-tight text-gray-900">
                                        {formatNumber(
                                            kpis.total_receipts
                                        )}
                                    </span>

                                    <span className="text-sm text-gray-500">
                                        total
                                    </span>
                                </div>
                            </div>

                            {hasReceiptAttention && (
                                <div className="rounded-lg bg-amber-50 px-3 py-2 text-right">
                                    <div className="text-xl font-bold text-amber-700">
                                        {formatNumber(
                                            kpis.pending_receipts
                                        )}
                                    </div>

                                    <div className="text-xs font-medium text-amber-700">
                                        need review
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
                            <div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {formatNumber(
                                        handledReceipts
                                    )}
                                </div>

                                <div className="text-xs text-gray-500">
                                    Handled
                                </div>
                            </div>

                            <div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {formatNumber(
                                        kpis.approved_receipts
                                    )}
                                </div>

                                <div className="text-xs text-gray-500">
                                    Approved
                                </div>
                            </div>

                            <div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {formatNumber(
                                        rejectedReceipts
                                    )}
                                </div>

                                <div className="text-xs text-gray-500">
                                    Rejected
                                </div>
                            </div>
                        </div>

                        <div className="mt-5">
                            {hasReceiptAttention ? (
                                <Link
                                    to="/admin/receipts?filter=needs_review"
                                    className="inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                                >
                                    Review{' '}
                                    {formatNumber(
                                        kpis.pending_receipts
                                    )}{' '}
                                    Receipts
                                </Link>
                            ) : (
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm font-medium text-emerald-700">
                                        All receipts
                                        handled
                                    </span>

                                    <Link
                                        to="/admin/receipts"
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                    >
                                        View receipts →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Current / next draw */}

                    <div className="border-t border-gray-200">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Current / Next
                                Draw
                            </h3>

                            <Link
                                to="/admin/draws"
                                className="text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                                All draws
                            </Link>
                        </div>

                        {currentDraw ? (
                            <div className="px-5 py-4">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">
                                                Week{' '}
                                                {
                                                    currentDraw.week_number
                                                }
                                            </span>

                                            <StatusBadge
                                                status={
                                                    currentDraw.status
                                                }
                                            />
                                        </div>

                                        <div className="text-sm text-gray-500">
                                            {formatDateTime(
                                                currentDraw.draw_date,
                                                'Date not set'
                                            )}
                                        </div>

                                        <div className="text-sm text-gray-600">
                                            <span className="font-semibold text-gray-900">
                                                {formatNumber(
                                                    currentDraw.entries
                                                )}
                                            </span>{' '}
                                            entries
                                        </div>

                                        <div className="text-sm text-gray-600">
                                            <span className="font-semibold text-gray-900">
                                                {formatNumber(
                                                    currentDraw.prizes
                                                )}
                                            </span>{' '}
                                            prize
                                            slots
                                        </div>
                                    </div>

                                    <Link
                                        to={`/admin/draws/${currentDraw.id}`}
                                        className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-800"
                                    >
                                        Manage Draw →
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                title="No upcoming draw."
                                description="There is currently no active or scheduled draw."
                                minHeightClassName="min-h-32"
                                action={
                                    <Link
                                        to="/admin/draws"
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                    >
                                        View Draws
                                    </Link>
                                }
                            />
                        )}
                    </div>

                    {/* Receipt activity */}

                    <div className="border-t border-gray-200">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Receipt
                                    Activity
                                </h3>

                                <p className="mt-0.5 text-xs text-gray-500">
                                    Latest
                                    participation
                                    actions
                                </p>
                            </div>

                            <Link
                                to="/admin/receipts"
                                className="text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                                View receipts
                            </Link>
                        </div>

                        {receiptActivity.length ===
                        0 ? (
                            <EmptyState
                                title="No receipt activity yet."
                                minHeightClassName="min-h-36"
                            />
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {receiptActivity.map(
                                    (
                                        activity
                                    ) => (
                                        <ActivityItem
                                            key={
                                                activity.id
                                            }
                                            activity={
                                                activity
                                            }
                                            resource="receipt"
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Winner workflow */}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 bg-gray-50/70 px-5 py-4">
                        <h2 className="font-semibold text-gray-900">
                            Winners / Follow-up
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Contact selected
                            winners, confirm
                            prizes, and resolve
                            cancellations.
                        </p>
                    </div>

                    {/* Winner status */}

                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500">
                                    Confirmed
                                    Winners
                                </div>

                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-bold tracking-tight text-gray-900">
                                        {formatNumber(
                                            kpis.confirmed_winners
                                        )}
                                    </span>

                                    <span className="text-sm text-gray-500">
                                        confirmed
                                    </span>
                                </div>
                            </div>

                            {hasWinnerAttention && (
                                <div className="rounded-lg bg-amber-50 px-3 py-2 text-right">
                                    <div className="text-xl font-bold text-amber-700">
                                        {formatNumber(
                                            kpis.awaiting_winners
                                        )}
                                    </div>

                                    <div className="text-xs font-medium text-amber-700">
                                        need
                                        follow-up
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
                            <div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {formatNumber(
                                        kpis.total_winners
                                    )}
                                </div>

                                <div className="text-xs text-gray-500">
                                    Selections
                                </div>
                            </div>

                            <div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {formatNumber(
                                        resolvedWinners
                                    )}
                                </div>

                                <div className="text-xs text-gray-500">
                                    Resolved
                                </div>
                            </div>

                            <div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {formatNumber(
                                        kpis.cancelled_winners
                                    )}
                                </div>

                                <div className="text-xs text-gray-500">
                                    Cancelled
                                </div>
                            </div>
                        </div>

                        <div className="mt-5">
                            {hasWinnerAttention ? (
                                <Link
                                    to="/admin/winners"
                                    className="inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                                >
                                    Manage{' '}
                                    {formatNumber(
                                        kpis.awaiting_winners
                                    )}{' '}
                                    Winners
                                </Link>
                            ) : (
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm font-medium text-emerald-700">
                                        No winner
                                        follow-up
                                        pending
                                    </span>

                                    <Link
                                        to="/admin/winners"
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                    >
                                        View winners →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Winner status summary */}

                    <div className="border-t border-gray-200">
                        <div className="border-b border-gray-100 px-5 py-3">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Follow-up Status
                            </h3>
                        </div>

                        <div className="px-5 py-4">
                            <div className="flex flex-wrap gap-x-8 gap-y-4">
                                <div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {formatNumber(
                                            kpis.confirmed_winners
                                        )}
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        Confirmed
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {formatNumber(
                                            kpis.cancelled_winners
                                        )}
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        Cancelled
                                    </div>
                                </div>

                                <div>
                                    <div
                                        className={[
                                            'text-xl font-bold',
                                            hasWinnerAttention
                                                ? 'text-amber-700'
                                                : 'text-gray-900',
                                        ].join(
                                            ' '
                                        )}
                                    >
                                        {formatNumber(
                                            kpis.awaiting_winners
                                        )}
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        Waiting
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xl font-bold text-gray-900">
                                        {formatNumber(
                                            resolvedWinners
                                        )}
                                        /
                                        {formatNumber(
                                            kpis.total_winners
                                        )}
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        Resolved
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Winner activity */}

                    <div className="border-t border-gray-200">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Winner
                                    Activity
                                </h3>

                                <p className="mt-0.5 text-xs text-gray-500">
                                    Latest
                                    follow-up
                                    actions
                                </p>
                            </div>

                            <Link
                                to="/admin/winners"
                                className="text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                                View winners
                            </Link>
                        </div>

                        {winnerActivity.length ===
                        0 ? (
                            <EmptyState
                                title="No winner activity yet."
                                minHeightClassName="min-h-36"
                            />
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {winnerActivity.map(
                                    (
                                        activity
                                    ) => (
                                        <ActivityItem
                                            key={
                                                activity.id
                                            }
                                            activity={
                                                activity
                                            }
                                            resource="winner"
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Shared campaign context */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Prize Allocation
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Campaign prize
                            allocation across
                            weekly draws.
                        </p>
                    </div>

                    <Link
                        to="/admin/prizes"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        Details
                    </Link>
                </div>

                {prizes.length === 0 ? (
                    <EmptyState
                        title="No prizes configured."
                        minHeightClassName="min-h-36"
                    />
                ) : (
                    <div className="grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-3 md:divide-x md:divide-y-0">
                        {prizes.map(
                            (
                                prize
                            ) => {
                                const percentage =
                                    prize.total > 0
                                        ? Math.min(
                                            100,
                                            Math.round(
                                                (prize.allocated /
                                                    prize.total) *
                                                100
                                            )
                                        )
                                        : 0;

                                return (
                                    <div
                                        key={
                                            prize.id
                                        }
                                        className="p-5"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {
                                                        prize.name
                                                    }
                                                </div>

                                                <div className="mt-1 text-xs text-gray-500">
                                                    {formatNumber(
                                                        prize.allocated
                                                    )}{' '}
                                                    /{' '}
                                                    {formatNumber(
                                                        prize.total
                                                    )}{' '}
                                                    allocated
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="font-semibold text-gray-900">
                                                    {formatNumber(
                                                        prize.remaining
                                                    )}
                                                </div>

                                                <div className="text-xs text-gray-500">
                                                    available
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className="h-full rounded-full bg-gray-900"
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}
