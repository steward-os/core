export const ListRow = ({ columns, onClick, className = "", ...props }) => {
  return (
    <div
      className={`border-b border-gray-200 dark:border-white/5 last:border-0 hover:bg-blue-100/60 dark:hover:bg-white/5 transition-colors duration-150 cursor-pointer flex items-center px-4 min-h-[40px] group ${className}`}
      onClick={onClick}
      {...props}
    >
      {columns.map((column, index) => (
        <div
          key={index}
          style={column.width ? { width: column.width } : { flex: 1 }}
          className={`py-1 px-2 min-w-0 overflow-hidden ${column.className || ""}`}
        >
          {column.content}
        </div>
      ))}
    </div>
  );
};

export const RowButtons = ({ children, className = "", center = true }) => {
  return <div className={`flex ${center ? "justify-center" : "justify-end"} space-x-2 ${className}`}>{children}</div>;
};
