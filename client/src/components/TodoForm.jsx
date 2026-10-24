import { useState } from 'react';
import { Plus } from 'lucide-react';
import { validateTodo } from '../utils/validateTodo';

export default function TodoForm({ onAdd, inputRef }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateTodo({ title, description });
    setErrors(found);
    if (Object.keys(found).length) return;

    // Clear immediately (optimistic); restore input if the request fails.
    const values = { title: title.trim(), description: description.trim() };
    setTitle('');
    setDescription('');
    const ok = await onAdd(values);
    if (!ok) {
      setTitle(values.title);
      setDescription(values.description);
    }
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <input
          ref={inputRef}
          className={`input ${errors.title ? 'invalid' : ''}`}
          placeholder="Task title..."
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
          }}
          aria-label="Task title"
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>

      <div className="field field-grow">
        <input
          className={`input ${errors.description ? 'invalid' : ''}`}
          placeholder="Optional description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Task description"
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>

      <button type="submit" className="btn btn-primary btn-lg">
        <Plus size={18} /> Add Task
      </button>
    </form>
  );
}
