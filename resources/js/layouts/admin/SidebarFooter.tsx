import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageToggle from './LanguageToggle';
import Icon from '../../components/Icon';

export default function SidebarFooter() {

    const { logout: authLogout } = useAuth();
    const { tr } = useLanguage();

    const [ logoutLoading, setLogoutLoading ] = useState(false);

    const logoutAction = async () => {
        const confirmed = window.confirm(
            tr("Are you sure you want to log out?")
        );

        if (!confirmed) {
            return;
        }

        setLogoutLoading(true);

        try {
            await authLogout();
            window.location.href = '/login';
        } catch (err) {
            console.error(err);
            window.alert(tr("Unable to log out."));
        } finally {
            setLogoutLoading(false);
        }
    };

    return (
        <div className="mx-3 border-t border-gray-500 py-3">
            <div className="px-3 py-2">
                <LanguageToggle />
            </div>

            <button
                type="button"
                onClick={logoutAction}
                disabled={logoutLoading}
                className="mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
                <span>{logoutLoading ? tr("Logging out...") : tr("Logout")}</span>
                <Icon type="logout" />

            </button>

        </div>
    );
}
