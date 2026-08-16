import { useEffect, useMemo, useState } from 'react';
import {
    Link,
    useLocation,
    useParams,
} from 'react-router-dom';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDateTime } from '../../utils/date';

type Receipt = {
    id: number;
    receipt_number: string;
    receipt_image: string | null;
    status: string;
    is_suspicious: boolean;
    suspicious_reasons: string[] | null;
    submitted_at: string | null;
    verified_at: string | null;
    rejection_reason: string | null;
};

type Participant = {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;

    privacy_policy_accepted_at:
        string | null;

    official_rules_accepted_at:
        string | null;

    personal_data_consent_at:
        string | null;

    created_at: string;
    updated_at: string;

    receipts: Receipt[];
};

type ParticipantResponse = {
    data: Participant;
};


function ConsentStatus({
                           value,
                       }: {
    value: string | null;
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
    const { id } = useParams();

    const location = useLocation();

    const [participant, setParticipant] =
        useState<Participant | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const backUrl =
        typeof location.state?.from ===
        'string'
            ? location.state.from
            : '/admin/participants';

    const loadParticipant = async () => {
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
        } catch (err) {
            console.error(err);

            setError(
                'Unable to load participant.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadParticipant();
    }, [id]);

    const receiptStats =
        useMemo(() => {
            if (!participant) {
                return {
                    total: 0,
                    approved: 0,
                    rejected: 0,
                    suspicious: 0,
                };
            }

            return {
                total:
                participant.receipts.length,

                approved:
                participant.receipts.filter(
                    (receipt) =>
                        receipt.status ===
                        'approved'
                ).length,

                rejected:
                participant.receipts.filter(
                    (receipt) =>
                        receipt.status ===
                        'rejected'
                ).length,

                suspicious:
                participant.receipts.filter(
                    (receipt) =>
                        receipt.is_suspicious
                ).length,
            };
        }, [participant]);

    if (loading) {
        return (
            <div className="flex min-h-64 items-center justify-center text-sm text-gray-500">
                Loading participant...
            </div>
        );
    }

    if (error || !participant) {
        return (
            <div className="space-y-4">

                <Link
                    to={backUrl}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to Participants
                </Link>

                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error ??
                        'Participant not found.'}
                </div>

            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Header */}

            <div>

                <Link
                    to={backUrl}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to Participants
                </Link>

                <div className="mt-4 flex flex-wrap items-center gap-3">

                    <h2 className="text-2xl font-bold text-gray-900">
                        {participant.first_name}{' '}
                        {participant.last_name}
                    </h2>

                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        ID #{participant.id}
                    </span>

                </div>

                <p className="mt-1 text-sm text-gray-500">
                    Participant profile and
                    participation history.
                </p>

            </div>

            {/* Profile + stats */}

            <div className="grid gap-6 lg:grid-cols-3">

                {/* Profile */}

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">

                    <div className="border-b border-gray-200 px-5 py-4">

                        <h3 className="font-semibold text-gray-900">
                            Participant Information
                        </h3>

                    </div>

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

                        <div>

                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Email
                            </dt>

                            <dd className="mt-1 break-all text-sm text-gray-700">
                                {participant.email}
                            </dd>

                        </div>

                        <div>

                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                First Submission
                            </dt>

                            <dd className="mt-1 text-sm text-gray-700">
                                {formatDateTime(
                                    participant.created_at
                                )}
                            </dd>

                        </div>

                    </dl>

                </section>

                {/* Summary */}

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                    <div className="border-b border-gray-200 px-5 py-4">

                        <h3 className="font-semibold text-gray-900">
                            Participation Summary
                        </h3>

                    </div>

                    <div className="grid grid-cols-2 gap-3 p-5">

                        <div className="rounded-lg bg-gray-50 p-4">

                            <div className="text-xs text-gray-500">
                                Receipts
                            </div>

                            <div className="mt-1 text-2xl font-bold text-gray-900">
                                {
                                    receiptStats.total
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

                        <div className="rounded-lg bg-amber-50 p-4">

                            <div className="text-xs text-amber-700">
                                Suspicious
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

                    <h3 className="font-semibold text-gray-900">
                        Consents
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Consent records submitted with participation.
                    </p>

                </div>

                <div className="divide-y divide-gray-100">

                    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <div className="text-sm font-medium text-gray-900">
                                Privacy Policy
                            </div>

                            <div className="mt-1 text-xs text-gray-500">
                                {participant.privacy_policy_accepted_at
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
                                {participant.official_rules_accepted_at
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
                                {participant.personal_data_consent_at
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

            {/* Receipt history */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">

                    <h3 className="font-semibold text-gray-900">
                        Receipt History
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        All receipts submitted by this participant.
                    </p>

                </div>

                {participant.receipts.length ===
                0 ? (

                    <div className="p-6 text-sm text-gray-400">
                        No receipts submitted.
                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="min-w-full text-left text-sm">

                            <thead className="bg-gray-50">

                            <tr>

                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Receipt
                                </th>

                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>

                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Flags
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

                            {participant.receipts.map(
                                (receipt) => (

                                    <tr
                                        key={
                                            receipt.id
                                        }
                                        className="hover:bg-gray-50"
                                    >

                                        <td className="px-5 py-4">

                                            <div className="font-medium text-gray-900">
                                                {
                                                    receipt.receipt_number
                                                }
                                            </div>

                                            <div className="mt-1 text-xs text-gray-400">
                                                ID #
                                                {
                                                    receipt.id
                                                }
                                            </div>

                                        </td>

                                        <td className="px-5 py-4">

                                            <StatusBadge
                                                status={
                                                    receipt.status
                                                }
                                            />

                                        </td>

                                        <td className="px-5 py-4">

                                            {receipt.is_suspicious ? (

                                                <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                                                    Suspicious
                                                </span>

                                            ) : (

                                                <span className="text-xs text-gray-400">
                                                    —
                                                </span>

                                            )}

                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                                            {formatDateTime(
                                                receipt.submitted_at
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                                            {formatDateTime(
                                                receipt.verified_at
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-right">

                                            <Link
                                                to={`/admin/receipts/${receipt.id}`}
                                                state={{
                                                    from:
                                                        `${location.pathname}${location.search}`,
                                                }}
                                                className="inline-flex rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                                            >
                                                View receipt
                                            </Link>

                                        </td>

                                    </tr>

                                )
                            )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

        </div>
    );
}
