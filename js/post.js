// =====================================================
// What'sToday · post.js — Post Detail Page
// =====================================================

// ─── Read post id from URL ───────────────────────────
const postId = new URLSearchParams(window.location.search).get('id');

// ─── Render nav + footer ─────────────────────────────
renderNav({
  activePage: 'home',
  container: document.getElementById('navContainer'),
});
renderFooter(document.getElementById('footerContainer'));

// ─── State ───────────────────────────────────────────
let currentPost = null;
let currentComments = [];

// ─── Load post data ──────────────────────────────────
async function loadPost() {
  if (!postId) {
    document.getElementById('postContainer').innerHTML =
      `<div class="errorState">Missing post id.</div>`;
    return;
  }

  try {
    const data = await API.getPost(postId);
    currentPost = data.post;
    currentComments = data.comments || [];

    renderPost(currentPost);
    renderBackLink(currentPost);
    setupOwnerActions(currentPost);
    renderCommentCount(currentComments.length);
  } catch (err) {
    console.error(err);
    document.getElementById('postContainer').innerHTML =
      `<div class="errorState">Failed to load post.</div>`;
  }
}

// ─── Render post body ────────────────────────────────
function renderPost(post) {
  const el = document.getElementById('postContainer');

  if (!post) {
    el.innerHTML = `<div class="emptyState">Post not found.</div>`;
    return;
  }

  document.title = `${post.title} · What's Today`;

  const username = post.author?.username || 'Unknown';
  const initial = username[0].toUpperCase();

  const userVote = post.user_vote ?? 0;  // 1, -1, or 0
  const upActive   = userVote === 1  ? 'active' : '';
  const downActive = userVote === -1 ? 'active' : '';

  el.innerHTML = `
    <div class="postDetailMeta">
      <div class="avatar sm">${escapeHTML(initial)}</div>
      <strong>${escapeHTML(username)}</strong>
      <span>·</span>
      <span>${formatDate(post.created_at)}</span>
      ${post.updated_at ? '<span class="tag" style="font-size:11px">edited</span>' : ''}
    </div>
    <h1 class="postDetailTitle">${escapeHTML(post.title)}</h1>
    <div class="postDetailBody">${escapeHTML(post.content || '')}</div>

    <div class="postDetailVote">
      <button class="voteBtn up ${upActive}" onclick="handleVote(event, this, 1, ${post.id})">▲</button>
      <span class="voteScore">${post.score ?? 0}</span>
      <button class="voteBtn down ${downActive}" onclick="handleVote(event, this, -1, ${post.id})">▼</button>
    </div>
  `;
}

// ─── Render back link with issue title ───────────────
function renderBackLink(post) {
  if (!post.issue_id) return;
  const link = document.getElementById('backLink');
  link.href = `board.html?id=${post.issue_id}`;
  if (post.issue_title) {
    link.textContent = `← ${post.issue_title}`;
  }
}

// ─── Setup owner actions (Edit / Delete) ─────────────
function setupOwnerActions(post) {
  const user = Auth.getUser();
  if (!user || user.id !== post.author?.id) return;

  const actions = document.getElementById('postActions');
  const editLink = document.getElementById('editLink');
  const deleteBtn = document.getElementById('deleteBtn');

  editLink.href = `write.html?postId=${post.id}&issueId=${post.issue_id}`;

  deleteBtn.addEventListener('click', async () => {
    if (!confirm('Delete this post permanently?')) return;
    try {
      await API.deletePost(post.id);
      showToast('Post deleted');
      setTimeout(() => window.location.href = `board.html?id=${post.issue_id}`, 800);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete');
    }
  });

  actions.style.display = 'flex';
}

//