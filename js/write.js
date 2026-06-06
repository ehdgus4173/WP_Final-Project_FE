// =====================================================
// What'sToday · write.js — Write / Edit Page
// =====================================================

renderNav({ activePage: 'home', container: document.getElementById('navContainer') });
renderFooter(document.getElementById('footerContainer'));

// ─── URL 파라미터로 모드 구분 ────────────────────────
// 새 글:  write.html?issueId=5
// 수정:   write.html?postId=12&issueId=5
const params  = new URLSearchParams(window.location.search);
const postId  = params.get('postId');   // 있으면 수정 모드
const issueId = params.get('issueId');
const isEdit  = !!postId;

// ─── 비로그인 사용자 → 로그인 페이지로 (next에 현재 URL) ───
if (!Auth.isLoggedIn()) {
  window.location.href = 'login.html?next=' + encodeURIComponent(window.location.href);
}

// ─── DOM 참조 ────────────────────────────────────────
const writeHeading = document.getElementById('writeHeading');
const titleInput   = document.getElementById('title');
const contentInput = document.getElementById('content');
const submitBtn    = document.getElementById('submitBtn');
const cancelBtn    = document.getElementById('cancelBtn');
const errorBox     = document.getElementById('errorMsg');

// ─── 모드에 따라 화면 텍스트 변경 ─────────────────────
if (isEdit) {
  writeHeading.textContent = 'Edit Post';
  submitBtn.textContent    = 'Save Changes';
  loadPostForEdit();   // 기존 글 불러와 prefill
}

// ─── 수정 모드: 기존 글 불러오기 (prefill) ────────────
async function loadPostForEdit() {
  try {
    const res = await API.getPost(postId);
    // 통합 응답: { post: {...}, comments: [...] } → post만 사용
    const post = res.data.post;
    titleInput.value   = post.title;
    contentInput.value = post.content;
  } catch (err) {
    showError('Could not load the post to edit.');
  }
}

// ─── 제출 (작성 또는 수정) ────────────────────────────
async function handleSubmit() {
  const title   = titleInput.value.trim();
  const content = contentInput.value.trim();

  // 빈값 + 길이 검증 (명세: title 1~120자, content 20~10,000자)
  if (!title || !content) {
    showError('Please fill in both title and content.');
    return;
  }
  if (title.length > 120) {
    showError('Title must be 120 characters or less.');
    return;
  }
  if (content.length < 20) {
    showError('Content must be at least 20 characters.');
    return;
  }

  submitBtn.disabled = true;
  try {
    let res;
    if (isEdit) {
      res = await API.updatePost(postId, title, content);   // PUT /posts/:id
    } else {
      res = await API.createPost(issueId, title, content);  // POST /issues/:id/posts
    }
    // 작성·수정 둘 다 응답 data.id 로 글 id 반환 → 상세 페이지로 이동
    window.location.href = 'post.html?id=' + res.data.id;
  } catch (err) {
    // 명세 에러: 400 VALIDATION_ERROR / 401 / 403 NOT_OWNER / 404
    showError(err.message || 'Could not save the post. Please try again.');
    submitBtn.disabled = false;
  }
}

// ─── 취소 ────────────────────────────────────────────
function handleCancel() {
  if (isEdit) {
    window.location.href = 'post.html?id=' + postId;      // 수정이면 원래 글로
  } else {
    window.location.href = 'board.html?id=' + issueId;    // 새 글이면 이슈 보드로
  }
}

submitBtn.addEventListener('click', handleSubmit);
cancelBtn.addEventListener('click', handleCancel);

// Enter키로 제출 안 함 (content가 멀티라인이라 줄바꿈 필요) → title에서만
titleInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    contentInput.focus();   // Enter는 content로 포커스 이동
  }
});