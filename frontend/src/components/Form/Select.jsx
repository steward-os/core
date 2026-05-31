import { forwardRef } from "react";

const Select = forwardRef(({ className = "", error, children, ...props }, ref) => {
  return (
    <div>
      <select
        ref={ref}
        className={`w-full max-w-2xl px-3 py-2 bg-[var(--glass-bg)] ring-1 ring-inset ring-black/20 dark:ring-white/20 rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1  text-red-600">{error}</p>}
    </div>
  );
});

Select.displayName = "Select";

export default Select;
