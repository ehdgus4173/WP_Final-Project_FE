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

// ─── Nav ─────────────────────────────────────────────
function renderNav({ activePage = 'home', container }) {
  if (!container) return;
  const user = Auth.getUser();

  const authHTML = user
    ? `<div class="avatar sm">${escapeHTML((user.username || user.email)[0].toUpperCase())}</div>
       <span style="font-weight:500">${escapeHTML(user.username || user.email)}</span>
       <button class="ghostBtn" onclick="handleLogout()">Log out</button>`
    : `<a href="login.html" class="ghostBtn">Log in</a>
       <a href="register.html" class="primaryBtn">Sign up</a>`;

  // Admins see Admin; other logged-in users see MyPage in the same slot.
  let sectionLink = '';
  if (user && user.role === 'admin') {
    sectionLink = `<a href="admin.html" class="${activePage === 'admin' ? 'active' : ''}">Admin</a>`;
  } else if (user) {
    sectionLink = `<a href="mypage.html" class="${activePage === 'mypage' ? 'active' : ''}">MyPage</a>`;
  }

  container.innerHTML = `
    <header class="siteNav">
      <a href="index.html" class="siteLogo">What'sToday</a>
      <nav class="navMenu">
        <a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
        ${sectionLink}
      </nav>
      <span class="navSpacer"></span>
      <div class="navRight">
        ${authHTML}
      </div>
    </header>
  `;
}

function handleLogout() {
  Auth.logout();
  showToast('Logged out');
  setTimeout(() => window.location.href = 'index.html', 800);
}

// ─── Footer ──────────────────────────────────────────
function renderFooter(container) {
  container.innerHTML = `
    <footer class="siteFooter">
      <div class="footerInner">
        <div class="footerCol">
          <h4 class="footerHeading">What'sToday</h4>
          <p class="footerText">
            AI-curated daily issues.<br>
            Real conversations.
          </p>
        </div>

        <div class="footerCol">
          <h4 class="footerHeading">Project</h4>
          <ul class="footerLinks">
            <li><a href="https://github.com/ehdgus4173/WP_Final-Project_FE" target="_blank" rel="noopener">Frontend Repo</a></li>
            <li><a href="https://github.com/ehdgus4173/WP_Final-Projcet_BE" target="_blank" rel="noopener">Backend Repo</a></li>
            <li><a href="https://wp-final-projcet-be.onrender.com/api/docs" target="_blank" rel="noopener">API Docs</a></li>
          </ul>
        </div>

        <div class="footerCol">
          <h4 class="footerHeading">Team</h4>
          <ul class="footerLinks">
            <li>Kim Shin-woo</li>
            <li>Hong Jun-su</li>
            <li>Lim Dong-hyun</li>
            <li>Kim Byung-chan</li>
          </ul>
        </div>

        <div class="footerCol">
          <h4 class="footerHeading">Course</h4>
          <p class="footerText">
            Web Programming<br>
            SeoulTech
          </p>
        </div>
      </div>

      <div class="footerBottom">
        © 2026 What'sToday
      </div>
    </footer>
  `;
}

// ─── Post Row Template ───────────────────────────────
// Renders a clickable post summary row for the board page.
// post: { id, title, content, author_username, created_at, comment_count, vote_score }
// isOwn: true if the logged-in user authored this post
function postRowHTML({ post, isOwn = false }) {
  const snippet = post.body_preview ? escapeHTML(post.body_preview) : '';
  const username = post.author?.username || 'Unknown';
  const initial = username[0].toUpperCase();
  const score = post.score ?? 0;
  return `
    <div class="postRow">
      <div class="voteCol">
        <button class="voteBtn up" onclick="handleVote(event, this, 1, ${post.id})">▲</button>
        <span class="voteScore">${score}</span>
        <button class="voteBtn down" onclick="handleVote(event, this, -1, ${post.id})">▼</button>
      </div>
      <div onclick="window.location='post.html?id=${post.id}'" style="cursor:pointer;min-width:0">
        <div class="postMeta">
          <div class="avatar sm">${escapeHTML(initial)}</div>
          <strong>${escapeHTML(username)}</strong>
          <span>·</span>
          <span>${formatDateShort(post.created_at)}</span>
          ${isOwn ? '<span class="tag" style="font-size:11px;padding:1px 6px">You</span>' : ''}
        </div>
        <div class="postTitle">${escapeHTML(post.title)}</div>
        ${snippet ? `<div class="postSnippet">${snippet}</div>` : ''}
        <div class="postStats">
          <span>💬 ${post.comment_count ?? 0} comments</span>
        </div>
      </div>
    </div>
  `;
}

// ─── Vote Handler ────────────────────────────────────
async function handleVote(e, btn, value, postId) {
  e.stopPropagation();
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html?next=' + encodeURIComponent(window.location.href);
    return;
  }
  const col = btn.closest('.voteCol') || btn.closest('.postDetailVote');
  const upBtn   = col.querySelector('.voteBtn.up');
  const downBtn = col.querySelector('.voteBtn.down');
  const scoreEl = col.querySelector('.voteScore');

  const alreadyActive = btn.classList.contains('active');
  const wasOpposite = !alreadyActive && (value === 1 ? downBtn : upBtn).classList.contains('active');

  // Optimistic UI update
  upBtn.classList.remove('active');
  downBtn.classList.remove('active');

  try {
    // Backend toggles automatically: same value cancels, opposite switches.
    await API.votePost(postId, value);

    if (alreadyActive) {
      // Same vote → cancelled
      scoreEl.textContent = parseInt(scoreEl.textContent) + (value === 1 ? -1 : 1);
    } else {
      btn.classList.add('active');
      const delta = value === 1 ? (wasOpposite ? 2 : 1) : (wasOpposite ? -2 : -1);
      scoreEl.textContent = parseInt(scoreEl.textContent) + delta;
    }
  } catch {
    showToast('Please log in to vote');
  }
}