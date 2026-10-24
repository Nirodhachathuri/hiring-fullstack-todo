import { useCallback, useMemo, useRef, useState } from 'react';
import { LoaderCircle, Moon, RefreshCw, Sun } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TodoForm from '../components/TodoForm';
import FilterTabs from '../components/FilterTabs';
import TodoItem from '../components/TodoItem';
import EmptyState from '../components/EmptyState';
import EditModal from '../components/EditModal';
import Toast from '../components/Toast';
import UserMenu from '../components/UserMenu';
import { useTodos } from '../hooks/useTodos';
import { useAuth } from '../hooks/useAuth';

export default function TodosPage({ theme, onToggleTheme }) {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');
  const titleInputRef = useRef(null);

  const { todos, loading, loadError, reload, addTodo, updateTodo, toggleTodo, deleteTodo } =
    useTodos(setToast);

  const counts = useMemo(() => {
    const completed = todos.filter((t) => t.done).length;
    return { all: todos.length, completed, pending: todos.length - completed };
  }, [todos]);

  const visible = useMemo(() => {
    if (filter === 'completed') return todos.filter((t) => t.done);
    if (filter === 'pending') return todos.filter((t) => !t.done);
    return todos;
  }, [todos, filter]);

  const closeModal = useCallback(() => setEditing(null), []);
  const closeToast = useCallback(() => setToast(''), []);

  function handleSave(id, changes) {
    setEditing(null);
    updateTodo(id, changes);
  }

  function handleDelete(id) {
    setEditing(null);
    deleteTodo(id);
  }

  function renderList() {
    if (loading) {
      return (
        <div className="status">
          <LoaderCircle className="spin" size={28} />
          <p>Loading your tasks...</p>
        </div>
      );
    }
    if (loadError) {
      return (
        <div className="status error">
          <p>Couldn't load your tasks. {loadError}</p>
          <button className="btn btn-outline" onClick={reload}>
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      );
    }
    if (!visible.length) {
      return <EmptyState filter={filter} onAddClick={() => titleInputRef.current?.focus()} />;
    }
    return (
      <ul className="todo-list">
        {visible.map((todo) => (
          <TodoItem
            key={todo._id}
            todo={todo}
            onToggle={toggleTodo}
            onEdit={setEditing}
            onDelete={deleteTodo}
          />
        ))}
      </ul>
    );
  }

  const firstName = user.name.split(' ')[0];

  return (
    <div className="layout">
      <Sidebar filter={filter} onFilterChange={setFilter} />

      <main className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
          </button>
          <UserMenu />
        </header>

        <section className="todo-panel">
          <h1 className="page-title">My TODOs</h1>
          <p className="page-subtitle">Hi {firstName}, stay organized and get things done!</p>

          <TodoForm onAdd={addTodo} inputRef={titleInputRef} />
          <FilterTabs filter={filter} onChange={setFilter} counts={counts} />
          {renderList()}
        </section>
      </main>

      {editing && (
        <EditModal todo={editing} onSave={handleSave} onDelete={handleDelete} onClose={closeModal} />
      )}
      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}
