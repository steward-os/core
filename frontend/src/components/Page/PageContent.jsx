import { useAppHeaderVisibility } from "../../hooks/useAppHeaderVisibility";

const PageContent = ({ children, className = "", fullWidth = false, wide = false }) => {
  const { isAppHeaderHidden } = useAppHeaderVisibility();
  const paddingClass = isAppHeaderHidden ? 'px-0 pb-0 md:px-6 md:pb-6' : 'p-0 md:p-6';
  const maxWidthClass = fullWidth ? 'max-w-none' : wide ? 'max-w-6xl' : 'max-w-4xl';

  return <div className={`${maxWidthClass} mx-auto ${paddingClass} ${className}`}>{children}</div>;
};

export default PageContent;
