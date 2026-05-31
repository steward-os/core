import { Link, useLocation } from "react-router-dom";
import { useAppHeaderVisibility } from "../../hooks/useAppHeaderVisibility";
import {
    getVisibleAccountMenuItems,
    getVisibleAdminMenuItems,
    getVisibleBoardMenuItems,
    getVisibleFinanceMenuItems,
    getVisibleSessionMenuItems,
} from "../../utils/navigation";

const SubNavLayout = ({ children, isAdmin, isBoardMember, isSessionAdmin, isFinancialAdmin, isVolunteerAdmin, isBannerAdmin }) => {
    const location = useLocation();
    const { isMobile } = useAppHeaderVisibility();

    // Define sections and their corresponding menus
    const sections = [
        {
            name: "Beheer",
            items: getVisibleAdminMenuItems(isAdmin, isVolunteerAdmin, isBannerAdmin),
        },
        {
            name: "Bestuur",
            items: getVisibleBoardMenuItems(isAdmin, isBoardMember),
        },
        {
            name: "Planning",
            items: getVisibleSessionMenuItems(isAdmin, isSessionAdmin),
        },
        {
            name: "Financieel",
            items: getVisibleFinanceMenuItems(isFinancialAdmin),
        },
        {
            name: "Mijn account",
            items: getVisibleAccountMenuItems(isBoardMember, isFinancialAdmin),
        },
    ];

    // Find active section based on current path
    const activeSection = sections.find(section =>
        section.items.some(item => location.pathname.startsWith(item.path))
    );

    if (isMobile || !activeSection || (activeSection.items.length <= 1 && !activeSection.extraFooter)) {
        return <>{children}</>;
    }

    return (
        <div className="flex w-full max-w-none gap-0 px-4">
            {/* Left Sidebar */}
            <aside className="w-64 flex-shrink-0 sticky top-12 h-[calc(100vh-3rem)] hidden md:block border-r border-[var(--glass-border)] bg-[var(--glass-bg)]/50 backdrop-blur-md -ml-4">
                <div className="p-4 h-full">
                    <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 px-3">
                        {activeSection.name}
                    </h2>
                    <nav className="space-y-1">
                        {activeSection.items.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.key}
                                    to={item.path}
                                    className={`block px-3 py-2 text-sm font-medium rounded-xl transition-colors ${isActive
                                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        : "text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-primary)]"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                        {activeSection.extraFooter}
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                {children}
            </div>
        </div>
    );
};

export default SubNavLayout;
