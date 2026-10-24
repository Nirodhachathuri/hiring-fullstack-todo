import { useCallback, useEffect, useState } from 'react';
import { todosApi } from '../api/todos';

// Owns the TODO list state. Every mutation is optimistic:
// the UI changes immediately, then rolls back if the request fails.
export function useTodos(onError) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setTodos(await todosApi.getAll());
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Apply a local change, run the request, restore the snapshot on failure.
  async function optimistic(applyLocal, runRequest, failMessage) {
    const snapshot = todos;
    setTodos(applyLocal);
    try {
      const saved = await runRequest();
      return saved;
    } catch (err) {
      setTodos(snapshot);
      onError?.(`${failMessage}: ${err.message}`);
      return null;
    }
  }

  const replaceById = (id, next) => (list) => list.map((t) => (t._id === id ? next : t));

  async function addTodo({ title, description }) {
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const draft = { _id: tempId, title, description, done: false, createdAt: now, updatedAt: now, pending: true };

    const saved = await optimistic(
      (list) => [draft, ...list],
      () => todosApi.create({ title, description }),
      'Could not add task',
    );
    if (saved) setTodos(replaceById(tempId, saved));
    return Boolean(saved);
  }

  async function updateTodo(id, changes) {
    const saved = await optimistic(
      (list) => list.map((t) => (t._id === id ? { ...t, ...changes } : t)),
      () => todosApi.update(id, changes),
      'Could not save changes',
    );
    if (saved) setTodos(replaceById(id, saved));
    return Boolean(saved);
  }

  async function toggleTodo(id) {
    const saved = await optimistic(
      (list) => list.map((t) => (t._id === id ? { ...t, done: !t.done } : t)),
      () => todosApi.toggleDone(id),
      'Could not update status',
    );
    if (saved) setTodos(replaceById(id, saved));
  }

  async function deleteTodo(id) {
    await optimistic(
      (list) => list.filter((t) => t._id !== id),
      () => todosApi.remove(id),
      'Could not delete task',
    );
  }

  return { todos, loading, loadError, reload: load, addTodo, updateTodo, toggleTodo, deleteTodo };
}
