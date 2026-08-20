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
    | 'rejected';

type ReviewFilter =
    | 'all'
    | 'suspicious'
    | 'normal';

const emptyCounts: ReceiptListCounts = {
    all: 0,

    submitted: 0,

    submitted_suspicious: 0,
    submitted_normal: 0,

    approved: 0,
    rejected: 0,
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

    const initialReviewFilter =
        (
            searchParams.get(
                'review'
            ) as ReviewFilter | null
        ) ?? 'all';

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
        reviewFilter,
        setReviewFilter,
    ] = useState<ReviewFilter>(
        initialReviewFilter
    );

    const [
        quickReviewReceiptId,
        setQuickReviewReceiptId,
    ] = useState<
        number | null
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
                    };

                    if (
                        tab ===
                        'submitted'
                    ) {
                        params.status =
                            'submitted';

                        if (
                            reviewFilter ===
                            'suspicious'
                        ) {
                            params.suspicious =
                                1;
                        }

                        if (
                            reviewFilter ===
                            'normal'
                        ) {
                            params.suspicious =
                                0;
                        }
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
                reviewFilter,
            ]
        );

    /*
     * Keep only navigation state
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
            tab ===
            'submitted' &&
            reviewFilter !==
            'all'
        ) {
            params.set(
                'review',
                reviewFilter
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
        reviewFilter,
        setSearchParams,
    ]);

    useEffect(() => {
        loadReceipts();
    }, [loadReceipts]);

    const changeTab = (
        nextTab: ReceiptTab
    ) => {
        setTab(
            nextTab
        );

        setPage(1);

        if (
            nextTab !==
            'submitted'
        ) {
            setReviewFilter(
                'all'
            );
        }
    };

    const changeReviewFilter = (
        nextFilter: ReviewFilter
    ) => {
        setReviewFilter(
            nextFilter
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
    ];

    const currentListUrl =
        `${location.pathname}${location.search}`;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Receipts"
                description="Review participation receipts and prepare approved entries for the next draw."
            />

            {/* Main status navigation */}

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

            {/* Review queue */}

            {tab ===
                'submitted' && (
                    <section className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-sm font-semibold text-gray-900">
                                Review Queue
                            </div>

                            <div className="mt-0.5 text-xs text-gray-500">
                                Separate normal
                                submissions from
                                receipts requiring
                                deeper review.
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    changeReviewFilter(
                                        'all'
                                    )
                                }
                                className={
                                    reviewFilter ===
                                    'all'
                                        ? 'rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white'
                                        : 'rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200'
                                }
                            >
                                All{' '}
                                {
                                    counts.submitted
                                }
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    changeReviewFilter(
                                        'suspicious'
                                    )
                                }
                                className={
                                    reviewFilter ===
                                    'suspicious'
                                        ? 'rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white'
                                        : 'rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100'
                                }
                            >
                                Suspicious{' '}
                                {
                                    counts.submitted_suspicious
                                }
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    changeReviewFilter(
                                        'normal'
                                    )
                                }
                                className={
                                    reviewFilter ===
                                    'normal'
                                        ? 'rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-white'
                                        : 'rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200'
                                }
                            >
                                Normal{' '}
                                {
                                    counts.submitted_normal
                                }
                            </button>
                        </div>
                    </section>
                )}

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

            {/* Receipt table */}

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
                            tab ===
                            'submitted'
                                ? 'There are no receipts waiting for review in this queue.'
                                : 'There are no receipts in this section.'
                        }
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1180px] text-left text-sm">
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
                                        Latest Note
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Submitted
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
                                                <td className="px-5 py-4 align-top">
                                                    <div className="font-semibold text-gray-900">
                                                        {
                                                            receipt.receipt_number
                                                        }
                                                    </div>

                                                    <div className="mt-1 text-xs text-gray-400">
                                                        Receipt ID
                                                        #{' '}
                                                        {
                                                            receipt.id
                                                        }
                                                    </div>
                                                </td>

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

                                                <td className="px-5 py-4 align-top">
                                                    <StatusBadge
                                                        status={
                                                            receipt.status
                                                        }
                                                    />
                                                </td>

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

            {quickReviewReceiptId !==
                null && (
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
                            loadReceipts();
                        }}
                    />
                )}
        </div>
    );
}
