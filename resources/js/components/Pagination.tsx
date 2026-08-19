type PaginationProps = {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;

    loading?: boolean;

    onPageChange: (
        page: number
    ) => void;

    labels?: {
        showing?: string;
        to?: string;
        of?: string;
        page?: string;
        previous?: string;
        next?: string;
    };
};

export default function Pagination({
                                       currentPage,
                                       lastPage,
                                       perPage,
                                       total,
                                       loading = false,
                                       onPageChange,
                                       labels,
                                   }: PaginationProps) {
    if (
        total === 0 ||
        lastPage <= 1
    ) {
        return null;
    }

    const from =
        (currentPage - 1) *
        perPage +
        1;

    const to =
        Math.min(
            currentPage * perPage,
            total
        );

    const previousDisabled =
        currentPage <= 1 ||
        loading;

    const nextDisabled =
        currentPage >= lastPage ||
        loading;

    return (
        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
                {labels?.showing ?? 'Showing'}{' '}
                {from}{' '}
                {labels?.to ?? 'to'}{' '}
                {to}{' '}
                {labels?.of ?? 'of'}{' '}
                {total}
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={
                        previousDisabled
                    }
                    onClick={() =>
                        onPageChange(
                            currentPage - 1
                        )
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {labels?.previous ??
                        'Previous'}
                </button>

                <span className="px-2 text-sm text-gray-600">
                    {labels?.page ??
                        'Page'}{' '}
                    {currentPage} /{' '}
                    {lastPage}
                </span>

                <button
                    type="button"
                    disabled={
                        nextDisabled
                    }
                    onClick={() =>
                        onPageChange(
                            currentPage + 1
                        )
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {labels?.next ??
                        'Next'}
                </button>
            </div>
        </div>
    );
}
