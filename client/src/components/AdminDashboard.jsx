import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, color = 'indigo', icon }) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-sm opacity-70 mt-1">{label}</div>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ onClose }) {
  const { user: me } = useAuth();
  const [tab, setTab] = useState('overview'); // overview | users | tasks
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, [tab]);

  async function loadData() {
    setLoading(true); setError('');
    try {
      if (tab === 'overview') {
        const s = await api.get('/admin/stats');
        setStats(s);
      } else if (tab === 'users') {
        const u = await api.get('/admin/users');
        setUsers(u);
      } else if (tab === 'tasks') {
        const t = await api.get('/admin/tasks');
        setTasks(t);
      }
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  async function changeRole(userId, role) {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      setUsers(u => u.map(x => x.id === userId ? { ...x, role } : x));
    } catch (err) { alert(err.message); }
  }

  async function deleteUser(userId) {
    if (!confirm('Delete this user and all their data?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(u => u.filter(x => x.id !== userId));
    } catch (err) { alert(err.message); }
  }

  const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'users', label: '👥 Users' },
    { id: 'tasks', label: '📋 All Tasks' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-8 p-4">
      <div className="w-full max-w-5xl bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white text-lg">🛡️</div>
            <div>
              <h2 className="text-lg font-bold text-white">Admin Dashboard</h2>
              <p className="text-xs text-gray-500">Logged in as {me?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-gray-800 bg-gray-900">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && <div className="text-gray-500 text-center py-12">Loading...</div>}
          {error && <div className="text-red-400 text-center py-12">{error}</div>}

          {/* Overview */}
          {!loading && !error && tab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={stats.totalUsers} color="indigo" icon="👥" />
                <StatCard label="Admins" value={stats.adminCount} color="purple" icon="🛡️" />
                <StatCard label="Total Tasks" value={stats.totalTasks} color="green" icon="📋" />
                <StatCard label="Overdue" value={stats.overdue} color="red" icon="⚠️" />
              </div>

              {/* Completion rate */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-300 font-medium">Completion Rate</span>
                  <span className="text-white font-bold text-xl">
                    {stats.totalTasks > 0 ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${stats.totalTasks > 0 ? (stats.doneTasks / stats.totalTasks) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{stats.doneTasks} completed</span>
                  <span>{stats.totalTasks - stats.doneTasks} remaining</span>
                </div>
              </div>

              {/* Top users */}
              {stats.topUsers?.length > 0 && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <h3 className="text-gray-300 font-medium mb-4">Most Active Users</h3>
                  <div className="space-y-3">
                    {stats.topUsers.map((u, i) => (
                      <div key={u.id} className="flex items-center gap-3">
                        <span className="text-gray-600 text-sm w-5">{i + 1}.</span>
                        {u.avatar ? <img src={u.avatar} className="w-7 h-7 rounded-full" /> :
                          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div>}
                        <span className="text-gray-300 text-sm flex-1 truncate">{u.name}</span>
                        <span className="text-gray-500 text-xs">{u.task_count} tasks</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Users */}
          {!loading && !error && tab === 'users' && (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4">
                  {u.avatar ? <img src={u.avatar} className="w-9 h-9 rounded-full flex-shrink-0" /> :
                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">{u.name[0]}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm truncate">{u.name}</span>
                      {u.role === 'admin' && <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full">Admin</span>}
                      {u.id === me?.id && <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">You</span>}
                    </div>
                    <div className="text-gray-500 text-xs truncate">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                    <span>{u.task_count} tasks</span>
                    <span className="text-green-400">{u.done_count} done</span>
                    {u.overdue_count > 0 && <span className="text-red-400">{u.overdue_count} overdue</span>}
                  </div>
                  {u.id !== me?.id && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={u.role}
                        onChange={e => changeRole(u.id, e.target.value)}
                        className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button onClick={() => deleteUser(u.id)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tasks */}
          {!loading && !error && tab === 'tasks' && (
            <div className="space-y-2">
              {tasks.map(t => (
                <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 flex items-center gap-4">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${{ high:'bg-red-400', medium:'bg-indigo-400', low:'bg-green-400' }[t.priority]}`} />
                  <span className="text-white text-sm flex-1 truncate">{t.title}</span>
                  <span className="text-gray-500 text-xs">{t.user_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.status === 'done' ? 'bg-green-500/20 text-green-400' :
                    t.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>{t.status}</span>
                  {t.due_date && <span className="text-gray-600 text-xs">{t.due_date}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}