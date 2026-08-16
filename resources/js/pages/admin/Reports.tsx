import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import { Link } from 'react-router-dom';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/date';
import { formatEnumLabel } from '../../utils/format';

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
        useState<
            ReportsResponse['data'] | null
        >(null);

    const [loading, setLoading] =
        useState(true);

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

            setReport(
                response.data.data
            );
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
        type:
            | 'receipts'
            | 'winners'
            | 'draws'
    ) => {
        window.open(
            `/api/admin/reports/export/${type}`,
            '_blank'
        );
    };

    const totals =
        useMemo(() => {
            if (!report) {
                return {
                    draws: 0,
                    eligibleEntries: 0,
                    prizes: 0,
                    winners: 0,
                    confirmed: 0,
                    cancelled: 0,
                };
            }

            return report.draws.reduce(
                (
                    result,
                    draw
                ) => {
                    result.draws += 1;

                    result.eligibleEntries +=
                        draw.eligible_entries;

                    result.prizes +=
                        draw.total_prizes;

                    result.winners +=
                        draw.winners.total;

                    result.confirmed +=
                        draw.winners.confirmed;

                    result.cancelled +=
                        draw.winners.cancelled;

                    return result;
                },
                {
                    draws: 0,
                    eligibleEntries: 0,
                    prizes: 0,
                    winners: 0,
                    confirmed: 0,
                    cancelled: 0,
                }
            );
        }, [report]);

    if (loading) {
        return (
            <div className="flex min-h-64 items-center justify-center text-sm text-gray-500">
                Loading reports...
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="space-y-4">

                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error ??
                        'Report data is unavailable.'}
                </div>

                <button
                    type="button"
                    onClick={
                        loadReports
                    }
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Retry
                </button>

            </div>
        );
    }

    const receipts =
        report.overview.receipts;

    return (
        <div className="space-y-6">

            {/* Header */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>

                    <h2 className="text-2xl font-bold text-gray-900">
                        Reports & Exports
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Review campaign results and
                        export operational data.
                    </p>

                </div>

                <button
                    type="button"
                    onClick={
                        loadReports
                    }
                    disabled={
                        loading
                    }
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Refresh
                </button>

            </div>

            {/* Export Center */}

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">

                    <h3 className="font-semibold text-gray-900">
                        Export Center
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Download campaign data for
                        external analysis,
                        documentation or audit.
                    </p>

                </div>

                <div className="grid gap-4 p-5 md:grid-cols-3">

                    <div className="rounded-xl border border-gray-200 p-4">

                        <div className="font-medium text-gray-900">
                            Receipts
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                            Participant receipt
                            records and verification
                            results.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                exportReport(
                                    'receipts'
                                )
                            }
                            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                        >
                            Export Receipts
                        </button>

                    </div>

                    <div className="rounded-xl border border-gray-200 p-4">

                        <div className="font-medium text-gray-900">
                            Winners
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                            Winner selection,
                            confirmation and
                            cancellation data.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                exportReport(
                                    'winners'
                                )
                            }
                            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                        >
                            Export Winners
                        </button>

                    </div>

                    <div className="rounded-xl border border-gray-200 p-4">

                        <div className="font-medium text-gray-900">
                            Draws
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                            Draw configuration,
                            participation and
                            execution results.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                exportReport(
                                    'draws'
                                )
                            }
                            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                        >
                            Export Draws
                        </button>

                    </div>

                </div>

            </section>

            {/* Campaign totals */}

            <section>

                <div className="mb-4">

                    <h3 className="font-semibold text-gray-900">
                        Campaign Summary
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        High-level historical totals.
                    </p>

                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <div className="text-sm text-gray-500">
                            Receipts
                        </div>

                        <div className="mt-2 text-3xl font-bold text-gray-900">
                            {
                                receipts.total
                            }
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                            All submitted receipts
                        </div>

                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <div className="text-sm text-gray-500">
                            Draws
                        </div>

                        <div className="mt-2 text-3xl font-bold text-gray-900">
                            {
                                totals.draws
                            }
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                            Draw records
                        </div>

                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <div className="text-sm text-gray-500">
                            Winners Selected
                        </div>

                        <div className="mt-2 text-3xl font-bold text-gray-900">
                            {
                                totals.winners
                            }
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                            Winner records created
                        </div>

                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <div className="text-sm text-gray-500">
                            Confirmed Winners
                        </div>

                        <div className="mt-2 text-3xl font-bold text-green-700">
                            {
                                totals.confirmed
                            }
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                            Confirmed prize winners
                        </div>

                    </div>

                </div>

            </section>

            {/* Receipt status */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                        <h3 className="font-semibold text-gray-900">
                            Receipt Status
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Current receipt
                            distribution.
                        </p>

                    </div>

                    <Link
                        to="/admin/receipts"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        View Receipts →
                    </Link>

                </div>

                <div className="grid grid-cols-2 gap-px bg-gray-200 md:grid-cols-4 xl:grid-cols-7">

                    <div className="bg-white p-4">

                        <div className="text-xs text-gray-500">
                            Total
                        </div>

                        <div className="mt-1 text-xl font-bold text-gray-900">
                            {
                                receipts.total
                            }
                        </div>

                    </div>

                    <div className="bg-white p-4">

                        <div className="text-xs text-amber-600">
                            Submitted
                        </div>

                        <div className="mt-1 text-xl font-bold text-amber-700">
                            {
                                receipts.submitted
                            }
                        </div>

                    </div>

                    <div className="bg-white p-4">

                        <div className="text-xs text-blue-600">
                            Reviewing
                        </div>

                        <div className="mt-1 text-xl font-bold text-blue-700">
                            {
                                receipts.reviewing
                            }
                        </div>

                    </div>

                    <div className="bg-white p-4">

                        <div className="text-xs text-green-600">
                            Approved
                        </div>

                        <div className="mt-1 text-xl font-bold text-green-700">
                            {
                                receipts.approved
                            }
                        </div>

                    </div>

                    <div className="bg-white p-4">

                        <div className="text-xs text-red-600">
                            Rejected
                        </div>

                        <div className="mt-1 text-xl font-bold text-red-700">
                            {
                                receipts.rejected
                            }
                        </div>

                    </div>

                    <div className="bg-white p-4">

                        <div className="text-xs text-purple-600">
                            Winner
                        </div>

                        <div className="mt-1 text-xl font-bold text-purple-700">
                            {
                                receipts.winner
                            }
                        </div>

                    </div>

                    <div className="bg-white p-4">

                        <div className="text-xs text-gray-500">
                            Cancelled
                        </div>

                        <div className="mt-1 text-xl font-bold text-gray-700">
                            {
                                receipts.cancelled
                            }
                        </div>

                    </div>

                </div>

            </section>

            {/* Draw performance */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                        <h3 className="font-semibold text-gray-900">
                            Draw Results
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Participation and winner
                            results by draw.
                        </p>

                    </div>

                    <Link
                        to="/admin/draws"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        View Draws →
                    </Link>

                </div>

                {report.draws.length ===
                0 ? (

                    <div className="p-8 text-center text-sm text-gray-400">
                        No draws found.
                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="min-w-full text-left text-sm">

                            <thead className="bg-gray-50">

                            <tr>

                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Draw
                                </th>

                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Entries
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Prizes
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Winners
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Confirmed
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Cancelled
                                </th>

                                <th className="px-5 py-3" />

                            </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100">

                            {report.draws.map(
                                (draw) => (

                                    <tr
                                        key={
                                            draw.id
                                        }
                                        className="hover:bg-gray-50"
                                    >

                                        <td className="px-5 py-4">

                                            <div className="font-medium text-gray-900">
                                                Week{' '}
                                                {
                                                    draw.week_number
                                                }
                                            </div>

                                            <div className="mt-1 text-xs text-gray-500">
                                                {formatDate(
                                                    draw.draw_date,
                                                    'Not scheduled'
                                                )}

                                                {' · '}

                                                ID #
                                                {
                                                    draw.id
                                                }
                                            </div>

                                        </td>

                                        <td className="px-5 py-4">

                                            {draw.status ? (
                                                <StatusBadge
                                                    status={
                                                        draw.status
                                                    }
                                                />
                                            ) : (
                                                <span className="text-gray-400">
                                                    -
                                                </span>
                                            )}

                                        </td>

                                        <td className="px-5 py-4 text-center font-medium text-gray-700">
                                            {
                                                draw.eligible_entries
                                            }
                                        </td>

                                        <td className="px-5 py-4 text-center font-medium text-gray-700">
                                            {
                                                draw.total_prizes
                                            }
                                        </td>

                                        <td className="px-5 py-4 text-center font-medium text-gray-700">
                                            {
                                                draw.winners.total
                                            }
                                        </td>

                                        <td className="px-5 py-4 text-center font-medium text-green-700">
                                            {
                                                draw.winners.confirmed
                                            }
                                        </td>

                                        <td className="px-5 py-4 text-center font-medium text-red-700">
                                            {
                                                draw.winners.cancelled
                                            }
                                        </td>

                                        <td className="px-5 py-4 text-right">

                                            <Link
                                                to={`/admin/draws/${draw.id}`}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                View
                                            </Link>

                                        </td>

                                    </tr>

                                )
                            )}

                            </tbody>

                        </table>

                    </div>
                )}

            </section>

            {/* Prize allocation compact */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                        <h3 className="font-semibold text-gray-900">
                            Prize Allocation
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Allocation audit across
                            all configured draws.
                        </p>

                    </div>

                    <Link
                        to="/admin/prizes"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        View Inventory →
                    </Link>

                </div>

                {report.prize_allocation
                    .length === 0 ? (

                    <div className="p-8 text-center text-sm text-gray-400">
                        No prize allocation data.
                    </div>

                ) : (

                    <div className="divide-y divide-gray-100">

                        {report.prize_allocation.map(
                            (
                                prize
                            ) => {

                                const percentage =
                                    prize.total_quantity >
                                    0
                                        ? Math.min(
                                            100,
                                            (
                                                prize.allocated_quantity /
                                                prize.total_quantity
                                            ) *
                                            100
                                        )
                                        : 0;

                                return (
                                    <div
                                        key={
                                            prize.prize_id
                                        }
                                        className="p-5"
                                    >

                                        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr_auto] lg:items-center">

                                            <div>

                                                <div className="font-medium text-gray-900">
                                                    {
                                                        prize.name
                                                    }
                                                </div>

                                                <div className="mt-1 text-xs text-gray-500">
                                                    {formatEnumLabel(
                                                        prize.type
                                                    )}
                                                </div>

                                            </div>

                                            <div>

                                                <div className="flex justify-between text-sm">

                                                    <span className="text-gray-500">
                                                        {
                                                            prize.allocated_quantity
                                                        }{' '}
                                                        allocated
                                                    </span>

                                                    <span className="font-medium text-gray-700">
                                                        {
                                                            prize.total_quantity
                                                        }{' '}
                                                        total
                                                    </span>

                                                </div>

                                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">

                                                    <div
                                                        className="h-full rounded-full bg-gray-900"
                                                        style={{
                                                            width:
                                                                `${percentage}%`,
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                            <div className="text-right">

                                                <div className="text-lg font-semibold text-gray-900">
                                                    {
                                                        prize.remaining_quantity
                                                    }
                                                </div>

                                                <div className="text-xs text-gray-500">
                                                    remaining
                                                </div>

                                                {!prize.within_limit && (
                                                    <div className="mt-1 text-xs font-medium text-red-600">
                                                        Over allocated
                                                    </div>
                                                )}

                                            </div>

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
