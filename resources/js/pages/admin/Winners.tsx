import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    Link,
    useLocation,
    useSearchParams,
} from 'react-router-dom';

import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';

import api from '../../services/api';

import type {
    PaginatedResponse,
} from '../../types/api';

import {
    getApiErrorMessage,
} from '../../utils/apiError';

import {
    formatDateTime,
} from '../../utils/date';

import {
    formatEnumLabel,
} from '../../utils/format';

import {
    positiveIntegerParam,
} from '../../utils/query';

type WinnerStatus =
    | 'selected'
    | 'contacting'
    | 'confirmed'
    | 'cancelled';

type WinnerQueue =
    | 'needs_action'
    | 'confirmed'
    | 'cancelled'
    | 'all';

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

    value?:
        | number
        | string
        | null;

    currency?:
        | string
        | null;
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

    confirmed_at:
        | string
        | null;

    cancelled_at:
        | string
        | null;

    cancellation_reason:
        | string
        | null;

    replaced_winner_id:
        | number
        | null;

    draw: Draw;
    draw_prize: DrawPrize;
    receipt: Receipt;

    contact_attempts:
        ContactAttempt[];
};

type DrawListItem = {
    id: number;
    week_number: number;
    status: string;
};

type DrawListResponse = {
    data: DrawListItem[];
};

type WinnerCounts = {
    needs_action: number;
    confirmed: number;
    cancelled: number;
    all: number;
};

type WinnerListResponse =
    PaginatedResponse<Winner> & {
    counts: WinnerCounts;
};

const SEARCH_MIN_LENGTH =
    3;

const SEARCH_DEBOUNCE_MS =
    350;

const queueTabs: Array<{
    value: WinnerQueue;
    label: string;
}> = [
    {
        value:
            'needs_action',

        label:
            'Needs Action',
    },

    {
        value:
            'confirmed',

        label:
            'Confirmed',
    },

    {
        value:
            'cancelled',

        label:
            'Cancelled',
    },

    {
        value:
            'all',

        label:
            'All',
    },
];

function isWinnerQueue(
    value:
        | string
        | null
): value is WinnerQueue {
    return (
        value ===
        'needs_action' ||
        value ===
        'confirmed' ||
        value ===
        'cancelled' ||
        value ===
        'all'
    );
}

function latestContactAttempt(
    attempts:
    ContactAttempt[]
): ContactAttempt | null {
    if (
        attempts.length ===
        0
    ) {
        return null;
    }

    return [...attempts].sort(
        (
            first,
            second
        ) =>
            new Date(
                second.attempted_at
            ).getTime() -
            new Date(
                first.attempted_at
            ).getTime()
    )[0];
}

export default function Winners() {
    const location =
        useLocation();

    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams();

    const queueParam =
        searchParams.get(
            'queue'
        );

    const queue:
        WinnerQueue =
        isWinnerQueue(
            queueParam
        )
            ? queueParam
            : 'needs_action';

    const drawId =
        searchParams.get(
            'draw_id'
        ) ?? '';

    const urlSearch =
        searchParams.get(
            'receipt'
        ) ?? '';

    const page =
        positiveIntegerParam(
            searchParams.get(
                'page'
            )
        );

    const [
        receiptSearchInput,
        setReceiptSearchInput,
    ] = useState(
        urlSearch
    );

    const [
        winners,
        setWinners,
    ] = useState<
        Winner[]
    >([]);

    const [
        draws,
        setDraws,
    ] = useState<
        DrawListItem[]
    >([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        drawsLoading,
        setDrawsLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState<
        string | null
    >(null);

    const [
        pagination,
        setPagination,
    ] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    const [
        counts,
        setCounts,
    ] = useState<WinnerCounts>({
        needs_action: 0,
        confirmed: 0,
        cancelled: 0,
        all: 0,
    });

    const updateUrl =
        useCallback(
            ({
                 nextQueue = queue,
                 nextDrawId = drawId,
                 nextSearch = urlSearch,
                 nextPage = page,
             }: {
                nextQueue?: WinnerQueue;
                nextDrawId?: string;
                nextSearch?: string;
                nextPage?: number;
            }) => {
                const params =
                    new URLSearchParams();

                if (
                    nextQueue !==
                    'needs_action'
                ) {
                    params.set(
                        'queue',
                        nextQueue
                    );
                }

                if (
                    nextDrawId
                ) {
                    params.set(
                        'draw_id',
                        nextDrawId
                    );
                }

                if (
                    nextSearch
                ) {
                    params.set(
                        'receipt',
                        nextSearch
                    );
                }

                if (
                    nextPage >
                    1
                ) {
                    params.set(
                        'page',
                        String(
                            nextPage
                        )
                    );
                }

                setSearchParams(
                    params,
                    {
                        replace: true,
                    }
                );
            },
            [
                queue,
                drawId,
                urlSearch,
                page,
                setSearchParams,
            ]
        );

    /*
     * Browser back/forward
     * should restore the input.
     */
    useEffect(() => {
        setReceiptSearchInput(
            urlSearch
        );
    }, [
        urlSearch,
    ]);

    /*
     * Type-ahead receipt search.
     */
    useEffect(() => {
        const timer =
            window.setTimeout(
                () => {
                    const value =
                        receiptSearchInput.trim();

                    const nextSearch =
                        value.length >=
                        SEARCH_MIN_LENGTH
                            ? value
                            : '';

                    if (
                        nextSearch !==
                        urlSearch
                    ) {
                        updateUrl({
                            nextSearch,
                            nextPage:
                                1,
                        });
                    }
                },
                SEARCH_DEBOUNCE_MS
            );

        return () => {
            window.clearTimeout(
                timer
            );
        };
    }, [
        receiptSearchInput,
        urlSearch,
        updateUrl,
    ]);

    const loadDraws =
        useCallback(
            async () => {
                setDrawsLoading(
                    true
                );

                try {
                    const response =
                        await api.get<DrawListResponse>(
                            '/admin/draws'
                        );

                    setDraws(
                        response.data
                            .data ??
                        []
                    );
                } catch (
                    error: unknown
                    ) {
                    console.error(
                        'Unable to load draws:',
                        error
                    );
                } finally {
                    setDrawsLoading(
                        false
                    );
                }
            },
            []
        );

    const loadWinners =
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
                        await api.get<WinnerListResponse>(
                            '/admin/winners',
                            {
                                params: {
                                    queue,

                                    draw_id:
                                        drawId
                                            ? Number(
                                                drawId
                                            )
                                            : undefined,

                                    receipt_number:
                                        urlSearch ||
                                        undefined,

                                    page,

                                    per_page:
                                        20,
                                },
                            }
                        );

                    setWinners(
                        response.data
                            .data ??
                        []
                    );

                    setCounts(
                        response.data
                            .counts ?? {
                            needs_action:
                                0,

                            confirmed:
                                0,

                            cancelled:
                                0,

                            all:
                                0,
                        }
                    );

                    setPagination({
                        current_page:
                        response.data
                            .current_page,

                        last_page:
                        response.data
                            .last_page,

                        per_page:
                        response.data
                            .per_page,

                        total:
                        response.data
                            .total,
                    });
                } catch (
                    error: unknown
                    ) {
                    setError(
                        getApiErrorMessage(
                            error,
                            'Unable to load winners.'
                        )
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            [
                queue,
                drawId,
                urlSearch,
                page,
            ]
        );

    useEffect(() => {
        loadDraws();
    }, [
        loadDraws,
    ]);

    useEffect(() => {
        loadWinners();
    }, [
        loadWinners,
    ]);

    const trimmedSearch =
        receiptSearchInput.trim();

    const showSearchHint =
        trimmedSearch.length >
        0 &&
        trimmedSearch.length <
        SEARCH_MIN_LENGTH;

    const currentListUrl =
        `${location.pathname}${location.search}`;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Winners"
                description="Contact, confirm and manage promotion winners."
            />

            {/* Queue */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {/* Tabs */}

                <div className="border-b border-gray-200 px-4 pt-3">
                    <div className="flex gap-1 overflow-x-auto">
                        {queueTabs.map(
                            (
                                item
                            ) => {
                                const active =
                                    queue ===
                                    item.value;

                                const count =
                                    counts[
                                        item
                                            .value
                                        ];

                                return (
                                    <button
                                        key={
                                            item.value
                                        }
                                        type="button"
                                        onClick={() =>
                                            updateUrl({
                                                nextQueue:
                                                item.value,

                                                nextPage:
                                                    1,
                                            })
                                        }
                                        className={[
                                            'flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition',
                                            active
                                                ? 'border-gray-900 text-gray-900'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800',
                                        ].join(
                                            ' '
                                        )}
                                    >
                                        <span>
                                            {
                                                item.label
                                            }
                                        </span>

                                        <span
                                            className={[
                                                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                                active
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-100 text-gray-600',
                                            ].join(
                                                ' '
                                            )}
                                        >
                                            {
                                                count
                                            }
                                        </span>
                                    </button>
                                );
                            }
                        )}
                    </div>
                </div>

                {/* Search / draw */}

                <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div>
                        <div className="relative">
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
                                placeholder="Search by receipt number..."
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-20 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />

                            {receiptSearchInput && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setReceiptSearchInput(
                                            ''
                                        )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-gray-700"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="mt-1.5 text-xs text-gray-400">
                            {showSearchHint
                                ? 'Type at least 3 characters to search.'
                                : urlSearch
                                    ? `Searching for “${urlSearch}”`
                                    : 'Search starts automatically after 3 characters.'}
                        </div>
                    </div>

                    <select
                        value={
                            drawId
                        }
                        onChange={(
                            event
                        ) =>
                            updateUrl({
                                nextDrawId:
                                event
                                    .target
                                    .value,

                                nextPage:
                                    1,
                            })
                        }
                        disabled={
                            drawsLoading
                        }
                        className="h-[42px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                    >
                        <option value="">
                            All Draws
                        </option>

                        {draws.map(
                            (
                                draw
                            ) => (
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
                                    {formatEnumLabel(
                                        draw.status
                                    )}
                                </option>
                            )
                        )}
                    </select>
                </div>
            </section>

            {error && (
                <Alert
                    variant="error"
                    onDismiss={() =>
                        setError(
                            null
                        )
                    }
                >
                    {
                        error
                    }
                </Alert>
            )}

            {/* Winner queue */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {loading ? (
                    <LoadingState
                        message="Loading winners..."
                    />
                ) : winners.length ===
                0 ? (
                    <EmptyState
                        title="No winners found."
                        description={
                            queue ===
                            'needs_action'
                                ? 'There are no winners that currently need organizer action.'
                                : 'No winners match the current queue and filters.'
                        }
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] text-left text-sm">
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
                                        Contact
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Selected
                                    </th>

                                    <th className="px-5 py-3" />
                                </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                {winners.map(
                                    (
                                        winner
                                    ) => {
                                        const participant =
                                            winner
                                                .receipt
                                                ?.participant;

                                        const attempts =
                                            winner.contact_attempts ??
                                            [];

                                        const latestAttempt =
                                            latestContactAttempt(
                                                attempts
                                            );

                                        const contactCount =
                                            attempts.length;

                                        const prizeValue =
                                            winner
                                                .draw_prize
                                                ?.prize
                                                ?.value;

                                        return (
                                            <tr
                                                key={
                                                    winner.id
                                                }
                                                className="transition hover:bg-gray-50"
                                            >
                                                {/* Participant */}

                                                <td className="px-5 py-4 align-top">
                                                    <div className="font-semibold text-gray-900">
                                                        {participant
                                                            ? `${participant.first_name} ${participant.last_name}`
                                                            : 'Unknown participant'}
                                                    </div>

                                                    {participant?.phone && (
                                                        <div className="mt-1 text-sm text-gray-600">
                                                            {
                                                                participant.phone
                                                            }
                                                        </div>
                                                    )}

                                                    <div className="mt-1 text-xs text-gray-400">
                                                        {
                                                            winner
                                                                .receipt
                                                                ?.receipt_number
                                                        }
                                                    </div>
                                                </td>

                                                {/* Prize */}

                                                <td className="px-5 py-4 align-top">
                                                    <div className="font-medium text-gray-900">
                                                        {winner
                                                                .draw_prize
                                                                ?.prize
                                                                ?.name ??
                                                            '—'}
                                                    </div>

                                                    {prizeValue !=
                                                        null && (
                                                            <div className="mt-1 text-xs text-gray-500">
                                                                {Number(
                                                                    prizeValue
                                                                ).toLocaleString()}{' '}
                                                                {winner
                                                                        .draw_prize
                                                                        ?.prize
                                                                        ?.currency ??
                                                                    ''}
                                                            </div>
                                                        )}
                                                </td>

                                                {/* Draw */}

                                                <td className="px-5 py-4 align-top">
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
                                                        Entry
                                                        #{' '}
                                                        {
                                                            winner.entry_number
                                                        }
                                                    </div>
                                                </td>

                                                {/* Contact */}

                                                <td className="px-5 py-4 align-top">
                                                    {contactCount ===
                                                    0 ? (
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-700">
                                                                No
                                                                attempts
                                                            </div>

                                                            <div className="mt-1 text-xs text-gray-400">
                                                                Contact
                                                                required
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {
                                                                    contactCount
                                                                }{' '}
                                                                attempt
                                                                {contactCount ===
                                                                1
                                                                    ? ''
                                                                    : 's'}
                                                            </div>

                                                            {latestAttempt && (
                                                                <>
                                                                    <div className="mt-1 text-xs font-medium text-gray-600">
                                                                        Last:{' '}
                                                                        {formatEnumLabel(
                                                                            latestAttempt.result
                                                                        )}
                                                                    </div>

                                                                    <div className="mt-0.5 text-[11px] text-gray-400">
                                                                        {formatDateTime(
                                                                            latestAttempt.attempted_at
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Status */}

                                                <td className="px-5 py-4 align-top">
                                                    <StatusBadge
                                                        status={
                                                            winner.status
                                                        }
                                                    />
                                                </td>

                                                {/* Selected */}

                                                <td className="whitespace-nowrap px-5 py-4 align-top text-sm text-gray-500">
                                                    {formatDateTime(
                                                        winner.selected_at
                                                    )}
                                                </td>

                                                {/* Manage */}

                                                <td className="px-5 py-4 text-right align-top">
                                                    <Link
                                                        to={`/admin/winners/${winner.id}`}
                                                        state={{
                                                            from:
                                                            currentListUrl,
                                                        }}
                                                        className="inline-flex rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                                                    >
                                                        Manage
                                                        →
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={
                                pagination.current_page
                            }
                            lastPage={
                                pagination.last_page
                            }
                            perPage={
                                pagination.per_page
                            }
                            total={
                                pagination.total
                            }
                            loading={
                                loading
                            }
                            onPageChange={(
                                nextPage
                            ) => {
                                updateUrl({
                                    nextPage,
                                });

                                window.scrollTo({
                                    top: 0,
                                    behavior:
                                        'smooth',
                                });
                            }}
                        />
                    </>
                )}
            </section>
        </div>
    );
}
