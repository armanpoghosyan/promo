import { useCallback, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import Alert from '../../components/Alert';
import WorkQueueTabs from '../../components/admin/WorkQueueTabs';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import ReceiptQuickReviewModal from '../../components/receipts/ReceiptQuickReviewModal';
import StatusBadge from '../../components/StatusBadge';
import Tooltip from '../../components/Tooltip';
import api from '../../services/api';
import type { Receipt, ReceiptListCounts, ReceiptListResponse } from '../../types/receipt';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';
import { formatEnumLabel } from '../../utils/format';
import { positiveIntegerParam } from '../../utils/query';
import { suspiciousReasonLabel } from '../../utils/receipt';

type ReceiptTab = | 'all' | 'submitted' | 'approved' | 'rejected';
type ReviewFilter = | 'all' | 'suspicious' | 'normal';

const emptyCounts: ReceiptListCounts = {
    all: 0,
    submitted: 0,
    submitted_suspicious: 0,
    submitted_normal: 0,
    approved: 0,
    rejected: 0,
};

function truncate(value: string, limit: number): string {
    if (value.length <= limit) {
        return value;
    }
    return `${value.slice(0, limit)}...`;
}

export default function Receipts() {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialPage = positiveIntegerParam(searchParams.get('page'));
    const tabParam = searchParams.get('tab');
    const reviewParam = searchParams.get('review');
    const initialTab: ReceiptTab = tabParam === 'all' || tabParam === 'approved' || tabParam === 'rejected' ? tabParam : 'submitted';
    const initialReviewFilter: ReviewFilter = reviewParam === 'suspicious' || reviewParam === 'normal' ? reviewParam : 'all';
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [counts, setCounts] = useState<ReceiptListCounts>(emptyCounts);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(initialPage);
    const [tab, setTab] = useState<ReceiptTab>(initialTab);
    const [reviewFilter, setReviewFilter] = useState<ReviewFilter>(initialReviewFilter);
    const [quickReviewReceiptId, setQuickReviewReceiptId] = useState<number | null>(null);
    const [pagination, setPagination] = useState({current_page: 1, last_page: 1, per_page: 20, total: 0,});

    const loadReceipts = useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const params: Record<string, string | number | boolean> = {page};

                if (tab !== 'all') {params.status = tab}
                if (tab === 'submitted' && reviewFilter === 'suspicious') {params.suspicious = 1}
                if (tab === 'submitted' && reviewFilter === 'normal') {params.suspicious = 0}

                const response = await api.get<ReceiptListResponse>('/admin/receipts', {params});

                setReceipts(response.data.data);
                setCounts(response.data.meta.counts);

                setPagination({
                    current_page: response.data.current_page,
                    last_page: response.data.last_page,
                    per_page: response.data.per_page,
                    total: response.data.total,
                });
            } catch (error: unknown) {
                setError(getApiErrorMessage(error, 'Unable to load receipts.'));
            } finally {
                setLoading(false);
            }
        }, [page, tab, reviewFilter,]);

    useEffect(() => {
        const params = new URLSearchParams();

        if (page > 1) {
            params.set('page', String(page));
        }

        if (tab !== 'all') {
            params.set('tab', tab);
        }

        if (tab === 'submitted' && reviewFilter !== 'all') {
            params.set('review', reviewFilter);
        }

        setSearchParams(params, {replace: true});
    }, [page, tab, reviewFilter, setSearchParams]);

    useEffect(() => {
        loadReceipts();
    }, [loadReceipts]);

    const changeTab = (nextTab: ReceiptTab) => {
        setTab(nextTab);
        setPage(1);

        if (nextTab !== 'submitted') {
            setReviewFilter('all');
        }
    };

    const changeReviewFilter = (nextFilter: ReviewFilter) => {
        setReviewFilter(nextFilter);
        setPage(1);
    };

    const tabs: Array<{ value: ReceiptTab; label: string; count: number; }> = [
        {
            value: 'submitted',
            label: 'Needs Review',
            count: counts.submitted,
        },
        {
            value: 'approved',
            label: 'Approved',
            count: counts.approved,
        },
        {
            value: 'rejected',
            label: 'Rejected',
            count: counts.rejected,
        },
        {
            value: 'all',
            label: 'All',
            count: counts.all,
        },
    ];

    const currentListUrl = `${location.pathname}${location.search}`;

    return (
        <div className="space-y-5">
            <PageHeader
                title="Receipts"
                description="Start with incoming receipts that need a decision, then review completed work."
            />

            <WorkQueueTabs
                active={tab}
                ariaLabel="Receipt work queues"
                tabs={tabs.map((item) => ({
                    ...item,
                    attention: item.value === 'submitted',
                }))}
                onChange={(value) =>
                    changeTab(value as ReceiptTab)
                }
            />

            {error && (
                <Alert variant="error" onDismiss={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Table */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {tab === 'submitted' && (
                    <div className="flex flex-col gap-2 border-b border-gray-200 bg-gray-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Show receipts
                        </span>

                        <nav
                            aria-label="Filter needs review receipts"
                            className="flex flex-wrap gap-1.5"
                        >
                            <ReviewFilterButton
                                active={reviewFilter === 'all'}
                                count={counts.submitted}
                                label="All"
                                onClick={() => changeReviewFilter('all')}
                            />
                            <ReviewFilterButton
                                active={reviewFilter === 'suspicious'}
                                count={counts.submitted_suspicious}
                                label="Suspicious"
                                warning
                                onClick={() => changeReviewFilter('suspicious')}
                            />
                            <ReviewFilterButton
                                active={reviewFilter === 'normal'}
                                count={counts.submitted_normal}
                                label="Not flagged"
                                onClick={() => changeReviewFilter('normal')}
                            />
                        </nav>
                    </div>
                )}

                {loading ? (
                    <LoadingState message="Loading receipts..." />
                ) : receipts.length ===
                0 ? (
                    <EmptyState
                        title="No receipts found."
                        description={
                            tab === 'submitted'
                                ? 'There are no receipts waiting for review in this queue.'
                                : 'There are no receipts in this section.'
                        }
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1120px] text-left text-sm">
                                <thead className="bg-gray-50">
                                <tr>
                                    <TableHeader>Receipt</TableHeader>
                                    <TableHeader>Participant</TableHeader>
                                    <TableHeader>Status</TableHeader>
                                    <TableHeader>Suspicious</TableHeader>
                                    <TableHeader>Latest Note</TableHeader>
                                    <TableHeader>Submitted</TableHeader>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {receipts.map(
                                    (receipt) => {
                                        const participant = receipt.participant;
                                        const participantOtherReceipts = (participant?.receipts ?? []).filter((item) => item.id !== receipt.id);
                                        const reasons = receipt.suspicious_reasons ?? [];
                                        const extraReasons = Math.max(reasons.length - 1, 0);
                                        const latestNote = receipt.latest_note;
                                        const olderNoteItems = (receipt.notes ?? []).filter((item) => item.id !== latestNote?.id);
                                        return (
                                            <tr
                                                key={receipt.id}
                                                onClick={() => setQuickReviewReceiptId(receipt.id)}
                                                className={[
                                                    'cursor-pointer transition hover:bg-gray-50',
                                                    receipt.is_suspicious ? 'bg-amber-50/20' : '',
                                                ].join(' ')}
                                            >
                                                <td className="px-4 py-3 align-top">
                                                    <div className="font-semibold text-gray-900">
                                                        {receipt.receipt_number}
                                                    </div>

                                                    <div className="mt-0.5 text-xs text-gray-400">
                                                        ID #{' '}{receipt.id}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 align-top">
                                                    {participant ? (
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-gray-900">{participant.first_name}{' '}{participant.last_name}</span>

                                                                {participantOtherReceipts.length > 0 && (
                                                                        <Tooltip
                                                                            content={
                                                                                <div>
                                                                                    <div className="mb-2 font-semibold">Other receipts</div>
                                                                                    <div className="space-y-1.5">
                                                                                        {participantOtherReceipts.map((item) => (
                                                                                                <div key={item.id} className="flex items-center justify-between gap-4">
                                                                                                    <span className="max-w-[230px] truncate text-gray-200">{item.receipt_number}</span>
                                                                                                    <span className="shrink-0 font-medium text-white">{formatEnumLabel(item.status)}</span>
                                                                                                </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            }
                                                                            maxWidth={380}
                                                                        >
                                                                            <span
                                                                                className="cursor-help rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                                                                                onClick={(event) => event.stopPropagation()}
                                                                            >
                                                                                +{participantOtherReceipts.length}{' '}other receipt{participantOtherReceipts.length === 1 ? '' : 's'}
                                                                            </span>
                                                                        </Tooltip>
                                                                    )}
                                                            </div>
                                                            <div className="mt-0.5 text-xs text-gray-500">{participant.phone}</div>
                                                            <div className="mt-0.5 max-w-[220px] truncate text-xs text-gray-400">{participant.email}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 align-top">
                                                    <Tooltip
                                                        content={receipt.status === 'rejected' && receipt.rejection_reason ? (
                                                            <div>
                                                                <div className="mb-1 font-semibold">Rejection reason</div>
                                                                <div className="text-gray-200">{receipt.rejection_reason}</div>
                                                            </div>
                                                        ) : null}
                                                        maxWidth={360}
                                                    >
                                                        <span
                                                            className={receipt.status === 'rejected' && receipt.rejection_reason ? 'cursor-help' : undefined}
                                                            onClick={(event) => event.stopPropagation()}
                                                        >
                                                            <StatusBadge status={receipt.status}/>
                                                        </span>
                                                    </Tooltip>
                                                </td>

                                                <td className="px-4 py-3 align-top">
                                                    {receipt.is_suspicious && reasons.length > 0 ? (
                                                        <div>
                                                            <div className="max-w-[210px] text-xs font-medium text-amber-800">
                                                                {suspiciousReasonLabel(reasons[0])}
                                                            </div>

                                                            {extraReasons > 0 && (
                                                                <div className="mt-1">
                                                                    <Tooltip
                                                                        content={
                                                                            <div>
                                                                                <div className="mb-1 font-semibold">Additional suspicious reasons</div>

                                                                                <div className="space-y-1 text-gray-200">
                                                                                    {reasons.slice(1).map((reason) => (
                                                                                        <div key={reason}>
                                                                                            •{' '}{suspiciousReasonLabel(reason)}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        }
                                                                        maxWidth={360}
                                                                    >
                                                                        <span
                                                                            className="cursor-help rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800"
                                                                            onClick={(event) => event.stopPropagation()}
                                                                        >
                                                                            +{extraReasons}{' '}more
                                                                        </span>
                                                                    </Tooltip>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 align-top">
                                                    {latestNote ? (<div className="max-w-[260px]">
                                                            <span className="text-xs text-gray-700">{truncate(latestNote.note, 38)}</span>

                                                            {olderNoteItems.length > 0 && (
                                                                <span className="ml-2">
                                                                    <Tooltip
                                                                        content={
                                                                            <div>
                                                                                <div className="mb-2 font-semibold">Earlier notes</div>

                                                                                <div className="space-y-2">
                                                                                    {olderNoteItems.map((item) => (
                                                                                        <div key={item.id} className="border-b border-white/10 pb-2 last:border-0 last:pb-0">
                                                                                            <div className="text-gray-200">{item.note}</div>
                                                                                            <div className="mt-0.5 text-[10px] text-gray-400">{formatDateTime(item.created_at)}</div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        }
                                                                        maxWidth={380}
                                                                    >
                                                                        <span
                                                                            className="cursor-help rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                                                                            onClick={(event) => event.stopPropagation()}
                                                                        >
                                                                            +{olderNoteItems.length}
                                                                        </span>
                                                                    </Tooltip>
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>


                                                <td className="whitespace-nowrap px-4 py-3 align-top text-sm text-gray-500">
                                                    {formatDateTime(receipt.submitted_at ?? receipt.created_at)}
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={pagination.current_page}
                            lastPage={pagination.last_page}
                            perPage={pagination.per_page}
                            total={pagination.total}
                            loading={loading}
                            onPageChange={(nextPage) => {
                                setPage(nextPage);
                                window.scrollTo({top: 0, behavior: 'smooth'});
                            }}
                        />
                    </>
                )}
            </section>

            {quickReviewReceiptId !== null && (
                <ReceiptQuickReviewModal
                    receiptId={quickReviewReceiptId}
                    backUrl={currentListUrl}
                    onClose={() => setQuickReviewReceiptId(null)}
                    onChanged={() => {loadReceipts();}}
                />
            )}
        </div>
    );
}

function ReviewFilterButton({active, count, label, warning = false, onClick,}: { active: boolean; count: number; label: string; warning?: boolean; onClick: () => void; }) {
    const inactiveClass = warning ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    const activeClass = warning ? 'bg-amber-600 text-white' : 'bg-gray-900 text-white';

    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${active ? activeClass : inactiveClass}`}
        >
            <span>{label}</span>
            <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums ${active ? 'bg-white/20 text-white' : 'bg-white/70 text-current'}`}>
                {count}
            </span>
        </button>
    );
}

function TableHeader({children,}: { children: React.ReactNode; }) {
    return (
        <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {children}
        </th>
    );
}
