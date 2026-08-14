import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import api from '../../services/api';

type Participant = {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    receipts_count: number;
    created_at: string;
};

type PaginationResponse = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    data: Participant[];
};

export default function Participants() {
    const [searchParams, setSearchParams] = useSearchParams();

    const urlSearch = searchParams.get('search') ?? '';
    const urlPage = Number(searchParams.get('page') ?? '1');

    const page =
        Number.isInteger(urlPage) && urlPage > 0
            ? urlPage
            : 1;

    const [participants, setParticipants] =
        useState<Participant[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [search, setSearch] =
        useState(urlSearch);

    const [pagination, setPagination] =
        useState<PaginationResponse | null>(null);

    const loadParticipants = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(
                '/admin/participants',
                {
                    params: {
                        search:
                            urlSearch.trim() || undefined,
                        page,
                        per_page: 20,
                    },
                }
            );

            setParticipants(
                response.data.data ?? []
            );

            setPagination(response.data);
        } catch (err) {
            console.error(err);

            setError(
                'Unable to load participants.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSearch(urlSearch);
        loadParticipants();
    }, [urlSearch, page]);

    const updateUrl = (
        nextSearch: string,
        nextPage: number
    ) => {
        const params = new URLSearchParams();

        if (nextSearch.trim()) {
            params.set(
                'search',
                nextSearch.trim()
            );
        }

        if (nextPage > 1) {
            params.set(
                'page',
                String(nextPage)
            );
        }

        setSearchParams(params);
    };

    const handleSearch = () => {
        updateUrl(search, 1);
    };

    const handleClear = () => {
        setSearch('');
        updateUrl('', 1);
    };

    const goToPage = (nextPage: number) => {
        if (
            nextPage < 1 ||
            (pagination &&
                nextPage > pagination.last_page)
        ) {
            return;
        }

        updateUrl(search, nextPage);
    };

    return (
        <div className="space-y-6">

            {/* Header */}

            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Participants
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    View participants and their submitted receipts.
                </p>
            </div>

            {/* Search */}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                <div className="flex flex-col gap-3 sm:flex-row">

                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                        placeholder="Search by name, phone or email..."
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                    />

                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={loading}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Search
                    </button>

                    {search && (
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={loading}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Clear
                        </button>
                    )}

                </div>

            </div>

            {/* Error */}

            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Participants */}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">

                    <div className="flex items-center justify-between">

                        <div>

                            <h3 className="font-semibold text-gray-900">
                                Participant List
                            </h3>

                            {pagination && (
                                <p className="mt-1 text-sm text-gray-500">
                                    {pagination.total}{' '}
                                    participant
                                    {pagination.total === 1
                                        ? ''
                                        : 's'}
                                </p>
                            )}

                        </div>

                    </div>

                </div>

                {loading ? (

                    <div className="p-8 text-center text-sm text-gray-500">
                        Loading participants...
                    </div>

                ) : participants.length === 0 ? (

                    <div className="p-8 text-center text-sm text-gray-400">
                        No participants found.
                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="min-w-full divide-y divide-gray-200">

                            <thead className="bg-gray-50">

                            <tr>

                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Participant
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Phone
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Email
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Receipts
                                </th>

                                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Action
                                </th>

                            </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100 bg-white">

                            {participants.map(
                                (participant) => (

                                    <tr
                                        key={participant.id}
                                        className="hover:bg-gray-50"
                                    >

                                        <td className="px-5 py-4">

                                            <div className="font-medium text-gray-900">
                                                {participant.first_name}{' '}
                                                {participant.last_name}
                                            </div>

                                            <div className="mt-1 text-xs text-gray-500">
                                                ID #{participant.id}
                                            </div>

                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-700">
                                            {participant.phone}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-700">
                                            {participant.email}
                                        </td>

                                        <td className="px-5 py-4 text-center">

                                                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                                    {participant.receipts_count}
                                                </span>

                                        </td>

                                        <td className="px-5 py-4 text-right">

                                            <Link
                                                to={`/admin/participants/${participant.id}${(() => {
                                                    const params =
                                                        new URLSearchParams();

                                                    if (
                                                        search.trim()
                                                    ) {
                                                        params.set(
                                                            'search',
                                                            search.trim()
                                                        );
                                                    }

                                                    if (
                                                        page > 1
                                                    ) {
                                                        params.set(
                                                            'page',
                                                            String(page)
                                                        );
                                                    }

                                                    const query =
                                                        params.toString();

                                                    return query
                                                        ? `?${query}`
                                                        : '';
                                                })()}`}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                View
                                            </Link>

                                        </td>

                                    </tr>

                                )
                            )}

                            </tbody>

                        </table>

                    </div>

                )}

                {/* Pagination */}

                {pagination &&
                    pagination.last_page > 1 && (

                        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">

                            <div className="text-sm text-gray-500">
                                Page{' '}
                                {pagination.current_page}{' '}
                                of{' '}
                                {pagination.last_page}
                            </div>

                            <div className="flex gap-2">

                                <button
                                    type="button"
                                    onClick={() =>
                                        goToPage(
                                            pagination.current_page -
                                            1
                                        )
                                    }
                                    disabled={
                                        pagination.current_page ===
                                        1 ||
                                        loading
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        goToPage(
                                            pagination.current_page +
                                            1
                                        )
                                    }
                                    disabled={
                                        pagination.current_page ===
                                        pagination.last_page ||
                                        loading
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>

                            </div>

                        </div>

                    )}

            </div>

        </div>
    );
}
