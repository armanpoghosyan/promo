import { useEffect, useState } from 'react';

import api from '../../services/api';

type ReceiptOverview = {
    total: number;
    submitted: number;
    reviewing: number;
    approved: number;
    rejected: number;
    winner: number;
    cancelled: number;
};

type DrawPrize = {
    id: number;
    prize_id: number;
    name: string | null;
    type: string | null;
    quantity: number;
};

type DrawWinners = {
    total: number;
    selected: number;
    confirmed: number;
    cancelled: number;
};

type DrawReport = {
    id: number;
    week_number: number;
    draw_date: string | null;
    status: string | null;
    eligible_entries: number;
    prizes: DrawPrize[];
    total_prizes: number;
    winners: DrawWinners;
};

type PrizeAllocation = {
    prize_id: number;
    name: string;
    type: string | null;
    total_quantity: number;
    allocated_quantity: number;
    remaining_quantity: number;
    within_limit: boolean;
};

type ReportsResponse = {
    data: {
        overview: {
            receipts: ReceiptOverview;
        };
        draws: DrawReport[];
        prize_allocation: PrizeAllocation[];
    };
};

export default function Reports() {
    const [report, setReport] =
        useState<ReportsResponse['data'] | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] =
        useState<string | null>(null);

    const loadReports = async () => {
        setLoading(true);
        setError(null);

        try {
            const response =
                await api.get<ReportsResponse>(
                    '/admin/reports/overview'
                );

            setReport(response.data.data);
        } catch (err) {
            console.error(err);

            setError(
                'Unable to load reports.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const exportReport = (
        type: 'receipts' | 'winners' | 'draws'
    ) => {
        const url =
            `/api/admin/reports/export/${type}`;

        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">
                Loading reports...
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">

                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>

                <button
                    type="button"
                    onClick={loadReports}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Retry
                </button>

            </div>
        );
    }

    if (!report) {
        return null;
    }

    const receipts =
        report.overview.receipts;

    return (
        <div className="space-y-6">

            {/* Header */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Reports
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Overview of receipts, draws, winners and prize allocation.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadReports}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Refresh
                </button>

            </div>

            {/* Receipt Overview */}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Receipt Overview
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Current receipt status distribution.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                exportReport('receipts')
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Export Receipts
                        </button>

                    </div>

                </div>

                <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4 lg:grid-cols-7">

                    <div className="rounded-lg bg-gray-50 p-4">
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Total
                        </div>

                        <div className="mt-2 text-2xl font-bold text-gray-900">
                            {receipts.total}
                        </div>
                    </div>

                    <div className="rounded-lg bg-yellow-50 p-4">
                        <div className="text-xs font-medium uppercase tracking-wide text-yellow-700">
                            Submitted
                        </div>

                        <div className="mt-2 text-2xl font-bold text-yellow-800">
                            {receipts.submitted}
                        </div>
                    </div>

                    <div className="rounded-lg bg-blue-50 p-4">
                        <div className="text-xs font-medium uppercase tracking-wide text-blue-700">
                            Reviewing
                        </div>

                        <div className="mt-2 text-2xl font-bold text-blue-800">
                            {receipts.reviewing}
                        </div>
                    </div>

                    <div className="rounded-lg bg-green-50 p-4">
                        <div className="text-xs font-medium uppercase tracking-wide text-green-700">
                            Approved
                        </div>

                        <div className="mt-2 text-2xl font-bold text-green-800">
                            {receipts.approved}
                        </div>
                    </div>

                    <div className="rounded-lg bg-red-50 p-4">
                        <div className="text-xs font-medium uppercase tracking-wide text-red-700">
                            Rejected
                        </div>

                        <div className="mt-2 text-2xl font-bold text-red-800">
                            {receipts.rejected}
                        </div>
                    </div>

                    <div className="rounded-lg bg-purple-50 p-4">
                        <div className="text-xs font-medium uppercase tracking-wide text-purple-700">
                            Winners
                        </div>

                        <div className="mt-2 text-2xl font-bold text-purple-800">
                            {receipts.winner}
                        </div>
                    </div>

                    <div className="rounded-lg bg-gray-100 p-4">
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-600">
                            Cancelled
                        </div>

                        <div className="mt-2 text-2xl font-bold text-gray-800">
                            {receipts.cancelled}
                        </div>
                    </div>

                </div>

            </div>

            {/* Draw Reports */}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Draw Reports
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Draw participation, prizes and winner status.
                            </p>
                        </div>

                        <div className="flex gap-2">

                            <button
                                type="button"
                                onClick={() =>
                                    exportReport('draws')
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Export Draws
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    exportReport('winners')
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Export Winners
                            </button>

                        </div>

                    </div>

                </div>

                {report.draws.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">
                        No draws found.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">

                        {report.draws.map((draw) => (

                            <div
                                key={draw.id}
                                className="p-5"
                            >

                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                                    <div>

                                        <div className="flex items-center gap-3">

                                            <h4 className="font-semibold text-gray-900">
                                                Week {draw.week_number}
                                            </h4>

                                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                                {draw.status ?? '-'}
                                            </span>

                                        </div>

                                        <div className="mt-1 text-sm text-gray-500">
                                            {draw.draw_date
                                                ? new Date(
                                                    draw.draw_date
                                                ).toLocaleDateString()
                                                : 'No draw date'}
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                                        <div className="rounded-lg bg-gray-50 px-4 py-3">
                                            <div className="text-xs text-gray-500">
                                                Eligible
                                            </div>

                                            <div className="mt-1 font-semibold text-gray-900">
                                                {draw.eligible_entries}
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-gray-50 px-4 py-3">
                                            <div className="text-xs text-gray-500">
                                                Prizes
                                            </div>

                                            <div className="mt-1 font-semibold text-gray-900">
                                                {draw.total_prizes}
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-gray-50 px-4 py-3">
                                            <div className="text-xs text-gray-500">
                                                Winners
                                            </div>

                                            <div className="mt-1 font-semibold text-gray-900">
                                                {draw.winners.total}
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-green-50 px-4 py-3">
                                            <div className="text-xs text-green-700">
                                                Confirmed
                                            </div>

                                            <div className="mt-1 font-semibold text-green-800">
                                                {draw.winners.confirmed}
                                            </div>
                                        </div>

                                    </div>

                                </div>

                                {draw.prizes.length > 0 && (
                                    <div className="mt-5">

                                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Prizes
                                        </div>

                                        <div className="flex flex-wrap gap-2">

                                            {draw.prizes.map((prize) => (

                                                <span
                                                    key={prize.id}
                                                    className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700"
                                                >
                                                    {prize.name ?? 'Prize'} × {prize.quantity}
                                                </span>

                                            ))}

                                        </div>

                                    </div>
                                )}

                                <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">

                                    <span>
                                        Selected: {draw.winners.selected}
                                    </span>

                                    <span>
                                        Confirmed: {draw.winners.confirmed}
                                    </span>

                                    <span>
                                        Cancelled: {draw.winners.cancelled}
                                    </span>

                                </div>

                            </div>

                        ))}

                    </div>
                )}

            </div>

            {/* Prize Allocation */}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">

                    <h3 className="font-semibold text-gray-900">
                        Prize Allocation
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Total prize inventory compared with quantities allocated to draws.
                    </p>

                </div>

                {report.prize_allocation.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">
                        No prize allocation data found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="min-w-full divide-y divide-gray-200">

                            <thead className="bg-gray-50">

                            <tr>

                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Prize
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Type
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Total
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Allocated
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Remaining
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Status
                                </th>

                            </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100 bg-white">

                            {report.prize_allocation.map(
                                (prize) => (
                                    <tr
                                        key={prize.prize_id}
                                        className="hover:bg-gray-50"
                                    >

                                        <td className="px-5 py-4">

                                            <div className="font-medium text-gray-900">
                                                {prize.name}
                                            </div>

                                            <div className="mt-1 text-xs text-gray-500">
                                                ID #{prize.prize_id}
                                            </div>

                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-700">
                                            {prize.type ?? '-'}
                                        </td>

                                        <td className="px-5 py-4 text-center text-sm text-gray-700">
                                            {prize.total_quantity}
                                        </td>

                                        <td className="px-5 py-4 text-center text-sm text-gray-700">
                                            {prize.allocated_quantity}
                                        </td>

                                        <td className="px-5 py-4 text-center text-sm font-medium text-gray-900">
                                            {prize.remaining_quantity}
                                        </td>

                                        <td className="px-5 py-4 text-center">

                                                <span
                                                    className={
                                                        prize.within_limit
                                                            ? 'inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700'
                                                            : 'inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700'
                                                    }
                                                >
                                                    {prize.within_limit
                                                        ? 'Within limit'
                                                        : 'Over limit'}
                                                </span>

                                        </td>

                                    </tr>
                                )
                            )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}
