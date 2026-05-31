const DetailCard = ({ title, action, children, className = "", contentClassName = "p-4 flex flex-col md:flex-row gap-6" }) => (
  <div className={`glass-panel rounded-2xl overflow-hidden ${className}`}>
    {title && (
      <div className="glass-header px-4 py-3 flex items-center gap-2">
        <h3 className="text-lg font-medium text-[var(--text-primary)]">{title}</h3>
        {action && action}
      </div>
    )}
    <div className={contentClassName}>
      {children}
    </div>
  </div>
);

export default DetailCard;
