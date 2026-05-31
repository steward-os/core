import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const Textarea = forwardRef(({ className = "", error, rows = 4, autoGrow = false, onChange, ...props }, ref) => {
  const textareaRef = useRef(null);

  // Expose the textarea element to parent components
  useImperativeHandle(ref, () => textareaRef.current, []);

  const handleAutoGrow = (textarea) => {
    if (autoGrow && textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  const handleChange = (e) => {
    if (autoGrow) {
      handleAutoGrow(e.target);
    }
    if (onChange) {
      onChange(e);
    }
  };

  // Auto-grow on initial render and when value changes externally
  useEffect(() => {
    if (autoGrow && textareaRef.current) {
      handleAutoGrow(textareaRef.current);
    }
  }, [autoGrow, props.value]);

  const textareaStyle = autoGrow ? {
    overflow: 'hidden',
    resize: 'none',
    ...props.style
  } : props.style;

  return (
    <div>
      <textarea
        ref={textareaRef}
        rows={rows}
        className={`w-full px-3 py-2 bg-[var(--glass-bg)] border border-black/20 dark:border-white/20 rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        onChange={handleChange}
        style={textareaStyle}
        {...props}
      />
      {error && <p className="mt-1  text-red-600">{error}</p>}
    </div>
  );
});

Textarea.displayName = "Textarea";

export default Textarea;
