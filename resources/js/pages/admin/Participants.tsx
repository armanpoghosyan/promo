import {
    Fragment,
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
import StatusBadge from '../../components/StatusBadge';

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
    formatDateTime,
} from '../../utils/date';

import {
    positiveIntegerParam,
} from '../../utils/query';

const SEARCH_MIN_LENGTH =
    3;

const SEARCH_DEBOUNCE_MS =
    350;

function formatSuspiciousReason(
    reason: string
): string {
    return reason
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
        );
}

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
        expandedParticipantId,
        setExpandedParticipantId,
    ] = useState<
        number | null
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
        setExpandedParticipantId(
            null
        );

        loadParticipants();
    }, [
        loadParticipants,
    ]);

    const currentListUrl =
        `${location.pathname}${location.search}`;

    const toggleParticipant = (
        participantId: number
    ) => {
        setExpandedParticipantId(
            (
                current
            ) =>
                current ===
                participantId
                    ? null
                    : participantId
        );
    };

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
                                    <th className="w-8 px-3 py-3" />

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
                                        const expanded =
                                            expandedParticipantId ===
                                            participant.id;

                                        const receipts =
                                            participant.receipts ??
                                            [];

                                        return (
                                            <Fragment
                                                key={
                                                    participant.id
                                                }
                                            >
                                                {/* Participant row */}

                                                <tr
                                                    onClick={() =>
                                                        toggleParticipant(
                                                            participant.id
                                                        )
                                                    }
                                                    className={[
                                                        'cursor-pointer transition hover:bg-gray-50',
                                                        expanded
                                                            ? 'bg-gray-50'
                                                            : '',
                                                    ].join(
                                                        ' '
                                                    )}
                                                >
                                                    {/* Expand */}

                                                    <td className="px-3 py-4 align-top">
                                                            <span
                                                                className={[
                                                                    'inline-block text-xs text-gray-400 transition-transform',
                                                                    expanded
                                                                        ? 'rotate-90'
                                                                        : '',
                                                                ].join(
                                                                    ' '
                                                                )}
                                                            >
                                                                ▶
                                                            </span>
                                                    </td>

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

                                                    {/* Receipt count */}

                                                    <td className="px-5 py-4 text-center align-top">
                                                            <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                                                {
                                                                    participant.receipts_count ??
                                                                    receipts.length
                                                                }
                                                            </span>
                                                    </td>

                                                    {/* Joined */}

                                                    <td className="whitespace-nowrap px-5 py-4 align-top text-sm text-gray-500">
                                                        {formatDate(
                                                            participant.created_at
                                                        )}
                                                    </td>

                                                    {/* View participant */}

                                                    <td className="px-5 py-4 text-right align-top">
                                                        <button
                                                            type="button"
                                                            onClick={(
                                                                event
                                                            ) => {
                                                                event.stopPropagation();

                                                                openParticipant(
                                                                    participant.id
                                                                );
                                                            }}
                                                            className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                                                        >
                                                            View →
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Expanded receipts */}

                                                {expanded && (
                                                    <tr>
                                                        <td
                                                            colSpan={
                                                                6
                                                            }
                                                            className="bg-gray-50/70 px-6 py-4"
                                                        >
                                                            <div className="ml-5 overflow-hidden rounded-xl border border-gray-200 bg-white">

                                                                {/* Receipt table */}

                                                                {receipts.length ===
                                                                0 ? (
                                                                    <div className="px-4 py-5 text-sm text-gray-400">
                                                                        No
                                                                        receipts
                                                                        submitted.
                                                                    </div>
                                                                ) : (
                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full min-w-[760px] text-left text-sm">
                                                                            <thead className="bg-gray-50">
                                                                            <tr>
                                                                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                                    Receipt
                                                                                </th>

                                                                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                                    Status
                                                                                </th>

                                                                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                                    Suspicious
                                                                                </th>

                                                                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                                    Submitted
                                                                                </th>
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

                                                                                    return (
                                                                                        <tr
                                                                                            key={
                                                                                                receipt.id
                                                                                            }
                                                                                            className="hover:bg-gray-50"
                                                                                        >
                                                                                            {/* Receipt */}

                                                                                            <td className="px-4 py-3 align-top">
                                                                                                <div className="font-medium text-gray-900">
                                                                                                    {
                                                                                                        receipt.receipt_number
                                                                                                    }
                                                                                                </div>

                                                                                                <div className="mt-1 text-xs text-gray-400">
                                                                                                    Receipt
                                                                                                    ID
                                                                                                    #{' '}
                                                                                                    {
                                                                                                        receipt.id
                                                                                                    }
                                                                                                </div>
                                                                                            </td>

                                                                                            {/* Status */}

                                                                                            <td className="px-4 py-3 align-top">
                                                                                                <StatusBadge
                                                                                                    status={
                                                                                                        receipt.status
                                                                                                    }
                                                                                                />
                                                                                            </td>

                                                                                            {/* Suspicious */}

                                                                                            <td className="px-4 py-3 align-top">
                                                                                                {receipt.is_suspicious ? (
                                                                                                    firstReason ? (
                                                                                                        <div>
                                                                                                            <div className="max-w-[300px] text-xs font-medium text-amber-800">
                                                                                                                {formatSuspiciousReason(
                                                                                                                    firstReason
                                                                                                                )}
                                                                                                            </div>

                                                                                                            {extraReasons >
                                                                                                                0 && (
                                                                                                                    <div className="mt-1 text-[11px] font-medium text-amber-600">
                                                                                                                        +
                                                                                                                        {
                                                                                                                            extraReasons
                                                                                                                        }{' '}
                                                                                                                        more
                                                                                                                    </div>
                                                                                                                )}
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <span className="text-xs font-medium text-amber-700">
                                                                                                                    ⚠
                                                                                                                    Suspicious
                                                                                                                </span>
                                                                                                    )
                                                                                                ) : (
                                                                                                    <span className="text-xs text-gray-400">
                                                                                                                —
                                                                                                            </span>
                                                                                                )}
                                                                                            </td>

                                                                                            {/* Submitted */}

                                                                                            <td className="whitespace-nowrap px-4 py-3 align-top text-sm text-gray-500">
                                                                                                {formatDateTime(
                                                                                                    receipt.submitted_at ??
                                                                                                    receipt.created_at
                                                                                                )}
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                }
                                                                            )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
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
