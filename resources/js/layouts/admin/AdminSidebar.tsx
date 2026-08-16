import SidebarNavigation from './SidebarNavigation';
import SidebarHeader from './SidebarHeader';
import SidebarFooter from './SidebarFooter';

type Props = {
    onNavigate?: () => void;
};

export default function AdminSidebar({ onNavigate }: Props) {
    return (
        <div className="flex h-full flex-col">
            <SidebarHeader />

            <SidebarNavigation onNavigate={onNavigate}/>

            <SidebarFooter />
        </div>
    );
}
