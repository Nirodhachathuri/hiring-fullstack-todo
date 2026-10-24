import { request, USE_MOCK } from './client';
import { mockAuthApi } from './mock';

// Login/register failures return 401/400 with a message we want to show in the form,
// so they skip the automatic "log out on 401" behaviour.
const httpAuthApi = {
  register: (data) => request('/auth/register', { method: 'POST', body: data, skipAuthRedirect: true }),
  login: (data) => request('/auth/login', { method: 'POST', body: data, skipAuthRedirect: true }),
  me: () => request('/auth/me'),
};

export const authApi = USE_MOCK ? mockAuthApi : httpAuthApi;
