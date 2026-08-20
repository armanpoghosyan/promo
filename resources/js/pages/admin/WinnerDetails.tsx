import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    Link,
    useLocation,
    useParams,
} from 'react-router-dom';

import LoadingState from '../../components/LoadingState';
import StatusBadge from '../../components/StatusBadge';

import api from '../../services/api';

import type {
    ApiError,
} from '../../types/api';

import {
    formatDateTime,
} from '../../utils/date';

import {
    formatEnumLabel,
} from '../../utils/format';

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

    receipt_image:
        | string
        | null;

    status: string;
    is_suspicious: boolean;

    suspicious_reasons:
        | string[]
        | null;

    submitted_at:
        | string
        | null;

    verified_at:
        | string
        | null;

    rejection_reason:
        | string
        | null;

    participant: Participant;
};

type Prize = {
    id: number;
    name: string;
    type: string;

    value?:
        | number
        | string
        | null;

    currency?:
        | string
        | null;

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

    draw_date:
        | string
        | null;

    status: string;

    started_at:
        | string
        | null;

    completed_at:
        | string
        | null;

    snapshot_at:
        | string
        | null;

    random_provider:
        | string
        | null;

    randomized_at:
        | string
        | null;
};

type ContactAttempt = {
    id: number;
    draw_winner_id: number;

    created_by:
        | number
        | null;

    attempted_at: string;
    result: string;

    notes:
        | string
        | null;
};

type Winner = {
    id: number;

    draw_id: number;
    draw_prize_id: number;
    receipt_id: number;
    entry_number: number;

    status: string;

    selected_at: string;

    confirmed_at:
        | string
        | null;

    cancelled_at:
        | string
        | null;

    cancellation_reason:
        | string
        | null;

    replaced_winner_id:
        | number
        | null;

    draw: Draw;
    draw_prize: DrawPrize;
    receipt: Receipt;

    contact_attempts:
        ContactAttempt[];

    replaced_winner:
        | Winner
        | null;

    replacement_winner:
        | Winner
        | null;
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
            (
                item
            ) =>
                item.value ===
                result
        )?.label ??
        formatEnumLabel(
            result
        )
    );
}

function getApiMessage(
    error: unknown,
    fallback: string
): string {
    const apiError =
        error as ApiError;

    return (
        apiError.response?.data
            ?.message ??
        fallback
    );
}

export default function WinnerDetails() {
    const {
        id,
    } = useParams();

    const location =
        useLocation();

    const [
        winner,
        setWinner,
    ] = useState<
        Winner | null
    >(null);

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

    const loadWinner =
        async () => {
            if (!id) {
                setError(
                    'Winner ID is missing.'
                );

                setLoading(
                    false
                );

                return;
            }

            setLoading(
                true
            );

            setError(
                null
            );

            try {
                const response =
                    await api.get<WinnerResponse>(
                        `/admin/winners/${id}`
                    );

                setWinner(
                    response.data.data
                );
            } catch (
                error: unknown
                ) {
                console.error(
                    error
                );

                setError(
                    'Unable to load winner.'
                );
            } finally {
                setLoading(
                    false
                );
            }
        };

    useEffect(() => {
        loadWinner();
    }, [
        id,
    ]);

    const addContactAttempt =
        async () => {
            if (
                !winner ||
                !contactResult
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
                    await api.post<ContactAttemptResponse>(
                        `/admin/winners/${winner.id}/contact-attempts`,
                        {
                            result:
                            contactResult,

                            notes:
                                contactNotes.trim() ||
                                null,
                        }
                    );

                setActionSuccess(
                    response.data
                        .message ??
                    'Contact attempt recorded.'
                );

                setContactResult(
                    ''
                );

                setContactNotes(
                    ''
                );

                setShowContactForm(
                    false
                );

                await loadWinner();
            } catch (
                error: unknown
                ) {
                setActionError(
                    getApiMessage(
                        error,
                        'Unable to record contact attempt.'
                    )
                );
            } finally {
                setActionLoading(
                    false
                );
            }
        };

    const confirmWinner =
        async () => {
            if (!winner) {
                return;
            }

            if (
                !window.confirm(
                    'Confirm this winner and prize?'
                )
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
                    await api.post(
                        `/admin/winners/${winner.id}/confirm`
                    );

                setActionSuccess(
                    response.data
                        .message ??
                    'Winner confirmed successfully.'
                );

                await loadWinner();
            } catch (
                error: unknown
                ) {
                setActionError(
                    getApiMessage(
                        error,
                        'Unable to confirm winner.'
                    )
                );
            } finally {
                setActionLoading(
                    false
                );
            }
        };

    const cancelWinner =
        async () => {
            if (
                !winner ||
                !cancellationReason.trim()
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
                    await api.post(
                        `/admin/winners/${winner.id}/cancel`,
                        {
                            reason:
                                cancellationReason.trim(),
                        }
                    );

                setActionSuccess(
                    response.data
                        .message ??
                    'Winner cancelled successfully.'
                );

                setCancellationReason(
                    ''
                );

                setShowCancelForm(
                    false
                );

                await loadWinner();
            } catch (
                error: unknown
                ) {
                setActionError(
                    getApiMessage(
                        error,
                        'Unable to cancel winner.'
                    )
                );
            } finally {
                setActionLoading(
                    false
                );
            }
        };

    const replaceWinner =
        async () => {
            if (!winner) {
                return;
            }

            if (
                !window.confirm(
                    'Select a replacement winner for this cancelled winner?'
                )
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
                    await api.post(
                        `/admin/winners/${winner.id}/replace`
                    );

                setActionSuccess(
                    response.data
                        .message ??
                    'Replacement winner selected successfully.'
                );

                await loadWinner();
            } catch (
                error: unknown
                ) {
                setActionError(
                    getApiMessage(
                        error,
                        'Unable to select replacement winner.'
                    )
                );
            } finally {
                setActionLoading(
                    false
                );
            }
        };

    const contactAttempts =
        useMemo(
            () =>
                [
                    ...(winner?.contact_attempts ??
                        []),
                ].sort(
                    (
                        first,
                        second
                    ) =>
                        new Date(
                            second.attempted_at
                        ).getTime() -
                        new Date(
                            first.attempted_at
                        ).getTime()
                ),
            [
                winner,
            ]
        );

    if (
        loading
    ) {
        return (
            <LoadingState
                message="Loading winner..."
            />
        );
    }

    if (
        error ||
        !winner
    ) {
        return (
            <div className="space-y-4">
                <Link
                    to={
                        backToWinners
                    }
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
        winner.receipt
            .participant;

    const canManage =
        winner.status ===
        'selected' ||
        winner.status ===
        'contacting';

    const canReplace =
        winner.status ===
        'cancelled' &&
        !winner.replacement_winner;

    const latestAttempt =
        contactAttempts[0] ??
        null;

    const prizeValue =
        winner.draw_prize
            .prize.value;

    return (
        <div className="space-y-6">
            {/* Header */}

            <header>
                <Link
                    to={
                        backToWinners
                    }
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to Winners
                </Link>

                <div className="mt-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Winner #
                            {
                                winner.id
                            }
                        </h1>

                        <StatusBadge
                            status={
                                winner.status
                            }
                        />
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                        Week{' '}
                        {
                            winner.draw
                                .week_number
                        }

                        {' · '}

                        Entry #
                        {
                            winner.entry_number
                        }

                        {' · '}

                        {
                            winner.draw_prize
                                .prize.name
                        }
                    </p>
                </div>
            </header>

            {/* Feedback */}

            {actionSuccess && (
                <FeedbackAlert
                    type="success"
                    onClose={() =>
                        setActionSuccess(
                            null
                        )
                    }
                >
                    {
                        actionSuccess
                    }
                </FeedbackAlert>
            )}

            {actionError && (
                <FeedbackAlert
                    type="error"
                    onClose={() =>
                        setActionError(
                            null
                        )
                    }
                >
                    {
                        actionError
                    }
                </FeedbackAlert>
            )}

            {/* Main identity */}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Participant */}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                        <h2 className="font-semibold text-gray-900">
                            Participant
                        </h2>

                        <Link
                            to={`/admin/participants/${participant.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            View Participant →
                        </Link>
                    </div>

                    <div className="space-y-4 p-5">
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Name
                            </div>

                            <div className="mt-1 text-lg font-semibold text-gray-900">
                                {
                                    participant.first_name
                                }{' '}
                                {
                                    participant.last_name
                                }
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Phone
                                </div>

                                <div className="mt-1 text-sm font-medium text-gray-800">
                                    {
                                        participant.phone
                                    }
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Email
                                </div>

                                <div className="mt-1 break-all text-sm text-gray-700">
                                    {
                                        participant.email
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Prize */}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                        <h2 className="font-semibold text-gray-900">
                            Prize
                        </h2>
                    </div>

                    <div className="space-y-4 p-5">
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Prize
                            </div>

                            <div className="mt-1 text-lg font-semibold text-gray-900">
                                {
                                    winner.draw_prize
                                        .prize.name
                                }
                            </div>
                        </div>

                        {prizeValue !=
                            null && (
                                <div>
                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        Value
                                    </div>

                                    <div className="mt-1 text-sm font-medium text-gray-800">
                                        {Number(
                                            prizeValue
                                        ).toLocaleString()}{' '}
                                        {winner
                                                .draw_prize
                                                .prize
                                                .currency ??
                                            ''}
                                    </div>
                                </div>
                            )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Draw
                                </div>

                                <Link
                                    to={`/admin/draws/${winner.draw.id}`}
                                    className="mt-1 inline-flex text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                    Week{' '}
                                    {
                                        winner.draw
                                            .week_number
                                    }{' '}
                                    →
                                </Link>
                            </div>

                            <div>
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Entry
                                </div>

                                <div className="mt-1 text-sm text-gray-700">
                                    #
                                    {
                                        winner.entry_number
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Current Action */}

            {canManage && (
                <section className="overflow-hidden rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
                    <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                    Current Action
                                </div>

                                <h2 className="mt-1 text-xl font-semibold text-gray-900">
                                    Contact and Verify Winner
                                </h2>

                                {contactAttempts.length ===
                                0 ? (
                                    <p className="mt-2 text-sm text-gray-600">
                                        No contact
                                        attempts have
                                        been recorded
                                        yet.
                                    </p>
                                ) : (
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-600">
                                            {
                                                contactAttempts.length
                                            }{' '}
                                            contact
                                            attempt
                                            {contactAttempts.length ===
                                            1
                                                ? ''
                                                : 's'}{' '}
                                            recorded.
                                        </p>

                                        {latestAttempt && (
                                            <p className="mt-1 text-sm text-gray-600">
                                                Last:{' '}
                                                <strong>
                                                    {formatContactResult(
                                                        latestAttempt.result
                                                    )}
                                                </strong>{' '}
                                                ·{' '}
                                                {formatDateTime(
                                                    latestAttempt.attempted_at
                                                )}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {!showContactForm && (
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
                                    className="shrink-0 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                                >
                                    + Record Contact Attempt
                                </button>
                            )}
                        </div>

                        {showContactForm && (
                            <div className="mt-5 rounded-xl border border-blue-200 bg-white p-4">
                                <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
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
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                                        >
                                            <option value="">
                                                Select
                                                result
                                            </option>

                                            {contactAttemptResults.map(
                                                (
                                                    item
                                                ) => (
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
                                            rows={
                                                3
                                            }
                                            placeholder="Optional notes about the call..."
                                            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                        />
                                    </div>
                                </div>

                                <div className="mt-3 flex justify-end gap-2">
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
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            addContactAttempt
                                        }
                                        disabled={
                                            actionLoading ||
                                            !contactResult
                                        }
                                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        {actionLoading
                                            ? 'Saving...'
                                            : 'Save Attempt'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!showContactForm &&
                            !showCancelForm && (
                                <div className="mt-5 flex flex-wrap gap-3 border-t border-blue-200 pt-5">
                                    <button
                                        type="button"
                                        onClick={
                                            confirmWinner
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                        className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                        Confirm Winner
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCancelForm(
                                                true
                                            );

                                            setShowContactForm(
                                                false
                                            );
                                        }}
                                        disabled={
                                            actionLoading
                                        }
                                        className="rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        Cancel Winner
                                    </button>
                                </div>
                            )}

                        {showCancelForm && (
                            <div className="mt-5 rounded-xl border border-red-200 bg-white p-4">
                                <label className="text-sm font-medium text-red-800">
                                    Cancellation Reason
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
                                    rows={
                                        4
                                    }
                                    autoFocus
                                    placeholder="Why is this winner being cancelled?"
                                    className="mt-2 w-full resize-none rounded-lg border border-red-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                                />

                                <div className="mt-3 flex justify-end gap-2">
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
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            cancelWinner
                                        }
                                        disabled={
                                            actionLoading ||
                                            !cancellationReason.trim()
                                        }
                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {actionLoading
                                            ? 'Cancelling...'
                                            : 'Confirm Cancellation'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Confirmed */}

            {winner.status ===
                'confirmed' && (
                    <section className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wide text-green-700">
                            Winner Confirmed
                        </div>

                        <h2 className="mt-1 text-lg font-semibold text-gray-900">
                            Prize confirmed
                        </h2>

                        <p className="mt-2 text-sm text-gray-600">
                            Confirmed{' '}
                            {formatDateTime(
                                winner.confirmed_at
                            )}
                        </p>
                    </section>
                )}

            {/* Cancelled */}

            {winner.status ===
                'cancelled' && (
                    <section className="overflow-hidden rounded-xl border border-red-200 bg-red-50 shadow-sm">
                        <div className="p-5">
                            <div className="text-xs font-semibold uppercase tracking-wide text-red-700">
                                Winner Cancelled
                            </div>

                            <h2 className="mt-1 text-lg font-semibold text-gray-900">
                                Winner is no longer
                                active
                            </h2>

                            {winner.cancellation_reason && (
                                <div className="mt-4 rounded-lg border border-red-200 bg-white p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-red-600">
                                        Cancellation
                                        Reason
                                    </div>

                                    <div className="mt-2 whitespace-pre-wrap text-sm text-red-800">
                                        {
                                            winner.cancellation_reason
                                        }
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 text-xs text-gray-500">
                                Cancelled{' '}
                                {formatDateTime(
                                    winner.cancelled_at
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
                                    className="mt-5 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {actionLoading
                                        ? 'Selecting...'
                                        : 'Select Replacement Winner'}
                                </button>
                            )}
                        </div>
                    </section>
                )}

            {/* Replacement */}

            {winner.replacement_winner && (
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                        <h2 className="font-semibold text-gray-900">
                            Replacement Winner
                        </h2>
                    </div>

                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="font-semibold text-gray-900">
                                Winner #
                                {
                                    winner
                                        .replacement_winner
                                        .id
                                }
                            </div>

                            <div className="mt-1 text-sm text-gray-500">
                                Receipt{' '}
                                {
                                    winner
                                        .replacement_winner
                                        .receipt
                                        ?.receipt_number
                                }
                            </div>
                        </div>

                        <Link
                            to={`/admin/winners/${winner.replacement_winner.id}`}
                            state={{
                                from:
                                backToWinners,
                            }}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            Manage Replacement →
                        </Link>
                    </div>
                </section>
            )}

            {/* This winner replaced another */}

            {winner.replaced_winner && (
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                        <h2 className="font-semibold text-gray-900">
                            Replacement Context
                        </h2>
                    </div>

                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-sm text-gray-600">
                                This winner replaced
                                Winner #
                                {
                                    winner
                                        .replaced_winner
                                        .id
                                }.
                            </div>
                        </div>

                        <Link
                            to={`/admin/winners/${winner.replaced_winner.id}`}
                            state={{
                                from:
                                backToWinners,
                            }}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            View Original Winner →
                        </Link>
                    </div>
                </section>
            )}

            {/* Contact History */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Contact History
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                            Complete organizer
                            contact history for
                            this winner.
                        </p>
                    </div>

                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        {
                            contactAttempts.length
                        }
                    </span>
                </div>

                {contactAttempts.length ===
                0 ? (
                    <div className="p-6 text-sm text-gray-400">
                        No contact attempts
                        recorded.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {contactAttempts.map(
                            (
                                attempt
                            ) => (
                                <div
                                    key={
                                        attempt.id
                                    }
                                    className="grid gap-3 px-5 py-4 md:grid-cols-[180px_180px_minmax(0,1fr)]"
                                >
                                    <div className="text-sm text-gray-500">
                                        {formatDateTime(
                                            attempt.attempted_at
                                        )}
                                    </div>

                                    <div>
                                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                            {formatContactResult(
                                                attempt.result
                                            )}
                                        </span>
                                    </div>

                                    <div className="whitespace-pre-wrap text-sm text-gray-700">
                                        {attempt.notes ||
                                            '—'}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </section>

            {/* Receipt */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <h2 className="font-semibold text-gray-900">
                        Winning Receipt
                    </h2>

                    <Link
                        to={`/admin/receipts/${winner.receipt.id}`}
                        state={{
                            from:
                                `/admin/winners/${winner.id}`,
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        Full Receipt Details →
                    </Link>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoItem
                        label="Receipt Number"
                        value={
                            winner.receipt
                                .receipt_number
                        }
                    />

                    <InfoItem
                        label="Receipt ID"
                        value={`#${winner.receipt.id}`}
                    />

                    <InfoItem
                        label="Receipt Status"
                        value={formatEnumLabel(
                            winner.receipt
                                .status
                        )}
                    />

                    <InfoItem
                        label="Submitted"
                        value={formatDateTime(
                            winner.receipt
                                .submitted_at
                        )}
                    />
                </div>
            </section>

            {/* Technical & Audit */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                    <h2 className="font-semibold text-gray-900">
                        Technical & Audit Details
                    </h2>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoItem
                        label="Winner ID"
                        value={`#${winner.id}`}
                    />

                    <InfoItem
                        label="Draw ID"
                        value={`#${winner.draw_id}`}
                    />

                    <InfoItem
                        label="Entry Number"
                        value={`#${winner.entry_number}`}
                    />

                    <InfoItem
                        label="Selected"
                        value={formatDateTime(
                            winner.selected_at
                        )}
                    />

                    <InfoItem
                        label="Confirmed"
                        value={formatDateTime(
                            winner.confirmed_at
                        )}
                    />

                    <InfoItem
                        label="Cancelled"
                        value={formatDateTime(
                            winner.cancelled_at
                        )}
                    />

                    <InfoItem
                        label="Draw Date"
                        value={formatDateTime(
                            winner.draw
                                .draw_date
                        )}
                    />

                    <InfoItem
                        label="Random Provider"
                        value={
                            winner.draw
                                .random_provider ??
                            '—'
                        }
                    />
                </div>
            </section>
        </div>
    );
}

function InfoItem({
                      label,
                      value,
                  }: {
    label: string;

    value:
        | string
        | number;
}) {
    return (
        <div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {
                    label
                }
            </div>

            <div className="mt-1 break-all text-sm text-gray-700">
                {
                    value
                }
            </div>
        </div>
    );
}

function FeedbackAlert({
                           type,
                           children,
                           onClose,
                       }: {
    type:
        | 'success'
        | 'error';

    children:
        React.ReactNode;

    onClose:
        () => void;
}) {
    const className =
        type ===
        'success'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-red-200 bg-red-50 text-red-700';

    return (
        <div
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${className}`}
        >
            <span>
                {
                    children
                }
            </span>

            <button
                type="button"
                onClick={
                    onClose
                }
                className="ml-4 font-medium"
            >
                ×
            </button>
        </div>
    );
}
