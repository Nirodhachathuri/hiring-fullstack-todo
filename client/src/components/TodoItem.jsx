import { Check, Pencil, Trash2 } from 'lucide-react';

export default function TodoItem({ todo, onToggle, onEdit, onDelete }) {
  const { _id, title, description, done, pending } = todo;

  return (
    <li className={`todo-item ${done ? 'done' : ''} ${pending ? 'saving' : ''}`}>
      <button
        className={`checkbox ${done ? 'checked' : ''}`}
        onClick={() => onToggle(_id)}
        disabled={pending}
        aria-label={done ? 'Mark as pending' : 'Mark as done'}
      >
        {done && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="todo-text">
        <p className="todo-title">{title}</p>
        {description && <p className="todo-desc">{description}</p>}
      </div>

      <span className={`badge ${done ? 'badge-done' : 'badge-pending'}`}>
        {done ? 'Completed' : 'Pending'}
      </span>

      <div className="todo-actions">
        <button className="icon-btn" onClick={() => onEdit(todo)} disabled={pending} aria-label="Edit task">
          <Pencil size={18} />
        </button>
        <button className="icon-btn danger" onClick={() => onDelete(_id)} disabled={pending} aria-label="Delete task">
          <Trash2 size={18} />
        </button>
      </div>
    </li>
  );
}
