type LoadingStateProps = {
    message?: string;
    minHeightClassName?: string;
};

export default function LoadingState({
                                         message = 'Loading...',
                                         minHeightClassName = 'min-h-64',
                                     }: LoadingStateProps) {
    return (
        <div
            className={[
                'flex items-center justify-center text-sm text-gray-500',
                minHeightClassName,
            ].join(' ')}
        >
            <div className="text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />

                <div className="mt-3">
                    {message}
                </div>
            </div>
        </div>
    );
}
