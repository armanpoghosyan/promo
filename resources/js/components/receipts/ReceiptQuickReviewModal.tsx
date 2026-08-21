import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import { Link } from 'react-router-dom';

import Alert from '../Alert';
import LoadingState from '../LoadingState';
import StatusBadge from '../StatusBadge';
import Tooltip from '../Tooltip';

import api from '../../services/api';

import type {
    Receipt,
    ReceiptNoteResponse,
    ReceiptResponse,
} from '../../types/receipt';

import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';
import { suspiciousReasonLabel } from '../../utils/receipt';

type Props = {
    receiptId: number;
    backUrl: string;
    hideParticipant?: boolean;

    onClose: () => void;

    onChanged: (
        receipt: Receipt
    ) => void;
};

export default function ReceiptQuickReviewModal({
                                                    receiptId,
                                                    backUrl,
                                                    hideParticipant = false,
                                                    onClose,
                                                    onChanged,
                                                }: Props) {
    const [
        activeReceiptId,
        setActiveReceiptId,
    ] = useState(receiptId);

    const [receipt, setReceipt] =
        useState<Receipt | null>(null);

    const [
        receiptHistory,
        setReceiptHistory,
    ] = useState<number[]>([
        receiptId,
    ]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

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

    const [showReject, setShowReject] =
        useState(false);

    const [showApprove, setShowApprove] =
        useState(false);

    const [approvalNote, setApprovalNote] =
        useState('');

    const [
        rejectionReason,
        setRejectionReason,
    ] = useState('');

    const [imageOpen, setImageOpen] =
        useState(false);

    const [
        showAddNote,
        setShowAddNote,
    ] = useState(false);

    const [newNote, setNewNote] =
        useState('');

    const [
        noteLoading,
        setNoteLoading,
    ] = useState(false);

    const [
        noteError,
        setNoteError,
    ] = useState<string | null>(
        null
    );

    useEffect(() => {
        setActiveReceiptId(receiptId);
        setReceiptHistory([
            receiptId,
        ]);
    }, [receiptId]);

    useEffect(() => {
        const loadReceipt =
            async () => {
                setLoading(true);
                setError(null);
                setActionError(null);
                setNoteError(null);

                setShowReject(false);
                setRejectionReason('');
                setShowApprove(false);
                setApprovalNote('');
                setShowAddNote(false);
                setNewNote('');

                try {
                    const response =
                        await api.get<ReceiptResponse>(
                            `/admin/receipts/${activeReceiptId}`
                        );

                    setReceipt(
                        response.data.data
                    );
                } catch (
                    error: unknown
                    ) {
                    setReceipt(null);

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
    }, [activeReceiptId]);

    useEffect(() => {
        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key !== 'Escape'
            ) {
                return;
            }

            if (imageOpen) {
                setImageOpen(false);
                return;
            }

            if (showReject) {
                setShowReject(false);
                setRejectionReason('');
                return;
            }

            if (showApprove) {
                setShowApprove(false);
                setApprovalNote('');
                return;
            }

            if (showAddNote) {
                setShowAddNote(false);
                setNewNote('');
                setNoteError(null);
                return;
            }

            onClose();
        };

        window.addEventListener(
            'keydown',
            handleKeyDown
        );

        return () =>
            window.removeEventListener(
                'keydown',
                handleKeyDown
            );
    }, [
        imageOpen,
        showReject,
        showApprove,
        showAddNote,
        onClose,
    ]);

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

    const participant =
        receipt?.participant;

    const otherReceipts =
        useMemo(
            () =>
                (
                    participant?.receipts ??
                    []
                ).filter(
                    (item) =>
                        item.id !==
                        receipt?.id
                ),
            [
                participant,
                receipt?.id,
            ]
        );

    const canReview =
        receipt?.status ===
        'submitted';

    const suspicious =
        Boolean(
            receipt?.is_suspicious
        );

    const isRelatedReceipt =
        activeReceiptId !==
        receiptId;

    const openRelatedReceipt = (
        nextReceiptId: number
    ) => {
        if (
            nextReceiptId ===
            activeReceiptId
        ) {
            return;
        }

        setReceiptHistory(
            (current) => [
                ...current,
                nextReceiptId,
            ]
        );

        setActiveReceiptId(
            nextReceiptId
        );
    };

    const goBackReceipt = () => {
        if (
            receiptHistory.length <=
            1
        ) {
            return;
        }

        const nextHistory =
            receiptHistory.slice(
                0,
                -1
            );

        const previousReceiptId =
            nextHistory[
            nextHistory.length - 1
                ];

        setReceiptHistory(
            nextHistory
        );

        setActiveReceiptId(
            previousReceiptId
        );
    };

    const approveReceipt =
        async () => {
            if (
                !receipt ||
                (receipt.is_suspicious && !approvalNote.trim())
            ) {
                return;
            }

            setActionLoading(true);
            setActionError(null);

            try {
                const response =
                    await api.post<ReceiptResponse>(
                        `/admin/receipts/${receipt.id}/approve`,
                        {
                            review_note:
                                approvalNote.trim() ||
                                undefined,
                        }
                    );

                const updatedReceipt =
                    response.data.data;

                setReceipt(
                    updatedReceipt
                );

                setShowApprove(false);
                setApprovalNote('');

                onChanged(
                    updatedReceipt
                );

                if (
                    receipt.id ===
                    receiptId
                ) {
                    onClose();
                }
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

                setShowReject(false);
                setRejectionReason('');

                if (
                    receipt.id ===
                    receiptId
                ) {
                    onClose();
                }
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

    const addNote = async () => {
        if (
            !receipt ||
            !newNote.trim()
        ) {
            return;
        }

        setNoteLoading(true);
        setNoteError(null);

        try {
            const response =
                await api.post<ReceiptNoteResponse>(
                    `/admin/receipts/${receipt.id}/notes`,
                    {
                        note:
                            newNote.trim(),
                    }
                );

            const createdNote =
                response.data.data;

            const updatedReceipt: Receipt =
                {
                    ...receipt,

                    notes: [
                        createdNote,
                        ...(receipt.notes ??
                            []),
                    ],
                };

            setReceipt(
                updatedReceipt
            );

            setNewNote('');
            setShowAddNote(false);

            onChanged(
                updatedReceipt
            );
        } catch (error: unknown) {
            setNoteError(
                getApiErrorMessage(
                    error,
                    'Unable to add note.'
                )
            );
        } finally {
            setNoteLoading(false);
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
                onMouseDown={(event) => {
                    if (
                        event.target ===
                        event.currentTarget
                    ) {
                        onClose();
                    }
                }}
            >
                <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                    {/* Header */}

                    <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-3">
                        <div>
                            {isRelatedReceipt && (
                                <button
                                    type="button"
                                    onClick={
                                        goBackReceipt
                                    }
                                    className="mb-1.5 inline-flex text-xs font-medium text-blue-600 hover:text-blue-800"
                                >
                                    ← Back to previous
                                    receipt
                                </button>
                            )}

                            <div className="flex flex-wrap items-center gap-2">
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
                                    <span className="text-sm text-amber-600">
                                        ⚠
                                    </span>
                                )}
                            </div>

                            {receipt && (
                                <div className="mt-0.5 text-sm text-gray-500">
                                    {
                                        receipt.receipt_number
                                    }
                                    {' · '}
                                    {formatDateTime(
                                        receipt.submitted_at ??
                                        receipt.created_at
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-3 py-2 text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>

                    {loading ? (
                        <LoadingState message="Loading receipt..." />
                    ) : error ||
                    !receipt ? (
                        <div className="p-4">
                            <Alert variant="error">
                                {error ??
                                    'Receipt not found.'}
                            </Alert>
                        </div>
                    ) : (
                        <>
                            <div className="min-h-0 flex-1 overflow-y-auto">
                                <div className="grid min-h-full grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
                                    {/* Image */}

                                    <div className="border-b border-gray-200 bg-gray-50 p-4 xl:border-b-0 xl:border-r">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setImageOpen(
                                                    true
                                                )
                                            }
                                            className="flex min-h-[460px] w-full cursor-zoom-in items-center justify-center rounded-xl border border-gray-200 bg-white p-3"
                                        >
                                            <img
                                                src={`/api/admin/receipts/${receipt.id}/image`}
                                                alt={`Receipt ${receipt.receipt_number}`}
                                                className="max-h-[68vh] max-w-full object-contain"
                                            />
                                        </button>
                                    </div>

                                    {/* Context */}

                                    <div className="space-y-4 p-4">
                                        <section>
                                            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                                Receipt
                                                Number
                                            </div>

                                            <div className="mt-1 break-all text-lg font-semibold text-gray-900">
                                                {
                                                    receipt.receipt_number
                                                }
                                            </div>
                                        </section>

                                        {/* Participant */}

                                        {!hideParticipant &&
                                            participant && (
                                                <section className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                                                    <div className="p-3">
                                                        <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                                            Participant
                                                        </div>

                                                        <div className="mt-1 font-semibold text-gray-900">
                                                            {
                                                                participant.first_name
                                                            }{' '}
                                                            {
                                                                participant.last_name
                                                            }
                                                        </div>

                                                        <div className="mt-1.5 text-sm text-gray-600">
                                                            <div>
                                                                {
                                                                    participant.phone
                                                                }
                                                            </div>

                                                            <div className="break-all text-xs text-gray-500">
                                                                {
                                                                    participant.email
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {otherReceipts.length >
                                                        0 && (
                                                            <div className="border-t border-gray-200 bg-white">
                                                                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                    Other
                                                                    Receipts
                                                                </div>

                                                                <div className="max-h-72 divide-y divide-gray-100 overflow-y-auto">
                                                                    {otherReceipts.map(
                                                                        (
                                                                            participantReceipt
                                                                        ) => {
                                                                            const reasons =
                                                                                participantReceipt.suspicious_reasons ??
                                                                                [];

                                                                            const rejectionReason =
                                                                                participantReceipt.status ===
                                                                                'rejected' &&
                                                                                participantReceipt.rejection_reason
                                                                                    ? participantReceipt.rejection_reason
                                                                                    : null;

                                                                            return (
                                                                                <div
                                                                                    key={
                                                                                        participantReceipt.id
                                                                                    }
                                                                                    className="px-3 py-2.5"
                                                                                >
                                                                                    <div className="flex min-w-0 items-center gap-2">
                                                                                    <span className="min-w-0 truncate text-sm font-medium text-gray-900">
                                                                                        {
                                                                                            participantReceipt.receipt_number
                                                                                        }
                                                                                    </span>

                                                                                        {participantReceipt.is_suspicious && (
                                                                                            <Tooltip
                                                                                                content={
                                                                                                    reasons.length >
                                                                                                    0 ? (
                                                                                                        <div>
                                                                                                            <div className="mb-1 font-semibold">
                                                                                                                Suspicious
                                                                                                                reasons
                                                                                                            </div>

                                                                                                            <div className="space-y-1 text-gray-200">
                                                                                                                {reasons.map(
                                                                                                                    (
                                                                                                                        reason
                                                                                                                    ) => (
                                                                                                                        <div
                                                                                                                            key={
                                                                                                                                reason
                                                                                                                            }
                                                                                                                        >
                                                                                                                            •{' '}
                                                                                                                            {suspiciousReasonLabel(
                                                                                                                                reason
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                    )
                                                                                                                )}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        'This receipt is marked as suspicious.'
                                                                                                    )
                                                                                                }
                                                                                                maxWidth={
                                                                                                    360
                                                                                                }
                                                                                            >
                                                                                            <span className="shrink-0 cursor-help text-amber-600">
                                                                                                ⚠
                                                                                            </span>
                                                                                            </Tooltip>
                                                                                        )}

                                                                                        <Tooltip
                                                                                            content={
                                                                                                rejectionReason ? (
                                                                                                    <div>
                                                                                                        <div className="mb-1 font-semibold">
                                                                                                            Rejection
                                                                                                            reason
                                                                                                        </div>

                                                                                                        <div className="text-gray-200">
                                                                                                            {
                                                                                                                rejectionReason
                                                                                                            }
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ) : null
                                                                                            }
                                                                                            maxWidth={
                                                                                                360
                                                                                            }
                                                                                        >
                                                                                        <span
                                                                                            className={
                                                                                                rejectionReason
                                                                                                    ? 'cursor-help'
                                                                                                    : undefined
                                                                                            }
                                                                                        >
                                                                                            <StatusBadge
                                                                                                status={
                                                                                                    participantReceipt.status
                                                                                                }
                                                                                            />
                                                                                        </span>
                                                                                        </Tooltip>
                                                                                    </div>

                                                                                    <div className="mt-1 flex items-center justify-between gap-3">
                                                                                        <div className="min-w-0 truncate text-[11px] text-gray-400">
                                                                                            ID
                                                                                            #{' '}
                                                                                            {
                                                                                                participantReceipt.id
                                                                                            }
                                                                                            {' · '}
                                                                                            {formatDateTime(
                                                                                                participantReceipt.submitted_at ??
                                                                                                participantReceipt.created_at
                                                                                            )}
                                                                                        </div>

                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                openRelatedReceipt(
                                                                                                    participantReceipt.id
                                                                                                )
                                                                                            }
                                                                                            className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800"
                                                                                        >
                                                                                            Review
                                                                                            →
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                    <div className="border-t border-gray-200 px-3 py-2.5">
                                                        <Link
                                                            to={`/admin/participants/${participant.id}`}
                                                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                                        >
                                                            View
                                                            Participant
                                                            →
                                                        </Link>
                                                    </div>
                                                </section>
                                            )}

                                        {(receipt.submitted_first_name || receipt.submitted_last_name) && (
                                            <section className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    Submitted identity snapshot
                                                </div>
                                                <div className="mt-2 text-sm text-gray-700">
                                                    <div className="font-medium text-gray-900">
                                                        {`${receipt.submitted_first_name ?? ''} ${receipt.submitted_last_name ?? ''}`.trim()}
                                                    </div>
                                                    <div>{receipt.submitted_phone ?? '—'}</div>
                                                    <div className="break-all text-xs text-gray-500">
                                                        {receipt.submitted_email ?? '—'}
                                                    </div>
                                                </div>
                                            </section>
                                        )}

                                        {/* Suspicious */}

                                        {suspicious && (
                                            <section className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                                                <div className="font-semibold text-amber-900">
                                                    ⚠ Review
                                                    flags
                                                </div>

                                                {receipt.suspicious_reasons
                                                    ?.length ? (
                                                    <ul className="mt-2 space-y-1">
                                                        {receipt.suspicious_reasons.map(
                                                            (
                                                                reason
                                                            ) => (
                                                                <li
                                                                    key={
                                                                        reason
                                                                    }
                                                                    className="text-sm text-amber-900"
                                                                >
                                                                    •{' '}
                                                                    {suspiciousReasonLabel(
                                                                        reason
                                                                    )}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                ) : (
                                                    <div className="mt-1 text-sm text-amber-800">
                                                        No
                                                        suspicious
                                                        reason
                                                        recorded.
                                                    </div>
                                                )}
                                            </section>
                                        )}

                                        {(receipt.duplicate_matches?.length ?? 0) > 0 && (
                                            <section className="overflow-hidden rounded-xl border border-amber-200 bg-white">
                                                <div className="border-b border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
                                                    Duplicate evidence
                                                </div>
                                                <div className="divide-y divide-gray-100">
                                                    {receipt.duplicate_matches?.map((match) => (
                                                        <div key={match.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    Receipt #{match.id} · {match.receipt_number}
                                                                </div>
                                                                <div className="mt-0.5 text-xs text-gray-500">
                                                                    Matched by {match.matched_by
                                                                        .map((reason) => reason === 'receipt_image' ? 'image' : 'receipt number')
                                                                        .join(' and ')}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => openRelatedReceipt(match.id)}
                                                                className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800"
                                                            >
                                                                Review →
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {/* Notes */}

                                        <section>
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-semibold text-gray-900">
                                                        Notes
                                                    </h3>

                                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                                                        {
                                                            receipt
                                                                .notes
                                                                ?.length ??
                                                            0
                                                        }
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowAddNote(
                                                            (
                                                                current
                                                            ) =>
                                                                !current
                                                        );

                                                        setNewNote(
                                                            ''
                                                        );

                                                        setNoteError(
                                                            null
                                                        );
                                                    }}
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    {showAddNote
                                                        ? 'Cancel'
                                                        : '+ Add new note'}
                                                </button>
                                            </div>

                                            {showAddNote && (
                                                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                    <textarea
                                                        value={
                                                            newNote
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setNewNote(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        rows={
                                                            2
                                                        }
                                                        autoFocus
                                                        placeholder="Add a quick note..."
                                                        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                                                    />

                                                    {noteError && (
                                                        <div className="mt-1.5 text-xs text-red-600">
                                                            {
                                                                noteError
                                                            }
                                                        </div>
                                                    )}

                                                    <div className="mt-2 flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                noteLoading
                                                            }
                                                            onClick={() => {
                                                                setShowAddNote(
                                                                    false
                                                                );

                                                                setNewNote(
                                                                    ''
                                                                );

                                                                setNoteError(
                                                                    null
                                                                );
                                                            }}
                                                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                                                        >
                                                            Cancel
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                noteLoading ||
                                                                !newNote.trim()
                                                            }
                                                            onClick={
                                                                addNote
                                                            }
                                                            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                                        >
                                                            {noteLoading
                                                                ? 'Adding...'
                                                                : 'Add Note'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {!receipt.notes
                                                ?.length ? (
                                                <div className="mt-2 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-400">
                                                    No
                                                    notes
                                                    yet.
                                                </div>
                                            ) : (
                                                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                                                    {receipt.notes.map(
                                                        (
                                                            item
                                                        ) => (
                                                            <div
                                                                key={
                                                                    item.id
                                                                }
                                                                className="rounded-lg border border-gray-200 p-3"
                                                            >
                                                                <div className="whitespace-pre-wrap text-sm text-gray-700">
                                                                    {
                                                                        item.note
                                                                    }
                                                                </div>

                                                                <div className="mt-1.5 flex justify-between gap-3 text-[11px] text-gray-400">
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
                                            <section className="rounded-lg border border-red-200 bg-red-50 p-3">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-red-600">
                                                    Rejection
                                                    Reason
                                                </div>

                                                <div className="mt-1 whitespace-pre-wrap text-sm text-red-800">
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

                                        {/* Approve */}

                                        {showApprove && (
                                            <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                                <div className="text-sm font-semibold text-emerald-900">
                                                    Confirm permanent approval
                                                </div>
                                                <p className="mt-1 text-xs leading-5 text-emerald-800">
                                                    This decision cannot be reversed in v1.
                                                </p>

                                                <label
                                                    htmlFor="quick-review-approval-note"
                                                    className="mt-3 block text-sm font-medium text-emerald-900"
                                                >
                                                    Review note {suspicious ? '(required)' : '(optional)'}
                                                </label>
                                                <textarea
                                                    id="quick-review-approval-note"
                                                    value={approvalNote}
                                                    onChange={(event) => setApprovalNote(event.target.value)}
                                                    rows={3}
                                                    autoFocus
                                                    placeholder="Explain why this receipt is valid..."
                                                    className="mt-2 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
                                                />

                                                <div className="mt-2 flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={actionLoading}
                                                        onClick={() => {
                                                            setShowApprove(false);
                                                            setApprovalNote('');
                                                        }}
                                                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={actionLoading || (suspicious && !approvalNote.trim())}
                                                        onClick={approveReceipt}
                                                        className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                                    >
                                                        {actionLoading ? 'Approving...' : 'Confirm Approve'}
                                                    </button>
                                                </div>
                                            </section>
                                        )}

                                        {/* Reject */}

                                        {showReject && (
                                            <section className="rounded-lg border border-red-200 bg-red-50 p-3">
                                                <p className="mb-3 text-xs leading-5 text-red-800">
                                                    Rejection is permanent in v1 and cannot be reversed.
                                                </p>
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
                                                        3
                                                    }
                                                    autoFocus
                                                    placeholder="Why should this receipt be rejected?"
                                                    className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm"
                                                />

                                                <div className="mt-2 flex justify-end gap-2">
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
                                                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
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
                                                        className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
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

                            {/* Footer */}

                            <div className="flex flex-col gap-2 border-t border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <Link
                                    to={`/admin/receipts/${receipt.id}`}
                                    state={{
                                        from:
                                        backUrl,
                                    }}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                    Full Details →
                                </Link>

                                {canReview && (
                                    <div className="flex flex-wrap justify-end gap-2">
                                        {!showReject && !showApprove && (
                                            <button
                                                type="button"
                                                disabled={
                                                    actionLoading
                                                }
                                                onClick={() => {
                                                    setShowReject(true);
                                                    setShowApprove(false);
                                                }}
                                                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        )}

                                        {!showReject && !showApprove && (
                                            <button
                                                type="button"
                                                disabled={actionLoading}
                                                onClick={() => {
                                                    setShowApprove(true);
                                                    setShowReject(false);
                                                }}
                                                className={[
                                                    'rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-50',
                                                    suspicious
                                                        ? 'bg-gray-900 hover:bg-gray-800'
                                                        : 'bg-emerald-600 hover:bg-emerald-700',
                                                ].join(' ')}
                                            >
                                                Approve
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Enlarged image */}

            {imageOpen && receipt && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
                    onClick={() =>
                        setImageOpen(false)
                    }
                >
                    <button
                        type="button"
                        onClick={() =>
                            setImageOpen(false)
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
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    />
                </div>
            )}
        </>
    );
}
