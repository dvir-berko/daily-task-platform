const Database = require('better-sqlite3');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');
const DB_PATH = path.join(DATA_DIR, 'tasks.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Core schema ───────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT UNIQUE,
    email TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'User',
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
    whatsapp_to TEXT,
    reminder_time TEXT NOT NULL DEFAULT '08:00',
    reminder_enabled INTEGER NOT NULL DEFAULT 1,
    email_reminders INTEGER NOT NULL DEFAULT 0,
    google_access_token TEXT,
    google_refresh_token TEXT,
    calendar_connected INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','done')),
    due_date TEXT,
    completed_at TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// ── Safe migrations for existing installs ─────────────────────────────────────
const migrate = (sql) => { try { db.exec(sql); } catch(e) { /* column already exists */ } };
migrate('ALTER TABLE tasks ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE');
migrate('ALTER TABLE categories ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE');
migrate('ALTER TABLE users ADD COLUMN calendar_connected INTEGER NOT NULL DEFAULT 0');
migrate('ALTER TABLE users ADD COLUMN email_reminders INTEGER NOT NULL DEFAULT 0');
migrate('ALTER TABLE users ADD COLUMN reminder_time TEXT NOT NULL DEFAULT \'08:00\'');
migrate('ALTER TABLE users ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT 1');

module.exports = db;