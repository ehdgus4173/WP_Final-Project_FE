// =====================================================
// What'sToday · api.js — Central API Client
// =====================================================

// __API_BASE__ is injected at build time by Vite (see vite.config.js)
const BASE = window.__API_BASE__ || '/api';
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
  if (!res.ok) {
  const error = new Error(data.error?.message || data.message || `Error ${res.status}`);
  error.code = data.error?.code;
  error.status = res.status;
  error.details = data.error?.details;
  throw error;
}
  return data.data !== undefined ? data.data : data;
}

const API = {
  // ── Auth ──────────────────────────────────────────
  register : (username, email, password) =>
    apiFetch('/auth/register', { method: 'POST', body: { username, email, password } }),

  login    : (email, password) =>
    apiFetch('/auth/login', { method: 'POST', body: { email, password } }),

  me       : () =>
    apiFetch('/auth/me'),

  // MyPage: 프로필 수정(username/description) 및 최근 게시물 조회
  updateMe : (fields) =>
    apiFetch('/auth/me', { method: 'PATCH', body: fields }),

  myPosts  : (limit = 3) =>
    apiFetch(`/auth/me/posts?limit=${limit}`),

  // 다른 사용자 공개 프로필(읽기전용) 및 그 사용자의 최근 게시물
  getUser      : (id) =>
    apiFetch(`/users/${id}`),

  getUserPosts : (id, limit = 3) =>
    apiFetch(`/users/${id}/posts?limit=${limit}`),

  // ── OAuth (social login) ──────────────────────────
  // 1단계: Supabase access_token으로 신원 확인.
  // 응답: 기존 유저면 {token, user}, 신규 유저면 {needs_username: true}
  oauthLogin : (accessToken) =>
    apiFetch('/auth/oauth', { method: 'POST', body: { access_token: accessToken } }),

  // 2단계: 신규 유저가 username 정하면 가입 완료. 응답: {token, user}
  oauthRegister : (accessToken, username) =>
    apiFetch('/auth/oauth/register', {
      method: 'POST',
      body: { access_token: accessToken, username },
    }),

  // ── Home ──────────────────────────────────────────
  getHome  : () =>
    apiFetch('/home'),

  // ── Issues ────────────────────────────────────────
  getIssue : (id, sort = 'top') =>
    apiFetch(`/issues/${id}?sort=${sort}`),

  // ── Posts ─────────────────────────────────────────
  getPost    : (id) =>
    apiFetch(`/posts/${id}`),

  createPost : (issueId, title, content) =>
    apiFetch(`/issues/${issueId}/posts`, { method: 'POST', body: { title, content } }),

  updatePost : (id, title, content) =>
    apiFetch(`/posts/${id}`, { method: 'PUT', body: { title, content } }),

  deletePost : (id) =>
    apiFetch(`/posts/${id}`, { method: 'DELETE' }),

  // ── Votes (toggle) ────────────────────────────────
  // Single endpoint: same value cancels, opposite value switches.
  votePost   : (id, value) =>
    apiFetch(`/posts/${id}/votes`, { method: 'POST', body: { value } }),

  // ── Comments ──────────────────────────────────────
  // parentId is null for top-level comments, comment_id for 1-depth replies.
  createComment : (postId, content, parentId = null) =>
    apiFetch(`/posts/${postId}/comments`, {
      method: 'POST',
      body: { content, parent_id: parentId },
    }),

  deleteComment : (id) =>
    apiFetch(`/comments/${id}`, { method: 'DELETE' }),

  // ── Comment Likes (toggle) ────────────────────────
  toggleCommentLike : (id) =>
    apiFetch(`/comments/${id}/likes`, { method: 'POST' }),

  // ── Admin ─────────────────────────────────────────
  adminGetPendingIssues : () =>
    apiFetch('/admin/issues?status=pending'),

  adminApproveIssue : (id) =>
    apiFetch(`/admin/issues/${id}`, { method: 'PATCH', body: { status: 'published' } }),

  adminRejectIssue : (id) =>
    apiFetch(`/admin/issues/${id}`, { method: 'DELETE' }),
  adminRegenerateIssues : (force = false) =>
    apiFetch('/admin/regenerate-issues', { method: 'POST', body: { force } })
};