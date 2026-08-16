import { useEffect, useState } from 'react';
import {
    Link,
    useLocation,
    useParams,
} from 'react-router-dom';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDateTime } from '../../utils/date';
import { getApiErrorMessage } from '../../utils/apiError';

import type {
    Receipt,
    ReceiptResponse,
    ReceiptNoteResponse,
} from '../../types/receipt';


export default function ReceiptDetails() {
    const { id } = useParams();
    const location = useLocation();

    const backUrl =
        location.state?.from ??
        '/admin/receipts?page=1';

    const [receipt, setReceipt] =
        useState<Receipt | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [actionError, setActionError] =
        useState<string | null>(null);

    const [actionSuccess, setActionSuccess] =
        useState<string | null>(null);

    const [showRejectForm, setShowRejectForm] =
        useState(false);

    const [showNoteForm, setShowNoteForm] =
        useState(false);

    const [rejectionReason, setRejectionReason] =
        useState('');

    const [note, setNote] =
        useState('');

    const [imageViewerOpen, setImageViewerOpen] =
        useState(false);

    const [imageZoom, setImageZoom] =
        useState(1);

    /*
     * Load receipt
     */
    const loadReceipt = async () => {
        if (!id) {
            setError('Receipt ID is missing.');
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

            setReceipt(response.data.data);
        } catch (err) {
            console.error(err);

            setError(
                'Unable to load receipt.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReceipt();
    }, [id]);

    /*
     * Approve
     */
    const approveReceipt = async () => {
        if (!receipt) {
            return;
        }

        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
            const response =
                await api.post<ReceiptResponse>(
                    `/admin/receipts/${receipt.id}/approve`
                );

            setReceipt(response.data.data);

            setShowRejectForm(false);
            setRejectionReason('');

            setActionSuccess(
                'Receipt approved successfully.'
            );
        } catch (err) {
            console.error(err);

            setActionError(
                getApiErrorMessage(
                    err,
                    'Unable to approve receipt.'
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    /*
     * Reject
     */
    const rejectReceipt = async () => {
        if (
            !receipt ||
            !rejectionReason.trim()
        ) {
            return;
        }

        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
            const response =
                await api.post<ReceiptResponse>(
                    `/admin/receipts/${receipt.id}/reject`,
                    {
                        reason:
                            rejectionReason.trim(),
                    }
                );

            setReceipt(response.data.data);

            setShowRejectForm(false);
            setRejectionReason('');

            setActionSuccess(
                'Receipt rejected successfully.'
            );
        } catch (err) {
            console.error(err);

            setActionError(
                getApiErrorMessage(
                    err,
                    'Unable to reject receipt.'
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    /*
     * Add note
     */
    const addNote = async () => {
        if (
            !receipt ||
            !note.trim()
        ) {
            return;
        }

        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
            const response =
                await api.post<ReceiptNoteResponse>(
                    `/admin/receipts/${receipt.id}/notes`,
                    {
                        note: note.trim(),
                    }
                );

            const newNote =
                response.data.data;

            setReceipt(
                (currentReceipt) => {
                    if (!currentReceipt) {
                        return currentReceipt;
                    }

                    return {
                        ...currentReceipt,
                        notes: [
                            newNote,
                            ...currentReceipt.notes,
                        ],
                    };
                }
            );

            setNote('');
            setShowNoteForm(false);

            setActionSuccess(
                response.data.message ??
                'Note added successfully.'
            );
        } catch (err) {
            console.error(err);

            setActionError(
                getApiErrorMessage(
                    err,
                    'Unable to add note.'
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-64 items-center justify-center text-sm text-gray-500">
                Loading receipt...
            </div>
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

                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error ?? 'Receipt not found.'}
                </div>

            </div>
        );
    }

    const participant =
        receipt.participant;

    const canReview =
        receipt.status !== 'approved' &&
        receipt.status !== 'rejected';

    return (
        <div className="space-y-6">

            {/* Header */}

            <div>

                <Link
                    to={backUrl}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to Receipts
                </Link>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                        <div className="flex flex-wrap items-center gap-3">

                            <h2 className="text-2xl font-bold text-gray-900">
                                Receipt #{receipt.id}
                            </h2>

                            <StatusBadge
                                status={receipt.status}
                            />

                            {receipt.is_suspicious && (
                                <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                                    ⚠ Suspicious
                                </span>
                            )}

                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                            {receipt.receipt_number}
                            {' · '}
                            Submitted{' '}
                            {formatDateTime(
                                receipt.submitted_at ??
                                receipt.created_at
                            )}
                        </p>

                    </div>

                </div>

            </div>

            {/* Global messages */}

            {actionSuccess && (
                <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

                    <span>
                        {actionSuccess}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setActionSuccess(null)
                        }
                        className="ml-4 font-medium hover:text-green-900"
                    >
                        ×
                    </button>

                </div>
            )}

            {actionError && (
                <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                    <span>
                        {actionError}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setActionError(null)
                        }
                        className="ml-4 font-medium hover:text-red-900"
                    >
                        ×
                    </button>

                </div>
            )}

            {/* Main review workspace */}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

                {/* LEFT - Receipt */}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-2">

                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                        <div>

                            <h3 className="font-semibold text-gray-900">
                                Receipt Image
                            </h3>

                            <p className="mt-1 text-xs text-gray-500">
                                Click the image to inspect it.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setImageViewerOpen(true);
                                setImageZoom(1);
                            }}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Enlarge
                        </button>

                    </div>

                    <div
                        className="flex min-h-[550px] cursor-zoom-in items-center justify-center bg-gray-50 p-6"
                        onClick={() => {
                            setImageViewerOpen(true);
                            setImageZoom(1);
                        }}
                    >

                        <img
                            src={`/api/admin/receipts/${receipt.id}/image`}
                            alt={`Receipt ${receipt.receipt_number}`}
                            className="max-h-[800px] max-w-full rounded-lg object-contain shadow-sm"
                        />

                    </div>

                </section>

                {/* RIGHT - Review */}

                <div className="space-y-6">

                    <div className="xl:sticky xl:top-6">

                        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                            {/* Review header */}

                            <div className="border-b border-gray-200 px-5 py-4">

                                <div className="flex items-center justify-between gap-3">

                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            Review
                                        </h3>

                                        <p className="mt-1 text-xs text-gray-500">
                                            Verify receipt and participant information.
                                        </p>
                                    </div>

                                    <StatusBadge
                                        status={receipt.status}
                                    />

                                </div>

                            </div>

                            <div className="space-y-5 p-5">

                                {/* Receipt number */}

                                <div>

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Receipt Number
                                    </div>

                                    <div className="mt-1 text-lg font-semibold text-gray-900">
                                        {receipt.receipt_number}
                                    </div>

                                </div>

                                {/* Participant */}

                                {participant && (
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">

                                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Participant
                                        </div>

                                        <div className="mt-2 font-semibold text-gray-900">
                                            {participant.first_name}{' '}
                                            {participant.last_name}
                                        </div>

                                        <div className="mt-2 space-y-1 text-sm text-gray-600">

                                            <div>
                                                {participant.phone}
                                            </div>

                                            <div className="break-all">
                                                {participant.email}
                                            </div>

                                        </div>

                                        {participant.id && (
                                            <Link
                                                to={`/admin/participants/${participant.id}`}
                                                className="mt-3 inline-flex text-xs font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                View participant →
                                            </Link>
                                        )}

                                    </div>
                                )}

                                {/* Suspicious */}

                                {receipt.is_suspicious && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">

                                        <div className="flex items-center gap-2 font-medium text-red-800">
                                            <span>
                                                ⚠
                                            </span>

                                            <span>
                                                Suspicious Receipt
                                            </span>
                                        </div>

                                        <div className="mt-2 text-sm text-red-700">
                                            Review these flags before making a decision.
                                        </div>

                                        {receipt.suspicious_reasons?.length >
                                            0 && (
                                                <ul className="mt-3 space-y-2">

                                                    {receipt.suspicious_reasons.map(
                                                        (reason) => (
                                                            <li
                                                                key={reason}
                                                                className="flex gap-2 text-sm text-red-700"
                                                            >
                                                            <span>
                                                                •
                                                            </span>

                                                                <span>
                                                                {reason.replaceAll(
                                                                    '_',
                                                                    ' '
                                                                )}
                                                            </span>
                                                            </li>
                                                        )
                                                    )}

                                                </ul>
                                            )}

                                    </div>
                                )}

                                {/* Existing rejection */}

                                {receipt.rejection_reason && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">

                                        <div className="text-xs font-medium uppercase tracking-wide text-red-600">
                                            Rejection Reason
                                        </div>

                                        <p className="mt-2 whitespace-pre-line text-sm text-red-700">
                                            {receipt.rejection_reason}
                                        </p>

                                    </div>
                                )}

                                {/* Actions */}

                                {canReview ? (

                                    <div className="border-t border-gray-200 pt-5">

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
                                                        !showRejectForm
                                                    );

                                                    setShowNoteForm(
                                                        false
                                                    );
                                                }}
                                                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Reject
                                            </button>

                                        </div>

                                    </div>

                                ) : (

                                    <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">

                                        This receipt has already
                                        been{' '}

                                        <span className="font-medium">
                                            {receipt.status}
                                        </span>
                                        .

                                    </div>

                                )}

                                {/* Reject form */}

                                {showRejectForm && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">

                                        <label className="block text-sm font-medium text-red-800">
                                            Rejection reason
                                        </label>

                                        <textarea
                                            value={
                                                rejectionReason
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setRejectionReason(
                                                    event.target.value
                                                )
                                            }
                                            rows={4}
                                            autoFocus
                                            placeholder="Explain why this receipt is being rejected..."
                                            className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                        />

                                        <div className="mt-3 flex gap-2">

                                            <button
                                                type="button"
                                                disabled={
                                                    actionLoading ||
                                                    !rejectionReason.trim()
                                                }
                                                onClick={
                                                    rejectReceipt
                                                }
                                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Confirm Rejection
                                            </button>

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
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>

                                        </div>

                                    </div>
                                )}

                                {/* Add note */}

                                <div className="border-t border-gray-200 pt-5">

                                    {!showNoteForm ? (

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
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            + Add internal note
                                        </button>

                                    ) : (

                                        <div>

                                            <label className="block text-sm font-medium text-gray-700">
                                                Internal note
                                            </label>

                                            <textarea
                                                value={note}
                                                onChange={(
                                                    event
                                                ) =>
                                                    setNote(
                                                        event.target.value
                                                    )
                                                }
                                                rows={3}
                                                autoFocus
                                                placeholder="Add a note about this receipt..."
                                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            />

                                            <div className="mt-3 flex gap-2">

                                                <button
                                                    type="button"
                                                    disabled={
                                                        actionLoading ||
                                                        !note.trim()
                                                    }
                                                    onClick={
                                                        addNote
                                                    }
                                                    className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Save Note
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowNoteForm(
                                                            false
                                                        );

                                                        setNote(
                                                            ''
                                                        );
                                                    }}
                                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>

                                            </div>

                                        </div>

                                    )}

                                </div>

                            </div>

                        </section>

                    </div>

                </div>

            </div>

            {/* Secondary information */}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Receipt information */}

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="border-b border-gray-200 px-5 py-4">

                        <h3 className="font-semibold text-gray-900">
                            Receipt Details
                        </h3>

                    </div>

                    <dl className="grid gap-5 p-5 sm:grid-cols-2">

                        <div>

                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Receipt ID
                            </dt>

                            <dd className="mt-1 text-sm font-medium text-gray-900">
                                #{receipt.id}
                            </dd>

                        </div>

                        <div>

                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Receipt Number
                            </dt>

                            <dd className="mt-1 text-sm font-medium text-gray-900">
                                {receipt.receipt_number}
                            </dd>

                        </div>

                        <div>

                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Submitted
                            </dt>

                            <dd className="mt-1 text-sm text-gray-700">
                                {formatDateTime(
                                    receipt.submitted_at
                                )}
                            </dd>

                        </div>

                        <div>

                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Verified
                            </dt>

                            <dd className="mt-1 text-sm text-gray-700">
                                {formatDateTime(
                                    receipt.verified_at
                                )}
                            </dd>

                        </div>

                    </dl>

                    {/* Technical information */}

                    {receipt.image_hash && (
                        <details className="border-t border-gray-200">

                            <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-gray-600 hover:bg-gray-50">
                                Technical details
                            </summary>

                            <div className="border-t border-gray-100 px-5 py-4">

                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Image Hash
                                </div>

                                <div className="mt-2 break-all font-mono text-xs text-gray-600">
                                    {receipt.image_hash}
                                </div>

                            </div>

                        </details>
                    )}

                </section>

                {/* Participant details */}

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                        <h3 className="font-semibold text-gray-900">
                            Participant Details
                        </h3>

                        {participant?.id && (
                            <Link
                                to={`/admin/participants/${participant.id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                                View profile
                            </Link>
                        )}

                    </div>

                    {participant ? (

                        <dl className="grid gap-5 p-5 sm:grid-cols-2">

                            <div>

                                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Name
                                </dt>

                                <dd className="mt-1 text-sm font-medium text-gray-900">
                                    {participant.first_name}{' '}
                                    {participant.last_name}
                                </dd>

                            </div>

                            <div>

                                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Phone
                                </dt>

                                <dd className="mt-1 text-sm text-gray-700">
                                    {participant.phone}
                                </dd>

                            </div>

                            <div className="sm:col-span-2">

                                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Email
                                </dt>

                                <dd className="mt-1 break-all text-sm text-gray-700">
                                    {participant.email}
                                </dd>

                            </div>

                        </dl>

                    ) : (

                        <div className="p-5 text-sm text-gray-400">
                            Participant information is unavailable.
                        </div>

                    )}

                </section>

            </div>

            {/* Notes / History */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                    <div>

                        <h3 className="font-semibold text-gray-900">
                            Notes
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                            Internal notes recorded by administrators.
                        </p>

                    </div>

                    <span className="text-sm text-gray-400">
                        {receipt.notes.length}
                    </span>

                </div>

                {receipt.notes.length === 0 ? (

                    <div className="p-5 text-sm text-gray-400">
                        No notes have been added.
                    </div>

                ) : (

                    <div className="divide-y divide-gray-100">

                        {receipt.notes.map(
                            (item) => (
                                <div
                                    key={item.id}
                                    className="p-5"
                                >

                                    <div className="flex flex-wrap items-center justify-between gap-2">

                                        <span className="text-sm font-medium text-gray-700">
                                            {item.user?.name ??
                                                'Admin'}
                                        </span>

                                        <span className="text-xs text-gray-400">
                                            {formatDateTime(
                                                item.created_at
                                            )}
                                        </span>

                                    </div>

                                    <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
                                        {item.note}
                                    </p>

                                </div>
                            )
                        )}

                    </div>

                )}

            </section>

            {/* Image viewer */}

            {imageViewerOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/85 p-6"
                    onClick={() =>
                        setImageViewerOpen(false)
                    }
                >

                    <div
                        className="relative flex h-full w-full items-center justify-center"
                        onClick={(event) =>
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

                        {/* Viewer controls */}

                        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl bg-white/95 p-2 shadow-xl">

                            <button
                                type="button"
                                onClick={() =>
                                    setImageZoom(
                                        (zoom) =>
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
                                    setImageZoom(1)
                                }
                                className="min-w-16 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                                {Math.round(
                                    imageZoom * 100
                                )}
                                %
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setImageZoom(
                                        (zoom) =>
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
    );
}
