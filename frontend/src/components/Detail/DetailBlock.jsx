const DetailBlock = ({ title, children }) => (
  <div className="flex-1">
    {title && <h4 className="font-medium text-[var(--text-primary)] mb-2">{title}</h4>}
    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-x-6 gap-y-3 items-start">
      {children}
    </div>
  </div>
);

export const Row = ({ children }) => <div className="contents">{children}</div>;

export const Label = ({ htmlFor, children, required = false }) => (
  <label htmlFor={htmlFor} className="font-medium text-[var(--text-secondary)] md:whitespace-nowrap">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

export const Value = ({ children }) => (
  <div className="text-[var(--text-primary)] min-w-0">{children}</div>
);

export default DetailBlock;
