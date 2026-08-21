import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';
import type { DashboardActivity, DashboardData, DashboardResponse } from '../../types/dashboard';
import type { ReportDraw, ReportOverviewData, ReportsResponse } from '../../types/report';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';
import { formatEnumLabel, formatNumber } from '../../utils/format';

type CombinedActivity = DashboardActivity & { resource: 'receipt' | 'winner' };

export default function Dashboard() {
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [reports, setReports] = useState<ReportOverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [dashboardResponse, reportsResponse] = await Promise.all([
                api.get<DashboardResponse>('/admin/dashboard'),
                api.get<ReportsResponse>('/admin/reports/overview'),
            ]);

            setDashboard(dashboardResponse.data.data);
            setReports(reportsResponse.data.data);
        } catch (error: unknown) {
            setError(getApiErrorMessage(error, 'Unable to load dashboard data.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const activity = useMemo<CombinedActivity[]>(() => {
        if (!dashboard) {
            return [];
        }

        return [
            ...dashboard.receipt_activity.map((item) => ({ ...item, resource: 'receipt' as const })),
            ...dashboard.winner_activity.map((item) => ({ ...item, resource: 'winner' as const })),
        ]
            .sort((left, right) => Date.parse(right.occurred_at) - Date.parse(left.occurred_at))
            .slice(0, 8);
    }, [dashboard]);

    if (loading) {
        return <LoadingState message="Loading dashboard..." />;
    }

    if (!dashboard || !reports) {
        return (
            <div className="space-y-4">
                <Alert variant="error">{error ?? 'Dashboard data is unavailable.'}</Alert>
                <button
                    type="button"
                    onClick={() => loadData()}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <PageHeader title="Overview" />

            {error && <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>}

            <DashboardOverview dashboard={dashboard} reports={reports} activity={activity} />
        </div>
    );
}

type DashboardOverviewProps = {
    dashboard: DashboardData;
    reports: ReportOverviewData;
    activity: CombinedActivity[];
};

function DashboardOverview({ dashboard, reports, activity }: DashboardOverviewProps) {
    const { kpis } = dashboard;
    const rejectedReceipts = Math.max(
        0,
        kpis.total_receipts - kpis.approved_receipts - kpis.pending_receipts,
    );
    const resolvedWinners = kpis.confirmed_winners + kpis.cancelled_winners;
    const hasReceiptAttention = kpis.pending_receipts > 0;
    const hasWinnerAttention = kpis.awaiting_winners > 0;

    return (
        <>
            <div className="grid gap-4 xl:grid-cols-2">
                <ReviewProgressCard
                    title="Receipt Review"
                    icon="receipts"
                    link={hasReceiptAttention ? '/admin/receipts?tab=submitted' : '/admin/receipts'}
                    waiting={kpis.pending_receipts}
                    completed={kpis.approved_receipts + rejectedReceipts}
                    total={kpis.total_receipts}
                    progressLabel="handled"
                    tone="amber"
                    actionLabel="Needs Review"
                    metrics={[
                        { label: 'Approved', value: kpis.approved_receipts, className: 'text-emerald-700' },
                        { label: 'Rejected', value: rejectedReceipts },
                    ]}
                />
                <ReviewProgressCard
                    title="Winner Review"
                    icon="winners"
                    link="/admin/winners"
                    waiting={kpis.awaiting_winners}
                    completed={resolvedWinners}
                    total={kpis.total_winners}
                    progressLabel="resolved"
                    tone="blue"
                    actionLabel="Winner Actions"
                    metrics={[
                        { label: 'Confirmed', value: kpis.confirmed_winners, className: 'text-emerald-700' },
                        { label: 'Cancelled', value: kpis.cancelled_winners },
                    ]}
                />
            </div>

            <DrawPerformance draws={reports.draws} />

            <div className="grid gap-4 xl:grid-cols-2">
                <ActivityCard activity={activity} />
                <div className="flex flex-col gap-4">
                    <PrizeAllocationCard prizes={reports.prize_allocation} />
                    <section className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-4 py-3">
                            <h2 className="flex items-center gap-2.5 font-semibold text-gray-900">
                                <Icon type="exports" className="h-7 w-7 text-gray-700" />
                                <span>Export</span>
                            </h2>
                        </div>
                        <div className="px-4 py-4">
                            <ExportLinks />
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

function ReviewProgressCard({
    title,
    icon,
    link,
    waiting,
    completed,
    total,
    progressLabel,
    tone,
    actionLabel,
    metrics,
}: {
    title: string;
    icon: 'receipts' | 'winners';
    link: string;
    waiting: number;
    completed: number;
    total: number;
    progressLabel: string;
    tone: 'amber' | 'blue';
    actionLabel: string;
    metrics: Array<{ label: string; value: number; className?: string }>;
}) {
    const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
    const badgeClassName = tone === 'amber'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-blue-50 text-blue-700';
    const progressClassName = tone === 'amber' ? 'bg-amber-500' : 'bg-blue-500';
    const actionClassName = tone === 'amber'
        ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
        : 'border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100';

    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3">
                <h2 className="flex items-center gap-2.5 font-semibold text-gray-900">
                    <Icon type={icon} className="h-7 w-7 text-gray-700" />
                    <span>{title}</span>
                </h2>
                {waiting > 0 ? (
                    <span className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${badgeClassName}`}>
                        {formatNumber(waiting)} waiting
                    </span>
                ) : (
                    <span className="text-xs font-medium text-emerald-700">Up to date</span>
                )}
            </div>

            <div className="px-4 py-4">
                <div className="grid gap-4 sm:grid-cols-[minmax(160px,0.8fr)_minmax(0,1.7fr)]">
                    <Link
                        to={link}
                        className={`flex flex-col justify-between rounded-xl border px-4 py-3 shadow-sm transition ${actionClassName}`}
                    >
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-65">{actionLabel}</p>
                        <div className="mt-2 flex items-end justify-between gap-3">
                            <strong className="text-3xl font-bold tabular-nums">{formatNumber(waiting)}</strong>
                            <span className="text-sm font-semibold opacity-65">Open →</span>
                        </div>
                    </Link>

                    <div>
                        <div className="flex items-center justify-between gap-4 text-xs">
                            <span className="font-medium text-gray-600">
                                {formatNumber(completed)} of {formatNumber(total)} {progressLabel}
                            </span>
                            <span className="font-semibold tabular-nums text-gray-700">{percentage}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                                className={`h-full rounded-full transition-all ${progressClassName}`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                            {metrics.map((metric) => (
                                <div key={metric.label} className="text-center">
                                    <WorkflowMetric
                                        value={metric.value}
                                        label={metric.label}
                                        className={metric.className}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}

function ActivityCard({ activity }: { activity: CombinedActivity[] }) {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3">
                <h2 className="flex items-center gap-2.5 font-semibold text-gray-900">
                    <Icon type="activity" className="h-7 w-7 text-gray-700" />
                    <span>Recent activity</span>
                </h2>
                <Link to="/admin/activity" className="text-xs font-medium text-blue-600 hover:text-blue-800">
                    View all →
                </Link>
            </div>
            {activity.length === 0 ? <EmptyState title="No recent activity." minHeightClassName="min-h-24" /> : (
                <div className="divide-y divide-gray-100">
                    {activity.map((item) => {
                        const url = item.resource === 'receipt'
                            ? `/admin/receipts/${item.resource_id}`
                            : `/admin/winners/${item.resource_id}`;
                        const badge = activityActionBadge(item.action);

                        return (
                            <div key={`${item.resource}-${item.id}`} className="flex flex-col sm:flex-row sm:items-stretch">
                                <div className="flex min-w-0 flex-1 items-start gap-3 px-4 pb-2 pt-3 sm:py-3">
                                    <Icon
                                        type={item.resource === 'receipt' ? 'receipts' : 'winners'}
                                        className="mt-0.5 h-5 w-5 shrink-0 text-gray-400"
                                    />
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                            <StatusBadge status={badge.status} label={badge.label} />
                                        </div>
                                        {item.description && <p className="mt-0.5 truncate text-xs text-gray-500">{item.description}</p>}
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3 sm:justify-start sm:py-3 sm:pl-0">
                                    <span className="text-xs text-gray-400">{formatDateTime(item.occurred_at)}</span>
                                    <Link to={url} className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800">
                                        View →
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

function activityActionBadge(action: string): { status: string; label: string } {
    const badges: Record<string, { status: string; label: string }> = {
        'receipt.submitted': { status: 'submitted', label: 'Submitted' },
        'receipt.approved': { status: 'approved', label: 'Approved' },
        'receipt.rejected': { status: 'rejected', label: 'Rejected' },
        'receipt.note_added': { status: 'selected', label: 'Note added' },
        'winner.confirmed': { status: 'confirmed', label: 'Confirmed' },
        'winner.contact_attempt_added': { status: 'contacting', label: 'Contact attempt' },
        'winner.cancelled': { status: 'cancelled', label: 'Cancelled' },
        'winner.replacement_selected': { status: 'selected', label: 'Replacement selected' },
    };

    return badges[action] ?? { status: 'submitted', label: 'Activity' };
}

function DrawPerformance({ draws }: { draws: ReportDraw[] }) {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h2 className="flex items-center gap-2.5 font-semibold text-gray-900">
                    <Icon type="draws" className="h-7 w-7 text-gray-700" />
                    <span>Draws</span>
                </h2>
                <Link to="/admin/draws" className="text-xs font-medium text-blue-600 hover:text-blue-800">All draws →</Link>
            </div>
            {draws.length === 0 ? (
                <EmptyState title="No draws available." minHeightClassName="min-h-28" />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1250px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-2.5">Draw</th>
                                <th className="px-4 py-2.5 text-center">Entries</th>
                                <th className="px-4 py-2.5 text-center">Prize Slots</th>
                                <th className="px-4 py-2.5 text-center">Needs Action</th>
                                <th className="px-4 py-2.5 text-center">Confirmed</th>
                                <th className="px-4 py-2.5 text-center">Cancelled</th>
                                <th className="px-4 py-2.5 text-center">Replacements</th>
                                <th className="px-4 py-2.5">Randomization</th>
                                <th className="px-4 py-2.5" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {draws.map((draw) => {
                                const needsAction = draw.winners.selected + draw.winners.contacting;

                                return (
                                    <tr key={draw.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900">Week {draw.week_number}</span>
                                                <StatusBadge status={draw.status} />
                                            </div>
                                            <div className="mt-1 text-xs text-gray-500">{formatDateTime(draw.draw_date)}</div>
                                            <div className="mt-1 text-[11px] text-gray-400">Draw #{draw.id}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center align-top font-semibold tabular-nums text-gray-900">
                                            {formatNumber(draw.eligible_entries)}
                                        </td>
                                        <td className="px-4 py-3 text-center align-top">
                                            <div className="font-semibold tabular-nums text-gray-900">{formatNumber(draw.prize_slots)}</div>
                                            {draw.prizes.length > 0 && (
                                                <div className="mt-2 space-y-1 text-xs text-gray-500">
                                                    {draw.prizes.map((prize) => (
                                                        <div key={prize.id}>{prize.name ?? 'Prize'} × {formatNumber(prize.quantity)}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className={`px-4 py-3 text-center align-top tabular-nums ${needsAction > 0 ? 'font-semibold text-blue-700' : 'text-gray-500'}`}>
                                            {formatNumber(needsAction)}
                                        </td>
                                        <td className="px-4 py-3 text-center align-top font-semibold tabular-nums text-emerald-700">
                                            {formatNumber(draw.winners.confirmed)}
                                        </td>
                                        <td className={`px-4 py-3 text-center align-top tabular-nums ${draw.winners.cancelled > 0 ? 'font-semibold text-red-700' : 'text-gray-500'}`}>
                                            {formatNumber(draw.winners.cancelled)}
                                        </td>
                                        <td className="px-4 py-3 text-center align-top tabular-nums text-gray-700">
                                            {formatNumber(draw.winners.replacements)}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {draw.random.provider ? (
                                                <div>
                                                    <div className="font-medium text-gray-800">{formatEnumLabel(draw.random.provider)}</div>
                                                    <div className="mt-1 text-xs text-gray-500">{formatDateTime(draw.random.randomized_at)}</div>
                                                    {draw.random.request_id && (
                                                        <div className="mt-1 max-w-[220px] truncate text-[11px] text-gray-400">{draw.random.request_id}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right align-top">
                                            <Link to={`/admin/draws/${draw.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                                View Draw →
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
    );
}

function PrizeAllocationCard({ prizes }: { prizes: ReportOverviewData['prize_allocation'] }) {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="flex items-center gap-2.5 font-semibold text-gray-900">
                    <Icon type="prizes" className="h-7 w-7 text-gray-700" />
                    <span>Prizes</span>
                </h2>
            </div>

            {prizes.length === 0 ? (
                <EmptyState title="No prizes configured." minHeightClassName="min-h-28" />
            ) : (
                <div className="divide-y divide-gray-100">
                    {prizes.map((prize) => {
                        const percentage = prize.total_quantity > 0
                            ? Math.min(100, Math.round((prize.allocated_quantity / prize.total_quantity) * 100))
                            : 0;
                        const fullyAllocated = prize.remaining_quantity <= 0;
                        const completed = percentage === 100;

                        return (
                            <div key={prize.prize_id} className="p-4">
                                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_300px] sm:items-start">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{prize.name}</h3>
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${completed ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {percentage}% allocated
                                            </span>
                                        </div>

                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                                            <div className={`h-full rounded-full transition-all ${completed ? 'bg-emerald-500' : 'bg-gray-900'}`} style={{ width: `${percentage}%` }} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <PrizeQuantity label="Total" value={prize.total_quantity} className="bg-gray-50 text-gray-900" />
                                        <PrizeQuantity label="Allocated" value={prize.allocated_quantity} className="bg-blue-50 text-blue-800" />
                                        <PrizeQuantity
                                            label="Available"
                                            value={prize.remaining_quantity}
                                            className={fullyAllocated ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

function PrizeQuantity({ label, value, className }: { label: string; value: number; className: string }) {
    return (
        <div className={`rounded-lg px-3 py-2.5 text-center ${className}`}>
            <div className="text-xs font-medium leading-none opacity-75">{label}</div>
            <div className="mt-2 text-lg font-semibold leading-none tabular-nums">{formatNumber(value)}</div>
        </div>
    );
}

function WorkflowMetric({ value, label, className = 'text-gray-900' }: { value: number; label: string; className?: string }) {
    return (
        <div>
            <div className={`text-lg font-semibold ${className}`}>{formatNumber(value)}</div>
            <div className="mt-0.5 text-xs text-gray-500">{label}</div>
        </div>
    );
}

function ExportLinks() {
    return <div className="flex flex-wrap gap-2">{['receipts', 'winners', 'draws'].map((type) => <a key={type} href={`/api/admin/reports/export/${type}`} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium capitalize text-gray-600 hover:bg-gray-50 hover:text-gray-900">{type}</a>)}</div>;
}
