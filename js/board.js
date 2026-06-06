// =====================================================
// What'sToday · board.js — Issue Board Page
// =====================================================

// ─── Read issue id from URL ──────────────────────────
const issueId = new URLSearchParams(window.location.search).get('id');

// ─── Render nav + footer ─────────────────────────────
renderNav({
  activePage: 'home',
  container: document.getElementById('navContainer'),
});
renderFooter(document.getElementById('footerContainer'));

// ─── State ───────────────────────────────────────────
let currentSort = 'top';

// ─── Load board data ─────────────────────────────────
async function loadBoard() {
  if (!issueId) {
    document.getElementById('issueHeader').innerHTML =
      `<div class="errorState">Missing issue id.</div>`;
    return;
  }

  try {
    const data = await API.getIssue(issueId, currentSort);
    renderIssue(data.issue);
    renderPosts(data.posts);
    setupWriteBar();
  } catch (err) {
    console.error(err);
    document.getElementById('issueHeader').innerHTML =
      `<div class="errorState">Failed to load issue.</div>`;
    document.getElementById('postList').innerHTML = '';
  }
}

// ─── Render issue header ─────────────────────────────
function renderIssue(issue) {
  const el = document.getElementById('issueHeader');

  if (!issue) {
    el.innerHTML = `<div class="emptyState">Issue not found.</div>`;
    return;
  }

  document.title = `${issue.title} · What's Today`;

  el.innerHTML = `
    <div class="issueHeader">
      <span class="issueDate">${formatDate(issue.created_at)}</span>
      <h1 class="issueTitle">${escapeHTML(issue.title)}</h1>
      <p class="issueDescription">${escapeHTML(issue.summary || '')}</p>
    </div>
  `;
}

// ─── Render post list ────────────────────────────────
function renderPosts(posts) {
  const listEl = document.getElementById('postList');
  const countEl = document.getElementById('postCount');
  const toggleEl = document.getElementById('sortToggle');

  const count = posts ? posts.length : 0;
  countEl.textContent = `${count} post${count === 1 ? '' : 's'}`;

  if (!posts || posts.length === 0) {
    listEl.innerHTML = `<div class="emptyState">No posts yet. Be the first to share your thoughts.</div>`;
    return;
  }

  toggleEl.style.display = 'flex';

  const user = Auth.getUser();
  listEl.innerHTML = posts
    .map(post => postRowHTML({
      post,
      isOwn: user && user.id === post.author_id,
    }))
    .join('');
}

// ─── Setup write bar (logged-in only) ────────────────
function setupWriteBar() {
  if (!Auth.isLoggedIn()) return;
  const bar = document.getElementById('writeBar');
  const link = document.getElementById('writeLink');
  link.href = `write.html?issueId=${issueId}`;
  bar.style.display = 'flex';
}

// ─── Init ────────────────────────────────────────────
loadBoard();