import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import api from '../../services/api';
import { formatEnumLabel } from '../../utils/format';

type Prize = {
    id: number;
    name: string;
    type: string;
    value: number | string | null;
    currency: string | null;
    total_quantity: number;
    allocated_quantity: number | string;
    available_quantity: number | string;
};

type PrizesResponse = {
    data: Prize[];
};

type NormalizedPrize = Omit<
    Prize,
    'allocated_quantity' | 'available_quantity'
> & {
    allocated_quantity: number;
    available_quantity: number;
};


function formatPrizeValue(
    prize: NormalizedPrize
): string {
    if (
        prize.value === null ||
        prize.value === ''
    ) {
        return '—';
    }

    const numericValue =
        Number(prize.value);

    const formattedValue =
        Number.isNaN(numericValue)
            ? String(prize.value)
            : numericValue.toLocaleString();

    return prize.currency
        ? `${formattedValue} ${prize.currency}`
        : formattedValue;
}

export default function Prizes() {
    const [prizes, setPrizes] =
        useState<NormalizedPrize[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const loadPrizes = async () => {
        setLoading(true);
        setError(null);

        try {
            const response =
                await api.get<PrizesResponse>(
                    '/admin/prizes'
                );

            setPrizes(
                (
                    response.data.data ??
                    []
                ).map(
                    (prize) => ({
                        ...prize,

                        allocated_quantity:
                            Number(
                                prize.allocated_quantity
                            ) || 0,

                        available_quantity:
                            Number(
                                prize.available_quantity
                            ) || 0,
                    })
                )
            );
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

    const totals = useMemo(() => {
        return prizes.reduce(
            (
                result,
                prize
            ) => {
                result.total +=
                    prize.total_quantity;

                result.allocated +=
                    prize.allocated_quantity;

                result.available +=
                    prize.available_quantity;

                return result;
            },
            {
                total: 0,
                allocated: 0,
                available: 0,
            }
        );
    }, [prizes]);

    return (
        <div className="space-y-6">

            {/* Header */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>

                    <h2 className="text-2xl font-bold text-gray-900">
                        Prizes
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Monitor promotion prize
                        inventory and allocation
                        across all draws.
                    </p>

                </div>

                <button
                    type="button"
                    onClick={loadPrizes}
                    disabled={loading}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading
                        ? 'Refreshing...'
                        : 'Refresh'}
                </button>

            </div>

            {/* Error */}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Summary */}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="text-sm text-gray-500">
                        Prize Types
                    </div>

                    <div className="mt-2 text-3xl font-bold text-gray-900">
                        {prizes.length}
                    </div>

                    <div className="mt-1 text-xs text-gray-400">
                        Configured promotion prizes
                    </div>

                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="text-sm text-gray-500">
                        Total Quantity
                    </div>

                    <div className="mt-2 text-3xl font-bold text-gray-900">
                        {totals.total}
                    </div>

                    <div className="mt-1 text-xs text-gray-400">
                        Total promotion inventory
                    </div>

                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="text-sm text-gray-500">
                        Allocated
                    </div>

                    <div className="mt-2 text-3xl font-bold text-blue-700">
                        {totals.allocated}
                    </div>

                    <div className="mt-1 text-xs text-gray-400">
                        Assigned across draws
                    </div>

                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                    <div className="text-sm text-gray-500">
                        Available
                    </div>

                    <div className="mt-2 text-3xl font-bold text-green-700">
                        {totals.available}
                    </div>

                    <div className="mt-1 text-xs text-gray-400">
                        Not yet allocated
                    </div>

                </div>

            </section>

            {/* Prize inventory */}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">

                    <h3 className="font-semibold text-gray-900">
                        Prize Inventory
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Allocation represents prizes
                        assigned to configured draws.
                    </p>

                </div>

                {loading ? (

                    <div className="flex min-h-64 items-center justify-center text-sm text-gray-500">
                        Loading prizes...
                    </div>

                ) : prizes.length === 0 ? (

                    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

                        <div className="text-sm font-medium text-gray-700">
                            No prizes configured.
                        </div>

                        <p className="mt-1 text-sm text-gray-400">
                            Prize inventory has not
                            been created yet.
                        </p>

                    </div>

                ) : (

                    <div className="divide-y divide-gray-100">

                        {prizes.map(
                            (prize) => {

                                const allocatedPercentage =
                                    prize.total_quantity >
                                    0
                                        ? Math.min(
                                            100,
                                            (
                                                prize.allocated_quantity /
                                                prize.total_quantity
                                            ) *
                                            100
                                        )
                                        : 0;

                                const fullyAllocated =
                                    prize.available_quantity <=
                                    0;

                                return (
                                    <div
                                        key={
                                            prize.id
                                        }
                                        className="p-5"
                                    >

                                        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr_1fr] lg:items-center">

                                            {/* Prize */}

                                            <div>

                                                <div className="flex flex-wrap items-center gap-3">

                                                    <div className="text-base font-semibold text-gray-900">
                                                        {
                                                            prize.name
                                                        }
                                                    </div>

                                                    {fullyAllocated && (
                                                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                                            Fully allocated
                                                        </span>
                                                    )}

                                                </div>

                                                <div className="mt-1 text-sm text-gray-500">
                                                    {formatEnumLabel(
                                                        prize.type
                                                    )}

                                                    {' · '}

                                                    ID #
                                                    {
                                                        prize.id
                                                    }
                                                </div>

                                                {prize.value !==
                                                    null &&
                                                    prize.value !==
                                                    '' && (
                                                        <div className="mt-2 text-sm font-medium text-gray-700">
                                                            Value:{' '}
                                                            {formatPrizeValue(
                                                                prize
                                                            )}
                                                        </div>
                                                    )}

                                            </div>

                                            {/* Allocation */}

                                            <div>

                                                <div className="flex items-center justify-between text-sm">

                                                    <span className="text-gray-500">
                                                        Allocation
                                                    </span>

                                                    <span className="font-medium text-gray-900">
                                                        {
                                                            prize.allocated_quantity
                                                        }{' '}
                                                        /{' '}
                                                        {
                                                            prize.total_quantity
                                                        }
                                                    </span>

                                                </div>

                                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">

                                                    <div
                                                        className="h-full rounded-full bg-gray-900 transition-all"
                                                        style={{
                                                            width:
                                                                `${allocatedPercentage}%`,
                                                        }}
                                                    />

                                                </div>

                                                <div className="mt-2 text-xs text-gray-400">
                                                    {Math.round(
                                                        allocatedPercentage
                                                    )}
                                                    % allocated
                                                </div>

                                            </div>

                                            {/* Availability */}

                                            <div className="grid grid-cols-3 gap-2">

                                                <div className="rounded-lg bg-gray-50 p-3 text-center">

                                                    <div className="text-xs text-gray-500">
                                                        Total
                                                    </div>

                                                    <div className="mt-1 text-lg font-semibold text-gray-900">
                                                        {
                                                            prize.total_quantity
                                                        }
                                                    </div>

                                                </div>

                                                <div className="rounded-lg bg-blue-50 p-3 text-center">

                                                    <div className="text-xs text-blue-600">
                                                        Allocated
                                                    </div>

                                                    <div className="mt-1 text-lg font-semibold text-blue-800">
                                                        {
                                                            prize.allocated_quantity
                                                        }
                                                    </div>

                                                </div>

                                                <div className="rounded-lg bg-green-50 p-3 text-center">

                                                    <div className="text-xs text-green-600">
                                                        Available
                                                    </div>

                                                    <div className="mt-1 text-lg font-semibold text-green-800">
                                                        {
                                                            prize.available_quantity
                                                        }
                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </section>

            {/* Explanation */}

            {!loading &&
                prizes.length > 0 && (

                    <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">

                        <h3 className="text-sm font-semibold text-gray-800">
                            How prize allocation works
                        </h3>

                        <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">
                            Total quantity is the complete
                            promotion inventory.
                            Allocated quantity is the
                            number currently assigned to
                            draws. Available quantity is
                            the remaining inventory that
                            can still be assigned to
                            future draws.
                        </p>

                    </section>
                )}

        </div>
    );
}
