// =====================================================
// What'sToday · api.js — Central API Client
// =====================================================

const BASE = '/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('wt_token');

  const res = await fetch(BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    ...options,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || data.message || `Error ${res.status}`);
  return data;
}

const API = {
  // ── Auth ──────────────────────────────────────────
  register : (username, email, password) =>
    apiFetch('/auth/register', { method: 'POST', body: { username, email, password } }),

  login    : (email, password) =>
    apiFetch('/auth/login', { method: 'POST', body: { email, password } }),

  me       : () =>
    apiFetch('/auth/me'),

  // ── Home (aggregated: today + past 10) ────────────
  getHome  : () =>
    apiFetch('/home'),

  // ── Issues (aggregated: issue + posts) ────────────
  getIssue : (id, sort = 'top') =>
    apiFetch(`/issues/${id}?sort=${sort}`),

  // ── Posts (aggregated: post + comments) ───────────
  getPost    : (id) =>
    apiFetch(`/posts/${id}`),

  createPost : (issueId, title, content) =>
    apiFetch(`/issues/${issueId}/posts`, { method: 'POST', body: { title, content } }),

  updatePost : (id, title, content) =>
    apiFetch(`/posts/${id}`, { method: 'PUT', body: { title, content } }),

  deletePost : (id) =>
    apiFetch(`/posts/${id}`, { method: 'DELETE' }),

  // ── Votes ─────────────────────────────────────────
  votePost   : (id, value) =>
    apiFetch(`/posts/${id}/votes`, { method: 'POST', body: { value } }),  // value: 1 or -1

  unvotePost : (id) =>
    apiFetch(`/posts/${id}/votes`, { method: 'DELETE' }),

  // ── Comments ──────────────────────────────────────
  createComment : (postId, content) =>
    apiFetch(`/posts/${postId}/comments`, { method: 'POST', body: { content } }),

  deleteComment : (id) =>
    apiFetch(`/comments/${id}`, { method: 'DELETE' }),
};