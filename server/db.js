const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'faulttrack.db');

let db;

function getDb() { return db; }

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS faults (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fault_code TEXT,
      description TEXT NOT NULL,
      job_type TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'open',
      location TEXT,
      notes TEXT,
      engineer_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS solutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      fault_type TEXT,
      description TEXT NOT NULL,
      effectiveness TEXT DEFAULT 'Medium',
      author_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      sender_name TEXT,
      sender_role TEXT,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed default users
  const result = db.exec('SELECT COUNT(*) as c FROM users');
  const count = result[0]?.values[0][0] || 0;
  if (count === 0) {
    const stmt = db.prepare(
      `INSERT INTO users (username, password, role, first_name, last_name, email)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    stmt.run(['engineer1',   bcrypt.hashSync('password', 10), 'engineer',    'James', 'Smith', 'j.smith@company.com']);
    stmt.run(['headoffice1', bcrypt.hashSync('password', 10), 'head-office', 'Sara',  'Jones', 's.jones@company.com']);
    stmt.run(['admin1',      bcrypt.hashSync('password', 10), 'admin',       'Alex',  'Admin', 'admin@company.com']);
    stmt.free();
    console.log('✅ Default users created');
  }

  saveDb();
  console.log('✅ Database ready');
}

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Helper to mimic better-sqlite3 API
function prepare(sql) {
  return {
    get(...params) {
      const flat = params.flat();
      const result = db.exec(sql, flat);
      if (!result[0]) return undefined;
      const cols = result[0].columns;
      const row = result[0].values[0];
      if (!row) return undefined;
      return Object.fromEntries(cols.map((c, i) => [c, row[i]]));
    },
    all(...params) {
      const flat = params.flat();
      const result = db.exec(sql, flat);
      if (!result[0]) return [];
      const cols = result[0].columns;
      return result[0].values.map(row =>
        Object.fromEntries(cols.map((c, i) => [c, row[i]]))
      );
    },
    run(...params) {
      const flat = params.flat();
      db.run(sql, flat);
      saveDb();
      return { changes: db.getRowsModified() };
    }
  };
}

module.exports = { initDb, prepare, getDb };