import { useEffect, useState } from 'react';

import api from '../../services/api';
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

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const response = await api.get<{
                    data: DashboardData;
                }>('/admin/dashboard');

                setDashboard(response.data.data);
            } catch (err) {
                console.error(err);

                setError(
                    'Unable to load dashboard data.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="text-gray-600">
                Loading dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg bg-red-50 p-4 text-red-700">
                {error}
            </div>
        );
    }

    if (!dashboard) {
        return null;
    }

    const { kpis } = dashboard;

    const cards = [
        {
            label: 'Total Receipts',
            value: kpis.total_receipts,
        },
        {
            label: 'Pending Verification',
            value: kpis.pending_receipts,
        },
        {
            label: 'Approved Receipts',
            value: kpis.approved_receipts,
        },
        {
            label: 'Active Entries',
            value: kpis.active_entries,
        },
        {
            label: 'Total Winners',
            value: kpis.total_winners,
        },
        {
            label: 'Confirmed Winners',
            value: kpis.confirmed_winners,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">
                    Dashboard
                </h2>

                <p className="mt-1 text-gray-600">
                    Promotion overview
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="rounded-lg border bg-white p-5 shadow-sm"
                    >
                        <p className="text-sm text-gray-500">
                            {card.label}
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            {card.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                <div className="rounded-lg border bg-white p-5 shadow-sm">
                    <h3 className="font-semibold">
                        Upcoming Draw
                    </h3>

                    {dashboard.upcoming_draw ? (
                        <div className="mt-4 space-y-2">
                            <p>
                                Week:{' '}
                                <strong>
                                    {dashboard.upcoming_draw.week_number}
                                </strong>
                            </p>

                            <p>
                                Entries:{' '}
                                <strong>
                                    {dashboard.upcoming_draw.entries}
                                </strong>
                            </p>

                            <p>
                                Prizes:{' '}
                                <strong>
                                    {dashboard.upcoming_draw.prizes}
                                </strong>
                            </p>

                            <p>
                                Status:{' '}
                                <strong>
                                    {dashboard.upcoming_draw.status}
                                </strong>
                            </p>
                        </div>
                    ) : (
                        <p className="mt-4 text-gray-500">
                            No upcoming draw.
                        </p>
                    )}
                </div>

                <div className="rounded-lg border bg-white p-5 shadow-sm">
                    <h3 className="font-semibold">
                        Prize Availability
                    </h3>

                    <div className="mt-4 space-y-3">
                        {dashboard.prizes.map((prize) => (
                            <div
                                key={prize.id}
                                className="flex items-center justify-between border-b pb-3 last:border-0"
                            >
                                <div>
                                    <p className="font-medium">
                                        {prize.name}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        Allocated: {prize.allocated}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="font-semibold">
                                        {prize.remaining}
                                    </p>

                                    <p className="text-xs text-gray-500">
                                        remaining
                                    </p>
                                </div>
                            </div>
                        ))}

                        {dashboard.prizes.length === 0 && (
                            <p className="text-gray-500">
                                No prizes configured.
                            </p>
                        )}
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                            Recent Receipts
                        </h3>

                        <a
                            href="/admin/receipts"
                            className="text-sm text-blue-600 hover:underline"
                        >
                            View all
                        </a>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                            <tr className="border-b text-gray-500">
                                <th className="px-3 py-2">
                                    ID
                                </th>

                                <th className="px-3 py-2">
                                    Receipt
                                </th>

                                <th className="px-3 py-2">
                                    Status
                                </th>

                                <th className="px-3 py-2">
                                    Created
                                </th>
                            </tr>
                            </thead>

                            <tbody>
                            {dashboard.recent_receipts.map(
                                (receipt: any) => (
                                    <tr
                                        key={receipt.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="px-3 py-3">
                                            {receipt.id}
                                        </td>

                                        <td className="px-3 py-3">
                                            {receipt.receipt_number}
                                        </td>

                                        <td className="px-3 py-3">
                                            {receipt.status}
                                        </td>

                                        <td className="px-3 py-3">
                                            {receipt.created_at}
                                        </td>
                                    </tr>
                                )
                            )}

                            {dashboard.recent_receipts.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-3 py-6 text-center text-gray-500"
                                    >
                                        No receipts found.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                            Recent Winners
                        </h3>

                        <a
                            href="/admin/winners"
                            className="text-sm text-blue-600 hover:underline"
                        >
                            View all
                        </a>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                            <tr className="border-b text-gray-500">
                                <th className="px-3 py-2">
                                    ID
                                </th>

                                <th className="px-3 py-2">
                                    Week
                                </th>

                                <th className="px-3 py-2">
                                    Prize
                                </th>

                                <th className="px-3 py-2">
                                    Entry
                                </th>

                                <th className="px-3 py-2">
                                    Status
                                </th>
                            </tr>
                            </thead>

                            <tbody>
                            {dashboard.recent_winners.map(
                                (winner: any) => (
                                    <tr
                                        key={winner.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="px-3 py-3">
                                            {winner.id}
                                        </td>

                                        <td className="px-3 py-3">
                                            {winner.week_number ?? '-'}
                                        </td>

                                        <td className="px-3 py-3">
                                            {winner.prize ?? '-'}
                                        </td>

                                        <td className="px-3 py-3">
                                            {winner.entry_number}
                                        </td>

                                        <td className="px-3 py-3">
                                            {winner.status}
                                        </td>
                                    </tr>
                                )
                            )}

                            {dashboard.recent_winners.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-3 py-6 text-center text-gray-500"
                                    >
                                        No winners yet.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
