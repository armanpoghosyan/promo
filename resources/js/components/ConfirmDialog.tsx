import {
    useEffect,
    type ReactNode,
} from 'react';

type ConfirmDialogProps = {
    open: boolean;

    title: ReactNode;
    description?: ReactNode;

    confirmLabel?: string;
    cancelLabel?: string;

    variant?: 'default' | 'danger';

    loading?: boolean;

    onConfirm: () => void;
    onCancel: () => void;
};

export default function ConfirmDialog({
                                          open,
                                          title,
                                          description,

                                          confirmLabel = 'Confirm',
                                          cancelLabel = 'Cancel',

                                          variant = 'default',

                                          loading = false,

                                          onConfirm,
                                          onCancel,
                                      }: ConfirmDialogProps) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key === 'Escape' &&
                !loading
            ) {
                onCancel();
            }
        };

        window.addEventListener(
            'keydown',
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                'keydown',
                handleKeyDown
            );
        };
    }, [
        open,
        loading,
        onCancel,
    ]);

    if (!open) {
        return null;
    }

    const confirmClassName =
        variant === 'danger'
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-gray-900 text-white hover:bg-gray-800';

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="presentation"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !loading
                ) {
                    onCancel();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-md rounded-xl bg-white shadow-xl"
            >
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {title}
                    </h3>

                    {description && (
                        <div className="mt-2 text-sm leading-6 text-gray-500">
                            {description}
                        </div>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={onCancel}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={onConfirm}
                        className={[
                            'rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50',
                            confirmClassName,
                        ].join(' ')}
                    >
                        {loading
                            ? 'Please wait...'
                            : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
