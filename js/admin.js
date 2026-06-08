// =====================================================
// What'sToday · admin.js — Admin Review Page
// =====================================================

// ─── Render nav + footer ─────────────────────────────
renderNav({
  activePage: 'admin',
  container: document.getElementById('navContainer'),
});
renderFooter(document.getElementById('footerContainer'));

// ─── Admin role gate ─────────────────────────────────
const user = Auth.getUser();
if (!user) {
  // Not logged in → send to login with return path
  window.location.href = 'login.html?next=' + encodeURIComponent(window.location.href);
} else if (user.role !== 'admin') {
  // Logged in but not admin → kick to home
  showToast('Admin access required');
  setTimeout(() => window.location.href = 'index.html', 1000);
}

// ─── State ───────────────────────────────────────────
let pendingIssues = [];

// ─── Load pending issues ─────────────────────────────
async function loadPending() {
  if (!user || user.role !== 'admin') return;  // guarded

  try {
    const data = await API.adminGetPendingIssues();
    pendingIssues = data.issues || [];
    renderTodayStatus();
    renderCandidates();
  } catch (err) {
    console.error(err);
    handleAdminError(err);
  }
}

// ─── Render today's status banner ────────────────────
function renderTodayStatus() {
  const statusEl = document.getElementById('todayStatus');
  const subEl = document.getElementById('todayStatusSub');

  if (pendingIssues.length === 0) {
    statusEl.textContent = 'No pending issues';
    subEl.textContent = 'All issues are already reviewed.';
  } else {
    statusEl.textContent = `${pendingIssues.length} issue${pendingIssues.length === 1 ? '' : 's'} awaiting review`;
    subEl.textContent = 'Approve a pending candidate to publish it as today\'s issue.';
  }
}

// ─── Render candidate cards ──────────────────────────
function renderCandidates() {
  const listEl = document.getElementById('candidateList');

  if (pendingIssues.length === 0) {
    listEl.innerHTML = `<div class="emptyState">No candidates to review.</div>`;
    return;
  }

  listEl.innerHTML = pendingIssues.map(issue => `
    <div class="candidateCard" data-issue-id="${issue.id}">
      <div class="candidateMeta">
        ${formatDate(issue.created_at)} · status: ${escapeHTML(issue.status)}
      </div>
      <div class="candidateTitle">${escapeHTML(issue.title)}</div>
      <div class="candidateSummary">${escapeHTML(issue.summary || '')}</div>
      ${issue.source_url ? `
        <a href="${escapeHTML(issue.source_url)}" target="_blank" rel="noopener" class="candidateSource">
          🔗 Source
        </a>
      ` : ''}
      <div class="candidateActions">
        <button class="dangerBtn" onclick="handleReject(${issue.id})">Reject</button>
        <button class="accentBtn" onclick="handleApprove(${issue.id})">Approve & Publish</button>
      </div>
    </div>
  `).join('');
}

// ─── Approve handler ─────────────────────────────────
async function handleApprove(issueId) {
  if (!confirm('Publish this issue? It will appear on the home page immediately.')) return;

  try {
    await API.adminApproveIssue(issueId);
    showToast('Issue published');
    removeIssueFromDOM(issueId);
  } catch (err) {
    console.error(err);
    handleAdminError(err);
  }
}

// ─── Reject handler ──────────────────────────────────
async function handleReject(issueId) {
  if (!confirm('Reject and permanently delete this issue?')) return;

  try {
    await API.adminRejectIssue(issueId);
    showToast('Issue rejected');
    removeIssueFromDOM(issueId);
  } catch (err) {
    console.error(err);
    handleAdminError(err);
  }
}

// ─── Remove issue from DOM ──────────────────────────
function removeIssueFromDOM(issueId) {
  const card = document.querySelector(`[data-issue-id="${issueId}"]`);
  if (card) card.remove();

  pendingIssues = pendingIssues.filter(i => i.id != issueId);
  renderTodayStatus();

  if (pendingIssues.length === 0) {
    document.getElementById('candidateList').innerHTML =
      `<div class="emptyState">No candidates to review.</div>`;
  }
}

// ─── Error handler ──────────────────────────────────
function handleAdminError(err) {
  const code = err.code || '';
  const msg = err.message || '';

  if (code === 'UNAUTHORIZED' || msg.includes('UNAUTHORIZED') || msg.includes('INVALID_TOKEN')) {
    Auth.logout();
    showToast('Session expired');
    setTimeout(() => {
      window.location.href = 'login.html?next=' + encodeURIComponent(window.location.href);
    }, 1200);
  } else if (code === 'FORBIDDEN' || msg.includes('FORBIDDEN')) {
    showToast('Admin access required');
    setTimeout(() => window.location.href = 'index.html', 1000);
  } else if (code === 'ISSUE_NOT_FOUND' || msg.includes('ISSUE_NOT_FOUND')) {
    showToast('Issue not found (may have been deleted)');
  } else if (code === 'ALREADY_PUBLISHED' || msg.includes('ALREADY_PUBLISHED')) {
    showToast('Already published');
  } else {
    showToast('Action failed. Please try again.');
  }
}

// ─── Init ────────────────────────────────────────────
loadPending();