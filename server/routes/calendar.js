const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

function getCalendar(userId) {
  const user = db.prepare('SELECT google_access_token, google_refresh_token FROM users WHERE id = ?').get(userId);
  if (!user?.google_access_token) {
    throw new Error('Google Calendar not connected. Re-login with calendar permission.');
  }
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost/api/auth/google/callback'
  );
  auth.setCredentials({
    access_token: user.google_access_token,
    refresh_token: user.google_refresh_token,
  });
  auth.on('tokens', (tokens) => {
    if (tokens.refresh_token) db.prepare('UPDATE users SET google_refresh_token=? WHERE id=?').run(tokens.refresh_token, userId);
    if (tokens.access_token) db.prepare('UPDATE users SET google_access_token=? WHERE id=?').run(tokens.access_token, userId);
  });
  return google.calendar({ version: 'v3', auth });
}

// GET /api/calendar/events — upcoming events
router.get('/events', async (req, res) => {
  try {
    const cal = getCalendar(req.user.id);
    const r = await cal.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });
    res.json(r.data.items || []);
  } catch (err) {
    res.status(err.message.includes('not connected') ? 401 : 500).json({ error: err.message });
  }
});

// POST /api/calendar/export/:taskId — push task to Google Calendar
router.post('/export/:taskId', async (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.taskId, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (!task.due_date) return res.status(400).json({ error: 'Task needs a due date to export to calendar' });

  try {
    const cal = getCalendar(req.user.id);
    const event = await cal.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: task.title,
        description: task.description || '',
        start: { date: task.due_date },
        end: { date: task.due_date },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'email', minutes: 1440 },
          ],
        },
      },
    });
    res.json({ success: true, eventId: event.data.id, htmlLink: event.data.htmlLink });
  } catch (err) {
    res.status(err.message.includes('not connected') ? 401 : 500).json({ error: err.message });
  }
});

// POST /api/calendar/import — pull upcoming events and create tasks
router.post('/import', async (req, res) => {
  try {
    const cal = getCalendar(req.user.id);
    const r = await cal.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 30,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = r.data.items || [];
    let imported = 0;
    const insertTask = db.prepare(`
      INSERT INTO tasks (title, description, due_date, user_id, priority)
      VALUES (?, ?, ?, ?, 'medium')
    `);

    for (const ev of events) {
      if (!ev.summary) continue;
      const dueDate = ev.start?.date || ev.start?.dateTime?.split('T')[0] || null;
      insertTask.run(ev.summary, ev.description?.slice(0, 500) || null, dueDate, req.user.id);
      imported++;
    }

    res.json({ success: true, imported });
  } catch (err) {
    res.status(err.message.includes('not connected') ? 401 : 500).json({ error: err.message });
  }
});

module.exports = router;