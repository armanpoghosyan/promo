import {useCallback, useState, type ChangeEvent, type FormEvent, type ReactNode,} from 'react';

import TurnstileWidget from '../components/TurnstileWidget';

import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

type FormState = {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    receipt_number: string;

    privacy_policy_accepted: boolean;
    official_rules_accepted: boolean;
    personal_data_consent: boolean;
};

type FormErrors = Partial<
    Record<
        | 'turnstile_token'
        | 'first_name'
        | 'last_name'
        | 'phone'
        | 'email'
        | 'receipt_number'
        | 'receipt_image'
        | 'privacy_policy_accepted'
        | 'official_rules_accepted'
        | 'personal_data_consent',
        string
    >
>;

type ModalType =
    | 'privacy'
    | 'rules'
    | null;

const initialForm: FormState = {
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    receipt_number: '',

    privacy_policy_accepted: false,
    official_rules_accepted: false,
    personal_data_consent: false,
};

const turnstileEnabled = import.meta.env.VITE_TURNSTILE_ENABLED === 'true';

function isValidArmenianPhone(value: string): boolean {
    if (!/^\+?[0-9\s().-]+$/.test(value)) {
        return false;
    }

    const digits = value.replace(/\D+/g, '');

    return /^[1-9]\d{7}$/.test(digits)
        || /^0[1-9]\d{7}$/.test(digits)
        || /^374[1-9]\d{7}$/.test(digits);
}

const faqItems = [
    {
        question: 'How can I participate?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },{
        question: 'How are winners selected?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    },{
        question: 'When will the draws take place?',
        answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.',
    },
];

const privacyPolicyText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`;
const officialRulesText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

export default function Landing() {
    const {language, setLanguage, tr} = useLanguage();

    const [form, setForm] = useState<FormState>(initialForm);
    const [receiptImage, setReceiptImage] = useState<File | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [turnstileToken, setTurnstileToken] = useState('');
    const [turnstileResetKey, setTurnstileResetKey] = useState(0);

    const [success, setSuccess] = useState<string | null>(null);

    const [modal, setModal] = useState<ModalType>(null);

    const updateField = (field: keyof FormState, value: string | boolean) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const clearFieldError = (field: keyof FormErrors) => {
        setFieldErrors((current) => ({
                ...current,
                [field]: undefined,
        }));
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setReceiptImage(file);
        if (file) {
            clearFieldError('receipt_image');
        }
    };

    const validateForm = (): boolean => {
        const errors: FormErrors = {};

        if (turnstileEnabled && !turnstileToken) {
            errors.turnstile_token = tr('Please complete the CAPTCHA verification.');
        }

        if (!form.first_name.trim()) {
            errors.first_name = tr('This field is required.');
        }

        if (!form.last_name.trim()) {
            errors.last_name = tr('This field is required.');
        }

        if (!form.phone.trim()) {
            errors.phone = tr('This field is required.');
        } else if (!isValidArmenianPhone(form.phone.trim())) {
            errors.phone = tr('Please enter a valid Armenian phone number.');
        }

        if (!form.email.trim()) {
            errors.email = tr('This field is required.');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            errors.email = tr('Please enter a valid email address.');
        }

        if (!form.receipt_number.trim()) {
            errors.receipt_number = tr('This field is required.');
        }

        if (!receiptImage) {
            errors.receipt_image = tr('Please upload the receipt image.');
        }

        if (!form.privacy_policy_accepted) {
            errors.privacy_policy_accepted = tr('You must accept this condition.');
        }

        if (!form.official_rules_accepted) {
            errors.official_rules_accepted = tr('You must accept this condition.');
        }

        if (!form.personal_data_consent) {
            errors.personal_data_consent = tr('You must accept this condition.');
        }

        setFieldErrors(errors);

        return (Object.keys(errors).length === 0);
    };

    const resetForm = () => {
        setTurnstileToken('');
        setTurnstileResetKey((current) => current + 1);
        setForm(initialForm);
        setReceiptImage(null);
        setFieldErrors({});
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError(null);
        setSuccess(null);

        if (!validateForm()) {
            return;
        }

        if (!receiptImage) {
            return;
        }

        const data = new FormData();

        if (turnstileEnabled) {
            data.append('turnstile_token', turnstileToken);
        }

        data.append('first_name', form.first_name.trim());
        data.append('last_name', form.last_name.trim());
        data.append('phone', form.phone.trim());
        data.append('email', form.email.trim());
        data.append('receipt_number', form.receipt_number.trim());
        data.append('receipt_image', receiptImage);
        data.append('privacy_policy_accepted', '1');
        data.append('official_rules_accepted', '1');
        data.append('personal_data_consent', '1');

        setSubmitting(true);

        try {
            const response = await api.post(
                '/participants/receipts',
                data,
                {
                    headers: {'Content-Type': undefined}
                });

            setSuccess(tr(response.data?.message) ?? tr('Participation submitted successfully.'));

            resetForm();
        } catch (err: any) {
            console.error(err);

            const validationErrors = err.response?.data?.errors;

            if (validationErrors && typeof validationErrors === 'object') {
                const backendErrors: FormErrors = {};

                Object.entries(validationErrors).forEach(([field, messages,]) => {
                    if (Array.isArray(messages) && typeof messages[0] === 'string') {
                        backendErrors[field as keyof FormErrors] = tr(messages[0]);
                    }
                });

                if (Object.keys(backendErrors).length > 0) {
                    setFieldErrors(backendErrors);
                    return;
                }
            }

            setError(tr(err.response?.data?.message) ?? tr('Unable to submit participation. Please try again.'));
        } finally {
            setSubmitting(false);
            setTurnstileToken('');
            setTurnstileResetKey((current) => current + 1);
        }
    };

    const handleTurnstileUnavailable = useCallback(() => {
        setTurnstileToken('');

        setFieldErrors((current) => ({
            ...current,
            turnstile_token: tr('CAPTCHA could not be loaded. Please refresh and try again.'),
        }));
    }, [tr]);

    const handleTurnstileToken = useCallback(
        (token: string) => {
            setTurnstileToken(token);

            if (token) {
                setFieldErrors((current) => ({
                    ...current,
                    turnstile_token: undefined,
                }));
            }
        },
        []
    );

    return (
        <div className="min-h-screen bg-gray-50">

            <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

                {/* Participation Form */}

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

                    <div className="flex items-start justify-between gap-4">

                        <div>

                            <h1 className="text-2xl font-bold text-gray-900">
                                {tr('Participation Form')}
                            </h1>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                {tr('Fill in the form below to participate in the promotion.')}
                            </p>

                        </div>

                        {/* Language */}

                        <button
                            type="button"
                            onClick={() => setLanguage(language === 'hy' ? 'en' : 'hy')}
                            aria-label={tr('Change language')}
                            className="flex shrink-0 items-center gap-2"
                        >

                            <span className={`text-xs font-semibold transition-colors ${language === 'hy' ? 'text-gray-900' : 'text-gray-400'}`}>
                                ՀԱՅ
                            </span>

                            <span
                                className="relative inline-flex h-6 w-11 shrink-0 rounded-full bg-gray-900"
                                aria-hidden="true"
                            >

                                <span className={`pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${language === 'en' ? 'translate-x-[22px]' : 'translate-x-0.5'}`}/>

                            </span>

                            <span className={`text-xs font-semibold transition-colors ${language === 'en' ? 'text-gray-900' : 'text-gray-400'}`}>
                                EN
                            </span>

                        </button>

                    </div>

                    {/* Success */}

                    {success && (
                        <div className="mt-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">

                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold">
                                ✓
                            </div>

                            <div>
                                {success}
                            </div>

                        </div>
                    )}

                    {/* API Error */}

                    {error && (
                        <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
                                !
                            </div>

                            <div>
                                {error}
                            </div>

                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="mt-7">

                        <div className="grid gap-5 sm:grid-cols-2">

                            <Field
                                label={tr('First name')}
                                value={form.first_name}
                                error={fieldErrors.first_name}
                                onChange={(value) => {
                                    updateField('first_name', value);
                                    clearFieldError('first_name');
                                }}
                                autoComplete="given-name"
                            />

                            <Field
                                label={tr('Last name')}
                                value={form.last_name}
                                error={fieldErrors.last_name}
                                onChange={(value) => {
                                    updateField('last_name', value);
                                    clearFieldError('last_name');
                                }}
                                autoComplete="family-name"
                            />

                            <Field
                                label={tr('Phone number')}
                                value={form.phone}
                                type="tel"
                                error={fieldErrors.phone}
                                onChange={(value) => {
                                    updateField('phone', value);
                                    clearFieldError('phone');
                                }}
                                autoComplete="tel"
                            />

                            <Field
                                label={tr('Email')}
                                value={form.email}
                                type="email"
                                error={fieldErrors.email}
                                onChange={(value) => {
                                    updateField('email', value);
                                    clearFieldError('email');
                                }}
                                autoComplete="email"
                            />

                        </div>

                        <div className="mt-5">

                            <Field
                                label={tr('Receipt number')}
                                value={form.receipt_number}
                                error={fieldErrors.receipt_number}
                                onChange={(value) => {
                                    updateField('receipt_number', value);
                                    clearFieldError('receipt_number');
                                }}
                            />

                        </div>

                        {/* Receipt Image */}

                        <div className="mt-5">

                            <label className="block text-sm font-medium text-gray-700">

                                {tr('Receipt image')}

                                <span className="ml-1 text-red-500">
                                    *
                                </span>

                            </label>

                            <label
                                className={`mt-2 block cursor-pointer rounded-lg border border-dashed p-5 text-center transition ${
                                    fieldErrors.receipt_image
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                }`}
                            >

                                <div className="text-sm font-medium text-gray-700">
                                    {receiptImage
                                        ? receiptImage.name
                                        : tr('Choose image')}
                                </div>

                                <div className="mt-1 text-xs text-gray-400">
                                    {tr('JPG, PNG or WEBP image.')}
                                </div>

                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageChange}
                                    className="sr-only"
                                />

                            </label>

                            {fieldErrors.receipt_image && (
                                <InlineError>
                                    {fieldErrors.receipt_image}
                                </InlineError>
                            )}

                        </div>

                        {/* CAPTCHA */}

                        {turnstileEnabled && (
                            <div className="mt-5">
                                <TurnstileWidget
                                    key={turnstileResetKey}
                                    onTokenChange={handleTurnstileToken}
                                    onUnavailable={
                                        handleTurnstileUnavailable
                                    }
                                />

                                {fieldErrors.turnstile_token && (
                                    <InlineError>
                                        {fieldErrors.turnstile_token}
                                    </InlineError>
                                )}
                            </div>
                        )}

                        {/* Consents */}

                        <div className="mt-6 space-y-4">

                            <Consent
                                checked={form.privacy_policy_accepted}
                                error={fieldErrors.privacy_policy_accepted}
                                onChange={(checked) => {
                                    updateField('privacy_policy_accepted', checked);
                                    clearFieldError('privacy_policy_accepted');
                                }}
                            >
                                <span>

                                    {tr('I have read and agree to the')}{' '}
                                    <button
                                        type="button"
                                        onClick={() => setModal('privacy')}
                                        className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800"
                                    >
                                        {tr('Privacy Policy')}
                                    </button>

                                </span>
                            </Consent>

                            <Consent
                                checked={form.official_rules_accepted}
                                error={fieldErrors.official_rules_accepted}
                                onChange={(checked) => {
                                    updateField('official_rules_accepted', checked);
                                    clearFieldError('official_rules_accepted');
                                }}
                            >
                                <span>

                                    {tr('I have read and agree to the')}{' '}
                                    <button
                                        type="button"
                                        onClick={() => setModal('rules')}
                                        className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800"
                                    >
                                        {tr('Official Rules')}
                                    </button>

                                </span>
                            </Consent>

                            <Consent
                                checked={form.personal_data_consent}
                                error={fieldErrors.personal_data_consent}
                                onChange={(checked) => {
                                    updateField('personal_data_consent', checked);
                                    clearFieldError('personal_data_consent');
                                }}
                            >
                                {tr('I consent to the processing of my personal data.')}
                            </Consent>

                        </div>

                        {/* Submit */}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="mt-7 w-full rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? tr('Submitting...') : tr('Submit participation')}
                        </button>

                    </form>

                </section>

                {/* FAQ */}

                <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

                    <h2 className="text-xl font-semibold text-gray-900">
                        {tr('FAQ')}
                    </h2>

                    <div className="mt-4 divide-y divide-gray-200">

                        {faqItems.map((item, index) => (
                            <details
                                key={index}
                                className="group py-4"
                            >
                                <summary className="cursor-pointer list-none font-medium text-gray-800">
                                    <div className="flex items-center justify-between gap-4">
                                        <span>
                                            {tr(item.question)}
                                        </span>
                                        <span className="text-xl text-gray-400 transition group-open:rotate-45">+</span>
                                    </div>
                                </summary>
                                <p className="mt-3 text-sm leading-6 text-gray-500">
                                    {tr(item.answer)}
                                </p>
                            </details>
                        ))}

                    </div>

                </section>

            </main>

            {/* Legal Modal */}

            {modal && (
                <LegalModal
                    title={modal === 'privacy' ? tr('Privacy Policy') : tr('Official Rules')}
                    content={modal === 'privacy' ? tr(privacyPolicyText) : tr(officialRulesText)}
                    closeLabel={tr('Close')}
                    onClose={() => setModal(null)}
                />
            )}

        </div>
    );
}

function Field({label, value, onChange, type = 'text', autoComplete, error}: { label: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string; error?: string;}) {
    return (
        <div>

            <label className="block text-sm font-medium text-gray-700">
                {label}
                <span className="ml-1 text-red-500">*</span>
            </label>

            <input
                type={type}
                value={value}
                autoComplete={autoComplete}
                onChange={(event) => onChange(event.target.value)}
                className={`mt-2 w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 outline-none transition ${
                    error
                        ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-gray-300 bg-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500'
                }`}
            />

            {error && (
                <InlineError>
                    {error}
                </InlineError>
            )}

        </div>
    );
}

function InlineError({children,}: { children: ReactNode; }) {
    return (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold">
                !
            </span>
            <span>
                {children}
            </span>
        </div>
    );
}

function Consent({checked, onChange, children, error}: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode; error?: string}) {
    return (
        <div>
            <label
                className={['flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition',
                    error
                        ? 'border-red-200 bg-red-50'
                        : 'border-transparent hover:bg-gray-50',
                ].join(' ')}
            >
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => onChange(event.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300"
                />
                <span className="text-sm leading-6 text-gray-600">
                    {children}
                </span>

            </label>

            {error && (
                <div className="ml-3">
                    <InlineError>
                        {error}
                    </InlineError>
                </div>
            )}
        </div>
    );
}

function LegalModal({title, content, closeLabel, onClose}: { title: string; content: string; closeLabel: string; onClose: () => void; }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <h3 className="font-semibold text-gray-900">
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={closeLabel}
                        className="rounded-lg px-2 py-1 text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                    >
                        ×
                    </button>
                </div>
                <div className="max-h-[65vh] overflow-y-auto p-5">
                    <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
                        {content}
                    </p>
                </div>
                <div className="border-t border-gray-200 p-4 text-right">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        {closeLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
