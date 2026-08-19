import {
    useState,
} from 'react';

import {
    useNavigate,
} from 'react-router-dom';

import {
    useAuth,
} from '../../auth/AuthContext';

import {
    useLanguage,
} from '../../i18n/LanguageContext';

import Alert from '../../components/Alert';
import ConfirmDialog from '../../components/ConfirmDialog';
import Icon from '../../components/Icon';

import {
    getApiErrorMessage,
} from '../../utils/apiError';

import LanguageToggle from './LanguageToggle';

export default function SidebarFooter() {
    const navigate =
        useNavigate();

    const {
        logout: authLogout,
    } = useAuth();

    const { tr } =
        useLanguage();

    const [
        logoutDialogOpen,
        setLogoutDialogOpen,
    ] = useState(false);

    const [
        logoutLoading,
        setLogoutLoading,
    ] = useState(false);

    const [
        logoutError,
        setLogoutError,
    ] = useState<string | null>(
        null
    );

    const logoutAction =
        async () => {
            setLogoutLoading(true);
            setLogoutError(null);

            try {
                await authLogout();

                setLogoutDialogOpen(
                    false
                );

                navigate(
                    '/login',
                    {
                        replace: true,
                    }
                );
            } catch (error: unknown) {
                setLogoutError(
                    getApiErrorMessage(
                        error,
                        tr(
                            'Unable to log out.'
                        )
                    )
                );
            } finally {
                setLogoutLoading(
                    false
                );
            }
        };

    return (
        <>
            <div className="mx-3 border-t border-gray-800 py-3">
                {logoutError && (
                    <div className="px-3 pb-2">
                        <Alert
                            variant="error"
                            onDismiss={() =>
                                setLogoutError(
                                    null
                                )
                            }
                        >
                            {logoutError}
                        </Alert>
                    </div>
                )}

                <div className="px-3 py-2">
                    <LanguageToggle />
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setLogoutDialogOpen(
                            true
                        )
                    }
                    disabled={
                        logoutLoading
                    }
                    className="mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span>
                        {tr('Logout')}
                    </span>

                    <Icon type="logout" />
                </button>
            </div>

            <ConfirmDialog
                open={
                    logoutDialogOpen
                }
                title={tr('Logout')}
                description={tr(
                    'Are you sure you want to log out?'
                )}
                confirmLabel={tr(
                    'Logout'
                )}
                cancelLabel={tr(
                    'Cancel'
                )}
                loading={
                    logoutLoading
                }
                onConfirm={
                    logoutAction
                }
                onCancel={() => {
                    if (
                        !logoutLoading
                    ) {
                        setLogoutDialogOpen(
                            false
                        );
                    }
                }}
            />
        </>
    );
}
