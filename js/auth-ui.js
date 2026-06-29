let currentUser = null;

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  // 게임 진행 중이면 일시정지
  if (window.game) window.game.pause();
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  document.querySelectorAll(`#${id} .auth-error`).forEach(el => el.textContent = '');
  document.querySelectorAll(`#${id} input`).forEach(el => el.value = '');
  // 게임이 일시정지 상태면 재개
  if (window.game) window.game.resume();
}

function startGameAfterAuth() {
  document.getElementById('start-overlay').classList.add('hidden');
  window.game.reset();
}

function updateUserHeader(user) {
  currentUser = user;
  const guestArea = document.getElementById('guest-area');
  const userArea  = document.getElementById('user-area');
  const userEmail = document.getElementById('user-email');
  const autoBtn   = document.getElementById('autoBtn');
  if (user) {
    guestArea.classList.add('hidden');
    userArea.classList.remove('hidden');
    userEmail.textContent = user.email;
    if (autoBtn) autoBtn.classList.add('hidden');
    if (window.game && window.game.autoMode) {
      window.game.autoMode = false;
      if (autoBtn) { autoBtn.textContent = '🤖 Auto'; autoBtn.classList.remove('active'); }
    }
  } else {
    guestArea.classList.remove('hidden');
    userArea.classList.add('hidden');
    if (autoBtn) autoBtn.classList.remove('hidden');
  }
  refreshLeaderboard();
}

async function refreshLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  if (!list) return;
  try {
    const entries = await getLeaderboard();
    if (entries.length === 0) {
      list.innerHTML = '<li class="lb-empty">아직 기록이 없습니다.</li>';
      return;
    }
    const myEmail = currentUser ? currentUser.email : null;
    list.innerHTML = entries.map(e => {
      const isMe = e.email === myEmail;
      const medal = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : e.rank;
      return `<li class="${isMe ? 'lb-me' : ''}">
        <span class="lb-rank">${medal}</span>
        <span class="lb-email" title="${e.email}">${e.email.split('@')[0]}</span>
        <span class="lb-score">${e.best_score.toLocaleString()}</span>
      </li>`;
    }).join('');
  } catch {
    list.innerHTML = '<li class="lb-empty">불러오기 실패</li>';
  }
}

async function initAuth() {
  if (isLoggedIn()) {
    try {
      const user = await getMe();
      updateUserHeader(user);
    } catch {
      removeToken();
      updateUserHeader(null);
    }
  } else {
    updateUserHeader(null);
  }

  // 게스트 시작 (로그인 상태면 먼저 로그아웃)
  document.getElementById('guestStartBtn').addEventListener('click', () => {
    if (isLoggedIn()) {
      removeToken();
      updateUserHeader(null);
    }
    startGameAfterAuth();
  });

  // 회원가입 폼
  document.getElementById('register-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl  = document.getElementById('reg-error');
    try {
      await register(email, password);
      await login(email, password);
      const user = await getMe();
      updateUserHeader(user);
      closeModal('register-modal');
      // 아직 게임이 시작 안 됐으면 지금 시작
      if (!window.game.started) startGameAfterAuth();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  // 로그인 폼
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('login-error');
    try {
      await login(email, password);
      const user = await getMe();
      updateUserHeader(user);
      closeModal('login-modal');
      // 아직 게임이 시작 안 됐으면 지금 시작
      if (!window.game.started) startGameAfterAuth();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  // 로그아웃
  document.getElementById('logout-btn').addEventListener('click', () => {
    removeToken();
    updateUserHeader(null);
  });

  // 모달 배경 클릭 닫기
  ['login-modal', 'register-modal'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target.id === id) closeModal(id);
    });
  });
}

window.addEventListener('load', initAuth);
