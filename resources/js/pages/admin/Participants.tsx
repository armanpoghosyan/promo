import { useEffect, useState } from 'react';
import {
    Link,
    useLocation,
    useSearchParams,
} from 'react-router-dom';

import api from '../../services/api';
import type { PaginatedResponse } from '../../types/api';
import { formatDate } from '../../utils/date';

type Participant = {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    receipts_count: number;
    created_at: string;
};


export default function Participants() {
    const location = useLocation();

    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams();

    const urlSearch =
        searchParams.get('search') ?? '';

    const rawPage =
        Number(
            searchParams.get('page') ??
            '1'
        );

    const page =
        Number.isInteger(rawPage) &&
        rawPage > 0
            ? rawPage
            : 1;

    const [
        participants,
        setParticipants,
    ] = useState<Participant[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [searchInput, setSearchInput] =
        useState(urlSearch);

    const [
        pagination,
        setPagination,
    ] = useState<PaginatedResponse<Participant> | null>(
        null
    );

    const loadParticipants = async () => {
        setLoading(true);
        setError(null);

        try {
            const response =
                await api.get<PaginatedResponse<Participant>>(
                    '/admin/participants',
                    {
                        params: {
                            search:
                                urlSearch.trim() ||
                                undefined,

                            page,

                            per_page: 20,
                        },
                    }
                );

            setParticipants(
                response.data.data ?? []
            );

            setPagination(
                response.data
            );
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
        setSearchInput(urlSearch);

        loadParticipants();
    }, [
        urlSearch,
        page,
    ]);

    const updateUrl = (
        nextSearch: string,
        nextPage: number
    ) => {
        const params =
            new URLSearchParams();

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
        updateUrl(
            searchInput,
            1
        );
    };

    const handleClear = () => {
        setSearchInput('');

        updateUrl(
            '',
            1
        );
    };

    const goToPage = (
        nextPage: number
    ) => {
        if (
            nextPage < 1 ||
            (
                pagination &&
                nextPage >
                pagination.last_page
            )
        ) {
            return;
        }

        updateUrl(
            urlSearch,
            nextPage
        );
    };

    return (
        <div className="space-y-6">

            {/* Header */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>

                    <h2 className="text-2xl font-bold text-gray-900">
                        Participants
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Search participants and review
                        their participation history.
                    </p>

                </div>

                {pagination && (
                    <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
                        {pagination.total}{' '}
                        participant
                        {pagination.total === 1
                            ? ''
                            : 's'}
                    </div>
                )}

            </div>

            {/* Search */}

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

                <div className="flex flex-col gap-3 sm:flex-row">

                    <input
                        type="text"
                        value={searchInput}
                        onChange={(event) =>
                            setSearchInput(
                                event.target.value
                            )
                        }
                        onKeyDown={(event) => {
                            if (
                                event.key ===
                                'Enter'
                            ) {
                                handleSearch();
                            }
                        }}
                        placeholder="Search by name, phone or email..."
                        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                    />

                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={loading}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Search
                    </button>

                    {urlSearch && (
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

            </section>

            {/* Error */}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* List */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                {loading ? (

                    <div className="flex min-h-64 items-center justify-center text-sm text-gray-500">
                        Loading participants...
                    </div>

                ) : participants.length === 0 ? (

                    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

                        <div className="text-sm font-medium text-gray-700">
                            No participants found.
                        </div>

                        <div className="mt-1 text-sm text-gray-400">
                            Try changing your search terms.
                        </div>

                    </div>

                ) : (

                    <>

                        <div className="overflow-x-auto">

                            <table className="min-w-full text-left text-sm">

                                <thead className="bg-gray-50">

                                <tr>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Participant
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Contact
                                    </th>

                                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Receipts
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Registered
                                    </th>

                                    <th className="px-5 py-3" />

                                </tr>

                                </thead>

                                <tbody className="divide-y divide-gray-100">

                                {participants.map(
                                    (participant) => (

                                        <tr
                                            key={
                                                participant.id
                                            }
                                            className="hover:bg-gray-50"
                                        >

                                            {/* Participant */}

                                            <td className="px-5 py-4">

                                                <div className="font-medium text-gray-900">
                                                    {
                                                        participant.first_name
                                                    }{' '}
                                                    {
                                                        participant.last_name
                                                    }
                                                </div>

                                                <div className="mt-1 text-xs text-gray-400">
                                                    ID #
                                                    {
                                                        participant.id
                                                    }
                                                </div>

                                            </td>

                                            {/* Contact */}

                                            <td className="px-5 py-4">

                                                <div className="text-sm text-gray-700">
                                                    {
                                                        participant.phone
                                                    }
                                                </div>

                                                <div className="mt-1 max-w-[260px] truncate text-xs text-gray-500">
                                                    {
                                                        participant.email
                                                    }
                                                </div>

                                            </td>

                                            {/* Receipts */}

                                            <td className="px-5 py-4 text-center">

                                                <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                                    {
                                                        participant.receipts_count
                                                    }
                                                </span>

                                            </td>

                                            {/* Registered */}

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                                                {formatDate(
                                                    participant.created_at
                                                )}
                                            </td>

                                            {/* Action */}

                                            <td className="px-5 py-4 text-right">

                                                <Link
                                                    to={`/admin/participants/${participant.id}`}
                                                    state={{
                                                        from:
                                                            `${location.pathname}${location.search}`,
                                                    }}
                                                    className="inline-flex rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                                                >
                                                    View profile
                                                </Link>

                                            </td>

                                        </tr>

                                    )
                                )}

                                </tbody>

                            </table>

                        </div>

                        {/* Pagination */}

                        {pagination &&
                            pagination.last_page >
                            1 && (

                                <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                                    <div className="text-sm text-gray-500">

                                        Showing{' '}

                                        {(pagination.current_page -
                                                1) *
                                            pagination.per_page +
                                            1}

                                        {' '}to{' '}

                                        {Math.min(
                                            pagination.current_page *
                                            pagination.per_page,
                                            pagination.total
                                        )}

                                        {' '}of{' '}

                                        {
                                            pagination.total
                                        }

                                    </div>

                                    <div className="flex items-center gap-2">

                                        <button
                                            type="button"
                                            disabled={
                                                pagination.current_page <=
                                                1 ||
                                                loading
                                            }
                                            onClick={() =>
                                                goToPage(
                                                    pagination.current_page -
                                                    1
                                                )
                                            }
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Previous
                                        </button>

                                        <span className="px-2 text-sm text-gray-600">
                                        Page{' '}
                                            {
                                                pagination.current_page
                                            }{' '}
                                            of{' '}
                                            {
                                                pagination.last_page
                                            }
                                    </span>

                                        <button
                                            type="button"
                                            disabled={
                                                pagination.current_page >=
                                                pagination.last_page ||
                                                loading
                                            }
                                            onClick={() =>
                                                goToPage(
                                                    pagination.current_page +
                                                    1
                                                )
                                            }
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Next
                                        </button>

                                    </div>

                                </div>
                            )}

                    </>
                )}

            </section>

        </div>
    );
}
