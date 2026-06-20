const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/tasks
router.get('/', (req, res) => {
  const { category_id, status, priority, date } = req.query;
  let sql = `
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM tasks t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (category_id) { sql += ' AND t.category_id = ?'; params.push(category_id); }
  if (status) { sql += ' AND t.status = ?'; params.push(status); }
  if (priority) { sql += ' AND t.priority = ?'; params.push(priority); }
  if (date) { sql += ' AND date(t.due_date) = date(?)'; params.push(date); }

  sql += ' ORDER BY CASE t.priority WHEN "high" THEN 1 WHEN "medium" THEN 2 ELSE 3 END, t.due_date ASC, t.created_at DESC';

  const tasks = db.prepare(sql).all(...params);
  res.json(tasks);
});

// GET /api/tasks/stats
router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as n FROM tasks').get().n;
  const done = db.prepare("SELECT COUNT(*) as n FROM tasks WHERE status='done'").get().n;
  const pending = db.prepare("SELECT COUNT(*) as n FROM tasks WHERE status='pending'").get().n;
  const inProgress = db.prepare("SELECT COUNT(*) as n FROM tasks WHERE status='in_progress'").get().n;
  const overdue = db.prepare(
    "SELECT COUNT(*) as n FROM tasks WHERE due_date < date('now') AND status != 'done'"
  ).get().n;
  const dueToday = db.prepare(
    "SELECT COUNT(*) as n FROM tasks WHERE date(due_date) = date('now') AND status != 'done'"
  ).get().n;

  // Completion rate per day (last 7 days)
  const trend = db.prepare(`
    SELECT date(completed_at) as day, COUNT(*) as completed
    FROM tasks
    WHERE completed_at >= date('now', '-7 days')
    GROUP BY day
    ORDER BY day ASC
  `).all();

  res.json({ total, done, pending, inProgress, overdue, dueToday, completionRate: total ? Math.round((done / total) * 100) : 0, trend });
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM tasks t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `).get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, description, category_id, priority, due_date } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

  const result = db.prepare(`
    INSERT INTO tasks (title, description, category_id, priority, due_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(title.trim(), description || null, category_id || null, priority || 'medium', due_date || null);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, description, category_id, priority, status, due_date } = req.body;
  const completedAt = status === 'done' && task.status !== 'done' ? new Date().toISOString() : (status !== 'done' ? null : task.completed_at);

  db.prepare(`
    UPDATE tasks SET
      title = ?, description = ?, category_id = ?, priority = ?,
      status = ?, due_date = ?, completed_at = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title ?? task.title,
    description !== undefined ? description : task.description,
    category_id !== undefined ? category_id : task.category_id,
    priority ?? task.priority,
    status ?? task.status,
    due_date !== undefined ? due_date : task.due_date,
    completedAt,
    req.params.id
  );

  const updated = db.prepare(`
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM tasks t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = ?
  `).get(req.params.id);
  res.json(updated);
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Task not found' });
  res.json({ success: true });
});

module.exports = router;
