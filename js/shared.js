// =====================================================
// What'sToday · shared.js — Shared Utilities
// =====================================================

// ─── Auth State (localStorage) ───────────────────────
const Auth = {
  getUser   : () => {
    try { return JSON.parse(localStorage.getItem('wt_user')); } catch { return null; }
  },
  setUser   : (user) => localStorage.setItem('wt_user', JSON.stringify(user)),
  logout    : () => {
    localStorage.removeItem('wt_user');
    localStorage.removeItem('wt_token');
  },
  isLoggedIn: () => !!Auth.getUser(),
};

// ─── Toast ───────────────────────────────────────────
function showToast(msg, duration = 2500) {
  let el = document.getElementById('globalToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'globalToast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), duration);
}

// ─── Escape HTML (XSS prevention) ────────────────────
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Date Formatting ─────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}