import {
    useCallback,
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
} from '../../types/receipt';

import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';
import { suspiciousReasonLabel } from '../../utils/receipt';

export default function ParticipantDetails() {
    const { id } = useParams();
    const location = useLocation();

    const backUrl =
        typeof location.state?.from === 'string'
            ? location.state.from
            : '/admin/participants';

    const [
        participant,
        setParticipant,
    ] = useState<Participant | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [
        quickReviewReceiptId,
        setQuickReviewReceiptId,
    ] = useState<number | null>(null);

    const loadParticipant =
        useCallback(async () => {
            if (!id) {
                setError(
                    'Participant ID is missing.'
                );

                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response =
                    await api.get<ParticipantResponse>(
                        `/admin/participants/${id}`
                    );

                setParticipant(
                    response.data.data
                );
            } catch (error: unknown) {
                setError(
                    getApiErrorMessage(
                        error,
                        'Unable to load participant.'
                    )
                );
            } finally {
                setLoading(false);
            }
        }, [id]);

    useEffect(() => {
        loadParticipant();
    }, [loadParticipant]);

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
                    (receipt) =>
                        receipt.status ===
                        'submitted'
                ).length,

                approved:
                receipts.filter(
                    (receipt) =>
                        receipt.status ===
                        'approved'
                ).length,

                rejected:
                receipts.filter(
                    (receipt) =>
                        receipt.status ===
                        'rejected'
                ).length,

                suspicious:
                receipts.filter(
                    (receipt) =>
                        receipt.is_suspicious
                ).length,
            };
        }, [participant]);

    if (loading) {
        return (
            <LoadingState message="Loading participant..." />
        );
    }

    if (
        error ||
        !participant
    ) {
        return (
            <div className="space-y-4">
                <Link
                    to={backUrl}
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
        participant.receipts ?? [];

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
            <div className="space-y-5">
                {/* Header */}

                <header>
                    <Link
                        to={backUrl}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Participants
                    </Link>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {participant.first_name}{' '}
                            {participant.last_name}
                        </h1>

                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            ID #{participant.id}
                        </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                        Participant profile, consent records and receipt history.
                    </p>
                </header>

                {/* Profile + Summary */}

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.5fr)]">
                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <SectionHeader title="Participant Information" />

                        <div className="grid gap-4 p-4 sm:grid-cols-2">
                            <InfoItem
                                label="Name"
                                value={`${participant.first_name} ${participant.last_name}`}
                            />

                            <InfoItem
                                label="Phone"
                                value={participant.phone}
                            />

                            <InfoItem
                                label="Email"
                                value={participant.email}
                            />

                            <InfoItem
                                label="First Submission"
                                value={formatDateTime(
                                    participant.created_at
                                )}
                            />

                            <InfoItem
                                label="Participant ID"
                                value={`#${participant.id}`}
                            />

                            <InfoItem
                                label="Last Updated"
                                value={formatDateTime(
                                    participant.updated_at
                                )}
                            />
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <SectionHeader title="Participation Summary" />

                        <div className="grid grid-cols-2 gap-px bg-gray-200">
                            <SummaryMetric
                                label="Total"
                                value={
                                    receiptStats.total
                                }
                            />

                            <SummaryMetric
                                label="Needs Review"
                                value={
                                    receiptStats.submitted
                                }
                            />

                            <SummaryMetric
                                label="Approved"
                                value={
                                    receiptStats.approved
                                }
                                className="text-emerald-700"
                            />

                            <SummaryMetric
                                label="Rejected"
                                value={
                                    receiptStats.rejected
                                }
                                className="text-red-700"
                            />

                            <div className="col-span-2">
                                <SummaryMetric
                                    label="Suspicious"
                                    value={
                                        receiptStats.suspicious
                                    }
                                    className="text-amber-700"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Consents */}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <SectionHeader title="Consents" />

                    <div className="grid divide-y divide-gray-100 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                        <ConsentItem
                            title="Privacy Policy"
                            value={
                                participant.privacy_policy_accepted_at
                            }
                        />

                        <ConsentItem
                            title="Official Rules"
                            value={
                                participant.official_rules_accepted_at
                            }
                        />

                        <ConsentItem
                            title="Personal Data Consent"
                            value={
                                participant.personal_data_consent_at
                            }
                        />
                    </div>
                </section>

                {/* Receipt History */}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <SectionHeader
                        title="Receipt History"
                        action={
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                {receipts.length}{' '}
                                receipt
                                {receipts.length ===
                                1
                                    ? ''
                                    : 's'}
                            </span>
                        }
                    />

                    {receipts.length ===
                    0 ? (
                        <div className="px-4 py-5 text-sm text-gray-400">
                            No receipts submitted.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] text-left text-sm">
                                <thead className="bg-gray-50">
                                <tr>
                                    <TableHeader>
                                        Receipt
                                    </TableHeader>

                                    <TableHeader>
                                        Status
                                    </TableHeader>

                                    <TableHeader>
                                        Suspicious
                                    </TableHeader>

                                    <TableHeader>
                                        Submitted
                                    </TableHeader>

                                    <TableHeader>
                                        Verified
                                    </TableHeader>

                                    <th className="px-4 py-2.5" />
                                </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                {receipts.map(
                                    (receipt) => {
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

                                        const rejectionReason =
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
                                                <td className="px-4 py-3 align-top">
                                                    <div className="font-semibold text-gray-900">
                                                        {
                                                            receipt.receipt_number
                                                        }
                                                    </div>

                                                    <div className="mt-0.5 text-xs text-gray-400">
                                                        ID
                                                        #{' '}
                                                        {
                                                            receipt.id
                                                        }
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 align-top">
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

                                                <td className="px-4 py-3 align-top">
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
                                                                    <div className="mt-1">
                                                                        <Tooltip
                                                                            content={
                                                                                <div>
                                                                                    <div className="mb-1 font-semibold">
                                                                                        Additional
                                                                                        suspicious
                                                                                        reasons
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
                                                                                className="cursor-help rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800"
                                                                                onClick={(
                                                                                    event
                                                                                ) =>
                                                                                    event.stopPropagation()
                                                                                }
                                                                            >
                                                                                +
                                                                                {
                                                                                    extraReasons
                                                                                }{' '}
                                                                                more
                                                                            </span>
                                                                        </Tooltip>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                                —
                                                            </span>
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 align-top text-gray-500">
                                                    {formatDateTime(
                                                        receipt.submitted_at ??
                                                        receipt.created_at
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 align-top text-gray-500">
                                                    {receipt.verified_at
                                                        ? formatDateTime(
                                                            receipt.verified_at
                                                        )
                                                        : '—'}
                                                </td>

                                                <td className="px-4 py-3 text-right align-top">
                                                    <button
                                                        type="button"
                                                        onClick={(
                                                            event
                                                        ) => {
                                                            event.stopPropagation();

                                                            openQuickReview(
                                                                receipt
                                                            );
                                                        }}
                                                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                                    >
                                                        Review
                                                        →
                                                    </button>
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

                {/* Technical */}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <SectionHeader title="Technical & Audit Details" />

                    <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoItem
                            label="Participant ID"
                            value={`#${participant.id}`}
                        />

                        <InfoItem
                            label="Created"
                            value={formatDateTime(
                                participant.created_at
                            )}
                        />

                        <InfoItem
                            label="Updated"
                            value={formatDateTime(
                                participant.updated_at
                            )}
                        />

                        <InfoItem
                            label="Total Receipts"
                            value={
                                receiptStats.total
                            }
                        />
                    </div>
                </section>
            </div>

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
                            loadParticipant();
                        }}
                    />
                )}
        </>
    );
}

function SectionHeader({
                           title,
                           action,
                       }: {
    title: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3">
            <h2 className="font-semibold text-gray-900">
                {title}
            </h2>

            {action}
        </div>
    );
}

function InfoItem({
                      label,
                      value,
                  }: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {label}
            </div>

            <div className="mt-1 break-all text-sm text-gray-700">
                {value}
            </div>
        </div>
    );
}

function SummaryMetric({
                           label,
                           value,
                           className = 'text-gray-900',
                       }: {
    label: string;
    value: number;
    className?: string;
}) {
    return (
        <div className="bg-white p-3">
            <div className="text-xs text-gray-500">
                {label}
            </div>

            <div
                className={`mt-0.5 text-xl font-bold ${className}`}
            >
                {value}
            </div>
        </div>
    );
}

function ConsentItem({
                         title,
                         value,
                     }: {
    title: string;
    value:
        | string
        | null
        | undefined;
}) {
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
                <div className="text-sm font-medium text-gray-900">
                    {title}
                </div>

                <div className="mt-0.5 text-xs text-gray-500">
                    {value
                        ? formatDateTime(
                            value
                        )
                        : 'No acceptance recorded'}
                </div>
            </div>

            <ConsentStatus
                value={value}
            />
        </div>
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
            <span className="inline-flex shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Accepted
            </span>
        );
    }

    return (
        <span className="inline-flex shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            Not accepted
        </span>
    );
}

function TableHeader({
                         children,
                     }: {
    children: React.ReactNode;
}) {
    return (
        <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {children}
        </th>
    );
}
