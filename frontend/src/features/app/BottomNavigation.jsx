import { ChatBubbleLeftIcon, MusicalNoteIcon, UserGroupIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { ChatBubbleLeftIcon as ChatBubbleLeftIconSolid, MusicalNoteIcon as MusicalNoteIconSolid, UserGroupIcon as UserGroupIconSolid, WrenchScrewdriverIcon as WrenchScrewdriverIconSolid } from "@heroicons/react/24/solid";
import { useLocation, useNavigate } from "react-router-dom";
import pb from "../../pb";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = pb.authStore?.model || pb.authStore?.record || {};

  const navItems = [
    {
      key: "home",
      label: "Repetities en optredens",
      path: "/",
      icon: MusicalNoteIcon,
      activeIcon: MusicalNoteIconSolid
    },
    {
      key: "volunteering",
      label: "Vrijwilligers",
      path: "/volunteering",
      icon: UserGroupIcon,
      activeIcon: UserGroupIconSolid
    },
    {
      key: "tools",
      label: "Tools",
      path: "/tools",
      icon: WrenchScrewdriverIcon,
      activeIcon: WrenchScrewdriverIconSolid
    }
  ];

  // Add messages nav item if user is admin
  if (user.leden_app_admin) {
    navItems.push({
      key: "messages",
      label: "Berichten",
      path: "/messages",
      icon: ChatBubbleLeftIcon,
      activeIcon: ChatBubbleLeftIconSolid
    });
  }

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-nav z-40 md:hidden">
      <div className="flex">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = active ? item.activeIcon : item.icon;

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center py-2 px-1 transition-colors ${active
                  ? "text-blue-500"
                  : "text-[var(--text-secondary)]"
                }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;