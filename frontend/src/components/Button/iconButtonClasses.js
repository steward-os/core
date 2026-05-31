export const neutralIconButtonClasses = (showText, className = "") =>
  showText
    ? `flex items-center whitespace-nowrap w-full px-3 py-2 text-sm font-medium rounded-md text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors md:border md:border-[var(--glass-border)] md:shadow-sm ${className}`
    : `p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors ${className}`;

export const destructiveIconButtonClasses = (showText, className = "") =>
  showText
    ? `flex items-center whitespace-nowrap w-full px-3 py-2 text-sm font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors md:border md:border-[var(--glass-border)] md:shadow-sm ${className}`
    : `p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${className}`;
