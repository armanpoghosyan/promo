import {Navigate, Outlet, useLocation} from 'react-router-dom';
import {useAuth} from './AuthContext';
import {useLanguage} from '../i18n/LanguageContext';

export default function ProtectedRoute() {
    const {authenticated, loading} = useAuth();
    const { tr } = useLanguage();

    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                    <div className="mt-4 text-sm text-gray-500">
                        {tr("Loading...")}
                    </div>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{from: `${location.pathname}${location.search}`,}}
            />
        );
    }

    return <Outlet />;
}
