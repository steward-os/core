const Checkbox = ({ id, label, checked, onChange, className = "" }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-[var(--glass-border)] bg-[var(--glass-bg)] text-blue-600 focus:ring-blue-500 focus:ring-2"
      />
      {label && (
        <label htmlFor={id} className="font-medium text-[var(--text-primary)] cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
