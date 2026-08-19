import type {
    ReactNode,
} from 'react';

type PageHeaderProps = {
    title: ReactNode;
    description?: ReactNode;

    actions?: ReactNode;
};

export default function PageHeader({
                                       title,
                                       description,
                                       actions,
                                   }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <h2 className="text-2xl font-bold text-gray-900">
                    {title}
                </h2>

                {description && (
                    <div className="mt-1 text-sm text-gray-500">
                        {description}
                    </div>
                )}
            </div>

            {actions && (
                <div className="shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
