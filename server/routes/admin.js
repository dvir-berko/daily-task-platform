const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

// GET /api/admin/stats — system overview
router.get('/stats', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
  const adminCount = db.prepare("SELECT COUNT(*) as n FROM users WHERE role='admin'").get().n;
  const totalTasks = db.prepare('SELECT COUNT(*) as n FROM tasks').get().n;
  const doneTasks = db.prepare("SELECT COUNT(*) as n FROM tasks WHERE status='done'").get().n;
  const overdue = db.prepare(
    "SELECT COUNT(*) as n FROM tasks WHERE due_date < date('now') AND status != 'done'"
  ).get().n;

  const topUsers = db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar, u.role,
      COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status='done' THEN 1 ELSE 0 END) as done_count
    FROM users u LEFT JOIN tasks t ON t.user_id = u.id
    GROUP BY u.id
    ORDER BY task_count DESC
    LIMIT 10
  `).all();

  const recentActivity = db.prepare(`
    SELECT date(t.created_at) as day, COUNT(*) as created
    FROM tasks t
    WHERE t.created_at >= date('now', '-14 days')
    GROUP BY day ORDER BY day ASC
  `).all();

  res.json({ totalUsers, adminCount, totalTasks, doneTasks, overdue, topUsers, recentActivity,
    completionRate: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0 });
});

// GET /api/admin/users — list all users
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.email, u.name, u.avatar, u.role, u.whatsapp_to, u.calendar_connected,
      u.created_at,
      (SELECT COUNT(*) FROM tasks WHERE user_id = u.id) as task_count,
      (SELECT COUNT(*) FROM tasks WHERE user_id = u.id AND status = 'done') as done_count,
      (SELECT COUNT(*) FROM tasks WHERE user_id = u.id AND status != 'done'
        AND due_date < date('now')) as overdue_count
    FROM users u ORDER BY u.created_at DESC
  `).all();
  res.json(users);
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (String(req.params.id) === String(req.user.id)) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }
  db.prepare('UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?').run(role, req.params.id);
  const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(req.params.id);
  res.json(user);
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
  if (String(req.params.id) === String(req.user.id)) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true });
});

// GET /api/admin/tasks — all tasks across all users
router.get('/tasks', (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar,
      c.name as category_name, c.color as category_color
    FROM tasks t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY t.created_at DESC LIMIT 100
  `).all();
  res.json(tasks);
});

module.exports = router;