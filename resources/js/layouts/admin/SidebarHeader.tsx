import {
    useAuth,
} from '../../auth/AuthContext';

import {
    formatEnumLabel,
} from '../../utils/format';

export default function SidebarHeader() {
    const { user } =
        useAuth();

    return (
        <div className="mx-3 border-b border-gray-800 py-4">
            <div className="px-3">
                <div className="truncate text-sm font-semibold text-white">
                    {user?.name ??
                        'Administrator'}
                </div>

                {user?.email && (
                    <div className="mt-0.5 truncate text-xs text-gray-400">
                        {user.email}
                    </div>
                )}

                {user?.role && (
                    <div className="mt-2">
                        <span className="inline-flex rounded-md bg-gray-800 px-2 py-1 text-[11px] font-medium text-gray-300">
                            {formatEnumLabel(
                                user.role
                            )}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
