import {
    useEffect,
    useState,
} from 'react';

import {
    Link,
} from 'react-router-dom';

import Alert from '../Alert';
import LoadingState from '../LoadingState';
import StatusBadge from '../StatusBadge';

import api from '../../services/api';

import type {
    Receipt,
    ReceiptResponse,
    SuspiciousReason,
} from '../../types/receipt';

import {
    getApiErrorMessage,
} from '../../utils/apiError';

import {
    formatDateTime,
} from '../../utils/date';

type Props = {
    receiptId: number;

    onClose: () => void;

    onChanged: (
        receipt: Receipt
    ) => void;
};

const suspiciousReasonLabels:
    Record<string, string> = {
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

export default function ReceiptQuickReviewModal({
                                                    receiptId,
                                                    onClose,
                                                    onChanged,
                                                }: Props) {
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
    ] = useState<string | null>(
        null
    );

    const [
        actionLoading,
        setActionLoading,
    ] = useState(false);

    const [
        actionError,
        setActionError,
    ] = useState<string | null>(
        null
    );

    const [
        showReject,
        setShowReject,
    ] = useState(false);

    const [
        rejectionReason,
        setRejectionReason,
    ] = useState('');

    const [
        imageOpen,
        setImageOpen,
    ] = useState(false);

    useEffect(() => {
        const loadReceipt =
            async () => {
                setLoading(true);
                setError(null);

                try {
                    const response =
                        await api.get<ReceiptResponse>(
                            `/admin/receipts/${receiptId}`
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

        loadReceipt();
    }, [receiptId]);

    /*
     * Escape closes image first,
     * then the review modal.
     */
    useEffect(() => {
        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key !==
                'Escape'
            ) {
                return;
            }

            if (imageOpen) {
                setImageOpen(false);

                return;
            }

            onClose();
        };

        window.addEventListener(
            'keydown',
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                'keydown',
                handleKeyDown
            );
        };
    }, [
        imageOpen,
        onClose,
    ]);

    /*
     * Prevent page scrolling behind
     * the modal.
     */
    useEffect(() => {
        const previousOverflow =
            document.body.style
                .overflow;

        document.body.style.overflow =
            'hidden';

        return () => {
            document.body.style.overflow =
                previousOverflow;
        };
    }, []);

    const approveReceipt =
        async () => {
            if (!receipt) {
                return;
            }

            setActionLoading(true);
            setActionError(null);

            try {
                const response =
                    await api.post<ReceiptResponse>(
                        `/admin/receipts/${receipt.id}/approve`
                    );

                const updatedReceipt =
                    response.data.data;

                setReceipt(
                    updatedReceipt
                );

                onChanged(
                    updatedReceipt
                );

                onClose();
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
                setActionLoading(false);
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

            setActionLoading(true);
            setActionError(null);

            try {
                const response =
                    await api.post<ReceiptResponse>(
                        `/admin/receipts/${receipt.id}/reject`,
                        {
                            reason:
                                rejectionReason.trim(),
                        }
                    );

                const updatedReceipt =
                    response.data.data;

                setReceipt(
                    updatedReceipt
                );

                onChanged(
                    updatedReceipt
                );

                onClose();
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
                setActionLoading(false);
            }
        };

    const participant =
        receipt?.participant;

    const otherReceipts =
        Math.max(
            (
                participant
                    ?.receipts_count ??
                1
            ) - 1,
            0
        );

    const canReview =
        receipt?.status ===
        'submitted';

    const suspicious =
        Boolean(
            receipt?.is_suspicious
        );

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onMouseDown={(
                    event
                ) => {
                    if (
                        event.target ===
                        event.currentTarget
                    ) {
                        onClose();
                    }
                }}
            >
                <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                    {/* Header */}

                    <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {receipt
                                        ? `Receipt #${receipt.id}`
                                        : 'Receipt Review'}
                                </h2>

                                {receipt && (
                                    <StatusBadge
                                        status={
                                            receipt.status
                                        }
                                    />
                                )}

                                {receipt?.is_suspicious && (
                                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                        Suspicious
                                    </span>
                                )}
                            </div>

                            {receipt && (
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
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            className="rounded-lg px-3 py-2 text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>

                    {loading ? (
                        <LoadingState
                            message="Loading receipt..."
                        />
                    ) : error ||
                    !receipt ? (
                        <div className="p-6">
                            <Alert variant="error">
                                {error ??
                                    'Receipt not found.'}
                            </Alert>
                        </div>
                    ) : (
                        <>
                            <div className="min-h-0 flex-1 overflow-y-auto">
                                <div className="grid min-h-full grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
                                    {/* Image */}

                                    <div className="border-b border-gray-200 bg-gray-50 p-5 xl:border-b-0 xl:border-r">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setImageOpen(
                                                    true
                                                )
                                            }
                                            className="flex min-h-[500px] w-full cursor-zoom-in items-center justify-center rounded-xl border border-gray-200 bg-white p-4"
                                        >
                                            <img
                                                src={`/api/admin/receipts/${receipt.id}/image`}
                                                alt={`Receipt ${receipt.receipt_number}`}
                                                className="max-h-[65vh] max-w-full object-contain"
                                            />
                                        </button>

                                        <div className="mt-2 text-center text-xs text-gray-400">
                                            Click
                                            image
                                            to
                                            enlarge
                                        </div>
                                    </div>

                                    {/* Review data */}

                                    <div className="space-y-5 p-5">
                                        {/* Receipt number */}

                                        <section>
                                            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                                Receipt
                                                Number
                                            </div>

                                            <div className="mt-1 break-all text-xl font-semibold text-gray-900">
                                                {
                                                    receipt.receipt_number
                                                }
                                            </div>
                                        </section>

                                        {/* Participant */}

                                        {participant && (
                                            <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                                            Participant
                                                        </div>

                                                        <div className="mt-2 font-semibold text-gray-900">
                                                            {
                                                                participant.first_name
                                                            }{' '}
                                                            {
                                                                participant.last_name
                                                            }
                                                        </div>
                                                    </div>

                                                    {otherReceipts >
                                                        0 && (
                                                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
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

                                                <div className="mt-3 space-y-1 text-sm text-gray-600">
                                                    <div>
                                                        {
                                                            participant.phone
                                                        }
                                                    </div>

                                                    <div className="break-all">
                                                        {
                                                            participant.email
                                                        }
                                                    </div>
                                                </div>

                                                <Link
                                                    to={`/admin/participants/${participant.id}`}
                                                    className="mt-3 inline-flex text-xs font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    View
                                                    participant
                                                    →
                                                </Link>
                                            </section>
                                        )}

                                        {/* Suspicious */}

                                        {suspicious && (
                                            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                                <div className="font-semibold text-amber-900">
                                                    Review
                                                    flags
                                                </div>

                                                <div className="mt-1 text-xs text-amber-700">
                                                    This
                                                    receipt
                                                    was
                                                    automatically
                                                    flagged
                                                    for
                                                    additional
                                                    review.
                                                </div>

                                                <ul className="mt-3 space-y-2">
                                                    {receipt.suspicious_reasons?.map(
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
                                            </section>
                                        )}

                                        {/* Notes */}

                                        <section>
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-gray-900">
                                                    Notes
                                                </h3>

                                                <span className="text-xs text-gray-400">
                                                    {
                                                        receipt
                                                            .notes
                                                            ?.length ??
                                                        0
                                                    }
                                                </span>
                                            </div>

                                            {!receipt
                                                .notes
                                                ?.length ? (
                                                <div className="mt-3 rounded-lg border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-400">
                                                    No
                                                    notes
                                                    yet.
                                                </div>
                                            ) : (
                                                <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
                                                    {receipt.notes.map(
                                                        (
                                                            note
                                                        ) => (
                                                            <div
                                                                key={
                                                                    note.id
                                                                }
                                                                className="rounded-lg border border-gray-200 p-3"
                                                            >
                                                                <div className="whitespace-pre-wrap text-sm text-gray-700">
                                                                    {
                                                                        note.note
                                                                    }
                                                                </div>

                                                                <div className="mt-2 flex justify-between gap-3 text-[11px] text-gray-400">
                                                                    <span>
                                                                        {note
                                                                                .user
                                                                                ?.name ??
                                                                            'Organizer'}
                                                                    </span>

                                                                    <span>
                                                                        {formatDateTime(
                                                                            note.created_at
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </section>

                                        {receipt.rejection_reason && (
                                            <section className="rounded-xl border border-red-200 bg-red-50 p-4">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-red-600">
                                                    Rejection
                                                    Reason
                                                </div>

                                                <div className="mt-2 whitespace-pre-wrap text-sm text-red-800">
                                                    {
                                                        receipt.rejection_reason
                                                    }
                                                </div>
                                            </section>
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

                                        {showReject && (
                                            <section className="rounded-xl border border-red-200 bg-red-50 p-4">
                                                <label
                                                    htmlFor="quick-review-rejection-reason"
                                                    className="text-sm font-medium text-red-800"
                                                >
                                                    Rejection
                                                    reason
                                                </label>

                                                <textarea
                                                    id="quick-review-rejection-reason"
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
                                                    placeholder="Why should this receipt be rejected?"
                                                    className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                                                />

                                                <div className="mt-3 flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            actionLoading
                                                        }
                                                        onClick={() => {
                                                            setShowReject(
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
                                            </section>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}

                            <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <Link
                                    to={`/admin/receipts/${receipt.id}`}
                                    state={{
                                        from:
                                            '/admin/receipts',
                                    }}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                    Full
                                    Details →
                                </Link>

                                <div className="flex flex-wrap justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={
                                            onClose
                                        }
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                                    >
                                        Leave
                                        for
                                        Later
                                    </button>

                                    {canReview && (
                                        <>
                                            {!showReject && (
                                                <button
                                                    type="button"
                                                    disabled={
                                                        actionLoading
                                                    }
                                                    onClick={() =>
                                                        setShowReject(
                                                            true
                                                        )
                                                    }
                                                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                disabled={
                                                    actionLoading ||
                                                    showReject
                                                }
                                                onClick={
                                                    approveReceipt
                                                }
                                                className={[
                                                    'rounded-lg px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50',
                                                    suspicious
                                                        ? 'bg-gray-900 hover:bg-gray-800'
                                                        : 'bg-green-600 hover:bg-green-700',
                                                ].join(
                                                    ' '
                                                )}
                                            >
                                                {actionLoading
                                                    ? 'Processing...'
                                                    : 'Approve'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Enlarged image */}

            {imageOpen &&
                receipt && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
                        onClick={() =>
                            setImageOpen(
                                false
                            )
                        }
                    >
                        <button
                            type="button"
                            onClick={() =>
                                setImageOpen(
                                    false
                                )
                            }
                            className="absolute right-5 top-5 rounded-lg bg-black/40 px-4 py-2 text-2xl text-white hover:bg-black/60"
                            aria-label="Close image"
                        >
                            ×
                        </button>

                        <img
                            src={`/api/admin/receipts/${receipt.id}/image`}
                            alt={`Receipt ${receipt.receipt_number}`}
                            className="max-h-full max-w-full object-contain"
                            onClick={(
                                event
                            ) =>
                                event.stopPropagation()
                            }
                        />
                    </div>
                )}
        </>
    );
}
