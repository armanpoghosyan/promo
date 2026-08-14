import { useEffect, useState } from 'react';

import api from '../../services/api';

type Prize = {
    id: number;
    name: string;
    type: string;
    value: number | string | null;
    currency: string | null;
    total_quantity: number;
    allocated_quantity: number;
    available_quantity: number;
};

type PrizesResponse = {
    data: Prize[];
};

export default function Prizes() {
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPrizes = async () => {
        setLoading(true);
        setError(null);

        try {
            const response =
                await api.get<PrizesResponse>(
                    '/admin/prizes'
                );

            setPrizes(response.data.data ?? []);
        } catch (err) {
            console.error(err);

            setError(
                'Unable to load prizes.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPrizes();
    }, []);

    const formatValue = (prize: Prize) => {
        if (
            prize.value === null ||
            prize.value === ''
        ) {
            return '-';
        }

        return prize.currency
            ? `${prize.value} ${prize.currency}`
            : String(prize.value);
    };

    return (
        <div className="space-y-6">

            {/* Header */}

            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Prizes
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    View prizes and their current allocation across draws.
                </p>
            </div>

            {/* Error */}

            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Prize List */}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">
                    <div className="flex items-center justify-between">

                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Prize List
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                {prizes.length}{' '}
                                {prizes.length === 1
                                    ? 'prize'
                                    : 'prizes'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadPrizes}
                            disabled={loading}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Refresh
                        </button>

                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                        Loading prizes...
                    </div>
                ) : prizes.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">
                        No prizes found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="min-w-full divide-y divide-gray-200">

                            <thead className="bg-gray-50">

                            <tr>

                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Prize
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Type
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Value
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Total
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Allocated
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                                    Available
                                </th>

                            </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100 bg-white">

                            {prizes.map((prize) => {

                                const fullyAllocated =
                                    prize.available_quantity <= 0;

                                return (
                                    <tr
                                        key={prize.id}
                                        className="hover:bg-gray-50"
                                    >

                                        <td className="px-5 py-4">

                                            <div className="font-medium text-gray-900">
                                                {prize.name}
                                            </div>

                                            <div className="mt-1 text-xs text-gray-500">
                                                ID #{prize.id}
                                            </div>

                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-700">
                                            {prize.type || '-'}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-700">
                                            {formatValue(prize)}
                                        </td>

                                        <td className="px-5 py-4 text-center text-sm text-gray-700">
                                            {prize.total_quantity}
                                        </td>

                                        <td className="px-5 py-4 text-center text-sm text-gray-700">
                                            {prize.allocated_quantity}
                                        </td>

                                        <td className="px-5 py-4 text-center">

                                                <span
                                                    className={
                                                        fullyAllocated
                                                            ? 'inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700'
                                                            : 'inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700'
                                                    }
                                                >
                                                    {prize.available_quantity}
                                                </span>

                                        </td>

                                    </tr>
                                );
                            })}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}
