import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import type { AxiosResponse } from 'axios';

import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';


import api from '../../services/api';
import {getApiErrorMessage} from '../../utils/apiError';
import {formatDateTime} from '../../utils/date';
import {formatEnumLabel} from '../../utils/format';

type ReceiptOverview = {
    total: number;
    submitted: number;
    approved: number;
    rejected: number;
    suspicious: number;
};

type ReportOverview = {
    receipts: ReceiptOverview;
};

type DrawPrize = {
    id: number;
    prize_id: number;

    name:
        | string
        | null;

    type:
        | string
        | null;

    quantity: number;
};

type DrawWinnerStats = {
    winner_records: number;
    active_winners: number;
    selected: number;
    contacting: number;
    confirmed: number;
    cancelled: number;
    replacements: number;
};

type DrawRandom = {
    provider:
        | string
        | null;

    request_id:
        | string
        | null;

    randomized_at:
        | string
        | null;
};

type DrawReport = {
    id: number;
    week_number: number;

    draw_date:
        | string
        | null;

    status: string;

    eligible_entries: number;

    prizes: DrawPrize[];

    prize_slots: number;

    winners:
        DrawWinnerStats;

    random:
        DrawRandom;
};

type PrizeAllocation = {
    prize_id: number;
    name: string;
    type: string;

    total_quantity: number;
    allocated_quantity: number;
    remaining_quantity: number;

    within_limit: boolean;
};

type ReportData = {
    overview: ReportOverview;

    draws:
        DrawReport[];

    prize_allocation:
        PrizeAllocation[];
};

type ReportResponse = {
    data: ReportData;
};

type ExportType =
    | 'receipts'
    | 'winners'
    | 'draws';

function needsActionCount(
    draw: DrawReport
): number {
    return (
        draw.winners.selected +
        draw.winners.contacting
    );
}

function downloadFilename(
    response: AxiosResponse<Blob>,
    fallback: string
): string {
    const disposition =
        response.headers['content-disposition'];

    if (typeof disposition !== 'string') {
        return fallback;
    }

    const match = disposition.match(
        /filename="?([^"]+)"?/i
    );

    return match?.[1] ?? fallback;
}

export default function Reports() {
    const [
        data,
        setData,
    ] = useState<
        ReportData | null
    >(null);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState<
        string | null
    >(null);

    const [
        exportLoading,
        setExportLoading,
    ] = useState<
        ExportType | null
    >(null);

    const [
        exportError,
        setExportError,
    ] = useState<
        string | null
    >(null);

    const loadReports =
        useCallback(
            async () => {
                setLoading(
                    true
                );

                setError(
                    null
                );

                try {
                    const response =
                        await api.get<ReportResponse>(
                            '/admin/reports/overview'
                        );

                    setData(
                        response.data.data
                    );
                } catch (
                    error: unknown
                    ) {
                    setError(
                        getApiErrorMessage(
                            error,
                            'Unable to load reports.'
                        )
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            []
        );

    useEffect(() => {
        loadReports();
    }, [
        loadReports,
    ]);

    const exportReport =
        async (
            type: ExportType
        ) => {
            setExportLoading(
                type
            );

            setExportError(
                null
            );

            try {
                const response =
                    await api.get(
                        `/admin/reports/export/${type}`,
                        {
                            responseType:
                                'blob',
                        }
                    );

                const blob =
                    new Blob(
                        [
                            response.data,
                        ],
                        {
                            type:
                                'text/csv;charset=utf-8',
                        }
                    );

                const url =
                    window.URL.createObjectURL(
                        blob
                    );

                const link =
                    document.createElement(
                        'a'
                    );

                const filename =
                    downloadFilename(
                        response,
                        `${type}.csv`
                    );

                link.href =
                    url;

                link.download =
                    filename;

                document.body.appendChild(
                    link
                );

                link.click();

                link.remove();

                window.URL.revokeObjectURL(
                    url
                );
            } catch (
                error: unknown
                ) {
                setExportError(
                    getApiErrorMessage(
                        error,
                        `Unable to export ${type}.`
                    )
                );
            } finally {
                setExportLoading(
                    null
                );
            }
        };

    if (
        loading
    ) {
        return (
            <LoadingState
                message="Loading reports..."
            />
        );
    }

    if (
        error ||
        !data
    ) {
        return (
            <div className="space-y-4">
                <PageHeader
                    title="Reports"
                    description="Review promotion performance, draw outcomes and prize allocation."
                />

                <Alert
                    variant="error"
                >
                    {error ??
                        'Unable to load reports.'}
                </Alert>
            </div>
        );
    }

    const receipts =
        data.overview
            .receipts;

    const totalWinnerRecords =
        data.draws.reduce(
            (
                total,
                draw
            ) =>
                total +
                draw.winners
                    .winner_records,
            0
        );

    const totalConfirmed =
        data.draws.reduce(
            (
                total,
                draw
            ) =>
                total +
                draw.winners
                    .confirmed,
            0
        );

    const totalNeedsAction =
        data.draws.reduce(
            (
                total,
                draw
            ) =>
                total +
                needsActionCount(
                    draw
                ),
            0
        );

    const totalReplacements =
        data.draws.reduce(
            (
                total,
                draw
            ) =>
                total +
                draw.winners
                    .replacements,
            0
        );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Reports"
                description="Review promotion performance, draw outcomes and prize allocation."
            />

            {exportError && (
                <Alert
                    variant="error"
                    onDismiss={() =>
                        setExportError(
                            null
                        )
                    }
                >
                    {
                        exportError
                    }
                </Alert>
            )}

            {/* Participation Overview */}

            <section>
                <div className="mb-3">
                    <h2 className="text-base font-semibold text-gray-900">
                        Participation Overview
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Current receipt
                        processing totals.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <MetricCard
                        label="Total Receipts"
                        value={
                            receipts.total
                        }
                    />

                    <MetricCard
                        label="Needs Review"
                        value={
                            receipts.submitted
                        }
                    />

                    <MetricCard
                        label="Approved"
                        value={
                            receipts.approved
                        }
                        valueClassName="text-green-700"
                    />

                    <MetricCard
                        label="Rejected"
                        value={
                            receipts.rejected
                        }
                        valueClassName="text-red-700"
                    />

                    <MetricCard
                        label="Suspicious"
                        value={
                            receipts.suspicious
                        }
                        valueClassName="text-amber-700"
                    />
                </div>
            </section>

            {/* Winner Overview */}

            <section>
                <div className="mb-3">
                    <h2 className="text-base font-semibold text-gray-900">
                        Winner Overview
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Winner follow-up
                        across all executed
                        draws.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        label="Winner Records"
                        value={
                            totalWinnerRecords
                        }
                    />

                    <MetricCard
                        label="Needs Action"
                        value={
                            totalNeedsAction
                        }
                        valueClassName="text-blue-700"
                    />

                    <MetricCard
                        label="Confirmed"
                        value={
                            totalConfirmed
                        }
                        valueClassName="text-green-700"
                    />

                    <MetricCard
                        label="Replacements"
                        value={
                            totalReplacements
                        }
                    />
                </div>
            </section>

            {/* Draw Performance */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                    <h2 className="font-semibold text-gray-900">
                        Draw Performance
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Entries, prize
                        allocation, winner
                        progress and
                        randomization by week.
                    </p>
                </div>

                {data.draws.length ===
                0 ? (
                    <EmptyState
                        title="No draws available."
                        description="Draw reporting will appear here after draws are created."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1250px] text-left text-sm">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Draw
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Entries
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Prize Slots
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Needs Action
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Confirmed
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Cancelled
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Replacements
                                </th>

                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Randomization
                                </th>

                                <th className="px-5 py-3" />
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                            {data.draws.map(
                                (
                                    draw
                                ) => (
                                    <tr
                                        key={
                                            draw.id
                                        }
                                        className="hover:bg-gray-50"
                                    >
                                        {/* Draw */}

                                        <td className="px-5 py-4 align-top">
                                            <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900">
                                                        Week{' '}
                                                        {
                                                            draw.week_number
                                                        }
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

                                            <div className="mt-1 text-[11px] text-gray-400">
                                                Draw
                                                #{' '}
                                                {
                                                    draw.id
                                                }
                                            </div>
                                        </td>

                                        {/* Entries */}

                                        <td className="px-5 py-4 text-center align-top">
                                                <span className="font-semibold text-gray-900">
                                                    {
                                                        draw.eligible_entries
                                                    }
                                                </span>
                                        </td>

                                        {/* Prize slots */}

                                        <td className="px-5 py-4 text-center align-top">
                                            <div className="font-semibold text-gray-900">
                                                {
                                                    draw.prize_slots
                                                }
                                            </div>

                                            {draw.prizes.length >
                                                0 && (
                                                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                                                        {draw.prizes.map(
                                                            (
                                                                prize
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        prize.id
                                                                    }
                                                                >
                                                                    {prize.name ??
                                                                        'Prize'}
                                                                    {' × '}
                                                                    {
                                                                        prize.quantity
                                                                    }
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                        </td>

                                        {/* Needs action */}

                                        <td className="px-5 py-4 text-center align-top">
                                                <span
                                                    className={
                                                        needsActionCount(
                                                            draw
                                                        ) >
                                                        0
                                                            ? 'font-semibold text-blue-700'
                                                            : 'text-gray-500'
                                                    }
                                                >
                                                    {needsActionCount(
                                                        draw
                                                    )}
                                                </span>
                                        </td>

                                        {/* Confirmed */}

                                        <td className="px-5 py-4 text-center align-top font-semibold text-green-700">
                                            {
                                                draw.winners
                                                    .confirmed
                                            }
                                        </td>

                                        {/* Cancelled */}

                                        <td className="px-5 py-4 text-center align-top">
                                                <span
                                                    className={
                                                        draw.winners
                                                            .cancelled >
                                                        0
                                                            ? 'font-semibold text-red-700'
                                                            : 'text-gray-500'
                                                    }
                                                >
                                                    {
                                                        draw.winners
                                                            .cancelled
                                                    }
                                                </span>
                                        </td>

                                        {/* Replacements */}

                                        <td className="px-5 py-4 text-center align-top text-gray-700">
                                            {
                                                draw.winners
                                                    .replacements
                                            }
                                        </td>

                                        {/* Randomization */}

                                        <td className="px-5 py-4 align-top">
                                            {draw.random
                                                .provider ? (
                                                <div>
                                                    <div className="text-sm font-medium text-gray-800">
                                                        {formatEnumLabel(
                                                            draw
                                                                .random
                                                                .provider
                                                        )}
                                                    </div>

                                                    <div className="mt-1 text-xs text-gray-500">
                                                        {formatDateTime(
                                                            draw
                                                                .random
                                                                .randomized_at
                                                        )}
                                                    </div>

                                                    {draw.random
                                                        .request_id && (
                                                        <div className="mt-1 max-w-[220px] truncate text-[11px] text-gray-400">
                                                            {
                                                                draw
                                                                    .random
                                                                    .request_id
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                        —
                                                    </span>
                                            )}
                                        </td>

                                        {/* Details */}

                                        <td className="px-5 py-4 text-right align-top">
                                            <Link
                                                to={`/admin/draws/${draw.id}`}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                View
                                                Draw
                                                →
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

            {/* Prize Allocation */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                    <h2 className="font-semibold text-gray-900">
                        Prize Allocation
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Promotion-wide prize
                        inventory and current
                        draw allocation.
                    </p>
                </div>

                {data.prize_allocation
                    .length ===
                0 ? (
                    <EmptyState
                        title="No prizes configured."
                        description="Prize allocation information will appear here once prizes are configured."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Prize
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Total
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Allocated
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Remaining
                                </th>

                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                            {data.prize_allocation.map(
                                (
                                    prize
                                ) => (
                                    <tr
                                        key={
                                            prize.prize_id
                                        }
                                    >
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-gray-900">
                                                {
                                                    prize.name
                                                }
                                            </div>

                                            <div className="mt-1 text-xs text-gray-400">
                                                {formatEnumLabel(
                                                    prize.type
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-center font-medium text-gray-800">
                                            {
                                                prize.total_quantity
                                            }
                                        </td>

                                        <td className="px-5 py-4 text-center font-medium text-gray-800">
                                            {
                                                prize.allocated_quantity
                                            }
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                                <span
                                                    className={
                                                        prize.remaining_quantity ===
                                                        0
                                                            ? 'font-semibold text-amber-700'
                                                            : 'font-semibold text-green-700'
                                                    }
                                                >
                                                    {
                                                        prize.remaining_quantity
                                                    }
                                                </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            {prize.within_limit ? (
                                                <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                                        Within
                                                        limit
                                                    </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                                        Over
                                                        allocated
                                                    </span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Exports */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                    <h2 className="font-semibold text-gray-900">
                        Export Data
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Download complete
                        operational datasets
                        as CSV files.
                    </p>
                </div>

                <div className="grid gap-px bg-gray-200 lg:grid-cols-3">
                    <ExportCard
                        title="Receipts"
                        description="Participant, receipt, review and suspicious flag data."
                        loading={
                            exportLoading ===
                            'receipts'
                        }
                        disabled={
                            exportLoading !==
                            null
                        }
                        onExport={() =>
                            exportReport(
                                'receipts'
                            )
                        }
                    />

                    <ExportCard
                        title="Winners"
                        description="Winner, participant, prize, status and replacement data."
                        loading={
                            exportLoading ===
                            'winners'
                        }
                        disabled={
                            exportLoading !==
                            null
                        }
                        onExport={() =>
                            exportReport(
                                'winners'
                            )
                        }
                    />

                    <ExportCard
                        title="Draws"
                        description="Draw, prize allocation, winner totals and randomization data."
                        loading={
                            exportLoading ===
                            'draws'
                        }
                        disabled={
                            exportLoading !==
                            null
                        }
                        onExport={() =>
                            exportReport(
                                'draws'
                            )
                        }
                    />
                </div>
            </section>
        </div>
    );
}

function MetricCard({
                        label,
                        value,
                        valueClassName =
                        'text-gray-900',
                    }: {
    label: string;
    value: number;
    valueClassName?: string;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">
                {
                    label
                }
            </div>

            <div
                className={`mt-2 text-2xl font-bold ${valueClassName}`}
            >
                {
                    value
                }
            </div>
        </div>
    );
}

function ExportCard({
                        title,
                        description,
                        loading,
                        disabled,
                        onExport,
                    }: {
    title: string;
    description: string;
    loading: boolean;
    disabled: boolean;
    onExport: () => void;
}) {
    return (
        <div className="flex flex-col bg-white p-5">
            <div className="font-semibold text-gray-900">
                {
                    title
                }
            </div>

            <p className="mt-1 flex-1 text-sm leading-6 text-gray-500">
                {
                    description
                }
            </p>

            <button
                type="button"
                onClick={
                    onExport
                }
                disabled={
                    disabled
                }
                className="mt-4 self-start rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading
                    ? 'Exporting...'
                    : 'Export CSV'}
            </button>
        </div>
    );
}
