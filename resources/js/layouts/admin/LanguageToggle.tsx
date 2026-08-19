import {
    useLanguage,
} from '../../i18n/LanguageContext';

export default function LanguageToggle() {
    const {
        language,
        setLanguage,
        tr,
    } = useLanguage();

    const nextLanguage =
        language === 'hy'
            ? 'en'
            : 'hy';

    return (
        <button
            type="button"
            onClick={() =>
                setLanguage(
                    nextLanguage
                )
            }
            aria-label={tr(
                'Change language'
            )}
            title={tr(
                'Change language'
            )}
            className="flex w-full items-center justify-between rounded-lg bg-gray-900 px-3 py-2 transition hover:bg-gray-800"
        >
            <span
                className={
                    language === 'hy'
                        ? 'text-xs font-semibold text-white'
                        : 'text-xs font-semibold text-gray-500'
                }
            >
                ՀԱՅ
            </span>

            <span
                className="relative mx-3 inline-flex h-5 w-9 shrink-0 rounded-full bg-gray-700"
                aria-hidden="true"
            >
                <span
                    className={[
                        'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                        language ===
                        'en'
                            ? 'translate-x-[18px]'
                            : 'translate-x-0.5',
                    ].join(' ')}
                />
            </span>

            <span
                className={
                    language === 'en'
                        ? 'text-xs font-semibold text-white'
                        : 'text-xs font-semibold text-gray-500'
                }
            >
                EN
            </span>
        </button>
    );
}
