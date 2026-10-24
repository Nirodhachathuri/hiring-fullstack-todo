// In-browser stand-in for the backend, used only when VITE_USE_MOCK=true.
// Mirrors the real API's responses (including per-user TODOs) so the UI code doesn't change.
// NOT secure: passwords are stored in plain text in localStorage. Demo use only.
import { getAuthToken } from './client';

const USERS_KEY = 'todo-app-mock-users';
const TODOS_KEY = 'todo-app-mock-todos';
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const load = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

function fail(status, message) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

const publicUser = ({ password: _password, ...user }) => user;

function currentUserId() {
  const token = getAuthToken();
  const id = token?.startsWith('mock-') ? token.slice(5) : null;
  if (!id || !load(USERS_KEY).some((u) => u.id === id)) fail(401, 'Please log in again');
  return id;
}

function findOwnTodo(todos, id) {
  const todo = todos.find((t) => t._id === id && t.userId === currentUserId());
  if (!todo) fail(404, 'TODO not found');
  return todo;
}

export const mockAuthApi = {
  async register({ name, email, password }) {
    await delay();
    const users = load(USERS_KEY);
    const normalized = email.trim().toLowerCase();
    if (users.some((u) => u.email === normalized)) fail(409, 'An account with this email already exists');
    const user = { id: crypto.randomUUID(), name: name.trim(), email: normalized, password };
    save(USERS_KEY, [...users, user]);
    return { token: `mock-${user.id}`, user: publicUser(user) };
  },
  async login({ email, password }) {
    await delay();
    const user = load(USERS_KEY).find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.password !== password) fail(401, 'Incorrect email or password');
    return { token: `mock-${user.id}`, user: publicUser(user) };
  },
  async me() {
    await delay(150);
    const id = currentUserId();
    return { user: publicUser(load(USERS_KEY).find((u) => u.id === id)) };
  },
};

const stripOwner = ({ userId: _userId, ...todo }) => todo;

export const mockTodosApi = {
  async getAll() {
    await delay();
    const userId = currentUserId();
    return load(TODOS_KEY).filter((t) => t.userId === userId).map(stripOwner);
  },
  async create({ title, description = '' }) {
    await delay();
    const now = new Date().toISOString();
    const todo = {
      _id: crypto.randomUUID(), userId: currentUserId(),
      title, description, done: false, createdAt: now, updatedAt: now,
    };
    save(TODOS_KEY, [todo, ...load(TODOS_KEY)]);
    return stripOwner(todo);
  },
  async update(id, changes) {
    await delay();
    const todos = load(TODOS_KEY);
    const todo = findOwnTodo(todos, id);
    Object.assign(todo, changes, { updatedAt: new Date().toISOString() });
    save(TODOS_KEY, todos);
    return stripOwner(todo);
  },
  async toggleDone(id) {
    await delay();
    const todos = load(TODOS_KEY);
    const todo = findOwnTodo(todos, id);
    todo.done = !todo.done;
    todo.updatedAt = new Date().toISOString();
    save(TODOS_KEY, todos);
    return stripOwner(todo);
  },
  async remove(id) {
    await delay();
    const todos = load(TODOS_KEY);
    findOwnTodo(todos, id);
    save(TODOS_KEY, todos.filter((t) => t._id !== id));
    return null;
  },
};
