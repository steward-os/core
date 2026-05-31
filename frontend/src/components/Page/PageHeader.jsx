import { createPortal } from "react-dom";
import AnchoredMenu from "../AnchoredMenu";
import { useAppHeaderVisibility } from "../../hooks/useAppHeaderVisibility";

const MobileActionsMenu = ({ children }) => {
  if (!children) return null;
  return <AnchoredMenu>{children}</AnchoredMenu>;
};

const PageHeader = ({ title, children, backButton }) => {
  const { isAppHeaderHidden, isMobile } = useAppHeaderVisibility();

  // Helper to identify if we should show children directly (e.g. FAB) or in a menu
  const renderMobileActions = () => {
    if (!children) return null;

    // Convert children to an array to handle all cases consistently
    const childrenArray = Array.isArray(children) ? children : [children];

    // Filter out null/undefined/false children
    const validChildren = childrenArray.filter((child) => !!child);

    // If it contains exactly one element and it's an AddButton, show it as a FAB
    const isSingleAddButton =
      validChildren.length === 1 &&
      validChildren[0].type &&
      (validChildren[0].type.isAddButton ||
        validChildren[0].type.displayName === "AddButton" ||
        validChildren[0].type.name === "AddButton");

    if (isSingleAddButton) {
      // Use a portal so the FAB renders directly in document.body — root stacking
      // context, z-50 — above glass-panel cards (which each create a z-auto
      // stacking context via backdrop-filter and would otherwise paint on top).
      // On desktop the button is shown via the "hidden md:flex" container below.
      if (isMobile) {
        return createPortal(children, document.body);
      }
      return null;
    }

    return <MobileActionsMenu>{children}</MobileActionsMenu>;
  };

  if (isAppHeaderHidden) {
    return (
      <div className="">
        <div className="fixed top-0 left-0 right-0 z-40 px-4 pt-4 flex items-center justify-between pointer-events-none">
          <div className="flex items-center text-[var(--text-primary)] pointer-events-auto">{backButton}</div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="hidden md:flex items-center gap-2">{children}</div>
            <div className="md:hidden">{renderMobileActions()}</div>
          </div>
        </div>
        <div className="pt-10 pb-2 mb-4 flex items-center justify-between px-1">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] drop-shadow-sm">{title}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl backdrop-blur-sm bg-white/40 dark:bg-black/20 border border-black/10 dark:border-white/10">
      <div className="px-4 md:px-6 py-3 md:py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          {backButton}
          <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">{children}</div>
          <div className="md:hidden">{renderMobileActions()}</div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
