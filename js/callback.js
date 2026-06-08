// =====================================================
// What'sToday · callback.js — OAuth Callback Handler
// =====================================================

renderNav({ activePage: 'home', container: document.getElementById('navContainer') });
renderFooter(document.getElementById('footerContainer'));

const statusBox     = document.getElementById('statusBox');
const errorBox      = document.getElementById('errorMsg');
const usernameModal = document.getElementById('usernameModal');
const usernameInput = document.getElementById('username');
const usernameBtn   = document.getElementById('usernameBtn');

// 로그인 성공 후 돌아갈 곳 (login.js가 redirectTo에 실어 보낸 next)
const next = new URLSearchParams(window.location.search).get('next');

function showError(msg) {
  statusBox.style.display = 'none';
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
}

// 자체 JWT 저장 → 기존 이메일/비번 로그인과 100% 동일하게 처리
function finishLogin({ token, user }) {
  localStorage.setItem('wt_token', token);
  Auth.setUser(user);
  showToast('Logged in!');
  setTimeout(() => {
    window.location.href = next ? decodeURIComponent(next) : 'index.html';
  }, 600);
}

// 페이지 진입 시 자동 실행: Supabase 세션에서 access_token 꺼냄
async function handleCallback() {
  // Supabase가 redirect로 돌아온 직후 세션을 만들어줌
  const { data: { session } } = await sb.auth.getSession();

  if (!session) {
    showError('Sign-in failed. Please try again.');
    return;
  }

  const accessToken = session.access_token;

  try {
    // 1단계: 신원 확인
    const res = await API.oauthLogin(accessToken);

    if (res.needs_username) {
      // 신규 유저 → 모달 띄우고, 같은 accessToken을 2단계용으로 보관
      statusBox.style.display = 'none';
      usernameModal.style.display = 'block';
      usernameInput.focus();
      setupUsernameSubmit(accessToken);
    } else {
      // 기존 유저 → 바로 로그인 완료
      finishLogin(res);
    }
  } catch (err) {
    // 401 INVALID_OAUTH_TOKEN / OAUTH_EMAIL_REQUIRED / 503 OAUTH_NOT_CONFIGURED 등
    if (err.code === 'OAUTH_EMAIL_REQUIRED') {
      showError('Your GitHub email is private. Make it public and try again.');
    } else {
      showError(err.message || 'Sign-in failed. Please try again.');
    }
  }
}

// 2단계: 모달에서 username 제출
function setupUsernameSubmit(accessToken) {
  async function submitUsername() {
    const username = usernameInput.value.trim();

    // 클라이언트 검증 (BE 규칙과 동일: 3-20자, 영문/숫자/_)
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
      showUsernameError('3-20 characters: letters, numbers, underscore only.');
      return;
    }

    usernameBtn.disabled = true;
    try {
      const res = await API.oauthRegister(accessToken, username);
      finishLogin(res);
    } catch (err) {
      usernameBtn.disabled = false;
      if (err.status === 409) {
        showUsernameError('That username is taken. Try another.');
      } else if (err.code === 'INVALID_OAUTH_TOKEN') {
        // 모달 오래 방치 → 토큰 만료. OAuth부터 다시.
        showError('Session expired. Please sign in again.');
      } else {
        showUsernameError(err.message || 'Could not create account.');
      }
    }
  }

  usernameBtn.addEventListener('click', submitUsername);
  usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitUsername();
  });
}

// 모달 안에서 쓰는 에러 표시 (모달은 그대로 두고 에러만)
function showUsernameError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
}

handleCallback();   