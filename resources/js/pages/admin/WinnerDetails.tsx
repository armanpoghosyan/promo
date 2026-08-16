import { useEffect, useState } from 'react';
import {
    Link,
    useLocation,
    useParams,
} from 'react-router-dom';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import type { ApiError } from '../../types/api';
import { formatDateTime } from '../../utils/date';
import { formatEnumLabel } from '../../utils/format';

type Participant = {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
};

type Receipt = {
    id: number;
    participant_id: number;
    receipt_number: string;
    receipt_image: string | null;
    status: string;
    is_suspicious: boolean;
    suspicious_reasons: string[] | null;
    submitted_at: string | null;
    verified_at: string | null;
    rejection_reason: string | null;
    notes: string | null;
    participant: Participant;
};

type Prize = {
    id: number;
    name: string;
    type: string;
    value: number | null;
    currency: string | null;
    total_quantity: number;
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
    draw_date: string | null;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    snapshot_at: string | null;
    random_provider: string | null;
    randomized_at: string | null;
};

type ContactAttempt = {
    id: number;
    draw_winner_id: number;
    created_by: number | null;
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
    status: string;
    selected_at: string;
    confirmed_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    replaced_winner_id: number | null;

    draw: Draw;
    draw_prize: DrawPrize;
    receipt: Receipt;
    contact_attempts: ContactAttempt[];

    replaced_winner: Winner | null;
    replacement_winner: Winner | null;
};

type WinnerResponse = {
    data: Winner;
};

type ContactAttemptResponse = {
    message?: string;
    data: ContactAttempt;
};


type ContactAttemptResult =
    | 'no_answer'
    | 'busy'
    | 'wrong_number'
    | 'contacted'
    | 'confirmed'
    | 'declined'
    | 'other';

const contactAttemptResults: Array<{
    value: ContactAttemptResult;
    label: string;
}> = [
    {
        value: 'no_answer',
        label: 'No answer',
    },
    {
        value: 'busy',
        label: 'Busy',
    },
    {
        value: 'wrong_number',
        label: 'Wrong number',
    },
    {
        value: 'contacted',
        label: 'Contacted',
    },
    {
        value: 'confirmed',
        label: 'Confirmed',
    },
    {
        value: 'declined',
        label: 'Declined',
    },
    {
        value: 'other',
        label: 'Other',
    },
];


function formatContactResult(
    result: string
): string {
    return (
        contactAttemptResults.find(
            (item) =>
                item.value === result
        )?.label ??
        formatEnumLabel(result)
    );
}

export default function WinnerDetails() {
    const { id } = useParams();
    const location = useLocation();

    const [winner, setWinner] =
        useState<Winner | null>(null);

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
    ] = useState<string | null>(null);

    const [
        actionSuccess,
        setActionSuccess,
    ] = useState<string | null>(null);

    const [
        showContactForm,
        setShowContactForm,
    ] = useState(false);

    const [
        contactResult,
        setContactResult,
    ] = useState('');

    const [
        contactNotes,
        setContactNotes,
    ] = useState('');

    const [
        showCancelForm,
        setShowCancelForm,
    ] = useState(false);

    const [
        cancellationReason,
        setCancellationReason,
    ] = useState('');

    const backToWinners =
        typeof location.state?.from ===
        'string'
            ? location.state.from
            : '/admin/winners';

    const loadWinner = async () => {
        if (!id) {
            setError(
                'Winner ID is missing.'
            );

            setLoading(false);

            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response =
                await api.get<WinnerResponse>(
                    `/admin/winners/${id}`
                );

            setWinner(
                response.data.data
            );
        } catch (err) {
            console.error(err);

            setError(
                'Unable to load winner.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWinner();
    }, [id]);

    const addContactAttempt = async () => {
        if (
            !winner ||
            !contactResult.trim()
        ) {
            return;
        }

        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
            const response =
                await api.post<ContactAttemptResponse>(
                    `/admin/winners/${winner.id}/contact-attempts`,
                    {
                        result:
                            contactResult.trim(),

                        notes:
                            contactNotes.trim() ||
                            null,
                    }
                );

            setActionSuccess(
                response.data.message ??
                'Contact attempt recorded.'
            );

            setContactResult('');
            setContactNotes('');
            setShowContactForm(false);

            await loadWinner();
        } catch (err) {
            console.error(err);

            const apiError =
                err as ApiError;

            setActionError(
                apiError.response?.data
                    ?.message ??
                'Unable to record contact attempt.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const confirmWinner = async () => {
        if (!winner) {
            return;
        }

        const confirmed =
            window.confirm(
                'Confirm this winner and prize?'
            );

        if (!confirmed) {
            return;
        }

        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
            const response =
                await api.post(
                    `/admin/winners/${winner.id}/confirm`
                );

            setActionSuccess(
                response.data.message ??
                'Winner confirmed successfully.'
            );

            await loadWinner();
        } catch (err) {
            console.error(err);

            const apiError =
                err as ApiError;

            setActionError(
                apiError.response?.data
                    ?.message ??
                'Unable to confirm winner.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const cancelWinner = async () => {
        if (
            !winner ||
            !cancellationReason.trim()
        ) {
            return;
        }

        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
            const response =
                await api.post(
                    `/admin/winners/${winner.id}/cancel`,
                    {
                        reason:
                            cancellationReason.trim(),
                    }
                );

            setActionSuccess(
                response.data.message ??
                'Winner cancelled successfully.'
            );

            setCancellationReason('');
            setShowCancelForm(false);

            await loadWinner();
        } catch (err) {
            console.error(err);

            const apiError =
                err as ApiError;

            setActionError(
                apiError.response?.data
                    ?.message ??
                'Unable to cancel winner.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const replaceWinner = async () => {
        if (!winner) {
            return;
        }

        const confirmed =
            window.confirm(
                'Select a replacement winner for this cancelled winner?'
            );

        if (!confirmed) {
            return;
        }

        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
            const response =
                await api.post(
                    `/admin/winners/${winner.id}/replace`
                );

            setActionSuccess(
                response.data.message ??
                'Replacement winner selected successfully.'
            );

            await loadWinner();
        } catch (err) {
            console.error(err);

            const apiError =
                err as ApiError;

            setActionError(
                apiError.response?.data
                    ?.message ??
                'Unable to select replacement winner.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-64 items-center justify-center text-sm text-gray-500">
                Loading winner...
            </div>
        );
    }

    if (error || !winner) {
        return (
            <div className="space-y-4">

                <Link
                    to={backToWinners}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to Winners
                </Link>

                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error ??
                        'Winner not found.'}
                </div>

            </div>
        );
    }

    const participant =
        winner.receipt.participant;

    const canManage =
        winner.status === 'selected' ||
        winner.status === 'contacting';

    const canReplace =
        winner.status === 'cancelled' &&
        !winner.replacement_winner;

    return (
        <div className="space-y-6">

            {/* Header */}

            <div>

                <Link
                    to={backToWinners}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to Winners
                </Link>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                        <div className="flex flex-wrap items-center gap-3">

                            <h2 className="text-2xl font-bold text-gray-900">
                                Winner #{winner.id}
                            </h2>

                            <StatusBadge
                                status={winner.status}
                            />

                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                            Week{' '}
                            {winner.draw.week_number}
                            {' · '}
                            Entry #
                            {winner.entry_number}
                            {' · '}
                            {winner.draw_prize.prize.name}
                        </p>

                    </div>

                </div>

            </div>

            {/* Feedback */}

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

            {/* Main workspace */}

            <div className="grid gap-6 xl:grid-cols-3">

                {/* Left */}

                <div className="space-y-6 xl:col-span-2">

                    {/* Participant + Prize */}

                    <div className="grid gap-6 md:grid-cols-2">

                        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                                <h3 className="font-semibold text-gray-900">
                                    Participant
                                </h3>

                                <Link
                                    to={`/admin/participants/${participant.id}`}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                    View profile
                                </Link>

                            </div>

                            <div className="space-y-4 p-5">

                                <div>

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Name
                                    </div>

                                    <div className="mt-1 text-lg font-semibold text-gray-900">
                                        {participant.first_name}{' '}
                                        {participant.last_name}
                                    </div>

                                </div>

                                <div>

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Phone
                                    </div>

                                    <div className="mt-1 text-sm text-gray-700">
                                        {participant.phone}
                                    </div>

                                </div>

                                <div>

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Email
                                    </div>

                                    <div className="mt-1 break-all text-sm text-gray-700">
                                        {participant.email}
                                    </div>

                                </div>

                            </div>

                        </section>

                        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                            <div className="border-b border-gray-200 px-5 py-4">

                                <h3 className="font-semibold text-gray-900">
                                    Prize
                                </h3>

                            </div>

                            <div className="space-y-4 p-5">

                                <div>

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Prize
                                    </div>

                                    <div className="mt-1 text-lg font-semibold text-gray-900">
                                        {winner.draw_prize.prize.name}
                                    </div>

                                </div>

                                {winner.draw_prize.prize.value !==
                                    null && (

                                        <div>

                                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Value
                                            </div>

                                            <div className="mt-1 text-sm font-medium text-gray-900">
                                                {winner.draw_prize.prize.value.toLocaleString()}
                                                {' '}
                                                {winner.draw_prize.prize.currency ??
                                                    ''}
                                            </div>

                                        </div>
                                    )}

                                <div>

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Draw Allocation
                                    </div>

                                    <div className="mt-1 text-sm text-gray-700">
                                        {
                                            winner.draw_prize
                                                .quantity
                                        }{' '}
                                        prize
                                        {winner.draw_prize.quantity ===
                                        1
                                            ? ''
                                            : 's'}
                                    </div>

                                </div>

                            </div>

                        </section>

                    </div>

                    {/* Receipt + Draw */}

                    <div className="grid gap-6 md:grid-cols-2">

                        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                                <h3 className="font-semibold text-gray-900">
                                    Receipt
                                </h3>

                                <Link
                                    to={`/admin/receipts/${winner.receipt.id}`}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                    View receipt
                                </Link>

                            </div>

                            <div className="space-y-4 p-5">

                                <div>

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Receipt Number
                                    </div>

                                    <div className="mt-1 font-semibold text-gray-900">
                                        {
                                            winner.receipt
                                                .receipt_number
                                        }
                                    </div>

                                </div>

                                <div>

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Status
                                    </div>

                                    <div className="mt-1">

                                        <StatusBadge
                                            status={
                                                winner.receipt
                                                    .status
                                            }
                                        />

                                    </div>

                                </div>

                                {winner.receipt.is_suspicious && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                        This receipt is marked as suspicious.
                                    </div>
                                )}

                            </div>

                        </section>

                        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                                <h3 className="font-semibold text-gray-900">
                                    Draw
                                </h3>

                                <Link
                                    to={`/admin/draws/${winner.draw.id}`}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                    View draw
                                </Link>

                            </div>

                            <div className="grid grid-cols-2 gap-4 p-5">

                                <div>

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Week
                                    </div>

                                    <div className="mt-1 font-medium text-gray-900">
                                        Week{' '}
                                        {
                                            winner.draw
                                                .week_number
                                        }
                                    </div>

                                </div>

                                <div>

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Entry
                                    </div>

                                    <div className="mt-1 font-medium text-gray-900">
                                        #
                                        {
                                            winner.entry_number
                                        }
                                    </div>

                                </div>

                                <div>

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Draw Status
                                    </div>

                                    <div className="mt-1">

                                        <StatusBadge
                                            status={
                                                winner.draw.status
                                            }
                                        />

                                    </div>

                                </div>

                                <div>

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Selected
                                    </div>

                                    <div className="mt-1 text-sm text-gray-700">
                                        {formatDateTime(
                                            winner.selected_at
                                        )}
                                    </div>

                                </div>

                            </div>

                        </section>

                    </div>

                    {/* Contact history */}

                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                            <div>

                                <h3 className="font-semibold text-gray-900">
                                    Contact History
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    {
                                        winner
                                            .contact_attempts
                                            .length
                                    }{' '}
                                    attempt
                                    {winner.contact_attempts.length ===
                                    1
                                        ? ''
                                        : 's'}
                                </p>

                            </div>

                            {canManage && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowContactForm(
                                            true
                                        );

                                        setShowCancelForm(
                                            false
                                        );
                                    }}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Add Contact Attempt
                                </button>
                            )}

                        </div>

                        {showContactForm && (
                            <div className="border-b border-gray-200 bg-gray-50 p-5">

                                <div className="grid gap-4 md:grid-cols-2">

                                    <div>

                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Result
                                        </label>

                                        <select
                                            value={
                                                contactResult
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setContactResult(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                actionLoading
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                        >

                                            <option value="">
                                                Select result
                                            </option>

                                            {contactAttemptResults.map(
                                                (item) => (
                                                    <option
                                                        key={
                                                            item.value
                                                        }
                                                        value={
                                                            item.value
                                                        }
                                                    >
                                                        {
                                                            item.label
                                                        }
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </div>

                                    <div>

                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Notes
                                        </label>

                                        <textarea
                                            value={
                                                contactNotes
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setContactNotes(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            rows={3}
                                            maxLength={5000}
                                            disabled={
                                                actionLoading
                                            }
                                            placeholder="Optional notes..."
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                        />

                                    </div>

                                </div>

                                <div className="mt-3 flex gap-2">

                                    <button
                                        type="button"
                                        onClick={
                                            addContactAttempt
                                        }
                                        disabled={
                                            actionLoading ||
                                            !contactResult
                                        }
                                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {actionLoading
                                            ? 'Saving...'
                                            : 'Save Attempt'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowContactForm(
                                                false
                                            );

                                            setContactResult(
                                                ''
                                            );

                                            setContactNotes(
                                                ''
                                            );
                                        }}
                                        disabled={
                                            actionLoading
                                        }
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                </div>

                            </div>
                        )}

                        {winner.contact_attempts.length ===
                        0 ? (

                            <div className="p-6 text-sm text-gray-400">
                                No contact attempts recorded.
                            </div>

                        ) : (

                            <div className="divide-y divide-gray-100">

                                {winner.contact_attempts.map(
                                    (attempt) => (

                                        <div
                                            key={
                                                attempt.id
                                            }
                                            className="p-5"
                                        >

                                            <div className="flex flex-wrap items-start justify-between gap-3">

                                                <div>

                                                    <div className="font-medium text-gray-900">
                                                        {formatContactResult(
                                                            attempt.result
                                                        )}
                                                    </div>

                                                    {attempt.notes && (
                                                        <p className="mt-2 whitespace-pre-line text-sm text-gray-600">
                                                            {
                                                                attempt.notes
                                                            }
                                                        </p>
                                                    )}

                                                </div>

                                                <div className="text-right">

                                                    <div className="text-xs text-gray-400">
                                                        {formatDateTime(
                                                            attempt.attempted_at
                                                        )}
                                                    </div>

                                                    <div className="mt-1 text-xs text-gray-300">
                                                        Attempt #
                                                        {
                                                            attempt.id
                                                        }
                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>
                        )}

                    </section>

                    {/* Replacement history */}

                    {(winner.replaced_winner ||
                        winner.replacement_winner) && (

                        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                            <div className="border-b border-gray-200 px-5 py-4">

                                <h3 className="font-semibold text-gray-900">
                                    Replacement History
                                </h3>

                            </div>

                            <div className="divide-y divide-gray-100">

                                {winner.replaced_winner && (

                                    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">

                                        <div>

                                            <div className="text-sm text-gray-500">
                                                Replacement for
                                            </div>

                                            <div className="mt-1 flex items-center gap-2">

                                                <span className="font-medium text-gray-900">
                                                    Winner #
                                                    {
                                                        winner
                                                            .replaced_winner
                                                            .id
                                                    }
                                                </span>

                                                <StatusBadge
                                                    status={
                                                        winner
                                                            .replaced_winner
                                                            .status
                                                    }
                                                />

                                            </div>

                                        </div>

                                        <Link
                                            to={`/admin/winners/${winner.replaced_winner.id}`}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            View winner →
                                        </Link>

                                    </div>

                                )}

                                {winner.replacement_winner && (

                                    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">

                                        <div>

                                            <div className="text-sm text-gray-500">
                                                Replaced by
                                            </div>

                                            <div className="mt-1 flex items-center gap-2">

                                                <span className="font-medium text-gray-900">
                                                    Winner #
                                                    {
                                                        winner
                                                            .replacement_winner
                                                            .id
                                                    }
                                                </span>

                                                <StatusBadge
                                                    status={
                                                        winner
                                                            .replacement_winner
                                                            .status
                                                    }
                                                />

                                            </div>

                                        </div>

                                        <Link
                                            to={`/admin/winners/${winner.replacement_winner.id}`}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            View winner →
                                        </Link>

                                    </div>

                                )}

                            </div>

                        </section>
                    )}

                </div>

                {/* Right: Action panel */}

                <div>

                    <div className="xl:sticky xl:top-6">

                        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                            <div className="border-b border-gray-200 px-5 py-4">

                                <div className="flex items-center justify-between gap-3">

                                    <div>

                                        <h3 className="font-semibold text-gray-900">
                                            Winner Action
                                        </h3>

                                        <p className="mt-1 text-xs text-gray-500">
                                            Manage confirmation and replacement.
                                        </p>

                                    </div>

                                    <StatusBadge
                                        status={
                                            winner.status
                                        }
                                    />

                                </div>

                            </div>

                            <div className="space-y-5 p-5">

                                {/* Current status */}

                                <div>

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Current Status
                                    </div>

                                    <div className="mt-2">

                                        <StatusBadge
                                            status={
                                                winner.status
                                            }
                                        />

                                    </div>

                                </div>

                                {/* Contact summary */}

                                <div className="rounded-lg bg-gray-50 p-4">

                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        Contact Attempts
                                    </div>

                                    <div className="mt-1 text-2xl font-bold text-gray-900">
                                        {
                                            winner
                                                .contact_attempts
                                                .length
                                        }
                                    </div>

                                </div>

                                {/* Selected / contacting */}

                                {canManage && (
                                    <div className="space-y-3 border-t border-gray-200 pt-5">

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowContactForm(
                                                    true
                                                );

                                                setShowCancelForm(
                                                    false
                                                );
                                            }}
                                            disabled={
                                                actionLoading
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Add Contact Attempt
                                        </button>

                                        <button
                                            type="button"
                                            onClick={
                                                confirmWinner
                                            }
                                            disabled={
                                                actionLoading
                                            }
                                            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {actionLoading
                                                ? 'Processing...'
                                                : 'Confirm Winner'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCancelForm(
                                                    !showCancelForm
                                                );

                                                setShowContactForm(
                                                    false
                                                );
                                            }}
                                            disabled={
                                                actionLoading
                                            }
                                            className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                        >
                                            Cancel Winner
                                        </button>

                                    </div>
                                )}

                                {/* Cancellation form */}

                                {showCancelForm && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">

                                        <label className="block text-sm font-medium text-red-800">
                                            Cancellation reason
                                        </label>

                                        <textarea
                                            value={
                                                cancellationReason
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setCancellationReason(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            rows={4}
                                            autoFocus
                                            placeholder="Explain why this winner is being cancelled..."
                                            className="mt-2 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                        />

                                        <div className="mt-3 flex gap-2">

                                            <button
                                                type="button"
                                                onClick={
                                                    cancelWinner
                                                }
                                                disabled={
                                                    actionLoading ||
                                                    !cancellationReason.trim()
                                                }
                                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Confirm Cancellation
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowCancelForm(
                                                        false
                                                    );

                                                    setCancellationReason(
                                                        ''
                                                    );
                                                }}
                                                disabled={
                                                    actionLoading
                                                }
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>

                                        </div>

                                    </div>
                                )}

                                {/* Confirmed */}

                                {winner.status ===
                                    'confirmed' && (

                                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">

                                            <div className="font-medium text-green-800">
                                                Winner confirmed
                                            </div>

                                            <div className="mt-1 text-sm text-green-700">
                                                Confirmed{' '}
                                                {formatDateTime(
                                                    winner.confirmed_at
                                                )}
                                            </div>

                                        </div>
                                    )}

                                {/* Cancelled */}

                                {winner.status ===
                                    'cancelled' && (

                                        <div className="space-y-4">

                                            <div className="rounded-lg border border-red-200 bg-red-50 p-4">

                                                <div className="font-medium text-red-800">
                                                    Winner cancelled
                                                </div>

                                                <div className="mt-1 text-sm text-red-700">
                                                    {winner.cancellation_reason ??
                                                        'No cancellation reason recorded.'}
                                                </div>

                                                {winner.cancelled_at && (
                                                    <div className="mt-2 text-xs text-red-500">
                                                        {formatDateTime(
                                                            winner.cancelled_at
                                                        )}
                                                    </div>
                                                )}

                                            </div>

                                            {canReplace && (
                                                <button
                                                    type="button"
                                                    onClick={
                                                        replaceWinner
                                                    }
                                                    disabled={
                                                        actionLoading
                                                    }
                                                    className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {actionLoading
                                                        ? 'Selecting...'
                                                        : 'Select Replacement'}
                                                </button>
                                            )}

                                            {winner.replacement_winner && (
                                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">

                                                    <div className="text-sm text-blue-700">
                                                        Replacement selected
                                                    </div>

                                                    <Link
                                                        to={`/admin/winners/${winner.replacement_winner.id}`}
                                                        className="mt-2 inline-flex font-medium text-blue-700 hover:text-blue-900"
                                                    >
                                                        Winner #
                                                        {
                                                            winner
                                                                .replacement_winner
                                                                .id
                                                        }{' '}
                                                        →
                                                    </Link>

                                                </div>
                                            )}

                                        </div>
                                    )}

                                {/* Replacement winner */}

                                {winner.replaced_winner && (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">

                                        <div className="text-xs font-medium uppercase tracking-wide text-blue-600">
                                            Replacement
                                        </div>

                                        <div className="mt-1 text-sm text-blue-800">
                                            This winner replaces
                                            Winner #
                                            {
                                                winner
                                                    .replaced_winner
                                                    .id
                                            }
                                            .
                                        </div>

                                    </div>
                                )}

                            </div>

                        </section>

                    </div>

                </div>

            </div>

        </div>
    );
}
