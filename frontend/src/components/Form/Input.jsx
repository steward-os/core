import { forwardRef } from "react";

const Input = forwardRef(({ type = "text", className = "", error, ...props }, ref) => {
  return (
    <div>
      <input
        ref={ref}
        type={type}
        className={`w-full max-w-2xl px-3 py-2 bg-[var(--glass-bg)] border border-black/20 dark:border-white/20 rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      />
      {error && <p className="mt-1  text-red-600">{error}</p>}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
