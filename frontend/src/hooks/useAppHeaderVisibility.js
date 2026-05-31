import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { allMenuItemPaths } from "../utils/navigation";

// Responsive hook
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

/**
 * Hook to determine AppHeader visibility and related layout states
 * @returns {Object} - { isAppHeaderVisible, isAppHeaderHidden, isMobile, isListPage }
 */
export const useAppHeaderVisibility = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  const isListPage = (path) => {
    const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path;
    return allMenuItemPaths.includes(normalized);
  };

  const isCurrentPageListPage = isListPage(location.pathname);
  const isAppHeaderVisible = !isMobile || isCurrentPageListPage;
  const isAppHeaderHidden = !isAppHeaderVisible;

  return {
    isAppHeaderVisible,
    isAppHeaderHidden,
    isMobile,
    isListPage: isCurrentPageListPage
  };
};