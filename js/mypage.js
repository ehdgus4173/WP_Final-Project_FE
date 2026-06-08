// =====================================================
// What'sToday · mypage.js — User Profile Page
// Own page (?id absent or = my id): editable.
// Another user's page (?id = other): read-only.
// =====================================================

renderNav({
  activePage: 'mypage',
  container: document.getElementById('navContainer'),
});
renderFooter(document.getElementById('footerContainer'));

const container = document.getElementById('myPageContainer');

// ─── Who are we viewing? ─────────────────────────────
const viewId = new URLSearchParams(window.location.search).get('id');
const currentUser = Auth.getUser();
const isOwn = !viewId || (currentUser && String(viewId) === String(currentUser.id));
const canEdit = !!isOwn && !!currentUser;

// Only the OWN page requires login. Other users' pages are public read-only.
if (!viewId && !currentUser) {
  window.location.href = 'login.html?next=' + encodeURIComponent(window.location.href);
}

// ─── State ───────────────────────────────────────────
let me = null;
let currentPosts = [];

// ─── Load profile + recent posts ─────────────────────
async function loadMyPage() {
  try {
    const [profile, postsData] = await Promise.all([
      isOwn ? API.me() : API.getUser(viewId),
      (isOwn ? API.myPosts(3) : API.getUserPosts(viewId, 3)).catch(() => ({ posts: [] })),
    ]);
    me = profile.user;
    currentPosts = postsData.posts || [];
    renderMyPage();
  } catch (err) {
    console.error(err);
    handleAuthError(err);
    container.innerHTML = `<div class="errorState">Failed to load this page.</div>`;
  }
}

// ─── Render whole page ───────────────────────────────
function renderMyPage() {
  const initial = (me.username || me.email || '?')[0].toUpperCase();
  const hasDesc = me.description && me.description.trim().length > 0;

  container.innerHTML = `
    <div class="myPageHeader">
      <div class="avatar lg">${escapeHTML(initial)}</div>
      <h1 class="myPageName">${escapeHTML(me.username)}</h1>
    </div>

    <div class="fieldBlock">
      <div class="fieldLabel">username</div>
      <div class="fieldRow" id="usernameRow">${usernameViewHTML()}</div>
    </div>

    <div class="fieldBlock">
      <div class="fieldLabel">email</div>
      <div class="fieldRow">
        <div class="fieldValue readonly">${escapeHTML(me.email || '')}</div>
      </div>
    </div>

    <div class="fieldBlock">
      <div class="fieldLabel">Description</div>
      <div class="descRow" id="descRow">${descViewHTML(hasDesc)}</div>
    </div>

    <div class="fieldBlock">
      <div class="fieldLabel">Recent published</div>
      <div class="recentBox">${renderRecentPosts(currentPosts)}</div>
    </div>
  `;

  if (canEdit) bindViewHandlers();
}

// ─── Username row (view / edit) ──────────────────────
function usernameViewHTML() {
  const editBtn = canEdit
    ? `<button class="editBtn" id="editUsernameBtn" title="Edit username" aria-label="Edit username">✎</button>`
    : '';
  return `<div class="fieldValue">${escapeHTML(me.username)}</div>${editBtn}`;
}

function editUsername() {
  const row = document.getElementById('usernameRow');
  row.innerHTML = `
    <input class="fieldInput" id="usernameInput" type="text" maxlength="20"
           value="${escapeHTML(me.username)}" />
    <button class="saveBtn" id="saveUsernameBtn">Save</button>
    <button class="cancelBtn" id="cancelUsernameBtn">Cancel</button>
  `;
  const input = document.getElementById('usernameInput');
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  document.getElementById('saveUsernameBtn').addEventListener('click', saveUsername);
  document.getElementById('cancelUsernameBtn').addEventListener('click', renderMyPage);
}

async function saveUsername() {
  const input = document.getElementById('usernameInput');
  const value = input.value.trim();

  if (!/^[A-Za-z0-9_]{3,20}$/.test(value)) {
    showToast('Username must be 3–20 chars (letters, numbers, _)');
    return;
  }
  if (value === me.username) {
    renderMyPage();
    return;
  }

  const btn = document.getElementById('saveUsernameBtn');
  btn.disabled = true;

  try {
    const { user } = await API.updateMe({ username: value });
    me = user;
    syncStoredUser();
    showToast('Username updated');
    renderMyPage();
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    if ((err.code || '') === 'USERNAME_TAKEN' || /taken/i.test(err.message)) {
      showToast('That username is already taken');
    } else {
      handleAuthError(err) || showToast('Failed to update username');
    }
  }
}

// ─── Description block (view / edit) ─────────────────
function descViewHTML(hasDesc) {
  const text = hasDesc
    ? escapeHTML(me.description)
    : (canEdit ? 'Add a short description about yourself…' : 'No description yet.');
  const editBtn = canEdit
    ? `<button class="editBtn" id="editDescBtn" title="Edit description" aria-label="Edit description">✎</button>`
    : '';
  return `<div class="descValue ${hasDesc ? '' : 'empty'}">${text}</div>${editBtn}`;
}

function editDescription() {
  const row = document.getElementById('descRow');
  row.innerHTML = `
    <textarea class="descInput" id="descInput" rows="5" maxlength="500"
              placeholder="Write something about yourself…">${escapeHTML(me.description || '')}</textarea>
    <div class="descActions">
      <button class="saveBtn" id="saveDescBtn">Save</button>
      <button class="cancelBtn" id="cancelDescBtn">Cancel</button>
    </div>
  `;
  const ta = document.getElementById('descInput');
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);

  document.getElementById('saveDescBtn').addEventListener('click', saveDescription);
  document.getElementById('cancelDescBtn').addEventListener('click', renderMyPage);
}

async function saveDescription() {
  const ta = document.getElementById('descInput');
  const value = ta.value.trim();

  const btn = document.getElementById('saveDescBtn');
  btn.disabled = true;

  try {
    const { user } = await API.updateMe({ description: value });
    me = user;
    showToast('Description saved');
    renderMyPage();
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    handleAuthError(err) || showToast('Failed to save description');
  }
}

// ─── Recent posts ────────────────────────────────────
function renderRecentPosts(posts) {
  if (!posts || posts.length === 0) {
    return `<div class="emptyState">No posts published yet.</div>`;
  }
  return posts.map(p => `
    <a class="recentItem" href="post.html?id=${p.id}">
      <span class="recentTitle">${escapeHTML(p.title)}</span>
      <span class="recentMeta">${formatDateShort(p.created_at)} · ▲ ${p.score ?? 0} · 💬 ${p.comment_count ?? 0}</span>
    </a>
  `).join('');
}

// ─── Helpers ─────────────────────────────────────────
function bindViewHandlers() {
  const editU = document.getElementById('editUsernameBtn');
  if (editU) editU.addEventListener('click', editUsername);
  const editD = document.getElementById('editDescBtn');
  if (editD) editD.addEventListener('click', editDescription);
}

// Keep the stored session user in sync so the nav (and other pages) reflect edits.
function syncStoredUser() {
  const stored = Auth.getUser() || {};
  Auth.setUser({ ...stored, username: me.username, description: me.description });
  renderNav({ activePage: 'mypage', container: document.getElementById('navContainer') });
}

// Returns true if it handled an auth/session error (and is redirecting).
function handleAuthError(err) {
  const msg = err.message || '';
  const code = err.code || '';
  if (code === 'INVALID_TOKEN' || code === 'UNAUTHORIZED' ||
      err.status === 401 || /unauthorized|invalid token/i.test(msg)) {
    Auth.logout();
    showToast('Session expired. Please log in again.');
    setTimeout(() => {
      window.location.href = 'login.html?next=' + encodeURIComponent(window.location.href);
    }, 1200);
    return true;
  }
  return false;
}

// ─── Init ────────────────────────────────────────────
loadMyPage();
