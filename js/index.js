// =====================================================
// What'sToday · index.js — Home Page
// =====================================================

// ─── Render nav + footer ─────────────────────────────
renderNav({
  activePage: 'home',
  container: document.getElementById('navContainer'),
});
renderFooter(document.getElementById('footerContainer'));

// ─── Load home data ──────────────────────────────────
async function loadHome() {
  try {
    const data = await API.getHome();
    renderToday(data.today);
    renderArchive(data.past);
  } catch (err) {
    console.error(err);
    document.getElementById('todayContent').innerHTML =
      `<div class="errorState">Failed to load today's issue.</div>`;
    document.getElementById('archiveContent').innerHTML =
      `<div class="errorState">Failed to load past issues.</div>`;
  }
}

// ─── Render today's featured issue ───────────────────
function renderToday(issue) {
  const el = document.getElementById('todayContent');

  if (!issue) {
    el.innerHTML = `<div class="emptyState">No issue today.</div>`;
    return;
  }

  el.innerHTML = `
    <div class="todayFeatured" onclick="window.location='board.html?id=${issue.id}'">
      <div class="todayFeaturedLabel">What's Today</div>
      <div class="todayFeaturedTitle">${escapeHTML(issue.title)}</div>
      <div class="todayFeaturedSummary">${escapeHTML(issue.summary || '')}</div>
      <div class="todayFeaturedMeta">💬 ${issue.post_count ?? 0} posts</div>
    </div>
  `;
}

// ─── Placeholder for archive (next commit) ───────────
function renderArchive(issues) {
  document.getElementById('archiveContent').innerHTML = '';
}

// ─── Init ────────────────────────────────────────────
loadHome();