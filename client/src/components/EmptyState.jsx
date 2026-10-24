import { ClipboardList, Plus } from 'lucide-react';

const MESSAGES = {
  all: ['No TODOs yet', 'Add your first task and start getting things done!'],
  completed: ['Nothing completed yet', 'Tasks you finish will show up here.'],
  pending: ['All caught up!', 'You have no pending tasks.'],
};

export default function EmptyState({ filter, onAddClick }) {
  const [heading, text] = MESSAGES[filter];
  return (
    <div className="empty-state">
      <div className="empty-icon"><ClipboardList size={36} /></div>
      <h3>{heading}</h3>
      <p>{text}</p>
      {filter === 'all' && (
        <button className="btn btn-primary" onClick={onAddClick}>
          <Plus size={16} /> Add Task
        </button>
      )}
    </div>
  );
}
