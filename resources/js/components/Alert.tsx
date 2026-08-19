import type {
    ReactNode,
} from 'react';

export type AlertVariant =
    | 'success'
    | 'error'
    | 'warning'
    | 'info';

type AlertProps = {
    variant?: AlertVariant;

    children: ReactNode;

    onDismiss?: () => void;
};

const styles: Record<
    AlertVariant,
    string
> = {
    success:
        'border-green-200 bg-green-50 text-green-700',

    error:
        'border-red-200 bg-red-50 text-red-700',

    warning:
        'border-amber-200 bg-amber-50 text-amber-700',

    info:
        'border-blue-200 bg-blue-50 text-blue-700',
};

export default function Alert({
                                  variant = 'info',
                                  children,
                                  onDismiss,
                              }: AlertProps) {
    return (
        <div
            className={[
                'flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm',
                styles[variant],
            ].join(' ')}
        >
            <div className="min-w-0">
                {children}
            </div>

            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss"
                    className="shrink-0 text-lg leading-none opacity-60 hover:opacity-100"
                >
                    ×
                </button>
            )}
        </div>
    );
}
