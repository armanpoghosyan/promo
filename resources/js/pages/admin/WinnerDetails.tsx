import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

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

const formatDate = (
    value: string | null
): string => {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString();
};

const formatContactResult = (
    result: string
): string => {
    return result
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
};

export default function WinnerDetails() {
    const { id } = useParams();
    const location = useLocation();

    const [winner, setWinner] =
        useState<Winner | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    /*
     * Preserve the Winners list URL.
     *
     * Example:
     * /admin/winners?page=2&status=selected
     *
     * When opened from the list, this value is passed
     * through location.state.from.
     *
     * If the details page is opened directly, fall back
     * to the default Winners page.
     */
    const backToWinners =
        typeof location.state?.from === 'string'
            ? location.state.from
            : '/admin/winners';

    const loadWinner = async () => {
        if (!id) {
            setError('Winner ID is missing.');
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

            setWinner(response.data.data);
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

    if (loading) {
        return (
            <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">
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

                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    {error ?? 'Winner not found.'}
                </div>

            </div>
        );
    }

    const participant =
        winner.receipt.participant;

    return (
        <div className="space-y-6">

            {/* Header */}

            <div className="flex items-start justify-between">

                <div>

                    <Link
                        to={backToWinners}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Winners
                    </Link>

                    <div className="mt-3 flex items-center gap-3">

                        <h2 className="text-2xl font-bold text-gray-900">
                            Winner #{winner.id}
                        </h2>

                        <StatusBadge
                            status={winner.status}
                        />

                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                        Entry #{winner.entry_number}
                        {' · '}
                        Week {winner.draw.week_number}
                    </p>

                </div>

            </div>

            {/* Basic winner information */}

            <div className="grid gap-6 lg:grid-cols-2">

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="border-b border-gray-200 px-5 py-4">
                        <h3 className="font-semibold text-gray-900">
                            Winner Information
                        </h3>
                    </div>

                    <div className="space-y-4 p-5">

                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Status
                            </div>

                            <div className="mt-1">
                                <StatusBadge
                                    status={winner.status}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">

                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Entry Number
                                </div>

                                <div className="mt-1 font-medium text-gray-900">
                                    #{winner.entry_number}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Winner ID
                                </div>

                                <div className="mt-1 font-medium text-gray-900">
                                    #{winner.id}
                                </div>
                            </div>

                        </div>

                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Selected At
                            </div>

                            <div className="mt-1 text-sm text-gray-700">
                                {formatDate(
                                    winner.selected_at
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Confirmed At
                            </div>

                            <div className="mt-1 text-sm text-gray-700">
                                {formatDate(
                                    winner.confirmed_at
                                )}
                            </div>
                        </div>

                        {winner.cancelled_at && (
                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Cancelled At
                                </div>

                                <div className="mt-1 text-sm text-red-700">
                                    {formatDate(
                                        winner.cancelled_at
                                    )}
                                </div>
                            </div>
                        )}

                        {winner.cancellation_reason && (
                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Cancellation Reason
                                </div>

                                <div className="mt-1 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                    {winner.cancellation_reason}
                                </div>
                            </div>
                        )}

                    </div>

                </section>

                {/* Participant */}

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="border-b border-gray-200 px-5 py-4">
                        <h3 className="font-semibold text-gray-900">
                            Participant
                        </h3>
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

                            <div className="mt-1 text-sm text-gray-700">
                                {participant.email}
                            </div>
                        </div>

                    </div>

                </section>

            </div>

            {/* Prize + Receipt */}

            <div className="grid gap-6 lg:grid-cols-2">

                {/* Prize */}

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

                        <div className="grid grid-cols-2 gap-4">

                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Type
                                </div>

                                <div className="mt-1 text-sm text-gray-700">
                                    {winner.draw_prize.prize.type}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Quantity in Draw
                                </div>

                                <div className="mt-1 text-sm text-gray-700">
                                    {winner.draw_prize.quantity}
                                </div>
                            </div>

                        </div>

                        {winner.draw_prize.prize.value !== null && (
                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Value
                                </div>

                                <div className="mt-1 text-sm font-medium text-gray-900">
                                    {winner.draw_prize.prize.value}
                                    {' '}
                                    {winner.draw_prize.prize.currency ?? ''}
                                </div>
                            </div>
                        )}

                    </div>

                </section>

                {/* Receipt */}

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="border-b border-gray-200 px-5 py-4">
                        <h3 className="font-semibold text-gray-900">
                            Receipt
                        </h3>
                    </div>

                    <div className="space-y-4 p-5">

                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Receipt Number
                            </div>

                            <div className="mt-1 text-lg font-semibold text-gray-900">
                                {winner.receipt.receipt_number}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Status
                            </div>

                            <div className="mt-1">
                                <StatusBadge
                                    status={winner.receipt.status}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">

                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Submitted
                                </div>

                                <div className="mt-1 text-sm text-gray-700">
                                    {formatDate(
                                        winner.receipt.submitted_at
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Verified
                                </div>

                                <div className="mt-1 text-sm text-gray-700">
                                    {formatDate(
                                        winner.receipt.verified_at
                                    )}
                                </div>
                            </div>

                        </div>

                        {winner.receipt.is_suspicious && (
                            <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                                This receipt is marked as suspicious.
                            </div>
                        )}

                    </div>

                </section>

            </div>

            {/* Draw */}

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">
                    <h3 className="font-semibold text-gray-900">
                        Draw Information
                    </h3>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Draw
                        </div>

                        <div className="mt-1 font-medium text-gray-900">
                            #{winner.draw.id}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Week
                        </div>

                        <div className="mt-1 font-medium text-gray-900">
                            Week {winner.draw.week_number}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Status
                        </div>

                        <div className="mt-1">
                            <StatusBadge
                                status={winner.draw.status}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Random Provider
                        </div>

                        <div className="mt-1 text-sm text-gray-700">
                            {winner.draw.random_provider ?? '-'}
                        </div>
                    </div>

                </div>

            </section>

            {/* Contact Attempts */}

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">

                    <div className="flex items-center justify-between">

                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Contact Attempts
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                {winner.contact_attempts.length}{' '}
                                attempt
                                {winner.contact_attempts.length === 1
                                    ? ''
                                    : 's'}
                            </p>
                        </div>

                    </div>

                </div>

                {winner.contact_attempts.length === 0 ? (
                    <div className="p-5 text-sm text-gray-400">
                        No contact attempts recorded.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">

                        {winner.contact_attempts.map(
                            (attempt) => (
                                <div
                                    key={attempt.id}
                                    className="p-5"
                                >

                                    <div className="flex items-start justify-between gap-4">

                                        <div>

                                            <div className="font-medium text-gray-900">
                                                {formatContactResult(
                                                    attempt.result
                                                )}
                                            </div>

                                            <div className="mt-1 text-xs text-gray-500">
                                                {formatDate(
                                                    attempt.attempted_at
                                                )}
                                            </div>

                                        </div>

                                        <span className="text-xs text-gray-400">
                                            Attempt #{attempt.id}
                                        </span>

                                    </div>

                                    {attempt.notes && (
                                        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                                            {attempt.notes}
                                        </div>
                                    )}

                                </div>
                            )
                        )}

                    </div>
                )}

            </section>

            {/* Replacement information */}

            {(winner.replaced_winner ||
                winner.replacement_winner) && (
                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="border-b border-gray-200 px-5 py-4">
                        <h3 className="font-semibold text-gray-900">
                            Replacement History
                        </h3>
                    </div>

                    <div className="p-5">

                        {winner.replaced_winner && (
                            <div className="flex items-center gap-3">

                                <span className="font-medium text-gray-900">
                                    Replacement for Winner #
                                    {winner.replaced_winner.id}
                                </span>

                                <StatusBadge
                                    status={
                                        winner.replaced_winner.status
                                    }
                                />

                            </div>
                        )}

                        {winner.replacement_winner && (
                            <div className="flex items-center gap-3">

                                <span className="font-medium text-gray-900">
                                    Replaced by Winner #
                                    {winner.replacement_winner.id}
                                </span>

                                <StatusBadge
                                    status={
                                        winner.replacement_winner.status
                                    }
                                />

                            </div>
                        )}

                    </div>

                </section>
            )}

            {/* Back */}

            <div className="flex justify-between">

                <Link
                    to={backToWinners}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Back
                </Link>

            </div>

        </div>
    );
}
