const Database = require('better-sqlite3');
const path = require('path');

// Use /app/data in production (Docker volume), fallback to project root in dev
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');
const DB_PATH = path.join(DATA_DIR, 'tasks.db');
const db = new Database(DB_PATH);

// Enable WAL for better concurrent performance
db.pragma('journal_mode = WAL');

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6366f1',
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
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed default categories if empty
const catCount = db.prepare('SELECT COUNT(*) as n FROM categories').get();
if (catCount.n === 0) {
  const insert = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)');
  insert.run('Personal', '#6366f1');
  insert.run('Work', '#f59e0b');
  insert.run('Health', '#10b981');
  insert.run('Learning', '#3b82f6');
}

// Seed default settings
const settingsInsert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
settingsInsert.run('whatsapp_to', process.env.WHATSAPP_TO || '');
settingsInsert.run('reminder_time', process.env.REMINDER_TIME || '08:00');
settingsInsert.run('reminder_enabled', 'true');

module.exports = db;