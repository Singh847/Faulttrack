// ── Token helpers ──────────────────────────────────
function getToken() { return localStorage.getItem('ft_token'); }
function getUser()  { return JSON.parse(localStorage.getItem('ft_user') || 'null'); }
function saveSession(token, user) {
  localStorage.setItem('ft_token', token);
  localStorage.setItem('ft_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('ft_token');
  localStorage.removeItem('ft_user');
}

// ── Redirect if not logged in ──────────────────────
function requireAuth() {
  if (!getToken()) { window.location.href = '/'; }
}

// ── Redirect if wrong role ─────────────────────────
function requireRole(...roles) {
  const user = getUser();
  if (!user || !roles.includes(user.role)) { window.location.href = '/pages/dashboard.html'; }
}

// ── API helper (fetch with auth header) ───────────
async function api(method, endpoint, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('/api' + endpoint, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

// ── Toast notification ─────────────────────────────
function showToast(icon, message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.innerHTML = '<span id="toast-icon"></span><span id="toast-msg"></span>';
    document.body.appendChild(toast);
  }
  document.getElementById('toast-icon').textContent = icon;
  document.getElementById('toast-msg').textContent  = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Modal helpers ──────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close modal when clicking the dark overlay background
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

// ── Badge HTML ─────────────────────────────────────
function badge(value) {
  const cls = {
    open: 'badge-open', 'in-progress': 'badge-inprogress', resolved: 'badge-resolved',
    critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low'
  }[value] || 'badge-medium';
  return `<span class="badge ${cls}">${value}</span>`;
}

// ── Build topbar + sidebar HTML ────────────────────
function buildNav(activePage) {
  const user = getUser();
  if (!user) return;

  const isHO    = user.role === 'head-office';
  const isAdmin = user.role === 'admin';

  const links = [
    { href: '/pages/dashboard.html', label: '⊞ Dashboard',      show: true },
    { href: '/pages/faults.html',    label: '⚡ Fault Logs',     show: true },
    { href: '/pages/solutions.html', label: '💡 Solutions',      show: true },
    { href: '/pages/helpdesk.html',  label: '💬 Help Desk',      show: true },
    { href: '/pages/accounts.html',  label: '👤 Eng. Accounts',  show: isHO || isAdmin },
    { href: '/pages/security.html',  label: '🔒 Security',       show: isAdmin },
  ];

  const navHTML = links
    .filter(l => l.show)
    .map(l => `<a href="${l.href}" class="nav-link ${l.href.includes(activePage) ? 'active' : ''}">${l.label}</a>`)
    .join('');

  document.getElementById('sidebar').innerHTML = `
    <div class="nav-label">Main</div>
    ${navHTML}
  `;

  document.getElementById('topbar').innerHTML = `
    <span class="topbar-logo">FaultTrack</span>
    <div class="topbar-right">
      <span class="user-info">${user.name}</span>
      <span class="role-badge">${user.role}</span>
      <button class="btn btn-secondary btn-sm" onclick="logout()">⎋ Logout</button>
    </div>
  `;
}

// ── Logout ─────────────────────────────────────────
function logout() {
  if (confirm('Are you sure you want to log out?')) {
    clearSession();
    window.location.href = '/';
  }
}
