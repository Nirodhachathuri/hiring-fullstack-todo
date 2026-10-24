import { Check, CircleCheck, Clock, ListTodo } from 'lucide-react';

const NAV = [
  { key: 'all', label: 'All Tasks', Icon: ListTodo },
  { key: 'completed', label: 'Completed', Icon: CircleCheck },
  { key: 'pending', label: 'Pending', Icon: Clock },
];

export default function Sidebar({ filter, onFilterChange }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-logo"><Check size={20} strokeWidth={3} /></span>
        <span className="brand-name">TodoApp</span>
      </div>

      <nav className="nav">
        {NAV.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`nav-item ${filter === key ? 'active' : ''}`}
            onClick={() => onFilterChange(key)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <p className="sidebar-footer">Simple • Fast • Productive</p>
    </aside>
  );
}
