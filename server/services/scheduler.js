const cron = require('node-cron');
const db = require('../db/database');
const { sendDailyDigestToAll } = require('./email');

let currentJob = null;

// Send WhatsApp reminder to a single user
async function sendWhatsAppReminder(user) {
  if (!user.whatsapp_to || !process.env.TWILIO_ACCOUNT_SID) return;

  const today = new Date().toISOString().split('T')[0];
  const tasks = db.prepare(`
    SELECT * FROM tasks
    WHERE user_id = ? AND status != 'done'
    ORDER BY CASE WHEN due_date <= ? THEN 0 ELSE 1 END,
      CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
    LIMIT 5
  `).all(user.id, today);

  if (tasks.length === 0) return;

  const overdue = tasks.filter(t => t.due_date && t.due_date < today);
  const dueToday = tasks.filter(t => t.due_date === today);
  const pending = tasks.filter(t => !t.due_date || t.due_date > today);

  let msg = `📋 *DailyTask — Good morning ${user.name}!*\n`;
  if (overdue.length) msg += `\n⚠️ *Overdue (${overdue.length}):*\n` + overdue.map(t => `  • ${t.title}`).join('\n');
  if (dueToday.length) msg += `\n📅 *Due Today (${dueToday.length}):*\n` + dueToday.map(t => `  • ${t.title}`).join('\n');
  if (pending.length) msg += `\n📋 *Upcoming:*\n` + pending.slice(0,3).map(t => `  • ${t.title}`).join('\n');
  msg += `\n\nOpen: ${process.env.CLIENT_URL || 'http://localhost'}`;

  const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await twilio.messages.create({
    body: msg,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'}`,
    to: `whatsapp:${user.whatsapp_to}`,
  });
  console.log(`[Scheduler] WhatsApp sent to ${user.whatsapp_to}`);
}

function startScheduler() {
  if (currentJob) {
    currentJob.stop();
    currentJob = null;
  }

  // Get all users with reminders enabled — run a cron that fires every minute
  // and checks each user's reminder_time
  currentJob = cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

      const users = db.prepare(
        "SELECT * FROM users WHERE reminder_enabled = 1 AND reminder_time = ?"
      ).all(timeStr);

      for (const user of users) {
        try { await sendWhatsAppReminder(user); } catch (e) { console.error('[Scheduler] WhatsApp error:', e.message); }
      }

      // Email digest: run at 08:00 for users with email_reminders enabled
      if (timeStr === '08:00') {
        try { await sendDailyDigestToAll(); } catch (e) { console.error('[Scheduler] Email error:', e.message); }
      }
    } catch (err) {
      console.error('[Scheduler] Error:', err.message);
    }
  });

  console.log('[Scheduler] Started — checking every minute');
}

module.exports = { startScheduler };