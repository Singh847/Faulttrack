const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const path    = require('path');
const http    = require('http');
const { Server } = require('socket.io');
const { initDb, prepare } = require('./db');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });
const SECRET = 'faulttrack_secret';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Auth middleware ──────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: 'You do not have permission for this action' });
    next();
  };
}

// ── LOGIN ────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid username or password' });

  if (!user.active)
    return res.status(403).json({ error: 'Your account has been deactivated' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role,
      name: `${user.first_name} ${user.last_name}` },
    SECRET, { expiresIn: '8h' }
  );
  res.json({ token, user: { id: user.id, username: user.username,
    role: user.role, name: `${user.first_name} ${user.last_name}` } });
});

// ── FAULTS ───────────────────────────────────────
app.get('/api/faults', auth, (req, res) => {
  const faults = prepare(`
    SELECT f.*, u.first_name || ' ' || u.last_name AS engineer_name
    FROM faults f
    LEFT JOIN users u ON f.engineer_id = u.id
    ORDER BY f.created_at DESC
  `).all();
  res.json(faults);
});

app.post('/api/faults', auth, requireRole('engineer', 'admin'), (req, res) => {
  const { description, job_type, priority, location, notes } = req.body;
  if (!description) return res.status(400).json({ error: 'Description is required' });

  const count = prepare('SELECT COUNT(*) as c FROM faults').get().c;
  const fault_code = 'F-' + String(count + 1).padStart(3, '0');

  prepare(`
    INSERT INTO faults (fault_code, description, job_type, priority, location, notes, engineer_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(fault_code, description, job_type, priority || 'medium', location, notes, req.user.id);

  res.json({ success: true, fault_code });
});

app.put('/api/faults/:id', auth, (req, res) => {
  const { status, notes } = req.body;
  prepare('UPDATE faults SET status = ?, notes = ? WHERE id = ?')
    .run(status, notes, req.params.id);
  res.json({ success: true });
});

// ── SOLUTIONS ─────────────────────────────────────
app.get('/api/solutions', auth, (req, res) => {
  const solutions = prepare(`
    SELECT s.*, u.first_name || ' ' || u.last_name AS author_name
    FROM solutions s
    LEFT JOIN users u ON s.author_id = u.id
    ORDER BY s.created_at DESC
  `).all();
  res.json(solutions);
});

app.post('/api/solutions', auth, requireRole('head-office', 'admin'), (req, res) => {
  const { title, fault_type, description, effectiveness } = req.body;
  if (!title || !description)
    return res.status(400).json({ error: 'Title and description are required' });

  prepare(`
    INSERT INTO solutions (title, fault_type, description, effectiveness, author_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, fault_type, description, effectiveness || 'Medium', req.user.id);

  res.json({ success: true });
});

// ── USERS / ACCOUNTS ──────────────────────────────
app.get('/api/users', auth, requireRole('head-office', 'admin'), (req, res) => {
  const users = prepare(
    'SELECT id, username, first_name, last_name, email, role, active FROM users ORDER BY id'
  ).all();
  res.json(users);
});

app.post('/api/users', auth, requireRole('head-office', 'admin'), (req, res) => {
  const { username, password, first_name, last_name, email } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    prepare(`
      INSERT INTO users (username, password, role, first_name, last_name, email)
      VALUES (?, ?, 'engineer', ?, ?, ?)
    `).run(username, bcrypt.hashSync(password, 10), first_name, last_name, email);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.put('/api/users/:id/toggle', auth, requireRole('head-office', 'admin'), (req, res) => {
  const user = prepare('SELECT active FROM users WHERE id = ?').get(req.params.id);
  prepare('UPDATE users SET active = ? WHERE id = ?').run(user.active ? 0 : 1, req.params.id);
  res.json({ success: true });
});

// ── MESSAGES ──────────────────────────────────────
app.get('/api/messages', auth, (req, res) => {
  const messages = prepare('SELECT * FROM messages ORDER BY created_at ASC').all();
  res.json(messages);
});

app.post('/api/messages', auth, (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Message cannot be empty' });
  prepare('INSERT INTO messages (sender_id, sender_name, sender_role, text) VALUES (?, ?, ?, ?)')
    .run(req.user.id, req.user.name, req.user.role, text);
  res.json({ success: true });
});
// ── SOCKET.IO REAL-TIME CHAT ──────────────────────
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send existing messages when user joins
  socket.on('join', () => {
    const messages = prepare('SELECT * FROM messages ORDER BY created_at ASC').all();
    socket.emit('history', messages);
  });

  // Receive and broadcast new message
  socket.on('message', (data) => {
    prepare('INSERT INTO messages (sender_id, sender_name, sender_role, text) VALUES (?, ?, ?, ?)')
      .run(data.sender_id, data.sender_name, data.sender_role, data.text);
    const messages = prepare('SELECT * FROM messages ORDER BY created_at ASC').all();
    io.emit('history', messages);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
// ── START ─────────────────────────────────────────
initDb().then(() => {
  const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ FaultTrack running on port ${PORT}`));
