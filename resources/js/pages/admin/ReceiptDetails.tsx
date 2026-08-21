import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams} from 'react-router-dom';
import Alert from '../../components/Alert';
import LoadingState from '../../components/LoadingState';
import ReceiptQuickReviewModal from '../../components/receipts/ReceiptQuickReviewModal';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';
import type { Receipt, ReceiptNoteResponse, ReceiptResponse} from '../../types/receipt';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';
import { suspiciousReasonLabel } from '../../utils/receipt';

export default function ReceiptDetails() {
    const { id } = useParams();
    const location = useLocation();
    const backUrl = (location.state as { from?: string; } | null)?.from ?? '/admin/receipts';
    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [note, setNote] = useState('');
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [imageZoom, setImageZoom] = useState(1);
    const [quickReviewReceiptId, setQuickReviewReceiptId] = useState<number | null>(null);

    const loadReceipt = useCallback(async () => {
        if (!id) {
            setError('Receipt ID is missing.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.get<ReceiptResponse>(`/admin/receipts/${id}`);

            setReceipt(response.data.data);
        } catch (error: unknown) {
            setError(
                getApiErrorMessage(error, 'Unable to load receipt.')
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadReceipt();
    }, [loadReceipt]);

    const resetMessages = () => {
        setActionError(null);
        setActionSuccess(null);
    };

    const approveReceipt = async () => {
        if (!receipt) {
            return;
        }

        setActionLoading(true);
        resetMessages();

        try {
            const response =
                await api.post<ReceiptResponse>(`/admin/receipts/${receipt.id}/approve`);

            setReceipt(response.data.data);

            setShowRejectForm(false);
            setRejectionReason('');

            setActionSuccess('Receipt approved successfully.');
        } catch (error: unknown) {
            setActionError(
                getApiErrorMessage(error, 'Unable to approve receipt.')
            );
        } finally {
            setActionLoading(false);
        }
    };

    const rejectReceipt = async () => {
        if (!receipt || !rejectionReason.trim()) {
            return;
        }

        setActionLoading(true);
        resetMessages();

        try {
            const response =
                await api.post<ReceiptResponse>(`/admin/receipts/${receipt.id}/reject`,
                    {
                        reason: rejectionReason.trim(),
                    }
                );

            setReceipt(response.data.data);

            setShowRejectForm(false);
            setRejectionReason('');

            setActionSuccess('Receipt rejected successfully.');
        } catch (error: unknown) {
            setActionError(
                getApiErrorMessage(error, 'Unable to reject receipt.')
            );
        } finally {
            setActionLoading(false);
        }
    };

    const addNote = async () => {
        if (!receipt || !note.trim()) {
            return;
        }

        setActionLoading(true);
        resetMessages();

        try {
            const response =
                await api.post<ReceiptNoteResponse>(`/admin/receipts/${receipt.id}/notes`,
                    {
                        note: note.trim(),
                    }
                );

            const createdNote = response.data.data;

            setReceipt((current) => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    notes: [
                        createdNote,
                        ...(current.notes ?? []),
                    ],
                };
            });

            setNote('');
            setShowNoteForm(false);

            setActionSuccess(response.data.message ?? 'Note added successfully.');
        } catch (error: unknown) {
            setActionError(
                getApiErrorMessage(error, 'Unable to add note.')
            );
        } finally {
            setActionLoading(false);
        }
    };

    const openImageViewer = () => {
        setImageZoom(1);
        setImageViewerOpen(true);
    };

    if (loading) {
        return (
            <LoadingState message="Loading receipt..." />
        );
    }

    if (error || !receipt) {
        return (
            <div className="space-y-4">
                <Link
                    to={backUrl}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to Receipts
                </Link>

                <Alert variant="error">
                    {error ?? 'Receipt not found.'}
                </Alert>
            </div>
        );
    }

    const participant = receipt.participant;
    const notes = receipt.notes ?? [];
    const relatedReceipts = (participant?.receipts ?? []).filter((item) => item.id !== receipt.id);
    const canReview = receipt.status === 'submitted';
    const currentReceiptUrl = `/admin/receipts/${receipt.id}`;

    return (
        <>
            <div className="space-y-5">

                <header>
                    <Link
                        to={backUrl}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Receipts
                    </Link>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">Receipt #{receipt.id}</h1>
                        <StatusBadge status={receipt.status}/>
                    </div>

                    <div className="mt-1 text-sm text-gray-500">
                        {receipt.receipt_number}
                        {' · Submitted '}
                        {formatDateTime(receipt.submitted_at ?? receipt.created_at)}
                    </div>
                </header>

                {actionSuccess && (
                    <Alert
                        variant="success"
                        onDismiss={() => setActionSuccess(null)}
                    >
                        {actionSuccess}
                    </Alert>
                )}

                {actionError && (
                    <Alert
                        variant="error"
                        onDismiss={() => setActionError(null)}
                    >
                        {actionError}
                    </Alert>
                )}

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(380px,0.8fr)]">

                    <div className="xl:self-start">
                        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:sticky xl:top-4">
                            <SectionHeader
                                title="Receipt Image"
                                action={
                                    <button
                                        type="button"
                                        onClick={openImageViewer}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                    >
                                        Enlarge
                                    </button>
                                }
                            />

                            <button
                                type="button"
                                onClick={openImageViewer}
                                className="flex min-h-[520px] w-full cursor-zoom-in items-center justify-center bg-gray-50 p-4"
                            >
                                <img
                                    src={`/api/admin/receipts/${receipt.id}/image`}
                                    alt={`Receipt ${receipt.receipt_number}`}
                                    className="max-h-[760px] max-w-full rounded-lg object-contain shadow-sm"
                                />
                            </button>
                        </section>
                    </div>

                    <div className="space-y-4">
                        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Receipt Number
                            </div>

                            <div className="mt-1 break-all text-lg font-semibold text-gray-900">
                                {receipt.receipt_number}
                            </div>

                            <div className="mt-1 text-xs text-gray-500">
                                Receipt ID #{receipt.id}
                            </div>
                        </section>

                        {receipt.is_suspicious && (
                            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-center gap-2 font-semibold text-amber-900">
                                    <span>⚠</span>
                                    <span>Review Flags</span>
                                </div>

                                {receipt.suspicious_reasons?.length ? (
                                    <ul className="mt-3 space-y-1.5">
                                        {receipt.suspicious_reasons.map(
                                            (reason) => (
                                                <li key={reason} className="flex gap-2 text-sm text-amber-900">
                                                    <span>•</span>
                                                    <span>{suspiciousReasonLabel(reason)}</span>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                ) : (
                                    <p className="mt-2 text-sm text-amber-800">
                                        Receipt is marked suspicious, but no reason was recorded.
                                    </p>
                                )}
                            </section>
                        )}

                        {participant && (
                            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                <SectionHeader
                                    title="Participant"
                                    action={
                                        <Link
                                            to={`/admin/participants/${participant.id}`}
                                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            View Participant →
                                        </Link>
                                    }
                                />

                                <div className="grid gap-3 p-4 sm:grid-cols-2">
                                    <InfoItem label="Name" value={`${participant.first_name} ${participant.last_name}`}/>
                                    <InfoItem label="Phone" value={participant.phone}/>
                                    <InfoItem label="Email" value={participant.email}/>
                                    <InfoItem label="Total Receipts" value={participant.receipts_count ?? relatedReceipts.length + 1}/>
                                </div>

                                {relatedReceipts.length > 0 && (
                                        <div className="border-t border-gray-100">
                                            <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Other Receipts
                                            </div>

                                            <div className="divide-y divide-gray-100">
                                                {relatedReceipts.map((relatedReceipt) => {
                                                        const reasons = relatedReceipt.suspicious_reasons ?? [];
                                                        return (
                                                            <div key={relatedReceipt.id} className="space-y-2 px-4 py-3">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div>
                                                                        <div className="font-medium text-gray-900">
                                                                            {relatedReceipt.receipt_number}
                                                                        </div>
                                                                        <div className="mt-0.5 text-xs text-gray-400">
                                                                            ID #{relatedReceipt.id}
                                                                            {' · '}
                                                                            {formatDateTime(relatedReceipt.submitted_at ?? relatedReceipt.created_at)}
                                                                        </div>
                                                                    </div>
                                                                    <StatusBadge status={relatedReceipt.status}/>
                                                                </div>

                                                                {relatedReceipt.is_suspicious && (
                                                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                                        <div className="text-xs font-semibold text-amber-800">⚠ Suspicious</div>

                                                                        {reasons.length > 0 ? (
                                                                            <ul className="mt-1.5 space-y-1">
                                                                                {reasons.map((reason) => (
                                                                                        <li key={reason} className="text-xs text-amber-900">•{' '}{suspiciousReasonLabel(reason)}</li>
                                                                                ))}
                                                                            </ul>
                                                                        ) : (
                                                                            <div className="mt-1 text-xs text-amber-800">
                                                                                No reason recorded.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {relatedReceipt.rejection_reason && (
                                                                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                                                        <div className="text-xs font-semibold uppercase tracking-wide text-red-600">
                                                                            Rejection Reason
                                                                        </div>

                                                                        <div className="mt-1 whitespace-pre-wrap text-sm text-red-800">
                                                                            {relatedReceipt.rejection_reason}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="flex justify-end">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setQuickReviewReceiptId(relatedReceipt.id)}
                                                                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                                                    >
                                                                        Quick Review →
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </section>
                        )}

                        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <SectionHeader
                                title={`Notes (${notes.length})`}
                                action={
                                    !showNoteForm ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowNoteForm(true);
                                                setShowRejectForm(false);
                                            }}
                                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            + Add Note
                                        </button>
                                    ) : undefined
                                }
                            />

                            {showNoteForm && (
                                <div className="border-b border-gray-100 bg-gray-50 p-4">
                                    <textarea
                                        value={note}
                                        onChange={(event) => setNote(event.target.value)}
                                        rows={2}
                                        autoFocus
                                        placeholder="Add an internal note..."
                                        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                                    />

                                    <div className="mt-2 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() => {
                                                setShowNoteForm(false);
                                                setNote('');
                                            }}
                                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            disabled={actionLoading || !note.trim()}
                                            onClick={addNote}
                                            className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            {actionLoading ? 'Saving...' : 'Add Note'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {notes.length === 0 ? (
                                <div className="px-4 py-5 text-sm text-gray-400">
                                    No notes have been added.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notes.map((item) => (
                                        <div key={item.id} className="px-4 py-3">
                                            <div className="whitespace-pre-wrap text-sm text-gray-700">
                                                {item.note}
                                            </div>
                                            <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-gray-400">
                                                <span>{item.user?.name ?? 'Organizer'}</span>
                                                <span>{formatDateTime(item.created_at)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {receipt.rejection_reason && (
                            <section className="rounded-xl border border-red-200 bg-red-50 p-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-red-600">
                                    Rejection Reason
                                </div>

                                <div className="mt-1 whitespace-pre-wrap text-sm text-red-800">
                                    {receipt.rejection_reason}
                                </div>
                            </section>
                        )}

                        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <SectionHeader title="Decision" />

                            <div className="p-4">
                                {canReview ? (
                                    <>
                                        {!showRejectForm && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    disabled={actionLoading}
                                                    onClick={approveReceipt}
                                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                                >
                                                    {actionLoading ? 'Processing...' : 'Approve'}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={actionLoading}
                                                    onClick={() => {
                                                        setShowRejectForm(true);
                                                        setShowNoteForm(false);
                                                    }}
                                                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}

                                        {showRejectForm && (
                                            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                                <label
                                                    htmlFor="receipt-rejection-reason"
                                                    className="text-sm font-medium text-red-800"
                                                >
                                                    Rejection reason
                                                </label>

                                                <textarea
                                                    id="receipt-rejection-reason"
                                                    value={rejectionReason}
                                                    onChange={(event) => setRejectionReason(event.target.value)}
                                                    rows={3}
                                                    autoFocus
                                                    placeholder="Explain why this receipt should be rejected..."
                                                    className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm"
                                                />

                                                <div className="mt-3 flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={actionLoading}
                                                        onClick={() => {
                                                            setShowRejectForm(false);
                                                            setRejectionReason('');
                                                        }}
                                                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                                                    >
                                                        Cancel
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={actionLoading || !rejectionReason.trim()}
                                                        onClick={rejectReceipt}
                                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={receipt.status}/>
                                            <span className="text-sm text-gray-600">Review completed</span>
                                        </div>
                                        {receipt.verified_at && (<span className="text-xs text-gray-500">{formatDateTime(receipt.verified_at)}</span>)}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <SectionHeader title="Technical & Audit Details"/>
                    <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <InfoItem label="Receipt ID" value={`#${receipt.id}`}/>
                        <InfoItem label="Participant ID" value={`#${receipt.participant_id}`}/>
                        <InfoItem label="Status" value={<StatusBadge status={receipt.status}/>}/>
                        <InfoItem label="Submitted" value={formatDateTime(receipt.submitted_at ?? receipt.created_at)}/>
                        <InfoItem label="Verified" value={receipt.verified_at ? formatDateTime(receipt.verified_at) : '—'}/>
                        <InfoItem label="Verified By" value={receipt.verified_by_user?.name ?? (receipt.verified_by ? `User #${receipt.verified_by}` : '—')}/>
                        <InfoItem label="Created" value={formatDateTime(receipt.created_at)}/>
                        <InfoItem label="Updated" value={formatDateTime(receipt.updated_at)}/>
                        <InfoItem label="Suspicious" value={receipt.is_suspicious ? 'Yes' : 'No'}/>
                        {receipt.image_hash && (<InfoItem label="Image Hash" value={receipt.image_hash} className="sm:col-span-2 lg:col-span-3 xl:col-span-4" mono/>)}
                    </div>
                </section>
            </div>

            {imageViewerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/90 p-4" onClick={() => setImageViewerOpen(false)}>
                    <div className="relative flex h-full w-full items-center justify-center" onClick={(event) => event.stopPropagation()}>
                        <div className="flex h-full w-full items-center justify-center overflow-auto">
                            <img
                                src={`/api/admin/receipts/${receipt.id}/image`}
                                alt={`Receipt ${receipt.receipt_number}`}
                                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                                style={{transform: `scale(${imageZoom})`, transition: 'transform 0.15s ease'}}
                            />
                        </div>

                        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl bg-white/95 p-2 shadow-xl">
                            <button
                                type="button"
                                onClick={() => setImageZoom((zoom) => Math.max(0.5, zoom - 0.25))}
                                className="rounded-lg px-3 py-2 text-lg font-medium text-gray-700 hover:bg-gray-100"
                            >
                                −
                            </button>
                            <button
                                type="button"
                                onClick={() => setImageZoom(1)}
                                className="min-w-16 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                                {Math.round(
                                    imageZoom * 100
                                )}
                                %
                            </button>

                            <button
                                type="button"
                                onClick={() => setImageZoom((zoom) => Math.min(4, zoom + 0.25))}
                                className="rounded-lg px-3 py-2 text-lg font-medium text-gray-700 hover:bg-gray-100"
                            >
                                +
                            </button>

                            <div className="mx-1 h-6 w-px bg-gray-200" />

                            <button
                                type="button"
                                onClick={() => setImageViewerOpen(false)}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {quickReviewReceiptId !== null && (
                <ReceiptQuickReviewModal
                    receiptId={quickReviewReceiptId}
                    backUrl={currentReceiptUrl}
                    onClose={() => setQuickReviewReceiptId(null)}
                    onChanged={() => {
                        setQuickReviewReceiptId(null);
                        loadReceipt();
                    }}
                />
            )}
        </>
    );
}

function SectionHeader({title, action,}: { title: string; action?: React.ReactNode; }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3">
            <h2 className="font-semibold text-gray-900">{title}</h2>
            {action}
        </div>
    );
}

function InfoItem({label, value, className = '', mono = false,}: { label: string; value: React.ReactNode; className?: string; mono?: boolean; }) {
    return (
        <div className={className}>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</div>
            <div className={['mt-1 break-all text-sm text-gray-700', mono ? 'font-mono text-xs' : '',].join(' ')}>{value}</div>
        </div>
    );
}
