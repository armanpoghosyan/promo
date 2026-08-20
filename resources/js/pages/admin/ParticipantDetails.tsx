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

import Alert from '../../components/Alert';
import LoadingState from '../../components/LoadingState';
import ReceiptQuickReviewModal from '../../components/receipts/ReceiptQuickReviewModal';
import StatusBadge from '../../components/StatusBadge';
import Tooltip from '../../components/Tooltip';

import api from '../../services/api';

import type {
    Participant,
    ParticipantResponse,
} from '../../types/participant';

import type {
    Receipt,
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
                (
                    character
                ) =>
                    character.toUpperCase()
            )
    );
}

function ConsentStatus({
                           value,
                       }: {
    value:
        | string
        | null
        | undefined;
}) {
    if (value) {
        return (
            <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                Accepted
            </span>
        );
    }

    return (
        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
            Not accepted
        </span>
    );
}

export default function ParticipantDetails() {
    const {
        id,
    } = useParams();

    const location =
        useLocation();

    const backUrl =
        typeof location.state?.from ===
        'string'
            ? location.state.from
            : '/admin/participants';

    const [
        participant,
        setParticipant,
    ] = useState<
        Participant | null
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
        quickReviewReceiptId,
        setQuickReviewReceiptId,
    ] = useState<
        number | null
    >(null);

    const loadParticipant =
        async () => {
            if (!id) {
                setError(
                    'Participant ID is missing.'
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
                    await api.get<ParticipantResponse>(
                        `/admin/participants/${id}`
                    );

                setParticipant(
                    response.data.data
                );
            } catch (
                error: unknown
                ) {
                setError(
                    getApiErrorMessage(
                        error,
                        'Unable to load participant.'
                    )
                );
            } finally {
                setLoading(
                    false
                );
            }
        };

    useEffect(() => {
        loadParticipant();
    }, [
        id,
    ]);

    const receiptStats =
        useMemo(() => {
            const receipts =
                participant?.receipts ??
                [];

            return {
                total:
                receipts.length,

                submitted:
                receipts.filter(
                    (
                        receipt
                    ) =>
                        receipt.status ===
                        'submitted'
                ).length,

                approved:
                receipts.filter(
                    (
                        receipt
                    ) =>
                        receipt.status ===
                        'approved'
                ).length,

                rejected:
                receipts.filter(
                    (
                        receipt
                    ) =>
                        receipt.status ===
                        'rejected'
                ).length,

                suspicious:
                receipts.filter(
                    (
                        receipt
                    ) =>
                        receipt.is_suspicious
                ).length,
            };
        }, [
            participant,
        ]);

    if (
        loading
    ) {
        return (
            <LoadingState
                message="Loading participant..."
            />
        );
    }

    if (
        error ||
        !participant
    ) {
        return (
            <div className="space-y-4">
                <Link
                    to={
                        backUrl
                    }
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to Participants
                </Link>

                <Alert variant="error">
                    {error ??
                        'Participant not found.'}
                </Alert>
            </div>
        );
    }

    const receipts =
        participant.receipts ??
        [];

    const currentPageUrl =
        `${location.pathname}${location.search}`;

    const openQuickReview = (
        receipt: Receipt
    ) => {
        setQuickReviewReceiptId(
            receipt.id
        );
    };

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
                        ← Back to Participants
                    </Link>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {
                                participant.first_name
                            }{' '}
                            {
                                participant.last_name
                            }
                        </h1>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            Participant ID #
                            {
                                participant.id
                            }
                        </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                        Participant profile,
                        consent records and
                        complete receipt history.
                    </p>
                </header>

                {/* Profile + Summary */}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.6fr)]">
                    {/* Profile */}

                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-5 py-4">
                            <h2 className="font-semibold text-gray-900">
                                Participant Information
                            </h2>
                        </div>

                        <dl className="grid gap-5 p-5 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Name
                                </dt>

                                <dd className="mt-1 text-sm font-semibold text-gray-900">
                                    {
                                        participant.first_name
                                    }{' '}
                                    {
                                        participant.last_name
                                    }
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Phone
                                </dt>

                                <dd className="mt-1 text-sm text-gray-700">
                                    {
                                        participant.phone
                                    }
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Email
                                </dt>

                                <dd className="mt-1 break-all text-sm text-gray-700">
                                    {
                                        participant.email
                                    }
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    First Submission
                                </dt>

                                <dd className="mt-1 text-sm text-gray-700">
                                    {formatDateTime(
                                        participant.created_at
                                    )}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Participant ID
                                </dt>

                                <dd className="mt-1 text-sm text-gray-700">
                                    #
                                    {
                                        participant.id
                                    }
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Last Updated
                                </dt>

                                <dd className="mt-1 text-sm text-gray-700">
                                    {formatDateTime(
                                        participant.updated_at
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    {/* Summary */}

                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-5 py-4">
                            <h2 className="font-semibold text-gray-900">
                                Participation Summary
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3 p-5">
                            <div className="rounded-lg bg-gray-50 p-4">
                                <div className="text-xs text-gray-500">
                                    Total Receipts
                                </div>

                                <div className="mt-1 text-2xl font-bold text-gray-900">
                                    {
                                        receiptStats.total
                                    }
                                </div>
                            </div>

                            <div className="rounded-lg bg-gray-50 p-4">
                                <div className="text-xs text-gray-500">
                                    Submitted
                                </div>

                                <div className="mt-1 text-2xl font-bold text-gray-700">
                                    {
                                        receiptStats.submitted
                                    }
                                </div>
                            </div>

                            <div className="rounded-lg bg-green-50 p-4">
                                <div className="text-xs text-green-700">
                                    Approved
                                </div>

                                <div className="mt-1 text-2xl font-bold text-green-800">
                                    {
                                        receiptStats.approved
                                    }
                                </div>
                            </div>

                            <div className="rounded-lg bg-red-50 p-4">
                                <div className="text-xs text-red-700">
                                    Rejected
                                </div>

                                <div className="mt-1 text-2xl font-bold text-red-800">
                                    {
                                        receiptStats.rejected
                                    }
                                </div>
                            </div>

                            <div className="col-span-2 rounded-lg bg-amber-50 p-4">
                                <div className="text-xs text-amber-700">
                                    Suspicious Receipts
                                </div>

                                <div className="mt-1 text-2xl font-bold text-amber-800">
                                    {
                                        receiptStats.suspicious
                                    }
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Consents */}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-4">
                        <h2 className="font-semibold text-gray-900">
                            Consents
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                            Consent records captured
                            during participation.
                        </p>
                    </div>

                    <div className="divide-y divide-gray-100">
                        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-900">
                                    Privacy Policy
                                </div>

                                <div className="mt-1 text-xs text-gray-500">
                                    {participant
                                        .privacy_policy_accepted_at
                                        ? formatDateTime(
                                            participant.privacy_policy_accepted_at
                                        )
                                        : 'No acceptance recorded'}
                                </div>
                            </div>

                            <ConsentStatus
                                value={
                                    participant.privacy_policy_accepted_at
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-900">
                                    Official Rules
                                </div>

                                <div className="mt-1 text-xs text-gray-500">
                                    {participant
                                        .official_rules_accepted_at
                                        ? formatDateTime(
                                            participant.official_rules_accepted_at
                                        )
                                        : 'No acceptance recorded'}
                                </div>
                            </div>

                            <ConsentStatus
                                value={
                                    participant.official_rules_accepted_at
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-900">
                                    Personal Data Consent
                                </div>

                                <div className="mt-1 text-xs text-gray-500">
                                    {participant
                                        .personal_data_consent_at
                                        ? formatDateTime(
                                            participant.personal_data_consent_at
                                        )
                                        : 'No acceptance recorded'}
                                </div>
                            </div>

                            <ConsentStatus
                                value={
                                    participant.personal_data_consent_at
                                }
                            />
                        </div>
                    </div>
                </section>

                {/* Receipt History */}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
                        <div>
                            <h2 className="font-semibold text-gray-900">
                                Receipt History
                            </h2>

                            <p className="mt-1 text-xs text-gray-500">
                                All receipts submitted
                                by this participant.
                            </p>
                        </div>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            {
                                receipts.length
                            }{' '}
                            receipt
                            {receipts.length ===
                            1
                                ? ''
                                : 's'}
                        </span>
                    </div>

                    {receipts.length ===
                    0 ? (
                        <div className="p-6 text-sm text-gray-400">
                            No receipts submitted.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-left text-sm">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Receipt
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Suspicious
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Submitted
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Verified
                                    </th>

                                    <th className="px-5 py-3" />
                                </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                {receipts.map(
                                    (
                                        receipt
                                    ) => {
                                        const reasons =
                                            receipt.suspicious_reasons ??
                                            [];

                                        const firstReason =
                                            reasons[0];

                                        const extraReasons =
                                            Math.max(
                                                reasons.length -
                                                1,
                                                0
                                            );

                                        const rejectionTooltip =
                                            receipt.status ===
                                            'rejected' &&
                                            receipt.rejection_reason
                                                ? receipt.rejection_reason
                                                : null;

                                        return (
                                            <tr
                                                key={
                                                    receipt.id
                                                }
                                                onClick={() =>
                                                    openQuickReview(
                                                        receipt
                                                    )
                                                }
                                                className={[
                                                    'cursor-pointer transition hover:bg-gray-50',
                                                    receipt.is_suspicious
                                                        ? 'bg-amber-50/20'
                                                        : '',
                                                ].join(
                                                    ' '
                                                )}
                                            >
                                                {/* Receipt */}

                                                <td className="px-5 py-4 align-top">
                                                    <div className="font-semibold text-gray-900">
                                                        {
                                                            receipt.receipt_number
                                                        }
                                                    </div>

                                                    <div className="mt-1 text-xs text-gray-400">
                                                        Receipt ID
                                                        #{' '}
                                                        {
                                                            receipt.id
                                                        }
                                                    </div>
                                                </td>

                                                {/* Status */}

                                                <td className="px-5 py-4 align-top">
                                                    <Tooltip
                                                        content={
                                                            rejectionTooltip
                                                                ? (
                                                                    <div>
                                                                        <div className="mb-1 font-semibold">
                                                                            Rejection reason
                                                                        </div>

                                                                        <div className="text-gray-200">
                                                                            {
                                                                                rejectionTooltip
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                )
                                                                : null
                                                        }
                                                        maxWidth={
                                                            360
                                                        }
                                                    >
                                                            <span
                                                                className={
                                                                    rejectionTooltip
                                                                        ? 'cursor-help'
                                                                        : undefined
                                                                }
                                                                onClick={(
                                                                    event
                                                                ) =>
                                                                    event.stopPropagation()
                                                                }
                                                            >
                                                                <StatusBadge
                                                                    status={
                                                                        receipt.status
                                                                    }
                                                                />
                                                            </span>
                                                    </Tooltip>
                                                </td>

                                                {/* Suspicious */}

                                                <td className="px-5 py-4 align-top">
                                                    {receipt.is_suspicious &&
                                                    firstReason ? (
                                                        <div>
                                                            <div className="max-w-[260px] text-xs font-medium text-amber-800">
                                                                {suspiciousReasonLabel(
                                                                    firstReason
                                                                )}
                                                            </div>

                                                            {extraReasons >
                                                                0 && (
                                                                    <Tooltip
                                                                        content={
                                                                            <div>
                                                                                <div className="mb-1 font-semibold">
                                                                                    Additional suspicious reasons
                                                                                </div>

                                                                                <div className="space-y-1 text-gray-200">
                                                                                    {reasons
                                                                                        .slice(
                                                                                            1
                                                                                        )
                                                                                        .map(
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
                                                                        }
                                                                        maxWidth={
                                                                            360
                                                                        }
                                                                    >
                                                                        <span
                                                                            onClick={(
                                                                                event
                                                                            ) =>
                                                                                event.stopPropagation()
                                                                            }
                                                                            className="mt-1 inline-flex cursor-help rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800"
                                                                        >
                                                                            +
                                                                            {
                                                                                extraReasons
                                                                            }{' '}
                                                                            more
                                                                        </span>
                                                                    </Tooltip>
                                                                )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                                —
                                                            </span>
                                                    )}
                                                </td>

                                                {/* Submitted */}

                                                <td className="whitespace-nowrap px-5 py-4 align-top text-sm text-gray-500">
                                                    {formatDateTime(
                                                        receipt.submitted_at ??
                                                        receipt.created_at
                                                    )}
                                                </td>

                                                {/* Verified */}

                                                <td className="whitespace-nowrap px-5 py-4 align-top text-sm text-gray-500">
                                                    {receipt.verified_at
                                                        ? formatDateTime(
                                                            receipt.verified_at
                                                        )
                                                        : '—'}
                                                </td>

                                                {/* Full details */}

                                                <td className="px-5 py-4 text-right align-top">
                                                    <Link
                                                        to={`/admin/receipts/${receipt.id}`}
                                                        state={{
                                                            from:
                                                            currentPageUrl,
                                                        }}
                                                        onClick={(
                                                            event
                                                        ) =>
                                                            event.stopPropagation()
                                                        }
                                                        className="inline-flex rounded-lg px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                                                    >
                                                        Full Details →
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {/* Receipt Quick Review */}

            {quickReviewReceiptId !==
                null && (
                    <ReceiptQuickReviewModal
                        receiptId={
                            quickReviewReceiptId
                        }
                        backUrl={
                            currentPageUrl
                        }
                        hideParticipant
                        onClose={() =>
                            setQuickReviewReceiptId(
                                null
                            )
                        }
                        onChanged={() => {
                            setQuickReviewReceiptId(
                                null
                            );

                            loadParticipant();
                        }}
                    />
                )}
        </>
    );
}
