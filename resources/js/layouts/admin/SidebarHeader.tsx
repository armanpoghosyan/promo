import { useAuth } from '../../auth/AuthContext';

export default function SidebarHeader() {
    const { user } = useAuth();

    return (
        <div className="mx-3 border-b border-gray-500 py-3">
            <div className="px-3">
                <div className="truncate text-sm font-medium text-white">
                    {user?.name ?? 'Administrator'}
                </div>

                {user?.email && (
                    <div className="mt-0.5 truncate text-xs text-gray-400">
                        {user.email}
                    </div>
                )}
            </div>
        </div>
    );
}
