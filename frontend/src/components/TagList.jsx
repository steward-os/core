const TagList = ({ tags = [] }) => {
  if (!tags.length) return "-";
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
          style={{ backgroundColor: tag.color || "#6b7280", color: "#fff" }}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
};

export default TagList;
