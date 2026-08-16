import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import AdminSidebar from './admin/AdminSidebar';
import Icon from '../components/Icon';

export default function AdminLayout() {

    const [ mobileMenuOpen, setMobileMenuOpen ] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-gray-950 lg:block">
                <AdminSidebar />
            </aside>

            {mobileMenuOpen && (<div
                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                onClick={() => setMobileMenuOpen(false) }
            />)}

            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-950 transition-transform duration-200 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <AdminSidebar onNavigate={() => setMobileMenuOpen(false)} />
            </aside>

            <div className="lg:pl-64">
                <div className="border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                    >
                        <Icon type="menu" />
                    </button>

                </div>

                <main className="px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mx-auto w-full max-w-[1600px]">
                        <Outlet />
                    </div>

                </main>

            </div>

        </div>
    );
}
