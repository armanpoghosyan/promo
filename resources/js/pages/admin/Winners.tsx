import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

type WinnerStatus =
    | 'selected'
    | 'contacting'
    | 'confirmed'
    | 'cancelled';

type Participant = {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
};

type Receipt = {
    id: number;
    receipt_number: string;
    participant: Participant | null;
};

type Prize = {
    id: number;
    name: string;
    type: string;
    value: number | null;
    currency: string | null;
};

type DrawPrize = {
    id: number;
    draw_id: number;
    prize_id: number;
    quantity: number;
    prize: Prize;
};

type Draw = {
    id: number;
    week_number: number;
    status: string;
};

type ContactAttempt = {
    id: number;
    attempted_at: string;
    result: string;
    notes: string | null;
};

type Winner = {
    id: number;
    draw_id: number;
    draw_prize_id: number;
    receipt_id: number;
    entry_number: number;
    status: WinnerStatus;
    selected_at: string;
    confirmed_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    replaced_winner_id: number | null;

    draw: Draw;
    draw_prize: DrawPrize;
    receipt: Receipt;
    contact_attempts: ContactAttempt[];
};

type WinnerListResponse = {
    current_page: number;
    data: Winner[];
    last_page: number;
    per_page: number;
    total: number;
};

const statuses: Array<{
    label: string;
    value: WinnerStatus | '';
}> = [
    {
        label: 'All',
        value: '',
    },
    {
        label: 'Selected',
        value: 'selected',
    },
    {
        label: 'Contacting',
        value: 'contacting',
    },
    {
        label: 'Confirmed',
        value: 'confirmed',
    },
    {
        label: 'Cancelled',
        value: 'cancelled',
    },
];

export default function Winners() {
    const [winners, setWinners] = useState<Winner[]>([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const [searchParams, setSearchParams] =
        useSearchParams();

    const initialPage =
        Number(searchParams.get('page')) || 1;

    const initialStatus =
        (searchParams.get('status') as WinnerStatus | '') || '';

    const [status, setStatus] =
        useState<WinnerStatus | ''>(initialStatus);

    const [page, setPage] =
        useState(initialPage);

    const location = useLocation();

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    const loadWinners = async () => {
        setLoading(true);
        setError(null);

        try {
            const response =
                await api.get<WinnerListResponse>(
                    '/admin/winners',
                    {
                        params: {
                            page,
                            ...(status
                                ? { status }
                                : {}),
                        },
                    }
                );

            setWinners(
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
                'Unable to load winners.'
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
    }, [
        page,
        status,
        setSearchParams,
    ]);

    useEffect(() => {
        loadWinners();
    }, [page, status]);

    return (
        <div className="space-y-6">

            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Winners
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Review and manage selected promotion winners.
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
                        Loading winners...
                    </div>

                ) : error ? (

                    <div className="m-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>

                ) : winners.length === 0 ? (

                    <div className="flex min-h-48 items-center justify-center text-sm text-gray-400">
                        No winners found.
                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full text-left text-sm">

                            <thead className="bg-gray-50">

                            <tr>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Winner
                                </th>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Draw
                                </th>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Prize
                                </th>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Receipt
                                </th>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Contact
                                </th>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Selected
                                </th>

                                <th className="px-4 py-3" />

                            </tr>

                            </thead>

                            <tbody>

                            {winners.map((winner) => {

                                const participant =
                                    winner.receipt?.participant;

                                return (

                                    <tr
                                        key={winner.id}
                                        className="border-t border-gray-100 hover:bg-gray-50"
                                    >

                                        <td className="px-4 py-4">

                                            <div className="font-medium text-gray-900">

                                                {participant
                                                    ? `${participant.first_name} ${participant.last_name}`
                                                    : '-'
                                                }

                                            </div>

                                            <div className="text-xs text-gray-500">
                                                {participant?.phone ?? ''}
                                            </div>

                                        </td>

                                        <td className="px-4 py-4">

                                            <div className="font-medium text-gray-900">
                                                Week {winner.draw?.week_number}
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                Winner #{winner.id}
                                            </div>

                                        </td>

                                        <td className="px-4 py-4">

                                            <div className="font-medium text-gray-900">
                                                {winner.draw_prize?.prize?.name ?? '-'}
                                            </div>

                                            {winner.draw_prize?.prize?.value && (
                                                <div className="text-xs text-gray-500">
                                                    {winner.draw_prize.prize.value.toLocaleString()}
                                                    {' '}
                                                    {winner.draw_prize.prize.currency ?? ''}
                                                </div>
                                            )}

                                        </td>

                                        <td className="px-4 py-4">

                                            <div className="font-medium text-gray-900">
                                                {winner.receipt?.receipt_number ?? '-'}
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                Entry #{winner.entry_number}
                                            </div>

                                        </td>

                                        <td className="px-4 py-4">

                                            <StatusBadge
                                                status={winner.status}
                                            />

                                        </td>

                                        <td className="px-4 py-4">

                                            <div className="font-medium text-gray-900">
                                                {winner.contact_attempts?.length ?? 0}
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                attempts
                                            </div>

                                        </td>

                                        <td className="px-4 py-4 text-gray-500">

                                            {winner.selected_at
                                                ? new Date(
                                                    winner.selected_at
                                                ).toLocaleString()
                                                : '-'
                                            }

                                        </td>

                                        <td className="px-4 py-4 text-right">

                                            <Link
                                                to={`/admin/winners/${winner.id}`}
                                                state={{
                                                    from:
                                                        `${location.pathname}${location.search}`,
                                                }}
                                                className="font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                View
                                            </Link>

                                        </td>

                                    </tr>

                                );

                            })}

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
                                    'No winners'
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
                                            (current) =>
                                                current - 1
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
                                            (current) =>
                                                current + 1
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
