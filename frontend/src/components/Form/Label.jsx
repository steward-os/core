const Label = ({ children, htmlFor, required = false, className = "" }) => {
  return (
    <label className={`block font-medium text-[var(--text-primary)] mb-2 ${className}`} htmlFor={htmlFor}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export default Label;
