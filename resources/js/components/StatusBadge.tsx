type StatusBadgeProps = {
    status: string;
};

const statusStyles: Record<string, string> = {
    approved:
        'bg-green-50 text-green-700 ring-green-600/20',

    submitted:
        'bg-yellow-50 text-yellow-700 ring-yellow-600/20',

    reviewing:
        'bg-blue-50 text-blue-700 ring-blue-600/20',

    rejected:
        'bg-red-50 text-red-700 ring-red-600/20',

    winner:
        'bg-purple-50 text-purple-700 ring-purple-600/20',

    selected:
        'bg-blue-50 text-blue-700 ring-blue-600/20',

    confirmed:
        'bg-green-50 text-green-700 ring-green-600/20',

    cancelled:
        'bg-red-50 text-red-700 ring-red-600/20',
};

export default function StatusBadge({
                                        status,
                                    }: StatusBadgeProps) {
    const style =
        statusStyles[status] ??
        'bg-gray-50 text-gray-700 ring-gray-600/20';

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${style}`}
        >
            {status.replace('_', ' ')}
        </span>
    );
}
