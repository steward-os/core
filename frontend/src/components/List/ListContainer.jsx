import PageHeader from "../Page/PageHeader";

export const ListHeading = ({ children, className = "", button = null }) => {
  return (
    <div className={className}>
      <PageHeader title={children} variant="list">
        {button}
      </PageHeader>
    </div>
  );
};

export const ListContainer = ({ children, className = "", narrow = false, fullWidth = false }) => {
  let maxWidthClass = "max-w-4xl"; // Default

  if (fullWidth) {
    maxWidthClass = "max-w-none";
  } else if (narrow) {
    maxWidthClass = "max-w-3xl";
  }

  return <div className={`mx-auto pt-6 px-0 pb-0 md:p-6 ${maxWidthClass} ${className}`}>{children}</div>;
};

export const ButtonContainer = ({ children, className = "", start = false, center = false }) => {
  let alignment = "justify-end"; // Default alignment

  if (start) {
    alignment = "justify-start";
  } else if (center) {
    alignment = "justify-center";
  }

  return <div className={`mb-6 flex items-center ${alignment} ${className}`}>{children}</div>;
};

export const EmptyListMessage = ({ message, className = "" }) => {
  return <div className={`text-center text-[var(--text-secondary)] py-8 ${className}`}>{message}</div>;
};
