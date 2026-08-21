import {type FormEvent, useState} from 'react';
import {Navigate, useLocation, useNavigate} from 'react-router-dom';
import Alert from '../../components/Alert';
import LoadingState from '../../components/LoadingState';
import {useAuth} from '../../auth/AuthContext';
import {useLanguage} from '../../i18n/LanguageContext';
import {getApiErrorMessageOrValidation} from '../../utils/apiError';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const {authenticated, loading: authLoading, login} = useAuth();
    const {tr, language, setLanguage} = useLanguage();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const destination = typeof location.state?.from === 'string' ? location.state.from : '/admin';

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedUsername = username.trim();

        if (!normalizedUsername || !password) {
            setError(tr('Please enter your username and password.'));
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await login({email: normalizedUsername, password,});
            navigate(destination, {replace: true,});
        } catch (error: unknown) {
            setError(getApiErrorMessageOrValidation(error, tr('Invalid username or password.')));
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <LoadingState message={tr('Checking session...')} minHeightClassName="min-h-screen"/>
            </div>
        );
    }

    if (authenticated) {
        return (<Navigate to={destination} replace/>);
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
            <div className="w-full max-w-sm">
                <div className="mb-4 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold text-gray-900">{tr('Admin Login')}</h1>
                        <p className="mt-1 text-sm text-gray-500">{tr('Sign in to manage the promotion.')}</p>
                    </div>

                    <div className="flex shrink-0 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setLanguage('hy')}
                            aria-pressed={language === 'hy'}
                            className={[
                                'rounded-md px-3 py-1.5 text-xs font-semibold transition',
                                language === 'hy' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                            ].join(' ')}
                        >
                            ՀԱՅ
                        </button>

                        <button
                            type="button"
                            onClick={() => setLanguage('en')}
                            aria-pressed={language === 'en'}
                            className={[
                                'rounded-md px-3 py-1.5 text-xs font-semibold transition',
                                language === 'en' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                            ].join(' ')}
                        >
                            EN
                        </button>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700">{tr('Username')}</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={username}
                                onChange={(event) => {
                                    setUsername(event.target.value);
                                    if (error) {
                                        setError(null);
                                    }
                                }}
                                autoComplete="username"
                                autoFocus
                                disabled={submitting}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">{tr('Password')}</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                    if (error) {
                                        setError(null);
                                    }
                                }}
                                autoComplete="current-password"
                                disabled={submitting}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                            />
                        </div>

                        {error && (<Alert variant="error">{error}</Alert>)}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? tr('Logging in...') : tr('Login')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
