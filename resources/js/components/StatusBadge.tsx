import { formatEnumLabel } from '../utils/format';

type StatusBadgeProps = {
    status: string | null | undefined;
    label?: string;
};

type StatusConfig = {
    className: string;
};

const statusStyles: Record<string, StatusConfig> = {
    submitted: {
        className:
            'bg-amber-50 text-amber-700 ring-amber-600/20',
    },

    approved: {
        className:
            'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    },

    rejected: {
        className:
            'bg-red-50 text-red-700 ring-red-600/20',
    },

    selected: {
        className:
            'bg-blue-50 text-blue-700 ring-blue-600/20',
    },

    contacting: {
        className:
            'bg-amber-50 text-amber-700 ring-amber-600/20',
    },

    confirmed: {
        className:
            'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    },

    cancelled: {
        className:
            'bg-gray-100 text-gray-700 ring-gray-600/20',
    },

    draft: {
        className:
            'bg-gray-100 text-gray-700 ring-gray-600/20',
    },

    scheduled: {
        className:
            'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    },

    running: {
        className:
            'bg-amber-50 text-amber-700 ring-amber-600/20',
    },

    completed: {
        className:
            'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    },
};

export default function StatusBadge({
                                        status,
                                        label,
                                    }: StatusBadgeProps) {
    if (!status) {
        return (
            <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-600/10">
                {label ?? 'Unknown'}
            </span>
        );
    }

    const normalizedStatus =
        status.toLowerCase();

    const config =
        statusStyles[normalizedStatus] ?? {
            className:
                'bg-gray-50 text-gray-700 ring-gray-600/20',
        };

    return (
        <span
            className={[
                'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                config.className,
            ].join(' ')}
        >
            {label ??
                formatEnumLabel(status)}
        </span>
    );
}
