import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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

import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';
import { formatNumber } from '../../utils/format';

function ActivityItem({activity, resource,}: { activity: DashboardActivity; resource: 'receipt' | 'winner'; }) {
    const resourceUrl = resource === 'receipt' ? `/admin/receipts/${activity.resource_id}` : `/admin/winners/${activity.resource_id}`;

    const content = (
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">
                    {activity.title}
                </div>

                {activity.description && (
                    <div className="mt-0.5 truncate text-xs text-gray-500">
                        {activity.description}
                    </div>
                )}
            </div>

            <div className="shrink-0 text-right text-xs text-gray-400">
                {formatDateTime(activity.occurred_at)}
            </div>
        </div>
    );

    if (!activity.resource_id) {
        return <div className="px-4 py-3">{content}</div>;
    }

    return (
        <Link
            to={resourceUrl}
            className="block px-4 py-3 transition hover:bg-gray-50"
        >
            {content}
        </Link>
    );
}

function WorkflowMetric({value, label, className = 'text-gray-900',}: { value: number; label: string; className?: string; }) {
    return (
        <div>
            <div className={`text-lg font-semibold ${className}`}>
                {formatNumber(value)}
            </div>

            <div className="mt-0.5 text-xs text-gray-500">
                {label}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadDashboard = useCallback(async (background = false) => {
        if (background) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError(null);

        try {
            const response = await api.get<DashboardResponse>('/admin/dashboard');

            setDashboard(response.data.data);
        } catch (error: unknown) {
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
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    if (loading) {
        return <LoadingState message="Loading dashboard..." />;
    }

    if (error && !dashboard) {
        return (
            <div className="space-y-4">
                <Alert variant="error">{error}</Alert>

                <button
                    type="button"
                    onClick={() => loadDashboard()}
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
        receipt_activity: receiptActivity,
        winner_activity: winnerActivity,
        prizes,
    } = dashboard;

    const rejectedReceipts = Math.max(
        0,
        kpis.total_receipts -
        kpis.approved_receipts -
        kpis.pending_receipts
    );

    const resolvedWinners = kpis.confirmed_winners + kpis.cancelled_winners;

    const hasReceiptAttention = kpis.pending_receipts > 0;
    const hasWinnerAttention = kpis.awaiting_winners > 0;

    return (
        <div className="space-y-5">
            <PageHeader
                title="Dashboard"
                description="Daily promotion operations."
                actions={
                    <button
                        type="button"
                        disabled={refreshing}
                        onClick={() => loadDashboard(true)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
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

            <div className="grid gap-4 xl:grid-cols-2">

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-4 px-4 py-3">
                        <div>
                            <h2 className="font-semibold text-gray-900">Receipt Review</h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Review submitted receipts before the next draw.
                            </p>
                        </div>

                        {hasReceiptAttention ? (
                            <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
                                {formatNumber(kpis.pending_receipts)} waiting
                            </span>
                        ) : (
                            <span className="text-xs font-medium text-emerald-700">
                                Up to date
                            </span>
                        )}
                    </div>

                    <div className="border-t border-gray-100 px-4 py-3">
                        <div className="grid grid-cols-4 gap-4">
                            <WorkflowMetric
                                value={kpis.total_receipts}
                                label="Total"
                            />

                            <WorkflowMetric
                                value={kpis.pending_receipts}
                                label="Needs Review"
                                className={hasReceiptAttention ? 'text-amber-700' : 'text-gray-900'}
                            />

                            <WorkflowMetric
                                value={kpis.approved_receipts}
                                label="Approved"
                                className="text-emerald-700"
                            />

                            <WorkflowMetric
                                value={rejectedReceipts}
                                label="Rejected"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                        <span className="text-xs text-gray-500">
                            {formatNumber(kpis.approved_receipts + rejectedReceipts)}{' '}handled
                        </span>

                        <Link
                            to={hasReceiptAttention ? '/admin/receipts?tab=submitted' : '/admin/receipts'}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            {hasReceiptAttention ? 'Review Receipts →' : 'View Receipts →'}
                        </Link>
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-4 px-4 py-3">
                        <div>
                            <h2 className="font-semibold text-gray-900">Winner Follow-up</h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Contact selected winners and resolve decisions.
                            </p>
                        </div>

                        {hasWinnerAttention ? (
                            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                                {formatNumber(kpis.awaiting_winners)} waiting
                            </span>
                        ) : (
                            <span className="text-xs font-medium text-emerald-700">
                                Up to date
                            </span>
                        )}
                    </div>

                    <div className="border-t border-gray-100 px-4 py-3">
                        <div className="grid grid-cols-4 gap-4">
                            <WorkflowMetric
                                value={kpis.total_winners}
                                label="Total"
                            />

                            <WorkflowMetric
                                value={kpis.awaiting_winners}
                                label="Needs Action"
                                className={hasWinnerAttention ? 'text-blue-700' : 'text-gray-900'}
                            />

                            <WorkflowMetric
                                value={kpis.confirmed_winners}
                                label="Confirmed"
                                className="text-emerald-700"
                            />

                            <WorkflowMetric
                                value={kpis.cancelled_winners}
                                label="Cancelled"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                        <span className="text-xs text-gray-500">{formatNumber(resolvedWinners)}{' '}resolved</span>
                        <Link
                            to="/admin/winners"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            {hasWinnerAttention ? 'Manage Winners →' : 'View Winners →'}
                        </Link>
                    </div>
                </section>
            </div>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Current / Next Draw
                        </h2>
                    </div>

                    <Link
                        to="/admin/draws"
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                        All Draws →
                    </Link>
                </div>

                {currentDraw ? (
                    <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">Week {currentDraw.week_number}</span>
                                <StatusBadge status={currentDraw.status} />
                            </div>

                            <span className="text-sm text-gray-500">{formatDateTime(currentDraw.draw_date, 'Date not set')}</span>

                            <span className="text-sm text-gray-600">
                                <strong className="text-gray-900">{formatNumber(currentDraw.entries)}</strong>{' '}entries
                            </span>
                            <span className="text-sm text-gray-600">
                                <strong className="text-gray-900">{formatNumber(currentDraw.prizes)}</strong>{' '}prize slots
                            </span>
                        </div>

                        <Link
                            to={`/admin/draws/${currentDraw.id}`}
                            className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            Manage Draw →
                        </Link>
                    </div>
                ) : (
                    <EmptyState
                        title="No upcoming draw."
                        description="There is currently no active or scheduled draw."
                        minHeightClassName="min-h-28"
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
            </section>

            <div className="grid gap-4 xl:grid-cols-2">
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <h2 className="font-semibold text-gray-900">
                            Recent Receipt Activity
                        </h2>

                        <Link
                            to="/admin/activity?category=receipts"
                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                            Activity Log →
                        </Link>
                    </div>

                    {receiptActivity.length === 0 ? (
                        <EmptyState
                            title="No receipt activity yet."
                            minHeightClassName="min-h-28"
                        />
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {receiptActivity.map((activity) => (
                                <ActivityItem
                                    key={activity.id}
                                    activity={activity}
                                    resource="receipt"
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <h2 className="font-semibold text-gray-900">
                            Recent Winner Activity
                        </h2>

                        <Link
                            to="/admin/activity?category=winners"
                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                            Activity Log →
                        </Link>
                    </div>

                    {winnerActivity.length === 0 ? (
                        <EmptyState
                            title="No winner activity yet."
                            minHeightClassName="min-h-28"
                        />
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {winnerActivity.map((activity) => (
                                <ActivityItem
                                    key={activity.id}
                                    activity={activity}
                                    resource="winner"
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div>
                        <h2 className="font-semibold text-gray-900">Prize Inventory</h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Promotion-wide allocation status.
                        </p>
                    </div>

                    <Link
                        to="/admin/prizes"
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                        Manage Prizes →
                    </Link>
                </div>

                {prizes.length === 0 ? (
                    <EmptyState
                        title="No prizes configured."
                        minHeightClassName="min-h-28"
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-sm">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Prize</th>
                                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Allocated</th>
                                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Remaining</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                            {prizes.map((prize) => (
                                <tr key={prize.id}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{prize.name}</td>
                                    <td className="px-4 py-3 text-center text-gray-700">{formatNumber(prize.total)}</td>
                                    <td className="px-4 py-3 text-center text-gray-700">{formatNumber(prize.allocated)}</td>
                                    <td className="px-4 py-3 text-center font-medium text-gray-900">{formatNumber(prize.remaining)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
