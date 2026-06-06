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
    renderComments(currentComments);
    setupCommentForm();
  } catch (err) {
    console.error(err);
    document.getElementById('postContainer').innerHTML =
      `<div class="errorState">Failed to load post.</div>`;
    // Hide comment section entirely — no post = no comments to show
    document.getElementById('commentsSection').style.display = 'none';
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

// ─── Render comment list (tree structure) ────────────
function renderComments(comments) {
  const listEl = document.getElementById('commentList');

  if (!comments || comments.length === 0) {
    listEl.innerHTML = `<div class="emptyState">No comments yet. Start the discussion!</div>`;
    return;
  }

  // Build parent-child map: parents (depth 0) with their replies (depth 1)
  const parents = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);

  const repliesByParent = {};
  replies.forEach(r => {
    if (!repliesByParent[r.parent_id]) repliesByParent[r.parent_id] = [];
    repliesByParent[r.parent_id].push(r);
  });

  listEl.innerHTML = parents.map(parent => {
    const childReplies = repliesByParent[parent.id] || [];
    return `
      ${renderCommentHTML(parent)}
      ${childReplies.map(reply => renderCommentHTML(reply, true)).join('')}
    `;
  }).join('');
}

// ─── Single comment template ─────────────────────────
function renderCommentHTML(comment, isReply = false) {
  const user = Auth.getUser();
  const username = comment.author?.username || 'Unknown';
  const isOwn = user && user.id === comment.author?.id;

  const likedClass = comment.liked_by_me ? 'active' : '';
  const likeCount = comment.like_count ?? 0;

  return `
    <div class="commentItem ${isReply ? 'reply' : ''}" data-comment-id="${comment.id}">
      <div class="commentMeta">
        <strong>${escapeHTML(username)}</strong>
        <span>·</span>
        <span>${formatDateShort(comment.created_at)}</span>
        ${isOwn ? `<button class="deleteCommentBtn" onclick="handleDeleteComment(${comment.id})">delete</button>` : ''}
      </div>
      <div class="commentBody">${escapeHTML(comment.content)}</div>
      <div class="commentActions">
        <button class="commentLikeBtn ${likedClass}" onclick="handleCommentLike(${comment.id}, this)">
          ♥ <span class="likeCount">${likeCount}</span>
        </button>
        ${!isReply ? `<button class="replyBtn" onclick="handleReply(${comment.id}, '${escapeHTML(username)}')">Reply</button>` : ''}
      </div>
    </div>
  `;
}

// ─── Comment action handlers (placeholders for next commits) ───
async function handleDeleteComment(commentId) {
  if (!confirm('Delete this comment?')) return;
  try {
    await API.deleteComment(commentId);
    showToast('Comment deleted');
    setTimeout(() => window.location.reload(), 600);
  } catch (err) {
    console.error(err);
    showToast('Failed to delete');
  }
}

async function handleCommentLike(commentId, btn) {
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html?next=' + encodeURIComponent(window.location.href);
    return;
  }
  const countEl = btn.querySelector('.likeCount');
  const wasLiked = btn.classList.contains('active');

  // Optimistic UI
  btn.classList.toggle('active');
  countEl.textContent = parseInt(countEl.textContent) + (wasLiked ? -1 : 1);

  try {
    await API.toggleCommentLike(commentId);
  } catch (err) {
    // Revert on failure
    btn.classList.toggle('active');
    countEl.textContent = parseInt(countEl.textContent) + (wasLiked ? 1 : -1);
    showToast('Failed to like');
  }
}

function handleReply(parentId, username) {
  // Placeholder — implemented in next commit
  showToast('Reply feature coming next');
}

// ─── Setup comment write form ────────────────────────
function setupCommentForm() {
  const container = document.getElementById('commentFormContainer');

  if (!Auth.isLoggedIn()) {
    container.innerHTML = `
      <a href="login.html?next=${encodeURIComponent(window.location.href)}"
         class="loginToCommentBox">
        sign in to comment
      </a>
    `;
    return;
  }

  container.innerHTML = `
    <form id="commentForm" class="commentForm">
      <textarea id="commentInput"
                placeholder="Add a comment…"
                rows="3"
                maxlength="1000"
                required></textarea>
      <button type="submit" class="accentBtn">Post comment</button>
    </form>
  `;

  document.getElementById('commentForm').addEventListener('submit', handleCommentSubmit);
}

// ─── Handle comment submit ───────────────────────────
async function handleCommentSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('commentInput');
  const content = input.value.trim();

  if (content.length < 2) {
    showToast('Comment is too short (min 2 characters)');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    await API.createComment(postId, content);
    showToast('Comment posted');
    input.value = '';
    // Reload to fetch fresh comments
    setTimeout(() => window.location.reload(), 500);
  } catch (err) {
    console.error(err);
    showToast('Failed to post comment');
    submitBtn.disabled = false;
  }
}

// ─── Init ────────────────────────────────────────────
loadPost();