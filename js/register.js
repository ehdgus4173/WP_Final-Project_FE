// =====================================================
// What'sToday · register.js — Register Page
// =====================================================

renderNav({ activePage: 'home', container: document.getElementById('navContainer') });
renderFooter(document.getElementById('footerContainer'));

// 이미 로그인된 상태면 홈으로 (페이지 진입 즉시 체크)
if (Auth.isLoggedIn()) {
  window.location.href = 'index.html';
}

const usernameInput = document.getElementById('username');
const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');
const registerBtn   = document.getElementById('registerBtn');
const errorBox      = document.getElementById('errorMsg');

async function handleRegister() {
  const username = usernameInput.value.trim();
  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  // 빈값 검증 (form 태그 안 쓰므로 required 대신 JS로 직접)
  if (!username || !email || !password) {
    showError('Please fill in all fields.');
    return;
  }
  // password 최소 8자 (클라이언트 검증)
  if (password.length < 8) {
    showError('Password must be at least 8 characters.');
    return;
  }

  registerBtn.disabled = true;
  try {
    // API.register 인자 순서: (username, email, password) — 명세 body 순서와 다름
    await API.register(username, email, password);

    // 자동 로그인 X — 가입 성공 시 로그인 페이지로 (명세 명시)
    showToast('Account created! Please log in');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 800);
  } catch (err) {
    // 명세 에러: 400 VALIDATION_ERROR / 409 EMAIL_TAKEN / 409 USERNAME_TAKEN
    const detailMsg = err.details?.[0]?.message;
    showError(detailMsg || err.message || 'Could not create account. Please try again.');
    registerBtn.disabled = false;
  }
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
}

registerBtn.addEventListener('click', handleRegister);

// Enter키로도 제출 (form 안 쓰므로 keydown 직접 추가)
[usernameInput, emailInput, passwordInput].forEach((el) =>
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  })
);