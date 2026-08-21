import {
    NavLink,
} from 'react-router-dom';

import Icon from '../../components/Icon';

import {
    useLanguage,
} from '../../i18n/LanguageContext';

type Props = {
    onNavigate?: () => void;
};

const linkClassName = ({
                           isActive,
                       }: {
    isActive: boolean;
}) =>
    [
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',

        isActive
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white',
    ].join(' ');

export default function SidebarNavigation({
                                              onNavigate,
                                          }: Props) {
    const {
        tr,
    } = useLanguage();

    return (
        <div className="flex-1 overflow-y-auto px-3 py-5">
            <nav className="space-y-6">
                {/* Operations */}

                <div>
                    <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {tr(
                            'Operations'
                        )}
                    </div>

                    <div className="space-y-1">
                        <NavLink
                            to="/admin"
                            end
                            onClick={
                                onNavigate
                            }
                            className={
                                linkClassName
                            }
                        >
                            <Icon type="dashboard" />

                            <span>
                                {tr(
                                    'Dashboard'
                                )}
                            </span>
                        </NavLink>

                        <NavLink
                            to="/admin/receipts"
                            onClick={
                                onNavigate
                            }
                            className={
                                linkClassName
                            }
                        >
                            <Icon type="receipts" />

                            <span>
                                {tr(
                                    'Receipts'
                                )}
                            </span>
                        </NavLink>

                        <NavLink
                            to="/admin/winners"
                            onClick={
                                onNavigate
                            }
                            className={
                                linkClassName
                            }
                        >
                            <Icon type="winners" />

                            <span>
                                {tr(
                                    'Winners'
                                )}
                            </span>
                        </NavLink>

                        <NavLink
                            to="/admin/draws"
                            onClick={
                                onNavigate
                            }
                            className={
                                linkClassName
                            }
                        >
                            <Icon type="draws" />

                            <span>
                                {tr(
                                    'Draws'
                                )}
                            </span>
                        </NavLink>
                    </div>
                </div>

                {/* Data */}

                <div>
                    <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {tr(
                            'Data'
                        )}
                    </div>

                    <div className="space-y-1">
                        <NavLink
                            to="/admin/participants"
                            onClick={
                                onNavigate
                            }
                            className={
                                linkClassName
                            }
                        >
                            <Icon type="participants" />

                            <span>
                                {tr(
                                    'Participants'
                                )}
                            </span>
                        </NavLink>

                    </div>
                </div>

            </nav>
        </div>
    );
}
