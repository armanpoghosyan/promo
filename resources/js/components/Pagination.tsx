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
        previous?: string;
        next?: string;
    };
};

type PageItem =
    | number
    | 'ellipsis-left'
    | 'ellipsis-right';

function buildPages(
    currentPage: number,
    lastPage: number
): PageItem[] {
    if (lastPage <= 7) {
        return Array.from(
            {
                length:
                lastPage,
            },
            (_, index) =>
                index + 1
        );
    }

    const pages: PageItem[] =
        [1];

    const start =
        Math.max(
            2,
            currentPage - 2
        );

    const end =
        Math.min(
            lastPage - 1,
            currentPage + 2
        );

    if (start > 2) {
        pages.push(
            'ellipsis-left'
        );
    }

    for (
        let page = start;
        page <= end;
        page += 1
    ) {
        pages.push(page);
    }

    if (
        end <
        lastPage - 1
    ) {
        pages.push(
            'ellipsis-right'
        );
    }

    pages.push(
        lastPage
    );

    return pages;
}

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
            currentPage *
            perPage,
            total
        );

    const pages =
        buildPages(
            currentPage,
            lastPage
        );

    return (
        <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-gray-500">
                {labels?.showing ??
                    'Showing'}{' '}
                {from}{' '}
                {labels?.to ??
                    'to'}{' '}
                {to}{' '}
                {labels?.of ??
                    'of'}{' '}
                {total}
            </div>

            <div className="flex flex-wrap items-center gap-1">
                <button
                    type="button"
                    disabled={
                        currentPage <=
                        1 ||
                        loading
                    }
                    onClick={() =>
                        onPageChange(
                            currentPage -
                            1
                        )
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {labels?.previous ??
                        'Previous'}
                </button>

                {pages.map(
                    (item) => {
                        if (
                            typeof item !==
                            'number'
                        ) {
                            return (
                                <span
                                    key={
                                        item
                                    }
                                    className="px-2 text-sm text-gray-400"
                                >
                                    …
                                </span>
                            );
                        }

                        const active =
                            item ===
                            currentPage;

                        return (
                            <button
                                key={
                                    item
                                }
                                type="button"
                                disabled={
                                    loading
                                }
                                onClick={() =>
                                    onPageChange(
                                        item
                                    )
                                }
                                aria-current={
                                    active
                                        ? 'page'
                                        : undefined
                                }
                                className={
                                    active
                                        ? 'min-w-9 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white'
                                        : 'min-w-9 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40'
                                }
                            >
                                {
                                    item
                                }
                            </button>
                        );
                    }
                )}

                <button
                    type="button"
                    disabled={
                        currentPage >=
                        lastPage ||
                        loading
                    }
                    onClick={() =>
                        onPageChange(
                            currentPage +
                            1
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
