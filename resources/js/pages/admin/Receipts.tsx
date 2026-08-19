import { useEffect, useState } from 'react';
import {
    Link,
    useLocation,
    useSearchParams,
} from 'react-router-dom';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import type { PaginatedResponse } from '../../types/api';
import { formatDateTime } from '../../utils/date';

import type {
    Receipt,
} from '../../types/receipt';

type FilterValue =
    | ''
    | 'needs_review'
    | 'approved'
    | 'rejected'
    | 'suspicious';

const filters: Array<{
    label: string;
    value: FilterValue;
}> = [
    {
        label: 'All',
        value: '',
    },
    {
        label: 'Needs Review',
        value: 'needs_review',
    },
    {
        label: 'Approved',
        value: 'approved',
    },
    {
        label: 'Rejected',
        value: 'rejected',
    },
    {
        label: 'Suspicious',
        value: 'suspicious',
    },
];


export default function Receipts() {
    const location = useLocation();

    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams();

    const initialPage =
        Number(
            searchParams.get('page')
        ) || 1;

    const initialFilter =
        (searchParams.get(
            'filter'
        ) as FilterValue | null) ?? '';

    const initialSearch =
        searchParams.get('search') ?? '';

    const [receipts, setReceipts] =
        useState<Receipt[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [page, setPage] =
        useState(initialPage);

    const [filter, setFilter] =
        useState<FilterValue>(
            initialFilter
        );

    const [search, setSearch] =
        useState(initialSearch);

    const [searchInput, setSearchInput] =
        useState(initialSearch);

    const [
        pagination,
        setPagination,
    ] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    const loadReceipts = async () => {
        setLoading(true);
        setError(null);

        try {
            const params: Record<
                string,
                string | number | boolean
            > = {
                page,
            };

            if (search.trim()) {
                /*
                 * Backend currently supports
                 * separate receipt_number,
                 * phone and email filters.
                 *
                 * For now we send the same search
                 * value to all three.
                 *
                 * This can later become a dedicated
                 * backend "search" parameter.
                 */
                params.receipt_number =
                    search.trim();

                params.phone =
                    search.trim();

                params.email =
                    search.trim();
            }

            if (
                filter === 'approved' ||
                filter === 'rejected'
            ) {
                params.status = filter;
            }

            if (
                filter === 'needs_review'
            ) {
                /*
                 * Backend currently only accepts
                 * one status value.
                 *
                 * We use submitted for now.
                 * Later we can support
                 * submitted + reviewing together.
                 */
                params.status =
                    'submitted';
            }

            if (
                filter === 'suspicious'
            ) {
                params.suspicious = true;
            }

            const response =
                await api.get<PaginatedResponse<Receipt>>(
                    '/admin/receipts',
                    {
                        params,
                    }
                );

            setReceipts(
                response.data.data ?? []
            );

            setPagination({
                current_page:
                response.data.current_page,

                last_page:
                response.data.last_page,

                per_page:
                response.data.per_page,

                total:
                response.data.total,
            });
        } catch (err) {
            console.error(err);

            setError(
                'Unable to load receipts.'
            );
        } finally {
            setLoading(false);
        }
    };

    /*
     * Keep browser URL synchronized
     * with current list state.
     */
    useEffect(() => {
        const params =
            new URLSearchParams();

        // Keep the URL clean on the first page.
        if (page > 1) {
            params.set(
                'page',
                String(page)
            );
        }

        if (filter) {
            params.set(
                'filter',
                filter
            );
        }

        if (search.trim()) {
            params.set(
                'search',
                search.trim()
            );
        }

        setSearchParams(
            params,
            {
                replace: true,
            }
        );
    }, [
        page,
        filter,
        search,
        setSearchParams,
    ]);

    useEffect(() => {
        loadReceipts();
    }, [
        page,
        filter,
        search,
    ]);

    const submitSearch = () => {
        setPage(1);
        setSearch(
            searchInput.trim()
        );
    };

    const clearSearch = () => {
        setSearchInput('');
        setSearch('');
        setPage(1);
    };

    const hasActiveFilters =
        Boolean(
            filter ||
            search
        );

    return (
        <div className="space-y-6">

            {/* Header */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Receipts
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Review and verify
                        submitted participation
                        receipts.
                    </p>
                </div>

                <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
                    {pagination.total}{' '}
                    receipt
                    {pagination.total === 1
                        ? ''
                        : 's'}
                </div>

            </div>

            {/* Search + Filters */}

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 p-4">

                    <div className="flex flex-col gap-3 lg:flex-row">

                        <div className="flex flex-1 gap-2">

                            <input
                                type="text"
                                value={
                                    searchInput
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearchInput(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                onKeyDown={(
                                    event
                                ) => {
                                    if (
                                        event.key ===
                                        'Enter'
                                    ) {
                                        submitSearch();
                                    }
                                }}
                                placeholder="Search receipt number, phone or email..."
                                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />

                            <button
                                type="button"
                                onClick={
                                    submitSearch
                                }
                                disabled={
                                    loading
                                }
                                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Search
                            </button>

                            {search && (
                                <button
                                    type="button"
                                    onClick={
                                        clearSearch
                                    }
                                    disabled={
                                        loading
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Clear
                                </button>
                            )}

                        </div>

                    </div>

                </div>

                {/* Filter tabs */}

                <div className="p-4">

                    <div className="flex flex-wrap gap-2">

                        {filters.map(
                            (item) => (
                                <button
                                    key={
                                        item.value
                                    }
                                    type="button"
                                    onClick={() => {
                                        setFilter(
                                            item.value
                                        );

                                        setPage(
                                            1
                                        );
                                    }}
                                    className={
                                        filter ===
                                        item.value
                                            ? 'rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white'
                                            : 'rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200'
                                    }
                                >
                                    {
                                        item.label
                                    }
                                </button>
                            )
                        )}

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={() => {
                                    setFilter(
                                        ''
                                    );

                                    setSearch(
                                        ''
                                    );

                                    setSearchInput(
                                        ''
                                    );

                                    setPage(
                                        1
                                    );
                                }}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900"
                            >
                                Reset filters
                            </button>
                        )}

                    </div>

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
                        Loading receipts...
                    </div>

                ) : receipts.length === 0 ? (

                    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

                        <div className="text-sm font-medium text-gray-700">
                            No receipts found.
                        </div>

                        <div className="mt-1 text-sm text-gray-400">
                            Try changing the
                            current filters or
                            search terms.
                        </div>

                    </div>

                ) : (

                    <>
                        <div className="overflow-x-auto">

                            <table className="min-w-full text-left text-sm">

                                <thead className="bg-gray-50">

                                <tr>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Receipt
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Participant
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

                                    <th className="px-5 py-3" />

                                </tr>

                                </thead>

                                <tbody className="divide-y divide-gray-100">

                                {receipts.map(
                                    (receipt) => {

                                        const participant =
                                            receipt.participant;

                                        return (
                                            <tr
                                                key={
                                                    receipt.id
                                                }
                                                className="hover:bg-gray-50"
                                            >

                                                {/* Receipt */}

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

                                                {/* Participant */}

                                                <td className="px-5 py-4">

                                                    {participant ? (
                                                        <div>

                                                            <div className="font-medium text-gray-900">
                                                                {
                                                                    participant.first_name
                                                                }{' '}
                                                                {
                                                                    participant.last_name
                                                                }
                                                            </div>

                                                            <div className="mt-1 text-xs text-gray-500">
                                                                {
                                                                    participant.phone
                                                                }
                                                            </div>

                                                            <div className="mt-0.5 max-w-[240px] truncate text-xs text-gray-400">
                                                                {
                                                                    participant.email
                                                                }
                                                            </div>

                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            -
                                                        </span>
                                                    )}

                                                </td>

                                                {/* Status */}

                                                <td className="px-5 py-4">

                                                    <StatusBadge
                                                        status={
                                                            receipt.status
                                                        }
                                                    />

                                                </td>

                                                {/* Flags */}

                                                <td className="px-5 py-4">

                                                    {receipt.is_suspicious ? (

                                                        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                                                            Suspicious
                                                        </span>

                                                    ) : (

                                                        <span className="text-xs text-gray-400">
                                                            —
                                                        </span>

                                                    )}

                                                </td>

                                                {/* Submitted */}

                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                                                    {formatDateTime(
                                                        receipt.submitted_at ??
                                                        receipt.created_at
                                                    )}
                                                </td>

                                                {/* Action */}

                                                <td className="px-5 py-4 text-right">

                                                    <Link
                                                        to={`/admin/receipts/${receipt.id}`}
                                                        state={{
                                                            from:
                                                                `${location.pathname}${location.search}`,
                                                        }}
                                                        className="inline-flex rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                                                    >
                                                        {
                                                            receipt.status === 'submitted'
                                                                ? 'Review'
                                                                : 'View'
                                                        }
                                                    </Link>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                                </tbody>

                            </table>

                        </div>

                        {/* Pagination */}

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
                                        setPage(
                                            (
                                                current
                                            ) =>
                                                Math.max(
                                                    1,
                                                    current -
                                                    1
                                                )
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
                                        setPage(
                                            (
                                                current
                                            ) =>
                                                Math.min(
                                                    pagination.last_page,
                                                    current +
                                                    1
                                                )
                                        )
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>

                            </div>

                        </div>

                    </>
                )}

            </section>

        </div>
    );
}
