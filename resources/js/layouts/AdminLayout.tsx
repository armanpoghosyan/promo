import {
    useEffect,
    useState,
} from 'react';

import {
    Outlet,
} from 'react-router-dom';

import Icon from '../components/Icon';
import AdminSidebar from './admin/AdminSidebar';

export default function AdminLayout() {
    const [
        mobileMenuOpen,
        setMobileMenuOpen,
    ] = useState(false);

    useEffect(() => {
        if (!mobileMenuOpen) {
            return;
        }

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (event.key === 'Escape') {
                setMobileMenuOpen(false);
            }
        };

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            'hidden';

        window.addEventListener(
            'keydown',
            handleKeyDown
        );

        return () => {
            document.body.style.overflow =
                previousOverflow;

            window.removeEventListener(
                'keydown',
                handleKeyDown
            );
        };
    }, [mobileMenuOpen]);

    return (
        <div className="min-h-screen bg-gray-50">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-gray-950 lg:block">
                <AdminSidebar />
            </aside>

            {mobileMenuOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    className="fixed inset-0 z-40 cursor-default bg-black/40 lg:hidden"
                    onClick={() =>
                        setMobileMenuOpen(false)
                    }
                />
            )}

            <aside
                aria-label="Admin navigation"
                className={[
                    'fixed inset-y-0 left-0 z-50 w-72 bg-gray-950 transition-transform duration-200 lg:hidden',
                    mobileMenuOpen
                        ? 'translate-x-0'
                        : '-translate-x-full',
                ].join(' ')}
            >
                <AdminSidebar
                    onNavigate={() =>
                        setMobileMenuOpen(false)
                    }
                />
            </aside>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            aria-label="Open navigation"
                            aria-expanded={
                                mobileMenuOpen
                            }
                            onClick={() =>
                                setMobileMenuOpen(
                                    true
                                )
                            }
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                        >
                            <Icon type="menu" />
                        </button>

                        <div className="text-sm font-semibold text-gray-900">
                            Promo Admin
                        </div>

                        <div
                            className="w-[38px]"
                            aria-hidden="true"
                        />
                    </div>
                </header>

                <main className="px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mx-auto w-full max-w-[1600px]">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
