import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import Alert from '../../components/Alert';
import LoadingState from '../../components/LoadingState';
import StatusBadge from '../../components/StatusBadge';

import api from '../../services/api';

import type {
    ContactAttemptResponse,
    ContactAttemptResult,
    WinnerDetail,
    WinnerResponse,
} from '../../types/winner';

import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';
import { formatEnumLabel } from '../../utils/format';
import {
    contactAttemptOptions,
    formatContactAttemptResult,
} from '../../utils/winner';

export default function WinnerDetails() {
    const { id } = useParams();
    const location = useLocation();

    const [winner, setWinner] = useState<WinnerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    const [showContactForm, setShowContactForm] = useState(false);
    const [contactResult, setContactResult] = useState<ContactAttemptResult | ''>('');
    const [contactNotes, setContactNotes] = useState('');

    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');

    const backToWinners =
        typeof location.state?.from === 'string'
            ? location.state.from
            : '/admin/winners';

    const loadWinner = useCallback(async () => {
        if (!id) {
            setError('Winner ID is missing.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.get<WinnerResponse>(`/admin/winners/${id}`);
            setWinner(response.data.data);
        } catch (error: unknown) {
            setError(
                getApiErrorMessage(
                    error,
                    'Unable to load winner.'
                )
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadWinner();
    }, [loadWinner]);

    const resetMessages = () => {
        setActionError(null);
        setActionSuccess(null);
    };

    const addContactAttempt = async () => {
        if (!winner || !contactResult) {
            return;
        }

        setActionLoading(true);
        resetMessages();

        try {
            const response = await api.post<ContactAttemptResponse>(`/admin/winners/${winner.id}/contact-attempts`,
                {
                    result: contactResult,
                    notes: contactNotes.trim() || null,
                }
            );

            setActionSuccess(response.data.message ??'Contact attempt recorded.');

            setContactResult('');
            setContactNotes('');
            setShowContactForm(false);

            await loadWinner();
        } catch (error: unknown) {
            setActionError(
                getApiErrorMessage(
                    error,
                    'Unable to record contact attempt.'
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    const confirmWinner = async () => {
        if (!winner || !window.confirm('Confirm this winner and prize?')) {
            return;
        }

        setActionLoading(true);
        resetMessages();

        try {
            const response = await api.post(`/admin/winners/${winner.id}/confirm`);

            setActionSuccess(response.data.message ?? 'Winner confirmed successfully.');

            await loadWinner();
        } catch (error: unknown) {
            setActionError(
                getApiErrorMessage(
                    error,
                    'Unable to confirm winner.'
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    const cancelWinner = async () => {
        if (!winner || !cancellationReason.trim()) {
            return;
        }

        setActionLoading(true);
        resetMessages();

        try {
            const response = await api.post(`/admin/winners/${winner.id}/cancel`,
                {
                    reason: cancellationReason.trim(),
                }
            );

            setActionSuccess(response.data.message ?? 'Winner cancelled successfully.');

            setCancellationReason('');
            setShowCancelForm(false);

            await loadWinner();
        } catch (error: unknown) {
            setActionError(
                getApiErrorMessage(
                    error,
                    'Unable to cancel winner.'
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    const replaceWinner = async () => {
        if (!winner || !window.confirm('Select a replacement winner for this cancelled winner?')) {
            return;
        }

        setActionLoading(true);
        resetMessages();

        try {
            const response = await api.post(`/admin/winners/${winner.id}/replace`);

            setActionSuccess(response.data.message ?? 'Replacement winner selected successfully.');

            await loadWinner();
        } catch (error: unknown) {
            setActionError(
                getApiErrorMessage(
                    error,
                    'Unable to select replacement winner.'
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    const contactAttempts = useMemo(
        () =>
            [...(winner?.contact_attempts ?? [])].sort(
                (a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime()
            ),
        [winner]
    );

    if (loading) {
        return <LoadingState message="Loading winner..." />;
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

                <Alert variant="error">
                    {error ?? 'Winner not found.'}
                </Alert>
            </div>
        );
    }

    const participant = winner.receipt.participant;
    const canManage = winner.status === 'selected' || winner.status === 'contacting';
    const canReplace = winner.status === 'cancelled' && !winner.replacement_winner;
    const latestAttempt = contactAttempts[0] ?? null;

    return (
        <div className="space-y-5">
            <header>
                <Link
                    to={backToWinners}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to Winners
                </Link>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">Winner #{winner.id}</h1>
                    <StatusBadge status={winner.status} />
                </div>

                <p className="mt-1 text-sm text-gray-500">
                    Week {winner.draw.week_number}
                    {' · '}
                    Entry #{winner.entry_number}
                    {' · '}
                    {winner.draw_prize.prize.name}
                </p>
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

            <div className="grid gap-4 lg:grid-cols-2">
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

                    <div className="grid gap-4 p-4 sm:grid-cols-2">
                        <InfoItem label="Name" value={`${participant.first_name} ${participant.last_name}`}/>
                        <InfoItem label="Phone" value={participant.phone}/>
                        <InfoItem label="Email" value={participant.email} className="sm:col-span-2"/>
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <SectionHeader
                        title="Prize"
                        action={
                            <Link
                                to={`/admin/draws/${winner.draw.id}`}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                                View Draw →
                            </Link>
                        }
                    />

                    <div className="grid gap-4 p-4 sm:grid-cols-2">
                        <InfoItem label="Prize" value={winner.draw_prize.prize.name}/>
                        <InfoItem label="Type" value={formatEnumLabel(winner.draw_prize.prize.type)}/>
                        <InfoItem label="Week" value={`Week ${winner.draw.week_number}`}/>
                        <InfoItem label="Entry" value={`#${winner.entry_number}`}/>
                    </div>
                </section>
            </div>

            {canManage && (
                <section className="overflow-hidden rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
                    <div className="p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                    Current Action
                                </div>
                                <h2 className="mt-1 text-lg font-semibold text-gray-900">Contact and Verify Winner</h2>

                                {contactAttempts.length === 0 ? (
                                    <p className="mt-1 text-sm text-gray-600">
                                        No contact attempts recorded.
                                    </p>
                                ) : (
                                    <p className="mt-1 text-sm text-gray-600">
                                        {contactAttempts.length}{' '}attempt {contactAttempts.length === 1 ? '' : 's'}
                                        {latestAttempt && (
                                            <>
                                                {' · Last: '}
                                                <strong>{formatContactAttemptResult(latestAttempt.result)}</strong>
                                                {' · '}
                                                {formatDateTime(latestAttempt.attempted_at)}
                                            </>
                                        )}
                                    </p>
                                )}
                            </div>

                            {!showContactForm && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowContactForm(true);
                                        setShowCancelForm(false);
                                    }}
                                    className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                                >
                                    + Record Contact
                                </button>
                            )}
                        </div>

                        {showContactForm && (
                            <div className="mt-4 rounded-lg border border-blue-200 bg-white p-4">
                                <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Result
                                        </label>

                                        <select
                                            value={contactResult}
                                            onChange={(event) =>
                                                setContactResult(event.target.value as | ContactAttemptResult  | '')
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                                        >
                                            <option value="">
                                                Select result
                                            </option>

                                            {contactAttemptOptions.map(
                                                (option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>

                                        <textarea
                                            value={contactNotes}
                                            onChange={(event) =>
                                                setContactNotes(event.target.value)
                                            }
                                            rows={2}
                                            placeholder="Optional notes about the call..."
                                            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                        />
                                    </div>
                                </div>

                                <div className="mt-3 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => {
                                            setShowContactForm(false);
                                            setContactResult('');
                                            setContactNotes('');
                                        }}
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        disabled={actionLoading || !contactResult}
                                        onClick={addContactAttempt}
                                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Saving...' : 'Save Attempt'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!showContactForm && !showCancelForm && (
                            <div className="mt-4 flex flex-wrap gap-2 border-t border-blue-200 pt-4">
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={confirmWinner}
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    Confirm Winner
                                </button>

                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => {
                                        setShowCancelForm(true);
                                        setShowContactForm(false);
                                    }}
                                    className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                    Cancel Winner
                                </button>
                            </div>
                        )}

                        {showCancelForm && (
                            <div className="mt-4 rounded-lg border border-red-200 bg-white p-4">
                                <label className="text-sm font-medium text-red-800">
                                    Cancellation Reason
                                </label>

                                <textarea
                                    value={cancellationReason}
                                    onChange={(event) =>
                                        setCancellationReason(event.target.value)
                                    }
                                    rows={3}
                                    autoFocus
                                    placeholder="Why is this winner being cancelled?"
                                    className="mt-2 w-full resize-none rounded-lg border border-red-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                                />

                                <div className="mt-3 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => {
                                            setShowCancelForm(false);
                                            setCancellationReason('');
                                        }}
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        disabled={actionLoading || !cancellationReason.trim()}
                                        onClick={cancelWinner}
                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {winner.status === 'confirmed' && (
                <section className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                Winner Confirmed
                            </div>

                            <div className="mt-1 text-sm text-gray-700">
                                Confirmed{' '}{formatDateTime(winner.confirmed_at)}
                            </div>
                        </div>

                        <StatusBadge status="confirmed" />
                    </div>
                </section>
            )}

            {winner.status === 'cancelled' && (
                <section className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-red-700">
                                Winner Cancelled
                            </div>

                            {winner.cancellation_reason && (
                                <p className="mt-1 text-sm text-red-800">
                                    {winner.cancellation_reason}
                                </p>
                            )}

                            <p className="mt-1 text-xs text-gray-500">
                                {formatDateTime(winner.cancelled_at)}
                            </p>
                        </div>

                        {canReplace && (
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={replaceWinner}
                                className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                                {actionLoading ? 'Selecting...' : 'Select Replacement'}
                            </button>
                        )}
                    </div>
                </section>
            )}

            {winner.replacement_winner && (
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <SectionHeader title="Replacement Winner" />

                    <div className="flex items-center justify-between gap-4 p-4">
                        <div>
                            <div className="font-medium text-gray-900">
                                Winner # {winner.replacement_winner.id}
                            </div>

                            <div className="mt-0.5 text-xs text-gray-500">
                                Replacement selected for this cancelled winner.
                            </div>
                        </div>

                        <Link
                            to={`/admin/winners/${winner.replacement_winner.id}`}
                            state={{ from: backToWinners }}
                            className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            Manage →
                        </Link>
                    </div>
                </section>
            )}

            {winner.replaced_winner && (
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <SectionHeader title="Replacement Context" />

                    <div className="flex items-center justify-between gap-4 p-4">
                        <span className="text-sm text-gray-600">
                            This winner replaced Winner #
                            {winner.replaced_winner.id}.
                        </span>

                        <Link
                            to={`/admin/winners/${winner.replaced_winner.id}`}
                            state={{ from: backToWinners }}
                            className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            View Original →
                        </Link>
                    </div>
                </section>
            )}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <SectionHeader
                    title="Contact History"
                    action={
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {contactAttempts.length}
                        </span>
                    }
                />

                {contactAttempts.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-gray-400">
                        No contact attempts recorded.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {contactAttempts.map((attempt) => (
                            <div key={attempt.id} className="grid gap-2 px-4 py-3 md:grid-cols-[170px_150px_minmax(0,1fr)]">
                                <div className="text-xs text-gray-500">
                                    {formatDateTime(attempt.attempted_at)}
                                </div>

                                <div>
                                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                                        {formatContactAttemptResult(attempt.result)}
                                    </span>
                                </div>

                                <div className="whitespace-pre-wrap text-sm text-gray-700">
                                    {attempt.notes || '—'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <SectionHeader
                    title="Winning Receipt"
                    action={
                        <Link
                            to={`/admin/receipts/${winner.receipt.id}`}
                            state={{from: `/admin/winners/${winner.id}`}}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                            Full Details →
                        </Link>
                    }
                />

                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoItem label="Receipt Number" value={winner.receipt.receipt_number}/>
                    <InfoItem label="Receipt ID" value={`#${winner.receipt.id}`}/>
                    <InfoItem label="Status" value={formatEnumLabel(winner.receipt.status)}/>
                    <InfoItem label="Submitted" value={formatDateTime(winner.receipt.submitted_at)}/>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <SectionHeader title="Technical & Audit Details" />
                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoItem label="Winner ID" value={`#${winner.id}`}/>
                    <InfoItem label="Draw ID" value={`#${winner.draw_id}`}/>
                    <InfoItem label="Entry Number" value={`#${winner.entry_number}`}/>
                    <InfoItem label="Selected" value={formatDateTime(winner.selected_at)}/>
                    <InfoItem label="Confirmed" value={formatDateTime(winner.confirmed_at)}/>
                    <InfoItem label="Cancelled" value={formatDateTime(winner.cancelled_at)}/>
                    <InfoItem label="Draw Date" value={formatDateTime(winner.draw.draw_date)}/>
                    <InfoItem label="Random Provider" value={winner.draw.random_provider ?? '—'}/>
                </div>
            </section>
        </div>
    );
}

function SectionHeader({title, action,}: { title: string; action?: React.ReactNode;}) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3">
            <h2 className="font-semibold text-gray-900">{title}</h2>
            {action}
        </div>
    );
}

function InfoItem({label, value, className = '',}: { label: string; value: React.ReactNode; className?: string; }) {
    return (
        <div className={className}>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</div>
            <div className="mt-1 break-all text-sm text-gray-700">
                {value}
            </div>
        </div>
    );
}
