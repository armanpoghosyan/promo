import type {
    ReactNode,
} from 'react';

type EmptyStateProps = {
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;

    minHeightClassName?: string;
};

export default function EmptyState({
                                       title,
                                       description,
                                       action,
                                       minHeightClassName = 'min-h-64',
                                   }: EmptyStateProps) {
    return (
        <div
            className={[
                'flex flex-col items-center justify-center px-6 text-center',
                minHeightClassName,
            ].join(' ')}
        >
            <div className="text-sm font-medium text-gray-700">
                {title}
            </div>

            {description && (
                <div className="mt-1 max-w-md text-sm text-gray-400">
                    {description}
                </div>
            )}

            {action && (
                <div className="mt-4">
                    {action}
                </div>
            )}
        </div>
    );
}
