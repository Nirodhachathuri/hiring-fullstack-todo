import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { validateTodo } from '../utils/validateTodo';

export default function EditModal({ todo, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description || '');
  const [errors, setErrors] = useState({});

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit(e) {
    e.preventDefault();
    const found = validateTodo({ title, description });
    setErrors(found);
    if (Object.keys(found).length) return;
    onSave(todo._id, { title: title.trim(), description: description.trim() });
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        noValidate
        role="dialog"
        aria-labelledby="edit-title"
      >
        <div className="modal-header">
          <h2 id="edit-title">Edit TODO</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <label className="label" htmlFor="edit-title-input">
          Title <span className="required">*</span>
        </label>
        <input
          id="edit-title-input"
          className={`input ${errors.title ? 'invalid' : ''}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        {errors.title && <span className="field-error">{errors.title}</span>}

        <label className="label" htmlFor="edit-desc-input">Description</label>
        <textarea
          id="edit-desc-input"
          className={`input textarea ${errors.description ? 'invalid' : ''}`}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {errors.description && <span className="field-error">{errors.description}</span>}

        <div className="modal-footer">
          <button type="button" className="btn btn-danger-soft" onClick={() => onDelete(todo._id)}>
            Delete
          </button>
          <div className="modal-footer-right">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </div>
      </form>
    </div>
  );
}
