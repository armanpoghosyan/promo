import { useEffect, useState } from 'react';
import {
    Link,
    useParams,
    useSearchParams,
} from 'react-router-dom';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

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
    privacy_policy_accepted_at: string | null;
    official_rules_accepted_at: string | null;
    personal_data_consent_at: string | null;
    created_at: string;
    updated_at: string;
    receipts: Receipt[];
};

type ParticipantResponse = {
    data: Participant;
};

export default function ParticipantDetails() {
    const { id } = useParams();

    const [searchParams] =
        useSearchParams();

    const [participant, setParticipant] =
        useState<Participant | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    /*
     * Preserve the Participants list state.
     *
     * Example:
     *
     * /admin/participants/9?search=john&page=2
     *
     * Back will return to:
     *
     * /admin/participants?search=john&page=2
     */

    const backSearch =
        searchParams.get('search') ?? '';

    const backPage =
        searchParams.get('page') ?? '';

    const backParams =
        new URLSearchParams();

    if (backSearch.trim()) {
        backParams.set(
            'search',
            backSearch
        );
    }

    if (backPage) {
        backParams.set(
            'page',
            backPage
        );
    }

    const backUrl =
        backParams.toString()
            ? `/admin/participants?${backParams.toString()}`
            : '/admin/participants';

    const loadParticipant = async () => {
        if (!id) {
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

    if (loading) {
        return (
            <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">
                Loading participant...
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">

                <Link
                    to={backUrl}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to participants
                </Link>

                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>

            </div>
        );
    }

    if (!participant) {
        return null;
    }

    return (
        <div className="space-y-6">

            {/* Header */}

            <div>

                <Link
                    to={backUrl}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to participants
                </Link>

                <div className="mt-3 flex items-center gap-3">

                    <h2 className="text-2xl font-bold text-gray-900">
                        {participant.first_name}{' '}
                        {participant.last_name}
                    </h2>

                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        #{participant.id}
                    </span>

                </div>

                <p className="mt-1 text-sm text-gray-500">
                    Participant details and submitted receipts.
                </p>

            </div>

            {/* Participant Information */}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">
                    <h3 className="font-semibold text-gray-900">
                        Participant Information
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 lg:grid-cols-3">

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            First Name
                        </div>

                        <div className="mt-1 text-sm text-gray-900">
                            {participant.first_name}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Last Name
                        </div>

                        <div className="mt-1 text-sm text-gray-900">
                            {participant.last_name}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Phone
                        </div>

                        <div className="mt-1 text-sm text-gray-900">
                            {participant.phone}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Email
                        </div>

                        <div className="mt-1 text-sm text-gray-900">
                            {participant.email}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Registered
                        </div>

                        <div className="mt-1 text-sm text-gray-900">
                            {new Date(
                                participant.created_at
                            ).toLocaleString()}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Receipts
                        </div>

                        <div className="mt-1 text-sm font-semibold text-gray-900">
                            {participant.receipts.length}
                        </div>
                    </div>

                </div>

            </div>

            {/* Consents */}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">
                    <h3 className="font-semibold text-gray-900">
                        Consents
                    </h3>
                </div>

                <div className="divide-y divide-gray-100">

                    <div className="flex items-center justify-between px-5 py-4">

                        <div>
                            <div className="text-sm font-medium text-gray-900">
                                Privacy Policy
                            </div>

                            <div className="text-xs text-gray-500">
                                {participant.privacy_policy_accepted_at
                                    ? new Date(
                                        participant.privacy_policy_accepted_at
                                    ).toLocaleString()
                                    : 'Not accepted'}
                            </div>
                        </div>

                        <span
                            className={
                                participant.privacy_policy_accepted_at
                                    ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700'
                                    : 'rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500'
                            }
                        >
                            {participant.privacy_policy_accepted_at
                                ? 'Accepted'
                                : 'Not accepted'}
                        </span>

                    </div>

                    <div className="flex items-center justify-between px-5 py-4">

                        <div>
                            <div className="text-sm font-medium text-gray-900">
                                Official Rules
                            </div>

                            <div className="text-xs text-gray-500">
                                {participant.official_rules_accepted_at
                                    ? new Date(
                                        participant.official_rules_accepted_at
                                    ).toLocaleString()
                                    : 'Not accepted'}
                            </div>
                        </div>

                        <span
                            className={
                                participant.official_rules_accepted_at
                                    ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700'
                                    : 'rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500'
                            }
                        >
                            {participant.official_rules_accepted_at
                                ? 'Accepted'
                                : 'Not accepted'}
                        </span>

                    </div>

                    <div className="flex items-center justify-between px-5 py-4">

                        <div>
                            <div className="text-sm font-medium text-gray-900">
                                Personal Data Consent
                            </div>

                            <div className="text-xs text-gray-500">
                                {participant.personal_data_consent_at
                                    ? new Date(
                                        participant.personal_data_consent_at
                                    ).toLocaleString()
                                    : 'Not accepted'}
                            </div>
                        </div>

                        <span
                            className={
                                participant.personal_data_consent_at
                                    ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700'
                                    : 'rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500'
                            }
                        >
                            {participant.personal_data_consent_at
                                ? 'Accepted'
                                : 'Not accepted'}
                        </span>

                    </div>

                </div>

            </div>

            {/* Receipts */}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">

                    <h3 className="font-semibold text-gray-900">
                        Receipts
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Receipts submitted by this participant.
                    </p>

                </div>

                {participant.receipts.length === 0 ? (

                    <div className="p-5 text-sm text-gray-400">
                        No receipts submitted.
                    </div>

                ) : (

                    <div className="divide-y divide-gray-100">

                        {participant.receipts.map(
                            (receipt) => (

                                <div
                                    key={receipt.id}
                                    className="p-5"
                                >

                                    <div className="flex flex-wrap items-start justify-between gap-4">

                                        <div>

                                            <Link
                                                to={`/admin/receipts/${receipt.id}`}
                                                className="font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                Receipt #{receipt.receipt_number}
                                            </Link>

                                            <div className="mt-1 text-xs text-gray-500">
                                                ID #{receipt.id}
                                            </div>

                                        </div>

                                        <StatusBadge
                                            status={
                                                receipt.status
                                            }
                                        />

                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">

                                        <div>
                                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Submitted
                                            </div>

                                            <div className="mt-1 text-sm text-gray-700">
                                                {receipt.submitted_at
                                                    ? new Date(
                                                        receipt.submitted_at
                                                    ).toLocaleString()
                                                    : '-'}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Verified
                                            </div>

                                            <div className="mt-1 text-sm text-gray-700">
                                                {receipt.verified_at
                                                    ? new Date(
                                                        receipt.verified_at
                                                    ).toLocaleString()
                                                    : '-'}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Suspicious
                                            </div>

                                            <div className="mt-1">

                                                {receipt.is_suspicious ? (

                                                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                                                        Yes
                                                    </span>

                                                ) : (

                                                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                                                        No
                                                    </span>

                                                )}

                                            </div>
                                        </div>

                                    </div>

                                    {receipt.is_suspicious &&
                                        receipt.suspicious_reasons &&
                                        receipt.suspicious_reasons.length >
                                        0 && (

                                            <div className="mt-4 rounded-lg bg-red-50 p-3">

                                                <div className="text-xs font-medium text-red-700">
                                                    Suspicious reasons
                                                </div>

                                                <div className="mt-1 text-sm text-red-600">
                                                    {receipt.suspicious_reasons.join(
                                                        ', '
                                                    )}
                                                </div>

                                            </div>

                                        )}

                                    {receipt.rejection_reason && (

                                        <div className="mt-4 rounded-lg bg-red-50 p-3">

                                            <div className="text-xs font-medium text-red-700">
                                                Rejection reason
                                            </div>

                                            <div className="mt-1 text-sm text-red-600">
                                                {
                                                    receipt.rejection_reason
                                                }
                                            </div>

                                        </div>

                                    )}

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>

        </div>
    );
}
