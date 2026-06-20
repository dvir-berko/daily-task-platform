const twilio = require('twilio');
const db = require('../db/database');

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || sid.startsWith('AC0000')) {
    throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
  }
  return twilio(sid, token);
}

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

function formatTasksMessage(tasks, isTest = false) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const prefix = isTest ? '🧪 *TEST MESSAGE*\n\n' : '';

  if (tasks.length === 0) {
    return `${prefix}✅ *Daily Task Digest — ${today}*\n\nYou have no pending tasks today. Enjoy your day! 🎉`;
  }

  const high = tasks.filter(t => t.priority === 'high');
  const medium = tasks.filter(t => t.priority === 'medium');
  const low = tasks.filter(t => t.priority === 'low');

  let msg = `${prefix}📋 *Daily Task Digest — ${today}*\n`;
  msg += `You have *${tasks.length}* pending task${tasks.length > 1 ? 's' : ''}\n\n`;

  if (high.length) {
    msg += `🔴 *High Priority*\n`;
    high.forEach(t => { msg += `• ${t.title}${t.due_date ? ` _(due ${t.due_date})_` : ''}\n`; });
    msg += '\n';
  }
  if (medium.length) {
    msg += `🟡 *Medium Priority*\n`;
    medium.forEach(t => { msg += `• ${t.title}${t.due_date ? ` _(due ${t.due_date})_` : ''}\n`; });
    msg += '\n';
  }
  if (low.length) {
    msg += `🟢 *Low Priority*\n`;
    low.forEach(t => { msg += `• ${t.title}${t.due_date ? ` _(due ${t.due_date})_` : ''}\n`; });
  }

  msg += `\n💪 Have a productive day!`;
  return msg;
}

async function sendDailyDigest(isTest = false) {
  const settings = getSettings();

  if (!isTest && settings.reminder_enabled !== 'true') {
    console.log('[WhatsApp] Reminders disabled — skipping');
    return;
  }

  const to = settings.whatsapp_to;
  if (!to) throw new Error('WhatsApp recipient number not configured in Settings');

  const tasks = db.prepare(`
    SELECT t.*, c.name as category_name
    FROM tasks t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.status != 'done'
    ORDER BY CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
  `).all();

  const body = formatTasksMessage(tasks, isTest);
  const client = getClient();

  const message = await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
    to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
    body,
  });

  console.log(`[WhatsApp] Message sent: ${message.sid}`);
  return message;
}

module.exports = { sendDailyDigest };
