// =====================================================
// What'sToday · login.js — Login Page
// =====================================================

renderNav({ activePage: 'home', container: document.getElementById('navContainer') });
renderFooter(document.getElementById('footerContainer'));

// 이미 로그인된 상태면 홈으로 (페이지 진입 즉시 체크)
if (Auth.isLoggedIn()) {
  window.location.href = 'index.html';
}

const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn      = document.getElementById('loginBtn');
const errorBox      = document.getElementById('errorMsg');

async function handleLogin() {
  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  // 빈값 검증 (form 태그 안 쓰므로 required 대신 JS로 직접)
  if (!email || !password) {
    showError('Please enter both email and password.');
    return;
  }

  loginBtn.disabled = true;
  try {
    // apiFetch already unwraps { success, data } and returns the data payload directly.
    // So the response is already { token, user }.
    const { token, user } = await API.login(email, password);

    localStorage.setItem('wt_token', token);  // JWT를 wt_token 키에 직접 저장
    Auth.setUser(user);                        // user는 setUser가 wt_user에 저장

    showToast('Logged in!');

    // ?next= 있으면 그쪽으로, 없으면 홈 (handleVote와 동일 패턴)
    const next = new URLSearchParams(window.location.search).get('next');
    setTimeout(() => {
      window.location.href = next ? decodeURIComponent(next) : 'index.html';
    }, 600);
  } catch (err) {
    // API.login 실패 시 throw → 여기서 잡음
    // 명세 에러: 400 VALIDATION_ERROR / 401 INVALID_CREDENTIALS / 429 RATE_LIMIT_EXCEEDED
    showError(err.message || 'Login failed. Check your email and password.');
    loginBtn.disabled = false;
  }
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
}

loginBtn.addEventListener('click', handleLogin);

// Enter키로도 제출 (form 안 쓰므로 keydown 직접 추가)
[emailInput, passwordInput].forEach((el) =>
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  })
);

// ── 소셜 로그인 ──────────────────────────────────────
// 버튼 누르면 Supabase가 Google/GitHub로 보냄 → 로그인 후 callback.html로 복귀.
// next 파라미터는 callback이 받을 수 있게 redirectTo 쿼리로 넘김.
async function handleOAuth(provider) {
  const next = new URLSearchParams(window.location.search).get('next');
  const callbackUrl = `${location.origin}/callback.html${next ? '?next=' + encodeURIComponent(next) : ''}`;

  await sb.auth.signInWithOAuth({
    provider,                                  // 'google' | 'github'
    options: { redirectTo: callbackUrl },
  });
  // 이 줄 이후 브라우저가 외부로 이동하므로 여기 코드는 사실상 실행 안 됨
}

document.getElementById('googleBtn').addEventListener('click', () => handleOAuth('google'));
document.getElementById('githubBtn').addEventListener('click', () => handleOAuth('github'));