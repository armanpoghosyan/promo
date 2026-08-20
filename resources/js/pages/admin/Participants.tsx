import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    useLocation,
    useNavigate,
    useSearchParams,
} from 'react-router-dom';

import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import Tooltip from '../../components/Tooltip';

import api from '../../services/api';

import type {
    PaginatedResponse,
} from '../../types/api';

import type {
    Participant,
} from '../../types/participant';

import {
    getApiErrorMessage,
} from '../../utils/apiError';

import {
    formatDate,
} from '../../utils/date';

import {
    formatEnumLabel,
} from '../../utils/format';

import {
    positiveIntegerParam,
} from '../../utils/query';

const SEARCH_MIN_LENGTH =
    3;

const SEARCH_DEBOUNCE_MS =
    350;

export default function Participants() {
    const location =
        useLocation();

    const navigate =
        useNavigate();

    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams();

    const urlSearch =
        searchParams.get(
            'search'
        ) ?? '';

    const page =
        positiveIntegerParam(
            searchParams.get(
                'page'
            )
        );

    const [
        searchInput,
        setSearchInput,
    ] = useState(
        urlSearch
    );

    const [
        participants,
        setParticipants,
    ] = useState<
        Participant[]
    >([]);

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
        pagination,
        setPagination,
    ] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    const updateUrl =
        useCallback(
            (
                nextSearch: string,
                nextPage: number
            ) => {
                const params =
                    new URLSearchParams();

                if (
                    nextSearch
                ) {
                    params.set(
                        'search',
                        nextSearch
                    );
                }

                if (
                    nextPage >
                    1
                ) {
                    params.set(
                        'page',
                        String(
                            nextPage
                        )
                    );
                }

                setSearchParams(
                    params,
                    {
                        replace: true,
                    }
                );
            },
            [
                setSearchParams,
            ]
        );

    /*
     * Keep search input synchronized
     * with browser navigation.
     */
    useEffect(() => {
        setSearchInput(
            urlSearch
        );
    }, [
        urlSearch,
    ]);

    /*
     * Type-ahead search.
     *
     * Search starts after 3 characters.
     * Clearing the input resets the list.
     */
    useEffect(() => {
        const timer =
            window.setTimeout(
                () => {
                    const value =
                        searchInput.trim();

                    const nextSearch =
                        value.length >=
                        SEARCH_MIN_LENGTH
                            ? value
                            : '';

                    if (
                        nextSearch !==
                        urlSearch
                    ) {
                        updateUrl(
                            nextSearch,
                            1
                        );
                    }
                },
                SEARCH_DEBOUNCE_MS
            );

        return () => {
            window.clearTimeout(
                timer
            );
        };
    }, [
        searchInput,
        urlSearch,
        updateUrl,
    ]);

    const loadParticipants =
        useCallback(
            async () => {
                setLoading(
                    true
                );

                setError(
                    null
                );

                try {
                    const response =
                        await api.get<
                            PaginatedResponse<Participant>
                        >(
                            '/admin/participants',
                            {
                                params: {
                                    search:
                                        urlSearch ||
                                        undefined,

                                    page,

                                    per_page:
                                        20,
                                },
                            }
                        );

                    setParticipants(
                        response.data
                            .data ??
                        []
                    );

                    setPagination({
                        current_page:
                        response.data
                            .current_page,

                        last_page:
                        response.data
                            .last_page,

                        per_page:
                        response.data
                            .per_page,

                        total:
                        response.data
                            .total,
                    });
                } catch (
                    error: unknown
                    ) {
                    setError(
                        getApiErrorMessage(
                            error,
                            'Unable to load participants.'
                        )
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            [
                urlSearch,
                page,
            ]
        );

    useEffect(() => {
        loadParticipants();
    }, [
        loadParticipants,
    ]);

    const currentListUrl =
        `${location.pathname}${location.search}`;

    const openParticipant = (
        participantId: number
    ) => {
        navigate(
            `/admin/participants/${participantId}`,
            {
                state: {
                    from:
                    currentListUrl,
                },
            }
        );
    };

    const trimmedSearch =
        searchInput.trim();

    const showSearchHint =
        trimmedSearch.length >
        0 &&
        trimmedSearch.length <
        SEARCH_MIN_LENGTH;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Participants"
                description="Find participants and review their participation history."
            />

            {/* Search */}

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="relative">
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
                        placeholder="Search by name, phone, email or participant ID..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-20 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                    />

                    {searchInput && (
                        <button
                            type="button"
                            onClick={() =>
                                setSearchInput(
                                    ''
                                )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-gray-700"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-4">
                    <div className="text-xs text-gray-400">
                        {showSearchHint
                            ? `Type at least ${SEARCH_MIN_LENGTH} characters to search.`
                            : urlSearch
                                ? `Searching for “${urlSearch}”`
                                : 'Search starts automatically after 3 characters.'}
                    </div>

                    <div className="shrink-0 text-xs text-gray-500">
                        {
                            pagination.total
                        }{' '}
                        participant
                        {pagination.total ===
                        1
                            ? ''
                            : 's'}
                    </div>
                </div>
            </section>

            {error && (
                <Alert
                    variant="error"
                    onDismiss={() =>
                        setError(
                            null
                        )
                    }
                >
                    {
                        error
                    }
                </Alert>
            )}

            {/* Participants */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {loading ? (
                    <LoadingState
                        message="Loading participants..."
                    />
                ) : participants.length ===
                0 ? (
                    <EmptyState
                        title="No participants found."
                        description={
                            urlSearch
                                ? 'No participant matches this search.'
                                : 'No participants have been registered yet.'
                        }
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Participant
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Contact
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Receipts
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Joined
                                    </th>

                                    <th className="px-5 py-3" />
                                </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                {participants.map(
                                    (
                                        participant
                                    ) => {
                                        const receipts =
                                            participant.receipts ??
                                            [];

                                        const receiptCount =
                                            participant.receipts_count ??
                                            receipts.length;

                                        return (
                                            <tr
                                                key={
                                                    participant.id
                                                }
                                                className="transition hover:bg-gray-50"
                                            >
                                                {/* Participant */}

                                                <td className="px-5 py-4 align-top">
                                                    <div className="font-semibold text-gray-900">
                                                        {
                                                            participant.first_name
                                                        }{' '}
                                                        {
                                                            participant.last_name
                                                        }
                                                    </div>

                                                    <div className="mt-1 text-xs text-gray-400">
                                                        Participant
                                                        ID
                                                        #{' '}
                                                        {
                                                            participant.id
                                                        }
                                                    </div>
                                                </td>

                                                {/* Contact */}

                                                <td className="px-5 py-4 align-top">
                                                    <div className="text-sm text-gray-700">
                                                        {
                                                            participant.phone
                                                        }
                                                    </div>

                                                    <div className="mt-1 max-w-[280px] truncate text-xs text-gray-500">
                                                        {
                                                            participant.email
                                                        }
                                                    </div>
                                                </td>

                                                {/* Receipts */}

                                                <td className="px-5 py-4 align-top">
                                                    {receipts.length >
                                                    0 ? (
                                                        <Tooltip
                                                            content={
                                                                <div>
                                                                    <div className="mb-2 font-semibold">
                                                                        Receipts
                                                                    </div>

                                                                    <div className="space-y-1.5">
                                                                        {receipts.map(
                                                                            (
                                                                                receipt
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        receipt.id
                                                                                    }
                                                                                    className="flex items-center justify-between gap-5"
                                                                                >
                                                                                        <span className="max-w-[230px] truncate text-gray-200">
                                                                                            {
                                                                                                receipt.receipt_number
                                                                                            }
                                                                                        </span>

                                                                                    <span className="shrink-0 font-medium text-white">
                                                                                            {formatEnumLabel(
                                                                                                receipt.status
                                                                                            )}
                                                                                        </span>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            }
                                                            maxWidth={
                                                                400
                                                            }
                                                        >
                                                                <span className="inline-flex cursor-help rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                                                    {
                                                                        receiptCount
                                                                    }{' '}
                                                                    total
                                                                </span>
                                                        </Tooltip>
                                                    ) : (
                                                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                                                                0
                                                                total
                                                            </span>
                                                    )}
                                                </td>

                                                {/* Joined */}

                                                <td className="whitespace-nowrap px-5 py-4 align-top text-sm text-gray-500">
                                                    {formatDate(
                                                        participant.created_at
                                                    )}
                                                </td>

                                                {/* View Participant */}

                                                <td className="px-5 py-4 text-right align-top">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openParticipant(
                                                                participant.id
                                                            )
                                                        }
                                                        className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                                                    >
                                                        View
                                                        Participant
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

                        <Pagination
                            currentPage={
                                pagination.current_page
                            }
                            lastPage={
                                pagination.last_page
                            }
                            perPage={
                                pagination.per_page
                            }
                            total={
                                pagination.total
                            }
                            loading={
                                loading
                            }
                            onPageChange={(
                                nextPage
                            ) => {
                                updateUrl(
                                    urlSearch,
                                    nextPage
                                );

                                window.scrollTo({
                                    top: 0,
                                    behavior:
                                        'smooth',
                                });
                            }}
                        />
                    </>
                )}
            </section>
        </div>
    );
}
