const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="flex mb-4">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`mx-3 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeTab === tab.id
            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default Tabs;
