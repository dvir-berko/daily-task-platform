import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import CalendarSync from './CalendarSync';

export default function Settings({ tasks = [], onTasksImported }) {
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState({
    reminder_time: '08:00',
    reminder_enabled: true,
    email_reminders: false,
    whatsapp_to: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/settings').then(s => {
      setSettings({
        reminder_time: s.reminder_time || '08:00',
        reminder_enabled: Boolean(s.reminder_enabled),
        email_reminders: Boolean(s.email_reminders),
        whatsapp_to: s.whatsapp_to || '',
      });
    }).catch(console.error);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.put('/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h2 className="text-xl font-bold text-white">Settings</h2>

      {/* Reminder settings */}
      <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold">Reminders</h3>
          <p className="text-gray-500 text-sm mt-0.5">Configure how you receive daily task digests</p>
        </div>

        <div className="p-5 space-y-5">
          {/* WhatsApp */}
          <div>
            <label className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">💬</span>
                <span className="text-gray-300 font-medium text-sm">WhatsApp Reminders</span>
              </div>
              <button type="button" onClick={() => toggle('reminder_enabled')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.reminder_enabled ? 'bg-green-600' : 'bg-gray-700'
                }`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                  settings.reminder_enabled ? 'translate-x-4.5' : 'translate-x-0.5'
                }`} />
              </button>
            </label>
            {settings.reminder_enabled && (
              <div className="space-y-3 pl-7">
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Your WhatsApp number</label>
                  <input
                    type="tel"
                    value={settings.whatsapp_to}
                    onChange={e => setSettings(s => ({ ...s, whatsapp_to: e.target.value }))}
                    placeholder="+1234567890"
                    className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs block mb-1">Reminder time</label>
                  <input
                    type="time"
                    value={settings.reminder_time}
                    onChange={e => setSettings(s => ({ ...s, reminder_time: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="border-t border-gray-800 pt-5">
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📧</span>
                <div>
                  <span className="text-gray-300 font-medium text-sm">Email Digest</span>
                  <p className="text-gray-600 text-xs">Daily summary sent at 08:00 to {user?.email}</p>
                </div>
              </div>
              <button type="button" onClick={() => toggle('email_reminders')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.email_reminders ? 'bg-indigo-600' : 'bg-gray-700'
                }`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                  settings.email_reminders ? 'translate-x-4.5' : 'translate-x-0.5'
                }`} />
              </button>
            </label>
          </div>
        </div>

        {error && <div className="mx-5 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
        {saved && <div className="mx-5 mb-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">✓ Settings saved</div>}

        <div className="px-5 pb-5">
          <button type="submit" disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-xl transition-colors">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Calendar sync */}
      <CalendarSync tasks={tasks} onTasksImported={onTasksImported} />
    </div>
  );
}