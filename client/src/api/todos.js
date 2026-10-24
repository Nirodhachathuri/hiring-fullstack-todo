import { request, USE_MOCK } from './client';
import { mockTodosApi } from './mock';

// The server works out whose TODOs these are from the auth token,
// so no user id is sent from the browser.
const httpTodosApi = {
  getAll: () => request('/todos'),
  create: (todo) => request('/todos', { method: 'POST', body: todo }),
  update: (id, changes) => request(`/todos/${id}`, { method: 'PUT', body: changes }),
  toggleDone: (id) => request(`/todos/${id}/done`, { method: 'PATCH' }),
  remove: (id) => request(`/todos/${id}`, { method: 'DELETE' }),
};

export const todosApi = USE_MOCK ? mockTodosApi : httpTodosApi;
