import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

type Prize = {
    id: number;
    name: string;
    type: string;
    value: number | null;
    currency: string | null;
    total_quantity: number;
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
    draw_date: string | null;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    snapshot_at: string | null;
    random_provider: string | null;
    randomized_at: string | null;
    draw_prizes: DrawPrize[];
};

type DrawListResponse = {
    data: Draw[];
};

export default function Draws() {
    const [draws, setDraws] = useState<Draw[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDraws = async () => {
        setLoading(true);
        setError(null);

        try {
            const response =
                await api.get<DrawListResponse>(
                    '/admin/draws'
                );

            setDraws(
                response.data.data ?? []
            );
        } catch (err) {
            console.error(err);

            setError(
                'Unable to load draws.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDraws();
    }, []);

    const getTotalPrizes = (
        draw: Draw
    ) => {
        return draw.draw_prizes.reduce(
            (total, drawPrize) =>
                total + drawPrize.quantity,
            0
        );
    };

    return (
        <div className="space-y-6">

            <div className="flex items-start justify-between">

                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Draws
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Manage weekly prize draws and winners.
                    </p>
                </div>

                <button
                    type="button"
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Create Draw
                </button>

            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                {loading ? (
                    <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">
                        Loading draws...
                    </div>
                ) : error ? (
                    <div className="m-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                ) : draws.length === 0 ? (
                    <div className="flex min-h-48 items-center justify-center text-sm text-gray-400">
                        No draws found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="w-full text-left text-sm">

                            <thead className="bg-gray-50">
                            <tr>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Week
                                </th>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status
                                </th>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Prizes
                                </th>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Snapshot
                                </th>

                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Randomization
                                </th>

                                <th className="px-4 py-3" />

                            </tr>
                            </thead>

                            <tbody>

                            {draws.map((draw) => (

                                <tr
                                    key={draw.id}
                                    className="border-t border-gray-100 hover:bg-gray-50"
                                >

                                    <td className="px-4 py-4">

                                        <div className="font-semibold text-gray-900">
                                            Week {draw.week_number}
                                        </div>

                                        <div className="text-xs text-gray-500">
                                            Draw #{draw.id}
                                        </div>

                                    </td>

                                    <td className="px-4 py-4">
                                        <StatusBadge
                                            status={draw.status}
                                        />
                                    </td>

                                    <td className="px-4 py-4">

                                        <div className="font-medium text-gray-900">
                                            {getTotalPrizes(draw)} winners
                                        </div>

                                        <div className="mt-1 space-y-1">

                                            {draw.draw_prizes.map(
                                                (drawPrize) => (
                                                    <div
                                                        key={drawPrize.id}
                                                        className="text-xs text-gray-500"
                                                    >
                                                        {drawPrize.prize.name}
                                                        {' × '}
                                                        {drawPrize.quantity}
                                                    </div>
                                                )
                                            )}

                                            {draw.draw_prizes.length === 0 && (
                                                <div className="text-xs text-gray-400">
                                                    No prizes configured
                                                </div>
                                            )}

                                        </div>

                                    </td>

                                    <td className="px-4 py-4">

                                        {draw.snapshot_at ? (
                                            <div className="text-sm text-green-700">
                                                Created
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-400">
                                                Not created
                                            </div>
                                        )}

                                    </td>

                                    <td className="px-4 py-4">

                                        {draw.randomized_at ? (
                                            <div>
                                                <div className="text-sm font-medium text-green-700">
                                                    Randomized
                                                </div>

                                                <div className="text-xs text-gray-500">
                                                    {draw.random_provider ?? '-'}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-400">
                                                Not randomized
                                            </div>
                                        )}

                                    </td>

                                    <td className="px-4 py-4 text-right">

                                        <Link
                                            to={`/admin/draws/${draw.id}`}
                                            className="font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            Manage
                                        </Link>

                                    </td>

                                </tr>

                            ))}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}
