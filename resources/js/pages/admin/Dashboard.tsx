import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDateTime } from '../../utils/date';

import type {
    DashboardData,
} from '../../types/dashboard';



export default function Dashboard() {
    const [dashboard, setDashboard] =
        useState<DashboardData | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadDashboard = async () => {
        setLoading(true);
        setError(null);

        try {
            const response =
                await api.get<{
                    data: DashboardData;
                }>('/admin/dashboard');

            setDashboard(
                response.data.data
            );
        } catch (err) {
            console.error(err);

            setError(
                'Unable to load dashboard data.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-64 items-center justify-center">

                <div className="text-center">

                    <div className="text-sm font-medium text-gray-700">
                        Loading dashboard...
                    </div>

                    <div className="mt-1 text-xs text-gray-400">
                        Preparing promotion overview
                    </div>

                </div>

            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">

                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>

                <button
                    type="button"
                    onClick={loadDashboard}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Try Again
                </button>

            </div>
        );
    }

    if (!dashboard) {
        return null;
    }

    const { kpis } = dashboard;

    const attentionItems = [
        {
            label: 'Pending Review',
            value: kpis.pending_receipts,
            description:
                'Receipts waiting for verification',
            to: '/admin/receipts?status=submitted&page=1',
            action: 'Review receipts',
            important:
                kpis.pending_receipts > 0,
        },

        {
            label: 'Awaiting Winner Action',
            value: kpis.awaiting_winners,
            description:
                'Selected or contacting winners',
            to: '/admin/winners?status=selected&page=1',
            action: 'View winners',
            important:
                kpis.awaiting_winners > 0,
        },

        {
            label: 'Active Entries',
            value: kpis.active_entries,
            description:
                'Entries in the current draw',
            to: '/admin/draws',
            action: 'View draws',
            important: false,
        },

        {
            label: 'Confirmed Winners',
            value: kpis.confirmed_winners,
            description:
                'Successfully confirmed prizes',
            to: '/admin/winners?status=confirmed&page=1',
            action: 'View winners',
            important: false,
        },
    ];

    return (
        <div className="space-y-8">

            {/* Page heading */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Dashboard
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Promotion overview and items requiring attention.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadDashboard}
                    className="self-start rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Refresh
                </button>

            </div>

            {/* Attention / KPI cards */}

            <section>

                <div className="mb-3 flex items-center justify-between">

                    <div>
                        <h3 className="font-semibold text-gray-900">
                            Overview
                        </h3>

                        <p className="mt-0.5 text-xs text-gray-500">
                            Current promotion status
                        </p>
                    </div>

                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    {attentionItems.map(
                        (item) => (

                            <div
                                key={item.label}
                                className={[
                                    'rounded-xl border bg-white p-5 shadow-sm',
                                    item.important
                                        ? 'border-amber-200'
                                        : 'border-gray-200',
                                ].join(' ')}
                            >

                                <div className="flex items-start justify-between gap-3">

                                    <div className="text-sm font-medium text-gray-600">
                                        {item.label}
                                    </div>

                                    {item.important && (
                                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                                            Needs attention
                                        </span>
                                    )}

                                </div>

                                <div className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                                    {item.value}
                                </div>

                                <div className="mt-1 text-xs text-gray-500">
                                    {item.description}
                                </div>

                                <Link
                                    to={item.to}
                                    className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                    {item.action} →
                                </Link>

                            </div>

                        )
                    )}

                </div>

            </section>

            {/* Current draw + prizes */}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">

                {/* Current Draw */}

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-3">

                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Current / Next Draw
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                The draw requiring the organizer's attention.
                            </p>
                        </div>

                    </div>

                    {dashboard.current_draw ? (

                        <div className="p-5">

                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                                <div>

                                    <div className="flex items-center gap-3">

                                        <div className="text-2xl font-bold text-gray-900">
                                            Week{' '}
                                            {
                                                dashboard.current_draw
                                                    .week_number
                                            }
                                        </div>

                                        <StatusBadge
                                            status={
                                                dashboard.current_draw
                                                    .status
                                            }
                                        />

                                    </div>

                                    <div className="mt-2 text-sm text-gray-500">
                                        {dashboard.current_draw.draw_date
                                            ? formatDateTime(
                                                dashboard.current_draw
                                                    .draw_date
                                            )
                                            : 'Draw date not set'}
                                    </div>

                                </div>

                                <Link
                                    to={`/admin/draws/${dashboard.current_draw.id}`}
                                    className="inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                                >
                                    Manage Draw
                                </Link>

                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4">

                                <div className="rounded-lg bg-gray-50 p-4">

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Entries
                                    </div>

                                    <div className="mt-2 text-2xl font-bold text-gray-900">
                                        {
                                            dashboard.current_draw
                                                .entries
                                        }
                                    </div>

                                </div>

                                <div className="rounded-lg bg-gray-50 p-4">

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Prizes
                                    </div>

                                    <div className="mt-2 text-2xl font-bold text-gray-900">
                                        {
                                            dashboard.current_draw
                                                .prizes
                                        }
                                    </div>

                                </div>

                            </div>

                        </div>

                    ) : (

                        <div className="p-8 text-center">

                            <div className="text-sm font-medium text-gray-700">
                                No current or upcoming draw.
                            </div>

                            <p className="mt-1 text-sm text-gray-400">
                                Configure the next weekly draw when ready.
                            </p>

                            <Link
                                to="/admin/draws"
                                className="mt-4 inline-flex rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                View Draws
                            </Link>

                        </div>

                    )}

                </section>

                {/* Prize availability */}

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-2">

                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Prize Availability
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Remaining promotion inventory
                            </p>
                        </div>

                        <Link
                            to="/admin/prizes"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            Details
                        </Link>

                    </div>

                    <div className="divide-y divide-gray-100">

                        {dashboard.prizes.map(
                            (prize) => {

                                const percentage =
                                    prize.total > 0
                                        ? Math.min(
                                            100,
                                            Math.round(
                                                (
                                                    prize.allocated /
                                                    prize.total
                                                ) *
                                                100
                                            )
                                        )
                                        : 0;

                                return (
                                    <div
                                        key={prize.id}
                                        className="p-5"
                                    >

                                        <div className="flex items-start justify-between gap-4">

                                            <div>

                                                <div className="font-medium text-gray-900">
                                                    {prize.name}
                                                </div>

                                                <div className="mt-1 text-xs text-gray-500">
                                                    {prize.allocated} of{' '}
                                                    {prize.total} allocated
                                                </div>

                                            </div>

                                            <div className="text-right">

                                                <div className="text-lg font-semibold text-gray-900">
                                                    {prize.remaining}
                                                </div>

                                                <div className="text-xs text-gray-500">
                                                    remaining
                                                </div>

                                            </div>

                                        </div>

                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">

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

                        {dashboard.prizes.length === 0 && (
                            <div className="p-5 text-sm text-gray-400">
                                No prizes configured.
                            </div>
                        )}

                    </div>

                </section>

            </div>

            {/* Promotion totals */}

            <section>

                <div className="mb-3">

                    <h3 className="font-semibold text-gray-900">
                        Promotion Totals
                    </h3>

                    <p className="mt-0.5 text-xs text-gray-500">
                        High-level promotion statistics
                    </p>

                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Total Receipts
                        </div>

                        <div className="mt-2 text-2xl font-bold text-gray-900">
                            {kpis.total_receipts}
                        </div>

                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Approved
                        </div>

                        <div className="mt-2 text-2xl font-bold text-gray-900">
                            {kpis.approved_receipts}
                        </div>

                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Total Winners
                        </div>

                        <div className="mt-2 text-2xl font-bold text-gray-900">
                            {kpis.total_winners}
                        </div>

                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Cancelled Winners
                        </div>

                        <div className="mt-2 text-2xl font-bold text-gray-900">
                            {kpis.cancelled_winners}
                        </div>

                    </div>

                </div>

            </section>

            {/* Recent activity */}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

                {/* Receipts */}

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                        <div>

                            <h3 className="font-semibold text-gray-900">
                                Recent Receipts
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Latest participation submissions
                            </p>

                        </div>

                        <Link
                            to="/admin/receipts"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            View all
                        </Link>

                    </div>

                    {dashboard.recent_receipts.length === 0 ? (

                        <div className="p-6 text-center text-sm text-gray-400">
                            No receipts found.
                        </div>

                    ) : (

                        <div className="divide-y divide-gray-100">

                            {dashboard.recent_receipts.map(
                                (receipt) => (

                                    <Link
                                        key={receipt.id}
                                        to={`/admin/receipts/${receipt.id}`}
                                        className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50"
                                    >

                                        <div className="min-w-0">

                                            <div className="truncate text-sm font-medium text-gray-900">
                                                Receipt #
                                                {receipt.receipt_number}
                                            </div>

                                            <div className="mt-1 text-xs text-gray-500">
                                                {formatDateTime(
                                                    receipt.created_at
                                                )}
                                            </div>

                                        </div>

                                        <StatusBadge
                                            status={
                                                receipt.status
                                            }
                                        />

                                    </Link>

                                )
                            )}

                        </div>

                    )}

                </section>

                {/* Winners */}

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                        <div>

                            <h3 className="font-semibold text-gray-900">
                                Recent Winners
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Latest winner activity
                            </p>

                        </div>

                        <Link
                            to="/admin/winners"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            View all
                        </Link>

                    </div>

                    {dashboard.recent_winners.length === 0 ? (

                        <div className="p-6 text-center text-sm text-gray-400">
                            No winners yet.
                        </div>

                    ) : (

                        <div className="divide-y divide-gray-100">

                            {dashboard.recent_winners.map(
                                (winner) => (

                                    <Link
                                        key={winner.id}
                                        to={`/admin/winners/${winner.id}`}
                                        className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50"
                                    >

                                        <div className="min-w-0">

                                            <div className="truncate text-sm font-medium text-gray-900">
                                                {winner.prize ?? 'Prize'}
                                            </div>

                                            <div className="mt-1 text-xs text-gray-500">
                                                Week{' '}
                                                {winner.week_number ?? '-'}
                                                {' · '}
                                                Entry #
                                                {winner.entry_number}
                                            </div>

                                        </div>

                                        <StatusBadge
                                            status={
                                                winner.status
                                            }
                                        />

                                    </Link>

                                )
                            )}

                        </div>

                    )}

                </section>

            </div>

            {/* Reports shortcut */}

            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

                <div>

                    <div className="font-semibold text-gray-900">
                        Need detailed statistics?
                    </div>

                    <div className="mt-1 text-sm text-gray-500">
                        Open Reports & Exports for draw results, prize allocation and downloadable reports.
                    </div>

                </div>

                <Link
                    to="/admin/reports"
                    className="inline-flex shrink-0 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Reports & Exports
                </Link>

            </div>

        </div>
    );
}
