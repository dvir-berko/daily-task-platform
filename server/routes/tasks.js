const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// All task routes require authentication
router.use(requireAuth);

// GET /api/tasks
router.get('/', (req, res) => {
  try {
    const { status, priority, category_id, search } = req.query;
    const userId = req.user.id;
    let sql = `
      SELECT t.*, c.name as category_name, c.color as category_color
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (status) { sql += ' AND t.status = ?'; params.push(status); }
    if (priority) { sql += ' AND t.priority = ?'; params.push(priority); }
    if (category_id) { sql += ' AND t.category_id = ?'; params.push(category_id); }
    if (search) { sql += ' AND (t.title LIKE ? OR t.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    sql += ` ORDER BY CASE t.status WHEN 'done' THEN 1 ELSE 0 END,
      CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END, t.due_date ASC`;

    const tasks = db.prepare(sql).all(...params);
    res.json(tasks);
  } catch (err) {
    console.error('[Tasks] GET /:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
router.post('/', (req, res) => {
  try {
    const { title, description, priority, status, due_date, category_id } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = db.prepare(`
      INSERT INTO tasks (title, description, priority, status, due_date, category_id, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      description || null,
      priority || 'medium',
      status || 'todo',
      due_date || null,
      category_id || null,
      req.user.id
    );
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(task);
  } catch (err) {
    console.error('[Tasks] POST /:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const { title, description, priority, status, due_date, category_id } = req.body;
    db.prepare(`
      UPDATE tasks SET title=?, description=?, priority=?, status=?, due_date=?, category_id=?, updated_at=datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      title ?? existing.title,
      description !== undefined ? description : existing.description,
      priority ?? existing.priority,
      status ?? existing.status,
      due_date !== undefined ? due_date : existing.due_date,
      category_id !== undefined ? category_id : existing.category_id,
      req.params.id,
      req.user.id
    );
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    res.json(task);
  } catch (err) {
    console.error('[Tasks] PUT /:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/stats/summary
router.get('/stats/summary', (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const stats = {
      total: db.prepare('SELECT COUNT(*) as n FROM tasks WHERE user_id = ?').get(userId).n,
      done: db.prepare("SELECT COUNT(*) as n FROM tasks WHERE user_id = ? AND status = 'done'").get(userId).n,
      overdue: db.prepare("SELECT COUNT(*) as n FROM tasks WHERE user_id = ? AND status != 'done' AND due_date < ?").get(userId, today).n,
      dueToday: db.prepare("SELECT COUNT(*) as n FROM tasks WHERE user_id = ? AND status != 'done' AND due_date = ?").get(userId, today).n,
      byPriority: db.prepare("SELECT priority, COUNT(*) as count FROM tasks WHERE user_id = ? AND status != 'done' GROUP BY priority").all(userId),
      byStatus: db.prepare('SELECT status, COUNT(*) as count FROM tasks WHERE user_id = ? GROUP BY status').all(userId),
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;