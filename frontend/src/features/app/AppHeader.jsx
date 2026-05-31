import { Dialog, Disclosure } from "@headlessui/react";
import { Bars3Icon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import DarkModeToggle from "../../components/DarkModeToggle";

import {
  getVisibleAccountMenuItems,
  getVisibleAdminMenuItems,
  getVisibleBoardMenuItems,
  getVisibleFinanceMenuItems,
  getVisibleSessionMenuItems,
  menuItems,
} from "../../utils/navigation";


import { useAppHeaderVisibility } from "../../hooks/useAppHeaderVisibility";

// Component for regular menu items
const NavItems = ({ items, onClick, location, isMobile }) => {
  return items.map((item) => (
    <li key={item.key} className={isMobile ? "" : "h-full"}>
      <Link
        to={item.path}
        onClick={onClick}
        className={`${isMobile ? "block" : "flex items-center h-full"} px-3 ${isMobile ? "py-2" : ""} text-sm font-medium transition-colors ${location.pathname === item.path
          ? isMobile
            ? "bg-black/10 dark:bg-white/10 text-[var(--text-primary)]"
            : "bg-black/10 dark:bg-white/10 text-[var(--text-primary)]"
          : isMobile
            ? "text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
            : "text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--text-primary)]"
          }`}
      >
        {item.label}
      </Link>
    </li>
  ));
};

// Reusable mobile disclosure component
const MobileDisclosure = ({ title, items, location, onClose }) => {
  // Check if current page is in this disclosure section
  const isCurrentSection = items.some((item) => location.pathname.startsWith(item.path));

  return (
    <Disclosure as="div" className="mt-2" defaultOpen={isCurrentSection}>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
            <span>{title}</span>
            <ChevronRightIcon
              className={`${open ? "transform rotate-90" : ""} w-5 h-5 text-[var(--text-secondary)] transition-transform`}
            />
          </Disclosure.Button>
          <Disclosure.Panel className="mt-1 space-y-1 pl-3">
            {items.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                onClick={onClose}
                className={`block px-3 py-2 text-sm font-medium transition-colors ${location.pathname.startsWith(item.path)
                  ? "bg-black/10 dark:bg-white/10 text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-primary)]"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};


// Mobile drawer menu component
const MobileMenu = ({
  visible,
  onClose,
  location,
  menuItems,
  adminMenuItems,
  boardMenuItems,
  sessionMenuItems,
  financeMenuItems,
  accountMenuItems,
  hasAdminRights,
  hasBoardRights,
  hasSessionRights,
  hasFinanceRights,
}) => {
  return (
    <Dialog open={visible} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />
      <div className="fixed inset-0 flex">
        <Dialog.Panel className="ml-auto w-64 glass-nav h-full shadow-xl transition-all duration-300 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
            <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">Menu</Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-4 overflow-y-auto flex-1">
            <ul className="space-y-2">
              <NavItems items={menuItems} onClick={onClose} location={location} isMobile={true} />

              {/* Admin section */}
              {hasAdminRights && (
                <li>
                  <MobileDisclosure title="Beheer" items={adminMenuItems} location={location} onClose={onClose} />
                </li>
              )}

              {/* Board section */}
              {hasBoardRights && (
                <li>
                  <MobileDisclosure title="Bestuur" items={boardMenuItems} location={location} onClose={onClose} />
                </li>
              )}

              {/* Board section */}
              {hasSessionRights && (
                <li>
                  <MobileDisclosure title="Planning" items={sessionMenuItems} location={location} onClose={onClose} />
                </li>
              )}

              {/* Finance section */}
              {hasFinanceRights && (
                <li>
                  <MobileDisclosure title="Financieel" items={financeMenuItems} location={location} onClose={onClose} />
                </li>
              )}

              <li className="mt-2">
                <MobileDisclosure
                  title="Mijn account"
                  items={accountMenuItems}
                  location={location}
                  onClose={onClose}
                />
              </li>
              <li className="mt-4 px-3">
                <DarkModeToggle variant="segmented" onToggle={onClose} />
              </li>
            </ul>
          </nav>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

// Header link component for sections
const HeaderSection = ({ title, items, location, isActivePage }) => {
  const firstItem = items[0];
  if (!firstItem) return null;

  const active = isActivePage(location.pathname);

  return (
    <Link
      to={firstItem.path}
      className={`px-3 h-full text-sm font-medium transition-colors inline-flex items-center ${active
        ? "bg-black/10 dark:bg-white/10 text-[var(--text-primary)]"
        : "text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--text-primary)]"
        }`}
    >
      {title}
    </Link>
  );
};


const AppHeader = ({
  isSessionAdmin,
  isAdmin,
  isVolunteerAdmin,
  isBannerAdmin,
  isBoardMember,
  isFinancialAdmin,
  className,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const location = useLocation();
  const { isMobile, isAppHeaderVisible } = useAppHeaderVisibility();

  // Filter menu items based on status
  const visibleAdminMenuItems = getVisibleAdminMenuItems(isAdmin, isVolunteerAdmin, isBannerAdmin);
  const visibleBoardMenuItems = getVisibleBoardMenuItems(isAdmin, isBoardMember);
  const visibleSessionMenuItems = getVisibleSessionMenuItems(isAdmin, isSessionAdmin);
  const visibleFinanceMenuItems = getVisibleFinanceMenuItems(isFinancialAdmin);
  const visibleAccountMenuItems = getVisibleAccountMenuItems(isBoardMember, isFinancialAdmin);

  const hasAdminRights = visibleAdminMenuItems.length > 0;
  const hasBoardRights = visibleBoardMenuItems.length > 0;
  const hasSessionRights = visibleSessionMenuItems.length > 0;
  const hasFinanceRights = visibleFinanceMenuItems.length > 0;

  const isAdminPage = (path) => {
    return visibleAdminMenuItems.some((item) => path.startsWith(item.path));
  };

  const isBoardPage = (path) => {
    return visibleBoardMenuItems.some((item) => path.startsWith(item.path));
  };

  const isSessionPage = (path) => {
    return visibleSessionMenuItems.some((item) => path.startsWith(item.path));
  };

  const isFinancePage = (path) => {
    return visibleFinanceMenuItems.some((item) => path.startsWith(item.path));
  };

  const isAccountPage = (path) => {
    return visibleAccountMenuItems.some((item) => path.startsWith(item.path));
  };

  // Only render when AppHeader should be visible
  if (!isAppHeaderVisible) {
    return null;
  }

  // Mobile View: Floating hamburger button only
  if (isMobile) {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setDrawerVisible(true)}
            className="p-3 bg-black/10 dark:bg-white/10 text-[var(--text-primary)] rounded-full backdrop-blur-md border border-black/10 dark:border-white/10 transition-all active:scale-[0.9] hover:bg-black/20 dark:hover:bg-white/20"
            aria-label="Open menu"
          >
            <Bars3Icon className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <MobileMenu
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          location={location}
          menuItems={menuItems}
          adminMenuItems={visibleAdminMenuItems}
          boardMenuItems={visibleBoardMenuItems}
          sessionMenuItems={visibleSessionMenuItems}
          financeMenuItems={visibleFinanceMenuItems}
          accountMenuItems={visibleAccountMenuItems}
          hasAdminRights={hasAdminRights}
          hasBoardRights={hasBoardRights}
          hasSessionRights={hasSessionRights}
          hasFinanceRights={hasFinanceRights}
        />
      </>
    );
  }

  // Desktop View: Full header
  return (
    <header className={`glass-header text-[var(--text-primary)] h-12 ${className}`}>
      <div className="flex justify-between h-full px-4">
        <div className="flex-shrink-0 text-xl font-semibold flex items-center">Leden app</div>

        <div className="flex">
          <nav className="h-full flex space-x-1">
            <ul className="h-full flex space-x-1">
              <NavItems items={menuItems} location={location} isMobile={false} />

              {hasAdminRights && (
                <li className="h-full">
                  <HeaderSection
                    title="Beheer"
                    items={visibleAdminMenuItems}
                    location={location}
                    isActivePage={isAdminPage}
                  />
                </li>
              )}

              {hasBoardRights && (
                <li className="h-full">
                  <HeaderSection
                    title="Bestuur"
                    items={visibleBoardMenuItems}
                    location={location}
                    isActivePage={isBoardPage}
                  />
                </li>
              )}

              {hasSessionRights && (
                <li className="h-full">
                  <HeaderSection
                    title="Planning"
                    items={visibleSessionMenuItems}
                    location={location}
                    isActivePage={isSessionPage}
                  />
                </li>
              )}

              {hasFinanceRights && (
                <li className="h-full">
                  <HeaderSection
                    title="Financieel"
                    items={visibleFinanceMenuItems}
                    location={location}
                    isActivePage={isFinancePage}
                  />
                </li>
              )}

              <li className="h-full">
                <HeaderSection
                  title="Mijn account"
                  items={visibleAccountMenuItems}
                  location={location}
                  isActivePage={isAccountPage}
                />
              </li>
              <li className="h-full flex items-center px-2">
                <DarkModeToggle />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
