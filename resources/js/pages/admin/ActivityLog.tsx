import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    Link,
    useSearchParams,
} from 'react-router-dom';

import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';

import api from '../../services/api';

import type {
    PaginatedResponse,
} from '../../types/api';

import {
    getApiErrorMessage,
} from '../../utils/apiError';

import {
    formatDateTime,
} from '../../utils/date';

import {
    positiveIntegerParam,
} from '../../utils/query';

type ActivityCategory =
    | 'all'
    | 'receipts'
    | 'draws'
    | 'winners'
    | 'reports';

type AuditUser = {
    id: number;

    name?:
        | string
        | null;

    email?:
        | string
        | null;
};

type AuditValues =
    | Record<
    string,
    unknown
>
    | null;

type AuditLogItem = {
    id: number;

    user_id:
        | number
        | null;

    action: string;

    auditable_type:
        | string
        | null;

    auditable_id:
        | number
        | null;

    old_values:
        AuditValues;

    new_values:
        AuditValues;

    description:
        | string
        | null;

    ip_address:
        | string
        | null;

    user_agent:
        | string
        | null;

    created_at: string;
    updated_at: string;

    user:
        | AuditUser
        | null;
};

const categories: Array<{
    value: ActivityCategory;
    label: string;
}> = [
    {
        value: 'all',
        label: 'All Activity',
    },
    {
        value: 'receipts',
        label: 'Receipts',
    },
    {
        value: 'draws',
        label: 'Draws',
    },
    {
        value: 'winners',
        label: 'Winners',
    },
    {
        value: 'reports',
        label: 'Reports',
    },
];

function isActivityCategory(
    value:
        | string
        | null
): value is ActivityCategory {
    return (
        value === 'all' ||
        value === 'receipts' ||
        value === 'draws' ||
        value === 'winners' ||
        value === 'reports'
    );
}

function actionLabel(
    action: string
): string {
    return action
        .replaceAll(
            '.',
            ' '
        )
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

function entityType(
    type:
        | string
        | null
): 'receipt' | 'draw' | 'winner' | 'user' | 'other' {
    if (!type) {
        return 'other';
    }

    if (
        type.endsWith(
            '\\Receipt'
        )
    ) {
        return 'receipt';
    }

    if (
        type.endsWith(
            '\\DrawWinner'
        )
    ) {
        return 'winner';
    }

    if (
        type.endsWith(
            '\\Draw'
        )
    ) {
        return 'draw';
    }

    if (
        type.endsWith(
            '\\User'
        )
    ) {
        return 'user';
    }

    return 'other';
}

function entityLabel(
    item: AuditLogItem
): string {
    const type =
        entityType(
            item.auditable_type
        );

    if (
        item.auditable_id ===
        null
    ) {
        return '—';
    }

    switch (type) {
        case 'receipt':
            return `Receipt #${item.auditable_id}`;

        case 'draw':
            return `Draw #${item.auditable_id}`;

        case 'winner':
            return `Winner #${item.auditable_id}`;

        case 'user':
            return `User #${item.auditable_id}`;

        default:
            return `#${item.auditable_id}`;
    }
}

function entityUrl(
    item: AuditLogItem
): string | null {
    if (
        item.auditable_id ===
        null
    ) {
        return null;
    }

    switch (
        entityType(
            item.auditable_type
        )
        ) {
        case 'receipt':
            return `/admin/receipts/${item.auditable_id}`;

        case 'draw':
            return `/admin/draws/${item.auditable_id}`;

        case 'winner':
            return `/admin/winners/${item.auditable_id}`;

        default:
            return null;
    }
}

function administratorName(
    item: AuditLogItem
): string {
    return (
        item.user?.name ||
        item.user?.email ||
        (
            item.user_id
                ? `User #${item.user_id}`
                : 'System'
        )
    );
}

export default function ActivityLog() {
    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams();

    const categoryParam =
        searchParams.get(
            'category'
        );

    const category:
        ActivityCategory =
        isActivityCategory(
            categoryParam
        )
            ? categoryParam
            : 'all';

    const dateFrom =
        searchParams.get(
            'from'
        ) ?? '';

    const dateTo =
        searchParams.get(
            'to'
        ) ?? '';

    const page =
        positiveIntegerParam(
            searchParams.get(
                'page'
            )
        );

    const [
        logs,
        setLogs,
    ] = useState<
        AuditLogItem[]
    >([]);

    const [
        selectedLog,
        setSelectedLog,
    ] = useState<
        AuditLogItem | null
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
            ({
                 nextCategory =
                 category,

                 nextDateFrom =
                 dateFrom,

                 nextDateTo =
                 dateTo,

                 nextPage =
                 page,
             }: {
                nextCategory?:
                    ActivityCategory;

                nextDateFrom?:
                    string;

                nextDateTo?:
                    string;

                nextPage?:
                    number;
            }) => {
                const params =
                    new URLSearchParams();

                if (
                    nextCategory !==
                    'all'
                ) {
                    params.set(
                        'category',
                        nextCategory
                    );
                }

                if (
                    nextDateFrom
                ) {
                    params.set(
                        'from',
                        nextDateFrom
                    );
                }

                if (
                    nextDateTo
                ) {
                    params.set(
                        'to',
                        nextDateTo
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
                category,
                dateFrom,
                dateTo,
                page,
                setSearchParams,
            ]
        );

    const loadLogs =
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
                            PaginatedResponse<AuditLogItem>
                        >(
                            '/admin/audit-logs',
                            {
                                params: {
                                    category:
                                        category ===
                                        'all'
                                            ? undefined
                                            : category,

                                    date_from:
                                        dateFrom ||
                                        undefined,

                                    date_to:
                                        dateTo ||
                                        undefined,

                                    page,

                                    per_page:
                                        20,
                                },
                            }
                        );

                    setLogs(
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
                            'Unable to load activity log.'
                        )
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            [
                category,
                dateFrom,
                dateTo,
                page,
            ]
        );

    useEffect(() => {
        loadLogs();
    }, [
        loadLogs,
    ]);

    useEffect(() => {
        if (!selectedLog) {
            return;
        }

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key ===
                'Escape'
            ) {
                setSelectedLog(
                    null
                );
            }
        };

        window.addEventListener(
            'keydown',
            handleKeyDown
        );

        const previousOverflow =
            document.body.style
                .overflow;

        document.body.style.overflow =
            'hidden';

        return () => {
            window.removeEventListener(
                'keydown',
                handleKeyDown
            );

            document.body.style.overflow =
                previousOverflow;
        };
    }, [
        selectedLog,
    ]);

    return (
        <>
            <div className="space-y-6">
                <PageHeader
                    title="Activity Log"
                    description="Review administrator actions and important promotion changes."
                />

                {/* Categories */}

                <div className="overflow-x-auto border-b border-gray-200">
                    <nav className="flex min-w-max gap-6">
                        {categories.map(
                            (
                                item
                            ) => {
                                const active =
                                    category ===
                                    item.value;

                                return (
                                    <button
                                        key={
                                            item.value
                                        }
                                        type="button"
                                        onClick={() =>
                                            updateUrl({
                                                nextCategory:
                                                item.value,

                                                nextPage:
                                                    1,
                                            })
                                        }
                                        className={[
                                            'relative whitespace-nowrap pb-3 text-sm font-medium transition',
                                            active
                                                ? 'text-gray-900'
                                                : 'text-gray-500 hover:text-gray-900',
                                        ].join(
                                            ' '
                                        )}
                                    >
                                        {
                                            item.label
                                        }

                                        {active && (
                                            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gray-900" />
                                        )}
                                    </button>
                                );
                            }
                        )}
                    </nav>
                </div>

                {/* Date Filters */}

                <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div>
                            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                                From
                            </label>

                            <input
                                type="date"
                                value={
                                    dateFrom
                                }
                                onChange={(
                                    event
                                ) =>
                                    updateUrl({
                                        nextDateFrom:
                                        event
                                            .target
                                            .value,

                                        nextPage:
                                            1,
                                    })
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                                To
                            </label>

                            <input
                                type="date"
                                value={
                                    dateTo
                                }
                                onChange={(
                                    event
                                ) =>
                                    updateUrl({
                                        nextDateTo:
                                        event
                                            .target
                                            .value,

                                        nextPage:
                                            1,
                                    })
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                        </div>

                        {(dateFrom ||
                            dateTo) && (
                            <button
                                type="button"
                                onClick={() =>
                                    updateUrl({
                                        nextDateFrom:
                                            '',

                                        nextDateTo:
                                            '',

                                        nextPage:
                                            1,
                                    })
                                }
                                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                            >
                                Clear dates
                            </button>
                        )}

                        <div className="sm:ml-auto">
                            <span className="text-sm text-gray-500">
                                {
                                    pagination.total
                                }{' '}
                                activit
                                {pagination.total ===
                                1
                                    ? 'y'
                                    : 'ies'}
                            </span>
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

                {/* Activity */}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    {loading ? (
                        <LoadingState
                            message="Loading activity..."
                        />
                    ) : logs.length ===
                    0 ? (
                        <EmptyState
                            title="No activity found."
                            description="No audit events match the current filters."
                        />
                    ) : (
                        <>
                            <div className="divide-y divide-gray-100">
                                {logs.map(
                                    (
                                        item
                                    ) => {
                                        const url =
                                            entityUrl(
                                                item
                                            );

                                        return (
                                            <div
                                                key={
                                                    item.id
                                                }
                                                className="grid gap-4 px-5 py-4 transition hover:bg-gray-50 lg:grid-cols-[180px_200px_minmax(0,1fr)_160px]"
                                            >
                                                {/* Time */}

                                                <div>
                                                    <div className="text-sm text-gray-700">
                                                        {formatDateTime(
                                                            item.created_at
                                                        )}
                                                    </div>

                                                    <div className="mt-1 text-xs text-gray-400">
                                                        Log
                                                        #{' '}
                                                        {
                                                            item.id
                                                        }
                                                    </div>
                                                </div>

                                                {/* User */}

                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {administratorName(
                                                            item
                                                        )}
                                                    </div>

                                                    {item.user
                                                            ?.email &&
                                                        item.user
                                                            ?.name && (
                                                            <div className="mt-1 truncate text-xs text-gray-400">
                                                                {
                                                                    item
                                                                        .user
                                                                        .email
                                                                }
                                                            </div>
                                                        )}
                                                </div>

                                                {/* Action */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedLog(
                                                            item
                                                        )
                                                    }
                                                    className="min-w-0 text-left"
                                                >
                                                    <div className="font-semibold text-gray-900">
                                                        {actionLabel(
                                                            item.action
                                                        )}
                                                    </div>

                                                    {item.description && (
                                                        <div className="mt-1 text-sm text-gray-600">
                                                            {
                                                                item.description
                                                            }
                                                        </div>
                                                    )}

                                                    <div className="mt-1 text-xs text-gray-400">
                                                        {entityLabel(
                                                            item
                                                        )}
                                                    </div>
                                                </button>

                                                {/* Action */}

                                                <div className="flex items-start justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedLog(
                                                                item
                                                            )
                                                        }
                                                        className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                                    >
                                                        Details
                                                    </button>

                                                    {url && (
                                                        <Link
                                                            to={
                                                                url
                                                            }
                                                            className="rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                                                        >
                                                            View
                                                            →
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
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
                                    updateUrl({
                                        nextPage,
                                    });

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

            {/* Activity Details Modal */}

            {selectedLog && (
                <ActivityDetailsModal
                    item={
                        selectedLog
                    }
                    onClose={() =>
                        setSelectedLog(
                            null
                        )
                    }
                />
            )}
        </>
    );
}

function ActivityDetailsModal({
                                  item,
                                  onClose,
                              }: {
    item: AuditLogItem;
    onClose: () => void;
}) {
    const url =
        entityUrl(
            item
        );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(
                event
            ) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}

                <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
                    <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Activity Details
                        </div>

                        <h2 className="mt-1 text-xl font-semibold text-gray-900">
                            {actionLabel(
                                item.action
                            )}
                        </h2>

                        <div className="mt-1 text-sm text-gray-500">
                            {formatDateTime(
                                item.created_at
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        className="rounded-lg px-3 py-2 text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                        ×
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
                    {/* Summary */}

                    <div className="grid gap-5 sm:grid-cols-2">
                        <InfoItem
                            label="Administrator"
                            value={administratorName(
                                item
                            )}
                        />

                        <InfoItem
                            label="Entity"
                            value={entityLabel(
                                item
                            )}
                        />

                        <InfoItem
                            label="Action"
                            value={
                                item.action
                            }
                        />

                        <InfoItem
                            label="Log ID"
                            value={`#${item.id}`}
                        />

                        <InfoItem
                            label="IP Address"
                            value={
                                item.ip_address ??
                                '—'
                            }
                        />

                        <InfoItem
                            label="Created"
                            value={formatDateTime(
                                item.created_at
                            )}
                        />
                    </div>

                    {item.description && (
                        <section>
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Description
                            </div>

                            <div className="mt-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                                {
                                    item.description
                                }
                            </div>
                        </section>
                    )}

                    {/* Previous */}

                    <JsonBlock
                        title="Previous Values"
                        value={
                            item.old_values
                        }
                    />

                    {/* New */}

                    <JsonBlock
                        title="New Values"
                        value={
                            item.new_values
                        }
                    />

                    {/* User Agent */}

                    <section>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            User Agent
                        </div>

                        <div className="mt-2 break-all rounded-lg bg-gray-50 p-4 font-mono text-xs leading-5 text-gray-600">
                            {item.user_agent ??
                                '—'}
                        </div>
                    </section>
                </div>

                <div className="flex justify-between gap-3 border-t border-gray-200 px-5 py-4">
                    <div>
                        {url && (
                            <Link
                                to={
                                    url
                                }
                                onClick={
                                    onClose
                                }
                                className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                                View{' '}
                                {entityLabel(
                                    item
                                )}{' '}
                                →
                            </Link>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function JsonBlock({
                       title,
                       value,
                   }: {
    title: string;
    value: AuditValues;
}) {
    return (
        <section>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {
                    title
                }
            </div>

            <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-gray-950 p-4 text-xs leading-5 text-gray-200">
                {value
                    ? JSON.stringify(
                        value,
                        null,
                        2
                    )
                    : '—'}
            </pre>
        </section>
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
