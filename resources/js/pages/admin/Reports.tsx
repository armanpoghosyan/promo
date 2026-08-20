import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    useLocation,
    useSearchParams,
} from 'react-router-dom';

import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import ReceiptQuickReviewModal from '../../components/receipts/ReceiptQuickReviewModal';
import StatusBadge from '../../components/StatusBadge';

import api from '../../services/api';

import type {
    Receipt,
    ReceiptListCounts,
    ReceiptListResponse,
    SuspiciousReason,
} from '../../types/receipt';

import {
    getApiErrorMessage,
} from '../../utils/apiError';

import {
    formatDateTime,
} from '../../utils/date';

import {
    positiveIntegerParam,
} from '../../utils/query';

type ReceiptTab =
    | 'all'
    | 'submitted'
    | 'approved'
    | 'rejected'
    | 'suspicious';

type SortDirection =
    | 'asc'
    | 'desc';

const emptyCounts: ReceiptListCounts = {
    all: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    suspicious: 0,
};

const suspiciousReasonLabels: Record<
    string,
    string
> = {
    duplicate_receipt_number:
        'Duplicate receipt number',

    duplicate_receipt_image:
        'Duplicate receipt image',

    phone_used_by_another_participant:
        'Phone used by another participant',

    email_used_by_another_participant:
        'Email used by another participant',

    receipt_number_non_numeric:
        'Receipt number contains unexpected characters',
};

const suspiciousReasonOptions = [
    {
        value: '',
        label: 'All suspicious reasons',
    },

    {
        value:
            'duplicate_receipt_number',
        label:
            'Duplicate receipt number',
    },

    {
        value:
            'duplicate_receipt_image',
        label:
            'Duplicate receipt image',
    },

    {
        value:
            'phone_used_by_another_participant',
        label:
            'Phone used by another participant',
    },

    {
        value:
            'email_used_by_another_participant',
        label:
            'Email used by another participant',
    },

    {
        value:
            'receipt_number_non_numeric',
        label:
            'Unexpected receipt number format',
    },
];

function suspiciousReasonLabel(
    reason: SuspiciousReason
): string {
    return (
        suspiciousReasonLabels[
            reason
            ] ??
        reason
            .replaceAll(
                '_',
                ' '
            )
            .replace(
                /\b\w/g,
                (character) =>
                    character.toUpperCase()
            )
    );
}

function truncate(
    value: string,
    limit: number
): string {
    if (
        value.length <=
        limit
    ) {
        return value;
    }

    return `${value.slice(
        0,
        limit
    )}...`;
}

export default function Receipts() {
    const location =
        useLocation();

    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams();

    const initialPage =
        positiveIntegerParam(
            searchParams.get(
                'page'
            )
        );

    const initialTab =
        (
            searchParams.get(
                'tab'
            ) as ReceiptTab | null
        ) ?? 'all';

    const initialSearch =
        searchParams.get(
            'search'
        ) ?? '';

    const initialDateFrom =
        searchParams.get(
            'date_from'
        ) ?? '';

    const initialDateTo =
        searchParams.get(
            'date_to'
        ) ?? '';

    const initialReason =
        searchParams.get(
            'suspicious_reason'
        ) ?? '';

    const initialDirection =
        (
            searchParams.get(
                'direction'
            ) as SortDirection | null
        ) ?? 'desc';

    const [
        receipts,
        setReceipts,
    ] = useState<Receipt[]>([]);

    const [
        counts,
        setCounts,
    ] =
        useState<ReceiptListCounts>(
            emptyCounts
        );

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
        page,
        setPage,
    ] = useState(
        initialPage
    );

    const [
        tab,
        setTab,
    ] = useState<ReceiptTab>(
        initialTab
    );

    const [
        search,
        setSearch,
    ] = useState(
        initialSearch
    );

    const [
        searchInput,
        setSearchInput,
    ] = useState(
        initialSearch
    );

    const [
        dateFrom,
        setDateFrom,
    ] = useState(
        initialDateFrom
    );

    const [
        dateTo,
        setDateTo,
    ] = useState(
        initialDateTo
    );

    const [
        suspiciousReason,
        setSuspiciousReason,
    ] = useState(
        initialReason
    );

    const [
        direction,
        setDirection,
    ] = useState<SortDirection>(
        initialDirection
    );

    const [
        quickReviewReceiptId,
        setQuickReviewReceiptId,
    ] = useState<number | null>(
        null
    );

    const [
        pagination,
        setPagination,
    ] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    const loadReceipts =
        useCallback(
            async () => {
                setLoading(true);
                setError(null);

                try {
                    const params: Record<
                        string,
                        | string
                        | number
                        | boolean
                    > = {
                        page,
                        direction,
                    };

                    if (
                        tab ===
                        'submitted'
                    ) {
                        params.status =
                            'submitted';
                    }

                    if (
                        tab ===
                        'approved'
                    ) {
                        params.status =
                            'approved';
                    }

                    if (
                        tab ===
                        'rejected'
                    ) {
                        params.status =
                            'rejected';
                    }

                    if (
                        tab ===
                        'suspicious'
                    ) {
                        params.suspicious =
                            true;
                    }

                    if (
                        search.trim()
                    ) {
                        params.search =
                            search.trim();
                    }

                    if (dateFrom) {
                        params.date_from =
                            dateFrom;
                    }

                    if (dateTo) {
                        params.date_to =
                            dateTo;
                    }

                    if (
                        suspiciousReason
                    ) {
                        params.suspicious_reason =
                            suspiciousReason;
                    }

                    const response =
                        await api.get<ReceiptListResponse>(
                            '/admin/receipts',
                            {
                                params,
                            }
                        );

                    setReceipts(
                        response.data
                            .data
                    );

                    setCounts(
                        response.data
                            .meta
                            .counts
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
                            'Unable to load receipts.'
                        )
                    );
                } finally {
                    setLoading(false);
                }
            },
            [
                page,
                tab,
                search,
                dateFrom,
                dateTo,
                suspiciousReason,
                direction,
            ]
        );

    /*
     * Live global search.
     *
     * Numeric values can search
     * immediately because they may
     * be exact receipt IDs.
     *
     * Other searches start from
     * three characters.
     */
    useEffect(() => {
        const value =
            searchInput.trim();

        if (
            value === ''
        ) {
            if (
                search !== ''
            ) {
                setPage(1);
                setSearch('');
            }

            return;
        }

        const numeric =
            /^\d+$/.test(
                value
            );

        if (
            !numeric &&
            value.length < 3
        ) {
            return;
        }

        const timeout =
            window.setTimeout(
                () => {
                    setPage(1);

                    setSearch(
                        value
                    );
                },
                350
            );

        return () => {
            window.clearTimeout(
                timeout
            );
        };
    }, [
        searchInput,
        search,
    ]);

    /*
     * Keep the list workspace
     * represented in the URL.
     */
    useEffect(() => {
        const params =
            new URLSearchParams();

        if (
            page > 1
        ) {
            params.set(
                'page',
                String(page)
            );
        }

        if (
            tab !==
            'all'
        ) {
            params.set(
                'tab',
                tab
            );
        }

        if (
            search
        ) {
            params.set(
                'search',
                search
            );
        }

        if (
            dateFrom
        ) {
            params.set(
                'date_from',
                dateFrom
            );
        }

        if (
            dateTo
        ) {
            params.set(
                'date_to',
                dateTo
            );
        }

        if (
            suspiciousReason
        ) {
            params.set(
                'suspicious_reason',
                suspiciousReason
            );
        }

        if (
            direction !==
            'desc'
        ) {
            params.set(
                'direction',
                direction
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
        tab,
        search,
        dateFrom,
        dateTo,
        suspiciousReason,
        direction,
        setSearchParams,
    ]);

    useEffect(() => {
        loadReceipts();
    }, [loadReceipts]);

    const hasFilters =
        Boolean(
            search ||
            dateFrom ||
            dateTo ||
            suspiciousReason
        );

    const resetFilters = () => {
        setPage(1);

        setSearch('');
        setSearchInput('');

        setDateFrom('');
        setDateTo('');

        setSuspiciousReason(
            ''
        );
    };

    const changeTab = (
        nextTab: ReceiptTab
    ) => {
        setTab(
            nextTab
        );

        setPage(1);
    };

    const toggleSubmittedSort =
        () => {
            setDirection(
                (current) =>
                    current ===
                    'desc'
                        ? 'asc'
                        : 'desc'
            );

            setPage(1);
        };

    const tabs: Array<{
        value: ReceiptTab;
        label: string;
        count: number;
    }> = [
        {
            value: 'all',
            label: 'All',
            count:
            counts.all,
        },
        {
            value:
                'submitted',
            label:
                'Needs Review',
            count:
            counts.submitted,
        },
        {
            value:
                'approved',
            label:
                'Approved',
            count:
            counts.approved,
        },
        {
            value:
                'rejected',
            label:
                'Rejected',
            count:
            counts.rejected,
        },
        {
            value:
                'suspicious',
            label:
                'Suspicious',
            count:
            counts.suspicious,
        },
    ];

    const currentListUrl =
        `${location.pathname}${location.search}`;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Receipts"
                description="Review participation receipts and prepare approved entries for the next draw."
            />

            {/* Tabs */}

            <div className="overflow-x-auto border-b border-gray-200">
                <nav className="flex min-w-max gap-6">
                    {tabs.map(
                        (
                            item
                        ) => {
                            const active =
                                tab ===
                                item.value;

                            return (
                                <button
                                    key={
                                        item.value
                                    }
                                    type="button"
                                    onClick={() =>
                                        changeTab(
                                            item.value
                                        )
                                    }
                                    className={[
                                        'relative whitespace-nowrap pb-3 text-sm font-medium transition',
                                        active
                                            ? 'text-gray-900'
                                            : 'text-gray-500 hover:text-gray-900',
                                    ].join(
                                        ' '
                                    )}
                                >
                                    {
                                        item.label
                                    }

                                    <span
                                        className={[
                                            'ml-2 rounded-full px-2 py-0.5 text-xs',
                                            active
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-500',
                                        ].join(
                                            ' '
                                        )}
                                    >
                                        {
                                            item.count
                                        }
                                    </span>

                                    {active && (
                                        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gray-900" />
                                    )}
                                </button>
                            );
                        }
                    )}
                </nav>
            </div>

            {/* Search */}

            <div>
                <input
                    type="search"
                    value={
                        searchInput
                    }
                    onChange={(
                        event
                    ) =>
                        setSearchInput(
                            event
                                .target
                                .value
                        )
                    }
                    placeholder="Search receipt ID, receipt number, participant name, phone or email..."
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />

                {searchInput.trim() &&
                    !/^\d+$/.test(
                        searchInput.trim()
                    ) &&
                    searchInput
                        .trim()
                        .length <
                    3 && (
                        <div className="mt-1.5 text-xs text-gray-400">
                            Enter at
                            least 3
                            characters
                            to search.
                        </div>
                    )}
            </div>

            {/* Filters */}

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                    <div>
                        <label
                            htmlFor="date-from"
                            className="mb-1.5 block text-xs font-medium text-gray-500"
                        >
                            Submitted
                            from
                        </label>

                        <input
                            id="date-from"
                            type="date"
                            value={
                                dateFrom
                            }
                            onChange={(
                                event
                            ) => {
                                setDateFrom(
                                    event
                                        .target
                                        .value
                                );

                                setPage(
                                    1
                                );
                            }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 xl:w-44"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="date-to"
                            className="mb-1.5 block text-xs font-medium text-gray-500"
                        >
                            Submitted
                            to
                        </label>

                        <input
                            id="date-to"
                            type="date"
                            value={
                                dateTo
                            }
                            onChange={(
                                event
                            ) => {
                                setDateTo(
                                    event
                                        .target
                                        .value
                                );

                                setPage(
                                    1
                                );
                            }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 xl:w-44"
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <label
                            htmlFor="suspicious-reason"
                            className="mb-1.5 block text-xs font-medium text-gray-500"
                        >
                            Suspicious
                            reason
                        </label>

                        <select
                            id="suspicious-reason"
                            value={
                                suspiciousReason
                            }
                            onChange={(
                                event
                            ) => {
                                setSuspiciousReason(
                                    event
                                        .target
                                        .value
                                );

                                setPage(
                                    1
                                );
                            }}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                        >
                            {suspiciousReasonOptions.map(
                                (
                                    option
                                ) => (
                                    <option
                                        key={
                                            option.value
                                        }
                                        value={
                                            option.value
                                        }
                                    >
                                        {
                                            option.label
                                        }
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={
                                resetFilters
                            }
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                            Reset
                            filters
                        </button>
                    )}
                </div>
            </section>

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

            {/* Table */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {loading ? (
                    <LoadingState
                        message="Loading receipts..."
                    />
                ) : receipts.length ===
                0 ? (
                    <EmptyState
                        title="No receipts found."
                        description={
                            hasFilters
                                ? 'Try changing the search or filters.'
                                : 'There are no receipts in this section.'
                        }
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-[1180px] w-full text-left text-sm">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Receipt
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Participant
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Suspicious
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Latest
                                        Note
                                    </th>

                                    <th className="px-5 py-3">
                                        <button
                                            type="button"
                                            onClick={
                                                toggleSubmittedSort
                                            }
                                            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-900"
                                        >
                                            Submitted

                                            <span>
                                                    {direction ===
                                                    'desc'
                                                        ? '↓'
                                                        : '↑'}
                                                </span>
                                        </button>
                                    </th>
                                </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                {receipts.map(
                                    (
                                        receipt
                                    ) => {
                                        const participant =
                                            receipt.participant;

                                        const otherReceipts =
                                            Math.max(
                                                (participant?.receipts_count ??
                                                    1) -
                                                1,
                                                0
                                            );

                                        const noteCount =
                                            receipt.notes_count ??
                                            0;

                                        const olderNotes =
                                            Math.max(
                                                noteCount -
                                                1,
                                                0
                                            );

                                        const reasons =
                                            receipt.suspicious_reasons ??
                                            [];

                                        const extraReasons =
                                            Math.max(
                                                reasons.length -
                                                1,
                                                0
                                            );

                                        const latestNote =
                                            receipt.latest_note;

                                        return (
                                            <tr
                                                key={
                                                    receipt.id
                                                }
                                                onClick={() =>
                                                    setQuickReviewReceiptId(
                                                        receipt.id
                                                    )
                                                }
                                                className={[
                                                    'cursor-pointer transition hover:bg-gray-50',
                                                    receipt.is_suspicious
                                                        ? 'bg-amber-50/30'
                                                        : '',
                                                ].join(
                                                    ' '
                                                )}
                                            >
                                                {/* Receipt */}

                                                <td className="px-5 py-4 align-top">
                                                    <div className="font-semibold text-gray-900">
                                                        {
                                                            receipt.receipt_number
                                                        }
                                                    </div>

                                                    <div className="mt-1 text-xs text-gray-400">
                                                        Receipt
                                                        ID
                                                        #{' '}
                                                        {
                                                            receipt.id
                                                        }
                                                    </div>
                                                </td>

                                                {/* Participant */}

                                                <td className="px-5 py-4 align-top">
                                                    {participant ? (
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-gray-900">
                                                                        {
                                                                            participant.first_name
                                                                        }{' '}
                                                                        {
                                                                            participant.last_name
                                                                        }
                                                                    </span>

                                                                {otherReceipts >
                                                                    0 && (
                                                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                                                            +
                                                                            {
                                                                                otherReceipts
                                                                            }{' '}
                                                                            other
                                                                            receipt
                                                                            {otherReceipts ===
                                                                            1
                                                                                ? ''
                                                                                : 's'}
                                                                        </span>
                                                                    )}
                                                            </div>

                                                            <div className="mt-1 text-xs text-gray-500">
                                                                {
                                                                    participant.phone
                                                                }
                                                            </div>

                                                            <div className="mt-0.5 max-w-[220px] truncate text-xs text-gray-400">
                                                                {
                                                                    participant.email
                                                                }
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                                —
                                                            </span>
                                                    )}
                                                </td>

                                                {/* Status */}

                                                <td className="px-5 py-4 align-top">
                                                    <StatusBadge
                                                        status={
                                                            receipt.status
                                                        }
                                                    />
                                                </td>

                                                {/* Suspicious */}

                                                <td className="px-5 py-4 align-top">
                                                    {receipt.is_suspicious &&
                                                    reasons.length >
                                                    0 ? (
                                                        <div>
                                                            <div className="max-w-[210px] text-xs font-medium text-amber-800">
                                                                {suspiciousReasonLabel(
                                                                    reasons[0]
                                                                )}
                                                            </div>

                                                            {extraReasons >
                                                                0 && (
                                                                    <div className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                                                        +
                                                                        {
                                                                            extraReasons
                                                                        }{' '}
                                                                        more
                                                                    </div>
                                                                )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                                —
                                                            </span>
                                                    )}
                                                </td>

                                                {/* Latest note */}

                                                <td className="px-5 py-4 align-top">
                                                    {latestNote ? (
                                                        <div className="max-w-[260px]">
                                                                <span className="text-xs text-gray-700">
                                                                    {truncate(
                                                                        latestNote.note,
                                                                        38
                                                                    )}
                                                                </span>

                                                            {olderNotes >
                                                                0 && (
                                                                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                                                        +
                                                                        {
                                                                            olderNotes
                                                                        }
                                                                    </span>
                                                                )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                                —
                                                            </span>
                                                    )}
                                                </td>

                                                {/* Submitted */}

                                                <td className="whitespace-nowrap px-5 py-4 align-top text-sm text-gray-500">
                                                    {formatDateTime(
                                                        receipt.submitted_at ??
                                                        receipt.created_at
                                                    )}
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
                                setPage(
                                    nextPage
                                );

                                window.scrollTo(
                                    {
                                        top: 0,
                                        behavior:
                                            'smooth',
                                    }
                                );
                            }}
                        />
                    </>
                )}
            </section>

            {/* Quick review */}

            {quickReviewReceiptId !== null && (
                <ReceiptQuickReviewModal
                    receiptId={
                        quickReviewReceiptId
                    }
                    backUrl={
                        currentListUrl
                    }
                    onClose={() =>
                        setQuickReviewReceiptId(
                            null
                        )
                    }
                    onChanged={() => {
                        /*
                         * Refreshes:
                         * - row state
                         * - tab counts
                         * - suspicious count
                         * - pagination totals
                         */
                        loadReceipts();
                    }}
                />
            )}
        </div>
    );
}
