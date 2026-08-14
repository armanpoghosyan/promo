import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

import type {
    Receipt,
    ReceiptResponse,
} from '../../types/receipt';

function formatDate(
    value: string | null | undefined
): string {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString();
}

export default function ReceiptDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const location = useLocation();

    const backUrl =
        location.state?.from ??
        '/admin/receipts?page=1'

    const [receipt, setReceipt] = useState<Receipt | null>(null);

    const [loading, setLoading] = useState(true);

    const [imageZoom, setImageZoom] = useState(1);

    const [imageViewerOpen, setImageViewerOpen] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [actionLoading, setActionLoading] = useState(false);

    const [actionError, setActionError] = useState<string | null>(null);

    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    const [showRejectForm, setShowRejectForm] = useState(false);

    const [showNoteForm, setShowNoteForm] = useState(false);

    const [rejectionReason, setRejectionReason] = useState('');

    const [note, setNote] = useState('');

    const approveReceipt = async () => {
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

            setReceipt(response.data.data);
        } catch (err) {
            console.error(err);

            setActionError(
                'Unable to approve receipt.'
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

            setReceipt(response.data.data);

            setShowRejectForm(false);
            setRejectionReason('');
        } catch (err) {
            console.error(err);

            setActionError(
                'Unable to reject receipt.'
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

            const newNote = response.data.data;

            setReceipt((currentReceipt) => {
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
            });

            setShowNoteForm(false);
            setNote('');

            setActionSuccess(
                response.data.message ||
                'Note added successfully.'
            );
        } catch (err: any) {
            console.error(err);

            setActionError(
                err?.response?.data?.message ||
                'Unable to add note.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        if (!id) {
            return;
        }

        const loadReceipt = async () => {
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

        loadReceipt();
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">
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
                    ← Back to receipts
                </Link>

                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    {error ?? 'Receipt not found.'}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Header */}

            <div className="flex items-center justify-between">

                <div>
                    <Link
                        to={backUrl}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        ← Back to receipts
                    </Link>

                    <div className="mt-3 flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Receipt #{receipt.id}
                        </h2>

                        <StatusBadge
                            status={receipt.status}
                        />
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                        Receipt number: {receipt.receipt_number}
                    </p>
                </div>

            </div>

            {/* Suspicious warning */}

            {receipt.is_suspicious && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                    <div className="flex items-start gap-3">

                        <div className="text-red-600">
                            ⚠
                        </div>

                        <div>
                            <h3 className="font-semibold text-red-800">
                                Suspicious receipt
                            </h3>

                            <p className="mt-1 text-sm text-red-700">
                                This receipt has been flagged by the system.
                            </p>

                            <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
                                {receipt.suspicious_reasons.map(
                                    (reason) => (
                                        <li key={reason}>
                                            {reason.replaceAll('_', ' ')}
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>

                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* Receipt image */}

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">

                    <h3 className="font-semibold text-gray-900">
                        Receipt Image
                    </h3>

                    <div
                        className="mt-4 flex min-h-96 cursor-zoom-in items-center justify-center overflow-hidden rounded-lg bg-gray-50 p-4"
                        onClick={() => {
                            setImageViewerOpen(true);
                            setImageZoom(1);
                        }}
                    >
                        <img
                            src={`/api/admin/receipts/${receipt.id}/image`}
                            alt={`Receipt ${receipt.receipt_number}`}
                            className="max-h-[700px] max-w-full rounded-lg object-contain shadow"
                        />
                    </div>

                </div>

                {/* Receipt information */}

                <div className="space-y-6">

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                        <h3 className="font-semibold text-gray-900">
                            Receipt Information
                        </h3>

                        <dl className="mt-4 space-y-4 text-sm">

                            <div>
                                <dt className="text-gray-500">
                                    Receipt number
                                </dt>

                                <dd className="mt-1 font-medium text-gray-900">
                                    {receipt.receipt_number}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-gray-500">
                                    Status
                                </dt>

                                <dd className="mt-1">
                                    <StatusBadge
                                        status={receipt.status}
                                    />
                                </dd>
                            </div>

                            <div>
                                <dt className="text-gray-500">
                                    Submitted
                                </dt>

                                <dd className="mt-1 text-gray-900">
                                    {formatDate(
                                        receipt.submitted_at
                                    )}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-gray-500">
                                    Verified
                                </dt>

                                <dd className="mt-1 text-gray-900">
                                    {formatDate(
                                        receipt.verified_at
                                    )}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-gray-500">
                                    Image hash
                                </dt>

                                <dd className="mt-1 break-all font-mono text-xs text-gray-700">
                                    {receipt.image_hash ?? '-'}
                                </dd>
                            </div>

                        </dl>

                    </div>

                    {/* Participant */}

                    {receipt.participant && (
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                            <h3 className="font-semibold text-gray-900">
                                Participant
                            </h3>

                            <dl className="mt-4 space-y-4 text-sm">

                                <div>
                                    <dt className="text-gray-500">
                                        Name
                                    </dt>

                                    <dd className="mt-1 font-medium text-gray-900">
                                        {receipt.participant.first_name}{' '}
                                        {receipt.participant.last_name}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-gray-500">
                                        Phone
                                    </dt>

                                    <dd className="mt-1 text-gray-900">
                                        {receipt.participant.phone}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-gray-500">
                                        Email
                                    </dt>

                                    <dd className="mt-1 break-all text-gray-900">
                                        {receipt.participant.email}
                                    </dd>
                                </div>

                            </dl>

                        </div>
                    )}

                </div>

            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900">
                    Verification
                </h3>

                {actionSuccess && (
                    <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        <span>{actionSuccess}</span>

                        <button
                            type="button"
                            onClick={() => setActionSuccess(null)}
                            className="ml-4 font-medium text-green-700 hover:text-green-900"
                        >
                            X
                        </button>
                    </div>
                )}

                {actionError && (
                    <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <span>{actionError}</span>

                        <button
                            type="button"
                            onClick={() => setActionError(null)}
                            className="ml-4 font-medium text-red-700 hover:text-red-900"
                        >
                            X
                        </button>
                    </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">

                    {receipt.status !== 'approved' &&
                        receipt.status !== 'rejected' && (
                            <>
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={approveReceipt}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {actionLoading
                                        ? 'Processing...'
                                        : 'Approve'}
                                </button>

                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() =>
                                        setShowRejectForm(
                                            !showRejectForm
                                        )
                                    }
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    Reject
                                </button>
                            </>
                        )}

                    <button
                        type="button"
                        onClick={() =>
                            setShowNoteForm(!showNoteForm)
                        }
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Add Note
                    </button>

                </div>

                {showRejectForm && (
                    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">

                        <label className="block text-sm font-medium text-red-800">
                            Rejection reason
                        </label>

                        <textarea
                            value={rejectionReason}
                            onChange={(event) =>
                                setRejectionReason(
                                    event.target.value
                                )
                            }
                            rows={3}
                            className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            placeholder="Enter the reason for rejection..."
                        />

                        <div className="mt-3 flex gap-2">

                            <button
                                type="button"
                                disabled={
                                    actionLoading ||
                                    !rejectionReason.trim()
                                }
                                onClick={rejectReceipt}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Confirm Rejection
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowRejectForm(false);
                                    setRejectionReason('');
                                }}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
                            >
                                Cancel
                            </button>

                        </div>

                    </div>
                )}

                {showNoteForm && (
                    <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">

                        <label className="block text-sm font-medium text-gray-700">
                            Note
                        </label>

                        <textarea
                            value={note}
                            onChange={(event) =>
                                setNote(event.target.value)
                            }
                            rows={3}
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Add an internal note..."
                        />

                        <button
                            type="button"
                            disabled={
                                actionLoading ||
                                !note.trim()
                            }
                            onClick={addNote}
                            className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Save Note
                        </button>

                    </div>
                )}

            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                <h3 className="font-semibold text-gray-900">
                    Notes
                </h3>

                <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                    <div className="mt-3 space-y-3">
                        {receipt.notes.length === 0 ? (
                            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                                No notes.
                            </div>
                        ) : (
                            receipt.notes.map((item) => (
                                <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs font-medium text-gray-500">
                                            {item.user?.name ?? 'Admin'}
                                        </span>

                                        <span className="text-xs text-gray-400">
                                            {formatDate(item.created_at)}
                                        </span>
                                    </div>

                                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                                        {item.note}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {imageViewerOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
                    onClick={() => setImageViewerOpen(false)}
                >
                    <div
                        className="relative flex h-full w-full items-center justify-center"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <img
                            src={`/api/admin/receipts/${receipt.id}/image`}
                            alt={`Receipt ${receipt.receipt_number}`}
                            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                            style={{
                                transform: `scale(${imageZoom})`,
                                transition: 'transform 0.2s ease',
                            }}
                        />

                        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-white/95 p-2 shadow-lg">

                            <button
                                type="button"
                                onClick={() =>
                                    setImageZoom((zoom) =>
                                        Math.max(0.5, zoom - 0.25)
                                    )
                                }
                                className="rounded-lg px-3 py-2 text-lg font-medium text-gray-700 hover:bg-gray-100"
                            >
                                −
                            </button>

                            <button
                                type="button"
                                onClick={() => setImageZoom(1)}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                                {Math.round(imageZoom * 100)}%
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setImageZoom((zoom) =>
                                        Math.min(4, zoom + 0.25)
                                    )
                                }
                                className="rounded-lg px-3 py-2 text-lg font-medium text-gray-700 hover:bg-gray-100"
                            >
                                +
                            </button>

                            <button
                                type="button"
                                onClick={() => setImageViewerOpen(false)}
                                className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
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
