// In-browser stand-in for the backend, used only when VITE_USE_MOCK=true.
// Mirrors the API's response shapes so the UI code doesn't change.
const KEY = 'todo-app-mock';
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const read = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const write = (todos) => localStorage.setItem(KEY, JSON.stringify(todos));

function findOrThrow(todos, id) {
  const todo = todos.find((t) => t._id === id);
  if (!todo) throw new Error('TODO not found');
  return todo;
}

export const mockApi = {
  async getAll() {
    await delay();
    return read();
  },
  async create({ title, description = '' }) {
    await delay();
    const now = new Date().toISOString();
    const todo = { _id: crypto.randomUUID(), title, description, done: false, createdAt: now, updatedAt: now };
    write([todo, ...read()]);
    return todo;
  },
  async update(id, changes) {
    await delay();
    const todos = read();
    const todo = findOrThrow(todos, id);
    Object.assign(todo, changes, { updatedAt: new Date().toISOString() });
    write(todos);
    return todo;
  },
  async toggleDone(id) {
    await delay();
    const todos = read();
    const todo = findOrThrow(todos, id);
    todo.done = !todo.done;
    todo.updatedAt = new Date().toISOString();
    write(todos);
    return todo;
  },
  async remove(id) {
    await delay();
    write(read().filter((t) => t._id !== id));
    return null;
  },
};
