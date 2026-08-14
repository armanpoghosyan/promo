import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
    {
        name: 'Dashboard',
        path: '/admin',
    },
    {
        name: 'Receipts',
        path: '/admin/receipts',
    },
    {
        name: 'Participants',
        path: '/admin/participants',
    },
    {
        name: 'Draws',
        path: '/admin/draws',
    },
    {
        name: 'Winners',
        path: '/admin/winners',
    },
    {
        name: 'Prizes',
        path: '/admin/prizes',
    },
    {
        name: 'Reports',
        path: '/admin/reports',
    },
];

export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-gray-100">

            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white">

                <div className="px-6 py-5 text-xl font-bold">
                    Promo Admin
                </div>

                <nav className="px-3 space-y-1">

                    {navigation.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'}
                            className={({ isActive }) =>
                                `block rounded px-3 py-2 ${
                                    isActive
                                        ? 'bg-gray-700'
                                        : 'hover:bg-gray-800'
                                }`
                            }
                        >
                            {item.name}
                        </NavLink>
                    ))}

                </nav>

            </aside>

            {/* Main */}
            <div className="ml-64">

                <header className="h-16 bg-white border-b flex items-center justify-between px-6">

                    <h1 className="font-semibold">
                        Promotion Administration
                    </h1>

                    <button
                        type="button"
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Logout
                    </button>

                </header>

                <main className="p-6">
                    <Outlet />
                </main>

            </div>

        </div>
    );
}
