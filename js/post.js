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
    setupCommentListDelegation();
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
  const isOwner = user && String(user.id) === String(post.author?.id);
  const isAdmin = user && user.role === 'admin';
  if (!isOwner && !isAdmin) return;

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
// ─── Render comment count ────────────────────────────
function renderCommentCount(count) {
  const el = document.getElementById('commentCount');
  if (el) el.textContent = `${count} Comment${count === 1 ? '' : 's'}`;
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
  const isOwn = user && String(user.id) === String(comment.author?.id);
  const isAdmin = user && user.role === 'admin';
  const canDelete = isOwn || isAdmin;

  const likedClass = comment.liked_by_me ? 'active' : '';
  const likeCount = comment.like_count ?? 0;

  const parentAttr = comment.parent_id != null ? comment.parent_id : '';

  return `
    <div class="commentItem ${isReply ? 'reply' : ''}" data-comment-id="${comment.id}" data-username="${escapeHTML(username)}" data-parent-id="${parentAttr}">
      <div class="commentMeta">
        <strong class="commentAuthor"
                data-username="${escapeHTML(username)}"
                data-is-reply="${isReply ? '1' : '0'}"
                data-parent-id="${parentAttr}">${escapeHTML(username)}</strong>
        <span>·</span>
        <span>${formatDateShort(comment.created_at)}</span>
        ${canDelete ? `<button class="deleteCommentBtn" onclick="handleDeleteComment(${comment.id})">delete</button>` : ''}
      </div>
      <div class="commentBody">${linkifyMentions(escapeHTML(comment.content))}</div>
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
    removeCommentFromDOM(commentId);
    showToast('Comment deleted');
  } catch (err) {
    console.error(err);
    showToast('Failed to delete');
  }
}

// ─── Remove comment from DOM ────────────────────────
function removeCommentFromDOM(commentId) {
  const listEl = document.getElementById('commentList');

  // Find the comment element
  const commentEl = listEl.querySelector(`[data-comment-id="${commentId}"]`);
  if (!commentEl) return;

  // If this is a parent comment, also remove its replies
  const deletedComment = currentComments.find(c => c.id == commentId);
  const isParent = deletedComment && !deletedComment.parent_id;

  // Collect IDs to remove
  const idsToRemove = [commentId];
  if (isParent) {
    // Find all child replies of this parent
    currentComments
      .filter(c => c.parent_id == commentId)
      .forEach(reply => idsToRemove.push(reply.id));
  }

  // Remove from DOM
  idsToRemove.forEach(id => {
    const el = listEl.querySelector(`[data-comment-id="${id}"]`);
    if (el) el.remove();
  });

  // Remove from state
  currentComments = currentComments.filter(c => !idsToRemove.includes(c.id));

  // Update count
  renderCommentCount(currentComments.length);

  // If no comments left, show empty state
  if (currentComments.length === 0) {
    listEl.innerHTML = `<div class="emptyState">No comments yet. Start the discussion!</div>`;
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

// parentId: comment thread the reply attaches to (always a depth-0 parent).
// username: shown in the "Replying to @…" header.
// prefillMention: if set, the textarea is pre-filled with "@<name> " (YouTube-style).
function handleReply(parentId, username, prefillMention) {
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html?next=' + encodeURIComponent(window.location.href);
    return;
  }

  const existing = document.querySelector('.inlineReplyForm');
  if (existing) existing.remove();

  const parentEl = document.querySelector(`[data-comment-id="${parentId}"]`);
  if (!parentEl) return;

  const prefill = prefillMention ? `@${prefillMention} ` : '';

  const formHTML = `
    <div class="inlineReplyForm" data-parent-id="${parentId}">
      <div class="inlineReplyHeader">
        Replying to <strong>@${escapeHTML(username)}</strong>
        <button type="button" class="cancelReplyBtn" onclick="cancelInlineReply()">× cancel</button>
      </div>
      <textarea class="inlineReplyInput"
                placeholder="Write your reply…"
                rows="2"
                maxlength="1000">${escapeHTML(prefill)}</textarea>
      <button type="button" class="accentBtn smallBtn" onclick="submitInlineReply(${parentId})">Post reply</button>
    </div>
  `;

  parentEl.insertAdjacentHTML('afterend', formHTML);

  const newForm = document.querySelector('.inlineReplyForm');
  const textarea = newForm.querySelector('.inlineReplyInput');
  attachMentionAutocomplete(textarea);
  textarea.focus();
  // Place caret at the end so the user types right after "@name ".
  const len = textarea.value.length;
  textarea.setSelectionRange(len, len);

  newForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ─── Nickname / @mention click behaviour ─────────────
// Delegated once on #commentList; survives re-renders since the container persists.
function setupCommentListDelegation() {
  const listEl = document.getElementById('commentList');
  if (!listEl || listEl.dataset.delegated) return;
  listEl.dataset.delegated = '1';

  listEl.addEventListener('click', (e) => {
    const author = e.target.closest('.commentAuthor');
    if (author) {
      handleAuthorClick(author);
      return;
    }
    const mention = e.target.closest('.mention');
    if (mention) {
      e.preventDefault();
      handleMentionClick(mention.dataset.username, mention.closest('.commentItem'));
    }
  });
}

// Feature 1 + 2: clicking a nickname.
//  - reply nickname  → open inline reply on its parent, pre-filled "@name "
//  - parent nickname → fill the top comment box with "@name "
function handleAuthorClick(el) {
  const username = el.dataset.username;
  const isReply = el.dataset.isReply === '1';

  if (isReply) {
    const parentId = parseInt(el.dataset.parentId);
    if (!Number.isNaN(parentId)) handleReply(parentId, username, username);
  } else {
    fillTopCommentBox(username);
  }
}

// Feature 2: append "@name " into the top-level comment box (posts as a top-level comment).
function fillTopCommentBox(username) {
  const input = document.getElementById('commentInput');
  if (!input) return; // not logged in → no top box to fill

  const mention = `@${username} `;
  if (!input.value.trim()) {
    input.value = mention;
  } else {
    input.value = input.value.replace(/\s*$/, '') + ' ' + mention;
  }

  input.focus();
  const len = input.value.length;
  input.setSelectionRange(len, len);
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Mention click: scroll to + briefly highlight the mentioned user's comment.
//  - mention inside a reply  → that user's most recent reply within the SAME
//    parent thread (falls back to the parent comment if they only authored it)
//  - mention inside a parent → that user's first comment in the whole list
function handleMentionClick(username, sourceEl) {
  const listEl = document.getElementById('commentList');
  if (!listEl) return;

  let target = null;

  // If the mention was clicked inside a reply, stay within that parent's thread.
  if (sourceEl && sourceEl.classList.contains('reply')) {
    const parentId = sourceEl.dataset.parentId;

    if (parentId) {
      // Replies of this parent authored by the mentioned user, in DOM order.
      const replies = [...listEl.querySelectorAll('.commentItem.reply')]
        .filter(el => el.dataset.parentId === parentId && el.dataset.username === username);

      // Most recent = last in the list.
      if (replies.length) {
        target = replies[replies.length - 1];
      } else {
        // No reply by them here — fall back to the parent if they wrote it.
        const parentEl = listEl.querySelector(`.commentItem[data-comment-id="${parentId}"]`);
        if (parentEl && parentEl.dataset.username === username) target = parentEl;
      }
    }
  }

  // Default / fallback: first comment in the whole list by that user.
  if (!target) {
    target = [...listEl.querySelectorAll('.commentItem')]
      .find(el => el.dataset.username === username) || null;
  }

  if (!target) {
    showToast(`@${username} is not in this thread`);
    return;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.classList.add('commentHighlight');
  setTimeout(() => target.classList.remove('commentHighlight'), 1600);
}

// Turn "@name" tokens in already-escaped comment text into clickable mention links.
function linkifyMentions(escapedText) {
  return escapedText.replace(/@([A-Za-z0-9_]+|[가-힣]+)/g, (full, name) =>
    `<a class="mention" href="javascript:void(0)" data-username="${name}">@${name}</a>`);
}

// ─── @mention autocomplete (feature 3) ───────────────
// Candidates = unique usernames among the current post's comment authors.
let mentionState = null; // { textarea, tokenStart, matches, activeIndex }

function getMentionCandidates() {
  const map = new Map(); // lowercased → original casing (dedupe, keep first)
  currentComments.forEach(c => {
    const u = c.author?.username;
    if (u && !map.has(u.toLowerCase())) map.set(u.toLowerCase(), u);
  });
  return [...map.values()];
}

function getMentionDropdown() {
  let dd = document.getElementById('mentionDropdown');
  if (!dd) {
    dd = document.createElement('div');
    dd.id = 'mentionDropdown';
    dd.className = 'mentionDropdown';
    dd.style.display = 'none';
    document.body.appendChild(dd);
  }
  return dd;
}

function closeMentionDropdown() {
  const dd = document.getElementById('mentionDropdown');
  if (dd) dd.style.display = 'none';
  mentionState = null;
}

function attachMentionAutocomplete(textarea) {
  if (textarea.dataset.mentionBound) return;
  textarea.dataset.mentionBound = '1';
  textarea.addEventListener('input', () => onMentionInput(textarea));
  textarea.addEventListener('keydown', (e) => onMentionKeydown(e, textarea));
  textarea.addEventListener('blur', () => setTimeout(closeMentionDropdown, 150));
}

function onMentionInput(textarea) {
  const caret = textarea.selectionStart;
  const before = textarea.value.slice(0, caret);
  // The active @token immediately before the caret (letters/digits/_ or Hangul).
  const match = before.match(/@([A-Za-z0-9_가-힣]*)$/);
  if (!match) { closeMentionDropdown(); return; }

  const query = match[1].toLowerCase();
  const tokenStart = caret - match[0].length; // index of the '@'
  const matches = getMentionCandidates()
    .filter(u => u.toLowerCase().startsWith(query));

  if (matches.length === 0) { closeMentionDropdown(); return; }

  mentionState = { textarea, tokenStart, matches, activeIndex: 0 };
  renderMentionDropdown(textarea, caret);
}

function renderMentionDropdown(textarea, caret) {
  const dd = getMentionDropdown();
  dd.innerHTML = mentionState.matches.map((u, i) =>
    `<div class="mentionOption${i === mentionState.activeIndex ? ' active' : ''}" data-index="${i}">@${escapeHTML(u)}</div>`
  ).join('');

  const coords = getCaretCoordinates(textarea, caret);
  const rect = textarea.getBoundingClientRect();
  dd.style.left = (rect.left + window.scrollX + coords.left) + 'px';
  dd.style.top  = (rect.top + window.scrollY + coords.top - textarea.scrollTop + coords.height) + 'px';
  dd.style.display = 'block';

  dd.querySelectorAll('.mentionOption').forEach(opt => {
    // mousedown (not click) so it fires before the textarea blur.
    opt.addEventListener('mousedown', (e) => {
      e.preventDefault();
      selectMention(parseInt(opt.dataset.index));
    });
  });
}

function selectMention(index) {
  if (!mentionState) return;
  const { textarea, tokenStart } = mentionState;
  const username = mentionState.matches[index];
  const caret = textarea.selectionStart;
  const before = textarea.value.slice(0, tokenStart);
  const after = textarea.value.slice(caret);
  const insert = `@${username} `;

  textarea.value = before + insert + after;
  const newCaret = (before + insert).length;
  closeMentionDropdown();
  textarea.focus();
  textarea.setSelectionRange(newCaret, newCaret);
}

function onMentionKeydown(e, textarea) {
  const dd = document.getElementById('mentionDropdown');
  if (!mentionState || !dd || dd.style.display === 'none') return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    mentionState.activeIndex = (mentionState.activeIndex + 1) % mentionState.matches.length;
    renderMentionDropdown(textarea, textarea.selectionStart);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    mentionState.activeIndex =
      (mentionState.activeIndex - 1 + mentionState.matches.length) % mentionState.matches.length;
    renderMentionDropdown(textarea, textarea.selectionStart);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    selectMention(mentionState.activeIndex);
  } else if (e.key === 'Escape') {
    closeMentionDropdown();
  }
}

// Caret pixel coordinates inside a textarea, via a hidden mirror element.
function getCaretCoordinates(element, position) {
  const div = document.createElement('div');
  const computed = window.getComputedStyle(element);
  const style = div.style;

  style.position = 'absolute';
  style.visibility = 'hidden';
  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';

  [
    'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
    'fontFamily', 'lineHeight', 'textAlign', 'letterSpacing', 'wordSpacing', 'tabSize'
  ].forEach(p => { style[p] = computed[p]; });

  div.textContent = element.value.slice(0, position);
  const span = document.createElement('span');
  span.textContent = element.value.slice(position) || '.';
  div.appendChild(span);

  document.body.appendChild(div);
  const lineHeight = parseInt(computed.lineHeight) || Math.round(parseInt(computed.fontSize) * 1.4);
  const coords = { top: span.offsetTop, left: span.offsetLeft, height: lineHeight };
  document.body.removeChild(div);
  return coords;
}

function cancelInlineReply() {
  const form = document.querySelector('.inlineReplyForm');
  if (form) form.remove();
}

async function submitInlineReply(parentId) {
  const form = document.querySelector('.inlineReplyForm');
  if (!form) return;

  const textarea = form.querySelector('.inlineReplyInput');
  const submitBtn = form.querySelector('button.accentBtn');
  const content = textarea.value.trim();

  if (content.length < 2) {
    showToast('Reply is too short (min 2 characters)');
    return;
  }
  if (content.length > 1000) {
    showToast('Reply is too long (max 1000 characters)');
    return;
  }

  submitBtn.disabled = true;

  try {
    const newComment = await API.createComment(postId, content, parentId);
    form.remove();
    appendNewComment(newComment);
    showToast('Reply posted');
  } catch (err) {
    console.error(err);
    handleCommentError(err);
    submitBtn.disabled = false;
  }
}

function cancelReply() {
  const input = document.getElementById('commentInput');
  const indicator = document.getElementById('replyIndicator');

  delete input.dataset.replyTo;
  input.value = '';
  indicator.style.display = 'none';
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
      <div id="replyIndicator" class="replyIndicator" style="display:none">
        <span>Replying to <strong id="replyToUsername"></strong></span>
        <button type="button" class="cancelReplyBtn" onclick="cancelReply()">× cancel</button>
      </div>
      <textarea id="commentInput"
                placeholder="Add a comment…"
                rows="3"
                maxlength="1000"
                required></textarea>
      <button type="submit" class="accentBtn">Post comment</button>
    </form>
  `;

  document.getElementById('commentForm').addEventListener('submit', handleCommentSubmit);

  const input = document.getElementById('commentInput');
  if (input) attachMentionAutocomplete(input);
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
  if (content.length > 1000) {
    showToast('Comment is too long (max 1000 characters)');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  const parentId = input.dataset.replyTo ? parseInt(input.dataset.replyTo) : null;

  try {
    const newComment = await API.createComment(postId, content, parentId);
    appendNewComment(newComment);
    input.value = '';
    delete input.dataset.replyTo;
    document.getElementById('replyIndicator').style.display = 'none';
    showToast(parentId ? 'Reply posted' : 'Comment posted');
  } catch (err) {
    console.error(err);
    handleCommentError(err);
  } finally {
    submitBtn.disabled = false;
  }
}

// ─── Append new comment to DOM ──────────────────────
function appendNewComment(comment) {
  const listEl = document.getElementById('commentList');

  // If empty state was showing, clear it first
  const emptyState = listEl.querySelector('.emptyState');
  if (emptyState) listEl.innerHTML = '';

  const isReply = !!comment.parent_id;

  if (isReply) {
    // Insert under the parent comment (after any existing replies)
    const parentEl = listEl.querySelector(`[data-comment-id="${comment.parent_id}"]`);
    if (parentEl) {
      // Find the last existing reply to this parent, or insert right after parent
      let insertAfter = parentEl;
      let sibling = parentEl.nextElementSibling;
      while (sibling && sibling.classList.contains('reply')) {
        // Walk past existing replies
        if (sibling.dataset.commentId &&
            currentComments.find(c => c.id == sibling.dataset.commentId)?.parent_id == comment.parent_id) {
          insertAfter = sibling;
        }
        sibling = sibling.nextElementSibling;
      }
      insertAfter.insertAdjacentHTML('afterend', renderCommentHTML(comment, true));
    } else {
      // Parent not found — fallback to end
      listEl.insertAdjacentHTML('beforeend', renderCommentHTML(comment, true));
    }
  } else {
    // Top-level comment → append at the end
    listEl.insertAdjacentHTML('beforeend', renderCommentHTML(comment));
  }

  // Update state + count
  currentComments.push(comment);
  renderCommentCount(currentComments.length);
}
// ─── Handle comment-related API errors ──────────────
function handleCommentError(err) {
  const msg = err.message || '';
  if (msg.includes('UNAUTHORIZED') || msg.includes('INVALID_TOKEN')) {
    Auth.logout();
    showToast('Session expired. Please log in again.');
    setTimeout(() => {
      window.location.href = 'login.html?next=' + encodeURIComponent(window.location.href);
    }, 1200);
  } else if (msg.includes('VALIDATION_ERROR')) {
    showToast('Invalid comment content');
  } else if (msg.includes('POST_NOT_FOUND')) {
    showToast('Post no longer exists');
  } else if (msg.includes('PARENT_NOT_FOUND')) {
    showToast('Reply target no longer exists');
  } else if (msg.includes('CANNOT_REPLY_TO_REPLY')) {
    showToast('Cannot reply to a reply');
  } else {
    showToast('Failed to post comment');
  }
}

// ─── Init ────────────────────────────────────────────
loadPost();