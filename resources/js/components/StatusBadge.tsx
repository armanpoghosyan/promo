type StatusBadgeProps = {
    status: string | null | undefined;
};

type StatusConfig = {
    label?: string;
    className: string;
};

const statusStyles: Record<string, StatusConfig> = {
    /*
     * Receipt statuses
     */

    submitted: {
        className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    },

    reviewing: {
        className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    },

    approved: {
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    },

    rejected: {
        className: 'bg-red-50 text-red-700 ring-red-600/20',
    },

    winner: {
        className: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    },

    /*
     * Winner statuses
     */

    selected: {
        className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    },

    contacting: {
        className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    },

    confirmed: {
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    },

    cancelled: {
        className: 'bg-gray-100 text-gray-700 ring-gray-600/20',
    },

    /*
     * Draw statuses
     */

    draft: {
        className: 'bg-gray-100 text-gray-700 ring-gray-600/20',
    },

    scheduled: {
        className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    },

    running: {
        className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    },

    completed: {
        className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    },

    failed: {
        className: 'bg-red-50 text-red-700 ring-red-600/20',
    },
};

const formatStatus = (
    status: string
) => {
    return status
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
};

export default function StatusBadge({status,}: StatusBadgeProps) {
    if (!status) {
        return (
            <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-600/10">
                Unknown
            </span>
        );
    }

    const normalizedStatus = status.toLowerCase();
    const config = statusStyles[normalizedStatus] ?? {
            className: 'bg-gray-50 text-gray-700 ring-gray-600/20',
        };

    return (
        <span
            className={[
                'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                config.className,
            ].join(' ')}
        >
            {config.label ?? formatStatus(status)}
        </span>
    );
}
