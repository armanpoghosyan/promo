import {
    useEffect,
    useState,
} from 'react';

import {
    Link,
    useLocation,
    useParams,
} from 'react-router-dom';

import Alert from '../../components/Alert';
import LoadingState from '../../components/LoadingState';
import ReceiptQuickReviewModal from '../../components/receipts/ReceiptQuickReviewModal';
import StatusBadge from '../../components/StatusBadge';

import api from '../../services/api';

import type {
    Receipt,
    ReceiptNoteResponse,
    ReceiptResponse,
    SuspiciousReason,
} from '../../types/receipt';

import {
    getApiErrorMessage,
} from '../../utils/apiError';

import {
    formatDateTime,
} from '../../utils/date';

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

export default function ReceiptDetails() {
    const {
        id,
    } = useParams();

    const location =
        useLocation();

    const backUrl =
        (
            location.state as {
                from?: string;
            } | null
        )?.from ??
        '/admin/receipts';

    const [
        receipt,
        setReceipt,
    ] = useState<Receipt | null>(
        null
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
        actionLoading,
        setActionLoading,
    ] = useState(false);

    const [
        actionError,
        setActionError,
    ] = useState<
        string | null
    >(null);

    const [
        actionSuccess,
        setActionSuccess,
    ] = useState<
        string | null
    >(null);

    const [
        showRejectForm,
        setShowRejectForm,
    ] = useState(false);

    const [
        rejectionReason,
        setRejectionReason,
    ] = useState('');

    const [
        showNoteForm,
        setShowNoteForm,
    ] = useState(false);

    const [
        note,
        setNote,
    ] = useState('');

    const [
        imageViewerOpen,
        setImageViewerOpen,
    ] = useState(false);

    const [
        imageZoom,
        setImageZoom,
    ] = useState(1);

    const [
        quickReviewReceiptId,
        setQuickReviewReceiptId,
    ] = useState<
        number | null
    >(null);

    const loadReceipt =
        async () => {
            if (!id) {
                setError(
                    'Receipt ID is missing.'
                );

                setLoading(false);

                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response =
                    await api.get<ReceiptResponse>(
                        `/admin/receipts/${id}`
                    );

                setReceipt(
                    response.data.data
                );
            } catch (
                error: unknown
                ) {
                setError(
                    getApiErrorMessage(
                        error,
                        'Unable to load receipt.'
                    )
                );
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        loadReceipt();
    }, [
        id,
    ]);

    const approveReceipt =
        async () => {
            if (!receipt) {
                return;
            }

            setActionLoading(
                true
            );

            setActionError(
                null
            );

            setActionSuccess(
                null
            );

            try {
                const response =
                    await api.post<ReceiptResponse>(
                        `/admin/receipts/${receipt.id}/approve`
                    );

                setReceipt(
                    response.data.data
                );

                setShowRejectForm(
                    false
                );

                setRejectionReason(
                    ''
                );

                setActionSuccess(
                    'Receipt approved successfully.'
                );
            } catch (
                error: unknown
                ) {
                setActionError(
                    getApiErrorMessage(
                        error,
                        'Unable to approve receipt.'
                    )
                );
            } finally {
                setActionLoading(
                    false
                );
            }
        };

    const rejectReceipt =
        async () => {
            if (
                !receipt ||
                !rejectionReason.trim()
            ) {
                return;
            }

            setActionLoading(
                true
            );

            setActionError(
                null
            );

            setActionSuccess(
                null
            );

            try {
                const response =
                    await api.post<ReceiptResponse>(
                        `/admin/receipts/${receipt.id}/reject`,
                        {
                            reason:
                                rejectionReason.trim(),
                        }
                    );

                setReceipt(
                    response.data.data
                );

                setShowRejectForm(
                    false
                );

                setRejectionReason(
                    ''
                );

                setActionSuccess(
                    'Receipt rejected successfully.'
                );
            } catch (
                error: unknown
                ) {
                setActionError(
                    getApiErrorMessage(
                        error,
                        'Unable to reject receipt.'
                    )
                );
            } finally {
                setActionLoading(
                    false
                );
            }
        };

    const addNote =
        async () => {
            if (
                !receipt ||
                !note.trim()
            ) {
                return;
            }

            setActionLoading(
                true
            );

            setActionError(
                null
            );

            setActionSuccess(
                null
            );

            try {
                const response =
                    await api.post<ReceiptNoteResponse>(
                        `/admin/receipts/${receipt.id}/notes`,
                        {
                            note:
                                note.trim(),
                        }
                    );

                const createdNote =
                    response.data.data;

                setReceipt(
                    (
                        currentReceipt
                    ) => {
                        if (
                            !currentReceipt
                        ) {
                            return currentReceipt;
                        }

                        return {
                            ...currentReceipt,

                            notes: [
                                createdNote,
                                ...(currentReceipt.notes ??
                                    []),
                            ],
                        };
                    }
                );

                setNote(
                    ''
                );

                setShowNoteForm(
                    false
                );

                setActionSuccess(
                    response.data.message ??
                    'Note added successfully.'
                );
            } catch (
                error: unknown
                ) {
                setActionError(
                    getApiErrorMessage(
                        error,
                        'Unable to add note.'
                    )
                );
            } finally {
                setActionLoading(
                    false
                );
            }
        };

    if (
        loading
    ) {
        return (
            <LoadingState
                message="Loading receipt..."
            />
        );
    }

    if (
        error ||
        !receipt
    ) {
        return (
            <div className="space-y-4">
                <Link
                    to={
                        backUrl
                    }
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to Receipts
                </Link>

                <Alert variant="error">
                    {error ??
                        'Receipt not found.'}
                </Alert>
            </div>
        );
    }

    const participant =
        receipt.participant;

    const notes =
        receipt.notes ??
        [];

    const relatedReceipts =
        (
            participant
                ?.receipts ??
            []
        ).filter(
            (
                participantReceipt
            ) =>
                participantReceipt.id !==
                receipt.id
        );

    const canReview =
        receipt.status ===
        'submitted';

    const currentReceiptUrl =
        `/admin/receipts/${receipt.id}`;

    return (
        <>
            <div className="space-y-6">
                {/* Header */}

                <header>
                    <Link
                        to={
                            backUrl
                        }
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Receipts
                    </Link>

                    <div className="mt-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Receipt #
                                {
                                    receipt.id
                                }
                            </h1>

                            <StatusBadge
                                status={
                                    receipt.status
                                }
                            />
                        </div>

                        <div className="mt-1 text-sm text-gray-500">
                            {
                                receipt.receipt_number
                            }

                            {' · Submitted '}

                            {formatDateTime(
                                receipt.submitted_at ??
                                receipt.created_at
                            )}
                        </div>
                    </div>
                </header>

                {/* Messages */}

                {actionSuccess && (
                    <Alert
                        variant="success"
                        onDismiss={() =>
                            setActionSuccess(
                                null
                            )
                        }
                    >
                        {
                            actionSuccess
                        }
                    </Alert>
                )}

                {actionError && (
                    <Alert
                        variant="error"
                        onDismiss={() =>
                            setActionError(
                                null
                            )
                        }
                    >
                        {
                            actionError
                        }
                    </Alert>
                )}

                {/* Deep Review Workspace */}

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(400px,0.8fr)]">
                    {/* Receipt Image */}

                    <div className="xl:self-start">
                        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:sticky xl:top-6">
                            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        Receipt Image
                                    </h2>

                                    <div className="mt-1 text-xs text-gray-500">
                                        Inspect the receipt
                                        before making a
                                        decision.
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setImageViewerOpen(
                                            true
                                        );

                                        setImageZoom(
                                            1
                                        );
                                    }}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Enlarge
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setImageViewerOpen(
                                        true
                                    );

                                    setImageZoom(
                                        1
                                    );
                                }}
                                className="flex min-h-[650px] w-full cursor-zoom-in items-center justify-center bg-gray-50 p-6"
                            >
                                <img
                                    src={`/api/admin/receipts/${receipt.id}/image`}
                                    alt={`Receipt ${receipt.receipt_number}`}
                                    className="max-h-[850px] max-w-full rounded-lg object-contain shadow-sm"
                                />
                            </button>
                        </section>
                    </div>

                    {/* Investigation */}

                    <div className="space-y-5">
                        {/* Receipt summary */}

                        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Receipt Number
                            </div>

                            <div className="mt-1 break-all text-xl font-semibold text-gray-900">
                                {
                                    receipt.receipt_number
                                }
                            </div>

                            <div className="mt-3 text-xs text-gray-500">
                                Receipt ID #
                                {
                                    receipt.id
                                }
                            </div>
                        </section>

                        {/* Review Flags */}

                        {receipt.is_suspicious && (
                            <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                                <div className="flex items-center gap-2 font-semibold text-amber-900">
                                    <span>
                                        ⚠
                                    </span>

                                    <span>
                                        Review Flags
                                    </span>
                                </div>

                                <div className="mt-1 text-xs text-amber-700">
                                    Review these signals
                                    before making a
                                    decision.
                                </div>

                                {receipt
                                    .suspicious_reasons
                                    ?.length ? (
                                    <ul className="mt-4 space-y-2">
                                        {receipt.suspicious_reasons.map(
                                            (
                                                reason
                                            ) => (
                                                <li
                                                    key={
                                                        reason
                                                    }
                                                    className="flex gap-2 text-sm text-amber-900"
                                                >
                                                    <span>
                                                        •
                                                    </span>

                                                    <span>
                                                        {suspiciousReasonLabel(
                                                            reason
                                                        )}
                                                    </span>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                ) : (
                                    <div className="mt-3 text-sm text-amber-800">
                                        Receipt is marked
                                        suspicious, but no
                                        reason was recorded.
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Participant */}

                        {participant && (
                            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                <div className="border-b border-gray-200 px-5 py-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 className="font-semibold text-gray-900">
                                            Participant
                                        </h2>

                                        <Link
                                            to={`/admin/participants/${participant.id}`}
                                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            View Participant →
                                        </Link>
                                    </div>
                                </div>

                                <div className="space-y-4 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                {
                                                    participant.first_name
                                                }{' '}
                                                {
                                                    participant.last_name
                                                }
                                            </div>

                                            <div className="mt-1 break-all text-sm text-gray-500">
                                                {
                                                    participant.email
                                                }
                                            </div>
                                        </div>

                                        <div className="shrink-0 text-sm text-gray-600">
                                            {
                                                participant.phone
                                            }
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 text-sm">
                                        <div>
                                            <div className="text-xs uppercase tracking-wide text-gray-400">
                                                Participant ID
                                            </div>

                                            <div className="mt-1 font-medium text-gray-700">
                                                #
                                                {
                                                    participant.id
                                                }
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs uppercase tracking-wide text-gray-400">
                                                Total Receipts
                                            </div>

                                            <div className="mt-1 font-medium text-gray-700">
                                                {
                                                    participant.receipts_count ??
                                                    relatedReceipts.length +
                                                    1
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Other Receipts */}

                                {relatedReceipts.length >
                                    0 && (
                                        <div className="border-t border-gray-200">
                                            <div className="bg-gray-50 px-5 py-3">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    Other Receipts
                                                </div>

                                                <div className="mt-1 text-xs text-gray-400">
                                                    Full participant
                                                    receipt context for
                                                    investigation.
                                                </div>
                                            </div>

                                            <div className="divide-y divide-gray-200">
                                                {relatedReceipts.map(
                                                    (
                                                        relatedReceipt
                                                    ) => {
                                                        const reasons =
                                                            relatedReceipt.suspicious_reasons ??
                                                            [];

                                                        return (
                                                            <div
                                                                key={
                                                                    relatedReceipt.id
                                                                }
                                                                className="space-y-3 px-5 py-4"
                                                            >
                                                                {/* Header */}

                                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                                    <div>
                                                                        <div className="font-semibold text-gray-900">
                                                                            {
                                                                                relatedReceipt.receipt_number
                                                                            }
                                                                        </div>

                                                                        <div className="mt-1 text-xs text-gray-400">
                                                                            Receipt
                                                                            ID #
                                                                            {
                                                                                relatedReceipt.id
                                                                            }

                                                                            {' · Submitted '}

                                                                            {formatDateTime(
                                                                                relatedReceipt.submitted_at ??
                                                                                relatedReceipt.created_at
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <StatusBadge
                                                                        status={
                                                                            relatedReceipt.status
                                                                        }
                                                                    />
                                                                </div>

                                                                {/* Suspicious */}

                                                                {relatedReceipt.is_suspicious ? (
                                                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                                                                        <span>
                                                                            ⚠
                                                                        </span>

                                                                            <span>
                                                                            Suspicious
                                                                        </span>
                                                                        </div>

                                                                        {reasons.length >
                                                                        0 ? (
                                                                            <div className="mt-2">
                                                                                <div className="text-xs font-medium uppercase tracking-wide text-amber-700">
                                                                                    Suspicious
                                                                                    reasons
                                                                                </div>

                                                                                <ul className="mt-2 space-y-1.5">
                                                                                    {reasons.map(
                                                                                        (
                                                                                            reason
                                                                                        ) => (
                                                                                            <li
                                                                                                key={
                                                                                                    reason
                                                                                                }
                                                                                                className="flex gap-2 text-sm text-amber-900"
                                                                                            >
                                                                                            <span>
                                                                                                •
                                                                                            </span>

                                                                                                <span>
                                                                                                {suspiciousReasonLabel(
                                                                                                    reason
                                                                                                )}
                                                                                            </span>
                                                                                            </li>
                                                                                        )
                                                                                    )}
                                                                                </ul>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="mt-2 text-sm text-amber-800">
                                                                                No
                                                                                suspicious
                                                                                reason
                                                                                recorded.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-xs text-gray-500">
                                                                        Suspicious:
                                                                        No
                                                                    </div>
                                                                )}

                                                                {/* Rejection */}

                                                                {relatedReceipt.rejection_reason && (
                                                                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                                                        <div className="text-xs font-semibold uppercase tracking-wide text-red-600">
                                                                            Rejection
                                                                            Reason
                                                                        </div>

                                                                        <div className="mt-2 whitespace-pre-wrap text-sm text-red-800">
                                                                            {
                                                                                relatedReceipt.rejection_reason
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Action */}

                                                                <div className="flex justify-end">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setQuickReviewReceiptId(
                                                                                relatedReceipt.id
                                                                            )
                                                                        }
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

                        {/* Notes */}

                        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-semibold text-gray-900">
                                            Notes
                                        </h2>

                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                                            {
                                                notes.length
                                            }
                                        </span>
                                    </div>

                                    <div className="mt-1 text-xs text-gray-500">
                                        Internal review
                                        history for this
                                        receipt.
                                    </div>
                                </div>

                                {!showNoteForm && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowNoteForm(
                                                true
                                            );

                                            setShowRejectForm(
                                                false
                                            );
                                        }}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                    >
                                        + Add note
                                    </button>
                                )}
                            </div>

                            {showNoteForm && (
                                <div className="border-b border-gray-200 bg-gray-50 p-4">
                                    <textarea
                                        value={
                                            note
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setNote(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        rows={
                                            3
                                        }
                                        autoFocus
                                        placeholder="Add an internal note..."
                                        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                    />

                                    <div className="mt-3 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            disabled={
                                                actionLoading
                                            }
                                            onClick={() => {
                                                setShowNoteForm(
                                                    false
                                                );

                                                setNote(
                                                    ''
                                                );
                                            }}
                                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                actionLoading ||
                                                !note.trim()
                                            }
                                            onClick={
                                                addNote
                                            }
                                            className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {actionLoading
                                                ? 'Saving...'
                                                : 'Add Note'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {notes.length ===
                            0 ? (
                                <div className="p-5 text-sm text-gray-400">
                                    No notes have been
                                    added.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notes.map(
                                        (
                                            item
                                        ) => (
                                            <div
                                                key={
                                                    item.id
                                                }
                                                className="p-5"
                                            >
                                                <div className="whitespace-pre-wrap text-sm text-gray-700">
                                                    {
                                                        item.note
                                                    }
                                                </div>

                                                <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-gray-400">
                                                    <span>
                                                        {item
                                                                .user
                                                                ?.name ??
                                                            'Organizer'}
                                                    </span>

                                                    <span>
                                                        {formatDateTime(
                                                            item.created_at
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Existing rejection */}

                        {receipt.rejection_reason && (
                            <section className="rounded-xl border border-red-200 bg-red-50 p-5">
                                <div className="text-xs font-semibold uppercase tracking-wide text-red-600">
                                    Rejection Reason
                                </div>

                                <div className="mt-2 whitespace-pre-wrap text-sm text-red-800">
                                    {
                                        receipt.rejection_reason
                                    }
                                </div>
                            </section>
                        )}

                        {/* Decision */}

                        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-5 py-4">
                                <h2 className="font-semibold text-gray-900">
                                    Decision
                                </h2>

                                <div className="mt-1 text-xs text-gray-500">
                                    Complete the review
                                    after checking all
                                    available evidence.
                                </div>
                            </div>

                            <div className="p-5">
                                {canReview ? (
                                    <>
                                        {!showRejectForm && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        actionLoading
                                                    }
                                                    onClick={
                                                        approveReceipt
                                                    }
                                                    className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {actionLoading
                                                        ? 'Processing...'
                                                        : 'Approve'}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        actionLoading
                                                    }
                                                    onClick={() => {
                                                        setShowRejectForm(
                                                            true
                                                        );

                                                        setShowNoteForm(
                                                            false
                                                        );
                                                    }}
                                                    className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}

                                        {showRejectForm && (
                                            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                                <label
                                                    htmlFor="receipt-rejection-reason"
                                                    className="text-sm font-medium text-red-800"
                                                >
                                                    Rejection
                                                    reason
                                                </label>

                                                <textarea
                                                    id="receipt-rejection-reason"
                                                    value={
                                                        rejectionReason
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setRejectionReason(
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    rows={
                                                        4
                                                    }
                                                    autoFocus
                                                    placeholder="Explain why this receipt should be rejected..."
                                                    className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                                                />

                                                <div className="mt-3 flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            actionLoading
                                                        }
                                                        onClick={() => {
                                                            setShowRejectForm(
                                                                false
                                                            );

                                                            setRejectionReason(
                                                                ''
                                                            );
                                                        }}
                                                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                                                    >
                                                        Cancel
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            actionLoading ||
                                                            !rejectionReason.trim()
                                                        }
                                                        onClick={
                                                            rejectReceipt
                                                        }
                                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {actionLoading
                                                            ? 'Rejecting...'
                                                            : 'Confirm Reject'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge
                                                status={
                                                    receipt.status
                                                }
                                            />

                                            <span className="text-sm text-gray-600">
                                                Review completed
                                            </span>
                                        </div>

                                        {receipt.verified_at && (
                                            <div className="mt-2 text-xs text-gray-500">
                                                Reviewed{' '}
                                                {formatDateTime(
                                                    receipt.verified_at
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Technical & Audit Details */}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                        <h2 className="font-semibold text-gray-900">
                            Technical & Audit Details
                        </h2>

                        <div className="mt-1 text-xs text-gray-500">
                            Submission,
                            verification and
                            technical receipt
                            information.
                        </div>
                    </div>

                    <dl className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Receipt ID
                            </dt>

                            <dd className="mt-1 text-sm font-medium text-gray-900">
                                #
                                {
                                    receipt.id
                                }
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Participant ID
                            </dt>

                            <dd className="mt-1 text-sm text-gray-700">
                                #
                                {
                                    receipt.participant_id
                                }
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Status
                            </dt>

                            <dd className="mt-1">
                                <StatusBadge
                                    status={
                                        receipt.status
                                    }
                                />
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Submitted
                            </dt>

                            <dd className="mt-1 text-sm text-gray-700">
                                {formatDateTime(
                                    receipt.submitted_at ??
                                    receipt.created_at
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Verified
                            </dt>

                            <dd className="mt-1 text-sm text-gray-700">
                                {receipt.verified_at
                                    ? formatDateTime(
                                        receipt.verified_at
                                    )
                                    : '—'}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Verified By
                            </dt>

                            <dd className="mt-1 text-sm text-gray-700">
                                {receipt.verified_by
                                    ? `User #${receipt.verified_by}`
                                    : '—'}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Created
                            </dt>

                            <dd className="mt-1 text-sm text-gray-700">
                                {formatDateTime(
                                    receipt.created_at
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Updated
                            </dt>

                            <dd className="mt-1 text-sm text-gray-700">
                                {formatDateTime(
                                    receipt.updated_at
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Suspicious
                            </dt>

                            <dd className="mt-1 text-sm text-gray-700">
                                {receipt.is_suspicious
                                    ? 'Yes'
                                    : 'No'}
                            </dd>
                        </div>

                        {receipt.image_hash && (
                            <div className="sm:col-span-2 lg:col-span-3">
                                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Image Hash
                                </dt>

                                <dd className="mt-1 break-all font-mono text-xs text-gray-600">
                                    {
                                        receipt.image_hash
                                    }
                                </dd>
                            </div>
                        )}
                    </dl>
                </section>

                {/* Image Viewer */}

                {imageViewerOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/90 p-6"
                        onClick={() =>
                            setImageViewerOpen(
                                false
                            )
                        }
                    >
                        <div
                            className="relative flex h-full w-full items-center justify-center"
                            onClick={(
                                event
                            ) =>
                                event.stopPropagation()
                            }
                        >
                            <div className="flex h-full w-full items-center justify-center overflow-auto">
                                <img
                                    src={`/api/admin/receipts/${receipt.id}/image`}
                                    alt={`Receipt ${receipt.receipt_number}`}
                                    className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                                    style={{
                                        transform:
                                            `scale(${imageZoom})`,

                                        transition:
                                            'transform 0.15s ease',
                                    }}
                                />
                            </div>

                            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl bg-white/95 p-2 shadow-xl">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setImageZoom(
                                            (
                                                zoom
                                            ) =>
                                                Math.max(
                                                    0.5,
                                                    zoom -
                                                    0.25
                                                )
                                        )
                                    }
                                    className="rounded-lg px-3 py-2 text-lg font-medium text-gray-700 hover:bg-gray-100"
                                >
                                    −
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setImageZoom(
                                            1
                                        )
                                    }
                                    className="min-w-16 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                                >
                                    {Math.round(
                                        imageZoom *
                                        100
                                    )}
                                    %
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setImageZoom(
                                            (
                                                zoom
                                            ) =>
                                                Math.min(
                                                    4,
                                                    zoom +
                                                    0.25
                                                )
                                        )
                                    }
                                    className="rounded-lg px-3 py-2 text-lg font-medium text-gray-700 hover:bg-gray-100"
                                >
                                    +
                                </button>

                                <div className="mx-1 h-6 w-px bg-gray-200" />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setImageViewerOpen(
                                            false
                                        )
                                    }
                                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Related Receipt Quick Review */}

            {quickReviewReceiptId !==
                null && (
                    <ReceiptQuickReviewModal
                        receiptId={
                            quickReviewReceiptId
                        }
                        backUrl={
                            currentReceiptUrl
                        }
                        onClose={() =>
                            setQuickReviewReceiptId(
                                null
                            )
                        }
                        onChanged={() => {
                            setQuickReviewReceiptId(
                                null
                            );

                            loadReceipt();
                        }}
                    />
                )}
        </>
    );
}
