export default function FilterTabs({ filter, onChange, counts }) {
  const tabs = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'completed', label: `Completed (${counts.completed})` },
    { key: 'pending', label: `Pending (${counts.pending})` },
  ];

  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={filter === t.key}
          className={`tab ${filter === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
