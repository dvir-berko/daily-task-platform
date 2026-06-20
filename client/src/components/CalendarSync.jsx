import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function CalendarSync({ tasks = [], onTasksImported }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const connected = user?.calendar_connected;

  useEffect(() => {
    if (connected) loadEvents();
  }, [connected]);

  async function loadEvents() {
    setLoading(true); setError('');
    try {
      const data = await api.get('/calendar/events');
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  async function exportTask(taskId, taskTitle) {
    setExporting(taskId);
    try {
      await api.post(`/calendar/export/${taskId}`);
      showSuccess(`"${taskTitle}" exported to Google Calendar!`);
    } catch (err) {
      setError(err.message);
    } finally { setExporting(null); }
  }

  async function importEvents() {
    setImporting(true); setError('');
    try {
      const data = await api.post('/calendar/import');
      showSuccess(`Imported ${data.imported} events as tasks!`);
      onTasksImported?.();
    } catch (err) {
      setError(err.message);
    } finally { setImporting(false); }
  }

  function showSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  }

  const connectCalendar = () => {
    window.location.href = '/api/auth/google?calendar=1';
  };

  if (!connected) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-xl">📅</div>
          <div>
            <h3 className="text-white font-semibold">Google Calendar</h3>
            <p className="text-gray-500 text-sm">Not connected</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm mb-4">Connect your Google Calendar to sync tasks and import events.</p>
        <button onClick={connectCalendar}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition-colors">
          Connect Google Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600/20 rounded-xl flex items-center justify-center text-lg">📅</div>
          <div>
            <h3 className="text-white font-semibold text-sm">Google Calendar</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"/>
              <span className="text-green-400 text-xs">Connected</span>
            </div>
          </div>
        </div>
        <button onClick={importEvents} disabled={importing}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
          {importing ? <span className="animate-spin">⏳</span> : '⬇️'}
          Import Events
        </button>
      </div>

      {error && <div className="mx-5 mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
      {success && <div className="mx-5 mt-3 bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">✓ {success}</div>}

      {/* Export pending tasks */}
      {tasks.filter(t => t.status !== 'done').length > 0 && (
        <div className="px-5 py-4 border-b border-gray-800">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Export tasks to calendar</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tasks.filter(t => t.status !== 'done').slice(0, 20).map(task => (
              <div key={task.id} className="flex items-center justify-between gap-3">
                <span className="text-gray-300 text-sm truncate flex-1">{task.title}</span>
                {task.due_date && <span className="text-gray-600 text-xs flex-shrink-0">{task.due_date}</span>}
                <button
                  onClick={() => exportTask(task.id, task.title)}
                  disabled={exporting === task.id}
                  className="flex-shrink-0 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-400 hover:text-white text-xs px-2.5 py-1 rounded-lg transition-colors"
                >
                  {exporting === task.id ? '...' : 'Export'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming calendar events */}
      <div className="px-5 py-4">
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Upcoming Calendar Events</p>
        {loading ? (
          <div className="text-gray-600 text-sm text-center py-4">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-gray-600 text-sm text-center py-4">No upcoming events</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {events.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <span className="text-lg">{ev.summary?.includes('📋') ? '📋' : '📆'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-300 text-sm truncate">{ev.summary}</div>
                  <div className="text-gray-600 text-xs">{ev.start?.date || ev.start?.dateTime?.split('T')[0]}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}