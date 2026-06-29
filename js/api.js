const BASE_URL = 'http://localhost:8000';

const TOKEN_KEY = 'tetris_token';

function saveToken(token) { localStorage.setItem(TOKEN_KEY, token); }
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function removeToken() { localStorage.removeItem(TOKEN_KEY); }
function isLoggedIn() { return !!getToken(); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || '요청 실패');
  return data;
}

async function register(email, password) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveToken(data.access_token);
  return data;
}

async function getMe() {
  return apiFetch('/auth/me');
}

async function saveScore(score) {
  return apiFetch('/scores', {
    method: 'POST',
    body: JSON.stringify({ score }),
  });
}

async function getLeaderboard() {
  return apiFetch('/scores/leaderboard');
}

async function getMyScores() {
  return apiFetch('/scores/me');
}
