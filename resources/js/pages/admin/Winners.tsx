import { useEffect, useState } from 'react';
import {
    Link,
    useLocation,
    useSearchParams,
} from 'react-router-dom';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import type { PaginatedResponse } from '../../types/api';
import { formatDateTime } from '../../utils/date';

type WinnerStatus =
    | 'selected'
    | 'contacting'
    | 'confirmed'
    | 'cancelled';

type Participant = {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
};

type Receipt = {
    id: number;
    receipt_number: string;
    participant: Participant | null;
};

type Prize = {
    id: number;
    name: string;
    type: string;
    value: number | null;
    currency: string | null;
};

type DrawPrize = {
    id: number;
    draw_id: number;
    prize_id: number;
    quantity: number;
    prize: Prize;
};

type Draw = {
    id: number;
    week_number: number;
    status: string;
};

type ContactAttempt = {
    id: number;
    attempted_at: string;
    result: string;
    notes: string | null;
};

type Winner = {
    id: number;
    draw_id: number;
    draw_prize_id: number;
    receipt_id: number;
    entry_number: number;
    status: WinnerStatus;

    selected_at: string;
    confirmed_at: string | null;
    cancelled_at: string | null;

    cancellation_reason: string | null;
    replaced_winner_id: number | null;

    draw: Draw;
    draw_prize: DrawPrize;
    receipt: Receipt;
    contact_attempts: ContactAttempt[];
};

type DrawListItem = {
    id: number;
    week_number: number;
    status: string;
};

type DrawListResponse = {
    data: DrawListItem[];
};

type FilterValue =
    | ''
    | 'selected'
    | 'contacting'
    | 'confirmed'
    | 'cancelled';

const statusFilters: Array<{
    label: string;
    value: FilterValue;
}> = [
    {
        label: 'All',
        value: '',
    },
    {
        label: 'Selected',
        value: 'selected',
    },
    {
        label: 'Contacting',
        value: 'contacting',
    },
    {
        label: 'Confirmed',
        value: 'confirmed',
    },
    {
        label: 'Cancelled',
        value: 'cancelled',
    },
];


export default function Winners() {
    const location = useLocation();

    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams();

    const initialPage =
        Number(
            searchParams.get('page')
        ) || 1;

    const initialStatus =
        (
            searchParams.get(
                'status'
            ) as FilterValue | null
        ) ?? '';

    const initialDrawId =
        searchParams.get(
            'draw_id'
        ) ?? '';

    const initialReceiptSearch =
        searchParams.get(
            'receipt'
        ) ?? '';

    const [winners, setWinners] =
        useState<Winner[]>([]);

    const [draws, setDraws] =
        useState<DrawListItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [drawsLoading, setDrawsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [page, setPage] =
        useState(initialPage);

    const [status, setStatus] =
        useState<FilterValue>(
            initialStatus
        );

    const [drawId, setDrawId] =
        useState(initialDrawId);

    const [
        receiptSearch,
        setReceiptSearch,
    ] = useState(initialReceiptSearch);

    const [
        receiptSearchInput,
        setReceiptSearchInput,
    ] = useState(initialReceiptSearch);

    const [
        pagination,
        setPagination,
    ] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    const loadDraws = async () => {
        setDrawsLoading(true);

        try {
            const response =
                await api.get<DrawListResponse>(
                    '/admin/draws'
                );

            setDraws(
                response.data.data ?? []
            );
        } catch (err) {
            console.error(
                'Unable to load draws:',
                err
            );
        } finally {
            setDrawsLoading(false);
        }
    };

    const loadWinners = async () => {
        setLoading(true);
        setError(null);

        try {
            const response =
                await api.get<PaginatedResponse<Winner>>(
                    '/admin/winners',
                    {
                        params: {
                            page,

                            per_page: 20,

                            ...(status
                                ? {
                                    status,
                                }
                                : {}),

                            ...(drawId
                                ? {
                                    draw_id:
                                        Number(
                                            drawId
                                        ),
                                }
                                : {}),

                            ...(receiptSearch.trim()
                                ? {
                                    receipt_number:
                                        receiptSearch.trim(),
                                }
                                : {}),
                        },
                    }
                );

            setWinners(
                response.data.data ?? []
            );

            setPagination({
                current_page:
                response.data.current_page,

                last_page:
                response.data.last_page,

                per_page:
                response.data.per_page,

                total:
                response.data.total,
            });
        } catch (err) {
            console.error(err);

            setError(
                'Unable to load winners.'
            );
        } finally {
            setLoading(false);
        }
    };

    /*
     * Load draw filter options once.
     */
    useEffect(() => {
        loadDraws();
    }, []);

    /*
     * Keep URL in sync with current queue state.
     */
    useEffect(() => {
        const params =
            new URLSearchParams();

        if (page > 1) {
            params.set(
                'page',
                String(page)
            );
        }

        if (status) {
            params.set(
                'status',
                status
            );
        }

        if (drawId) {
            params.set(
                'draw_id',
                drawId
            );
        }

        if (
            receiptSearch.trim()
        ) {
            params.set(
                'receipt',
                receiptSearch.trim()
            );
        }

        setSearchParams(
            params,
            {
                replace: true,
            }
        );
    }, [
        page,
        status,
        drawId,
        receiptSearch,
        setSearchParams,
    ]);

    useEffect(() => {
        loadWinners();
    }, [
        page,
        status,
        drawId,
        receiptSearch,
    ]);

    const handleReceiptSearch = () => {
        setPage(1);

        setReceiptSearch(
            receiptSearchInput.trim()
        );
    };

    const clearReceiptSearch = () => {
        setReceiptSearchInput('');
        setReceiptSearch('');
        setPage(1);
    };

    const resetFilters = () => {
        setStatus('');
        setDrawId('');
        setReceiptSearch('');
        setReceiptSearchInput('');
        setPage(1);
    };

    const hasFilters =
        Boolean(
            status ||
            drawId ||
            receiptSearch
        );

    return (
        <div className="space-y-6">

            {/* Header */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>

                    <h2 className="text-2xl font-bold text-gray-900">
                        Winners
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Contact, confirm and
                        manage promotion winners.
                    </p>

                </div>

                <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
                    {pagination.total}{' '}
                    winner
                    {pagination.total === 1
                        ? ''
                        : 's'}
                </div>

            </div>

            {/* Filters */}

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                {/* Search / Draw */}

                <div className="border-b border-gray-200 p-4">

                    <div className="flex flex-col gap-3 xl:flex-row">

                        {/* Receipt Search */}

                        <div className="flex min-w-0 flex-1 gap-2">

                            <input
                                type="text"
                                value={
                                    receiptSearchInput
                                }
                                onChange={(
                                    event
                                ) =>
                                    setReceiptSearchInput(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                onKeyDown={(
                                    event
                                ) => {
                                    if (
                                        event.key ===
                                        'Enter'
                                    ) {
                                        handleReceiptSearch();
                                    }
                                }}
                                placeholder="Search by receipt number..."
                                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />

                            <button
                                type="button"
                                onClick={
                                    handleReceiptSearch
                                }
                                disabled={
                                    loading
                                }
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Search
                            </button>

                            {receiptSearch && (
                                <button
                                    type="button"
                                    onClick={
                                        clearReceiptSearch
                                    }
                                    disabled={
                                        loading
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Clear
                                </button>
                            )}

                        </div>

                        {/* Draw Filter */}

                        <div className="w-full xl:w-64">

                            <select
                                value={drawId}
                                onChange={(
                                    event
                                ) => {
                                    setDrawId(
                                        event.target.value
                                    );

                                    setPage(
                                        1
                                    );
                                }}
                                disabled={
                                    drawsLoading
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            >
                                <option value="">
                                    All draws
                                </option>

                                {draws.map(
                                    (draw) => (
                                        <option
                                            key={
                                                draw.id
                                            }
                                            value={
                                                draw.id
                                            }
                                        >
                                            Week{' '}
                                            {
                                                draw.week_number
                                            }
                                            {' — '}
                                            {
                                                draw.status
                                            }
                                        </option>
                                    )
                                )}

                            </select>

                        </div>

                    </div>

                </div>

                {/* Status tabs */}

                <div className="p-4">

                    <div className="flex flex-wrap gap-2">

                        {statusFilters.map(
                            (item) => (
                                <button
                                    key={
                                        item.value
                                    }
                                    type="button"
                                    onClick={() => {
                                        setStatus(
                                            item.value
                                        );

                                        setPage(
                                            1
                                        );
                                    }}
                                    className={
                                        status ===
                                        item.value
                                            ? 'rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white'
                                            : 'rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200'
                                    }
                                >
                                    {
                                        item.label
                                    }
                                </button>
                            )
                        )}

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={
                                    resetFilters
                                }
                                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900"
                            >
                                Reset filters
                            </button>
                        )}

                    </div>

                </div>

            </section>

            {/* Error */}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Winner queue */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                {loading ? (

                    <div className="flex min-h-64 items-center justify-center text-sm text-gray-500">
                        Loading winners...
                    </div>

                ) : winners.length === 0 ? (

                    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

                        <div className="text-sm font-medium text-gray-700">
                            No winners found.
                        </div>

                        <p className="mt-1 text-sm text-gray-400">
                            Try changing the current
                            filters or search value.
                        </p>

                    </div>

                ) : (

                    <>

                        <div className="overflow-x-auto">

                            <table className="min-w-full text-left text-sm">

                                <thead className="bg-gray-50">

                                <tr>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Participant
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Prize
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Draw
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Contact
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Selected
                                    </th>

                                    <th className="px-5 py-3" />

                                </tr>

                                </thead>

                                <tbody className="divide-y divide-gray-100">

                                {winners.map(
                                    (winner) => {

                                        const participant =
                                            winner
                                                .receipt
                                                ?.participant;

                                        const contactCount =
                                            winner
                                                .contact_attempts
                                                ?.length ??
                                            0;

                                        return (
                                            <tr
                                                key={
                                                    winner.id
                                                }
                                                className="hover:bg-gray-50"
                                            >

                                                {/* Participant */}

                                                <td className="px-5 py-4">

                                                    <div className="font-medium text-gray-900">

                                                        {participant
                                                            ? `${participant.first_name} ${participant.last_name}`
                                                            : 'Unknown participant'}

                                                    </div>

                                                    <div className="mt-1 text-xs text-gray-500">
                                                        {
                                                            participant?.phone ??
                                                            ''
                                                        }
                                                    </div>

                                                    <div className="mt-1 text-xs text-gray-400">
                                                        Receipt{' '}
                                                        {
                                                            winner
                                                                .receipt
                                                                ?.receipt_number
                                                        }
                                                    </div>

                                                </td>

                                                {/* Prize */}

                                                <td className="px-5 py-4">

                                                    <div className="font-medium text-gray-900">
                                                        {
                                                            winner
                                                                .draw_prize
                                                                ?.prize
                                                                ?.name ??
                                                            '-'
                                                        }
                                                    </div>

                                                    {winner
                                                            .draw_prize
                                                            ?.prize
                                                            ?.value !==
                                                        null &&
                                                        winner
                                                            .draw_prize
                                                            ?.prize
                                                            ?.value !==
                                                        undefined && (

                                                            <div className="mt-1 text-xs text-gray-500">

                                                                {winner.draw_prize.prize.value.toLocaleString()}

                                                                {' '}

                                                                {
                                                                    winner
                                                                        .draw_prize
                                                                        .prize
                                                                        .currency ??
                                                                    ''
                                                                }

                                                            </div>

                                                        )}

                                                </td>

                                                {/* Draw */}

                                                <td className="px-5 py-4">

                                                    <Link
                                                        to={`/admin/draws/${winner.draw_id}`}
                                                        className="font-medium text-blue-600 hover:text-blue-800"
                                                    >
                                                        Week{' '}
                                                        {
                                                            winner
                                                                .draw
                                                                ?.week_number
                                                        }
                                                    </Link>

                                                    <div className="mt-1 text-xs text-gray-400">
                                                        Entry #
                                                        {
                                                            winner.entry_number
                                                        }
                                                    </div>

                                                </td>

                                                {/* Status */}

                                                <td className="px-5 py-4">

                                                    <StatusBadge
                                                        status={
                                                            winner.status
                                                        }
                                                    />

                                                </td>

                                                {/* Contact */}

                                                <td className="px-5 py-4 text-center">

                                                    <div className="font-medium text-gray-900">
                                                        {
                                                            contactCount
                                                        }
                                                    </div>

                                                    <div className="mt-1 text-xs text-gray-400">
                                                        attempt
                                                        {contactCount ===
                                                        1
                                                            ? ''
                                                            : 's'}
                                                    </div>

                                                </td>

                                                {/* Selected */}

                                                <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                                                    {formatDateTime(
                                                        winner.selected_at
                                                    )}
                                                </td>

                                                {/* Action */}

                                                <td className="px-5 py-4 text-right">

                                                    <Link
                                                        to={`/admin/winners/${winner.id}`}
                                                        state={{
                                                            from:
                                                                `${location.pathname}${location.search}`,
                                                        }}
                                                        className="inline-flex rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                                                    >
                                                        Manage
                                                    </Link>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                                </tbody>

                            </table>

                        </div>

                        {/* Pagination */}

                        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                            <div className="text-sm text-gray-500">

                                Showing{' '}

                                {(pagination.current_page -
                                        1) *
                                    pagination.per_page +
                                    1}

                                {' '}to{' '}

                                {Math.min(
                                    pagination.current_page *
                                    pagination.per_page,
                                    pagination.total
                                )}

                                {' '}of{' '}

                                {
                                    pagination.total
                                }

                            </div>

                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    disabled={
                                        pagination.current_page <=
                                        1 ||
                                        loading
                                    }
                                    onClick={() =>
                                        setPage(
                                            (
                                                current
                                            ) =>
                                                Math.max(
                                                    1,
                                                    current -
                                                    1
                                                )
                                        )
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>

                                <span className="px-2 text-sm text-gray-600">
                                    Page{' '}
                                    {
                                        pagination.current_page
                                    }{' '}
                                    of{' '}
                                    {
                                        pagination.last_page
                                    }
                                </span>

                                <button
                                    type="button"
                                    disabled={
                                        pagination.current_page >=
                                        pagination.last_page ||
                                        loading
                                    }
                                    onClick={() =>
                                        setPage(
                                            (
                                                current
                                            ) =>
                                                Math.min(
                                                    pagination.last_page,
                                                    current +
                                                    1
                                                )
                                        )
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>

                            </div>

                        </div>

                    </>
                )}

            </section>

        </div>
    );
}
