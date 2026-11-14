import { http, toApiError } from './http';

// Thin wrappers: each returns response.data. Errors arrive as ApiError (the http interceptor
// normalises them); `call` also covers requests that never reached the interceptor.
const call = async (request) => {
  try {
    return (await request()).data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const register = ({ name, email, password }) => call(() => http.post('/auth/register', { name, email, password }));
export const login = ({ email, password, remember = false }) => call(() => http.post('/auth/login', { email, password, remember }));
export const refresh = () => call(() => http.post('/auth/refresh'));
export const logout = () => call(() => http.post('/auth/logout'));
export const me = () => call(() => http.get('/auth/me'));
export const forgotPassword = (email) => call(() => http.post('/auth/forgot-password', { email }));
export const resetPassword = (token, password) => call(() => http.post('/auth/reset-password', { token, password }));
export const verifyEmail = (token) => call(() => http.post('/auth/verify-email', { token }));
export const resendVerification = () => call(() => http.post('/auth/resend-verification'));
export const providers = () => call(() => http.get('/auth/providers'));
// The server answers { sessions: [...] }; callers want the list itself.
export const listSessions = async () => (await call(() => http.get('/auth/sessions'))).sessions;
export const revokeSession = (id) => call(() => http.delete(`/auth/sessions/${encodeURIComponent(id)}`));
