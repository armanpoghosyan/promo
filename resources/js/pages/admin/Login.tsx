import {FormEvent, useEffect, useState} from 'react';

import {Navigate, useLocation, useNavigate} from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const {user, authenticated, loading: authLoading, login,} = useAuth();
    const { tr } = useLanguage();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && authenticated) {
            navigate('/admin', {replace: true});
        }
    }, [authenticated, authLoading, navigate]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!email.trim() || !password) {
            setError(tr('Please enter your login and password.'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await login({email: email.trim(), password,});
            const destination = typeof location.state?.from === 'string'
                ? location.state.from
                : '/admin';

            navigate(destination, {replace: true});
        } catch (err: any) {
            console.error(err);

            setError(tr(err?.response?.data?.message) || tr('Invalid login or password.'));
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            </div>
        );
    }

    if (authenticated) {
        return (
            <Navigate to="/admin" replace/>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h1 className="mb-6 text-xl font-semibold text-gray-900">
                        {tr('Admin Login')}
                    </h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                                {tr('Username')}
                            </label>
                            <input
                                id="email"
                                type="text"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                autoComplete="username"
                                autoFocus
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                                {tr('Password')}
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="current-password"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? tr('Logging in...') : tr('Login')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
