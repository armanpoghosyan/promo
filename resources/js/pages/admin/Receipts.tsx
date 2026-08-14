import { useEffect, useState } from 'react';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import type {
    Receipt,
    ReceiptStatus,
} from '../../types/receipt';

const statuses: Array<{
    label: string;
    value: ReceiptStatus | '';
}> = [
    {
        label: 'All',
        value: '',
    },
    {
        label: 'Submitted',
        value: 'submitted',
    },
    {
        label: 'Reviewing',
        value: 'reviewing',
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
        label: 'Winner',
        value: 'winner',
    },
];

export default function Receipts() {
    const [receipts, setReceipts] = useState<Receipt[]>([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const [searchParams, setSearchParams] = useSearchParams();

    const initialPage = Number(searchParams.get('page')) || 1;

    const initialStatus = (searchParams.get('status') as ReceiptStatus | '') || '';

    const [status, setStatus] = useState<ReceiptStatus | ''>(initialStatus);

    const [page, setPage] = useState(initialPage);

    const location = useLocation();

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    const loadReceipts = async () => {
        setLoading(true);
        setError(null);

        try {
            const response =
                await api.get<ReceiptListResponse>(
                    '/admin/receipts',
                    {
                        params: {
                            page,
                            ...(status ? { status } : {}),
                        },
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

    useEffect(() => {
        const params: Record<string, string> = {
            page: String(page),
        };

        if (status) {
            params.status = status;
        }

        setSearchParams(params, {
            replace: true,
        });
    }, [page, status, setSearchParams]);

    useEffect(() => {
        loadReceipts();
    }, [status, page]);

    return (
        <div className="space-y-6">

            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Receipts
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Review and manage participant receipts.
                </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 p-4">

                    <div className="flex flex-wrap gap-2">

                        {statuses.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => {
                                    setStatus(item.value);
                                    setPage(1);
                                }}
                                className={
                                    status === item.value
                                        ? 'rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white'
                                        : 'rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200'
                                }
                            >
                                {item.label}
                            </button>
                        ))}

                    </div>

                </div>

                {loading ? (
                    <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">
                        Loading receipts...
                    </div>
                ) : error ? (
                    <div className="m-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                ) : receipts.length === 0 ? (
                    <div className="flex min-h-48 items-center justify-center text-sm text-gray-400">
                        No receipts found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="w-full text-left text-sm">

                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    ID
                                </th>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Receipt
                                </th>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Participant
                                </th>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Submitted
                                </th>

                                <th className="px-4 py-3" />
                            </tr>
                            </thead>

                            <tbody>
                            {receipts.map((receipt) => (
                                <tr
                                    key={receipt.id}
                                    className="border-t border-gray-100 hover:bg-gray-50"
                                >
                                    <td className="px-4 py-4 font-medium text-gray-900">
                                        #{receipt.id}
                                    </td>

                                    <td className="px-4 py-4 text-gray-700">
                                        {receipt.receipt_number}
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="font-medium text-gray-900">
                                            {receipt.participant
                                                ? `${receipt.participant.first_name} ${receipt.participant.last_name}`
                                                : '-'}
                                        </div>

                                        <div className="text-xs text-gray-500">
                                            {receipt.participant?.phone ?? ''}
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <StatusBadge
                                            status={receipt.status}
                                        />
                                    </td>

                                    <td className="px-4 py-4 text-gray-500">
                                        {new Date(
                                            receipt.created_at
                                        ).toLocaleString()}
                                    </td>

                                    <td className="px-4 py-4 text-right">
                                        <Link
                                            to={`/admin/receipts/${receipt.id}`}
                                            state={{
                                                from: `${location.pathname}${location.search}`,
                                            }}
                                            className="font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            </tbody>

                        </table>

                        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4">

                            <div className="text-sm text-gray-500">
                                {pagination.total > 0 ? (
                                    <>
                                        Showing{' '}
                                        {(pagination.current_page - 1) *
                                            pagination.per_page +
                                            1}
                                        {' '}to{' '}
                                        {Math.min(
                                            pagination.current_page *
                                            pagination.per_page,
                                            pagination.total
                                        )}
                                        {' '}of{' '}
                                        {pagination.total}
                                    </>
                                ) : (
                                    'No receipts'
                                )}
                            </div>

                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    disabled={
                                        pagination.current_page <= 1 ||
                                        loading
                                    }
                                    onClick={() =>
                                        setPage(
                                            (current) => current - 1
                                        )
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                <span className="px-2 text-sm text-gray-600">
                                    Page {pagination.current_page} of{' '}
                                    {pagination.last_page}
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
                                            (current) => current + 1
                                        )
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>

                            </div>

                        </div>

                    </div>
                )}

            </div>

        </div>
    );
}
