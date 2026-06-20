import { useState, useEffect } from 'react';
import { api } from '../api';

function MiniBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400 capitalize">{label}</span>
        <span className="text-gray-500">{count} ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/stats/summary')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 gap-3 p-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-800 rounded-xl" />
      ))}
    </div>
  );

  if (!stats) return null;

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const pending = stats.total - stats.done;

  const priorityMap = {};
  (stats.byPriority || []).forEach(p => { priorityMap[p.priority] = p.count; });

  const statusMap = {};
  (stats.byStatus || []).forEach(s => { statusMap[s.status] = s.count; });

  return (
    <div className="p-4 space-y-4">
      {/* Top metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Tasks</div>
          <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
          <div className="text-xs text-indigo-400 mt-1">{completionRate}% done</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">{stats.done}</div>
          <div className="text-xs text-gray-500 mt-0.5">Completed</div>
          <div className="text-xs text-gray-600 mt-2">{pending} remaining</div>
        </div>

        <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-400">{stats.overdue}</div>
          <div className="text-xs text-gray-500 mt-0.5">Overdue</div>
          {stats.overdue > 0 && <div className="text-xs text-red-500 mt-2">Needs attention</div>}
        </div>

        <div className="bg-indigo-950/40 border border-indigo-900/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-indigo-400">{stats.dueToday}</div>
          <div className="text-xs text-gray-500 mt-0.5">Due Today</div>
          {stats.dueToday > 0 && <div className="text-xs text-indigo-400 mt-2">Focus here</div>}
        </div>
      </div>

      {/* Priority breakdown */}
      {stats.total > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">By Priority</p>
          <MiniBar label="High" count={priorityMap.high || 0} total={stats.total} color="bg-red-400" />
          <MiniBar label="Medium" count={priorityMap.medium || 0} total={stats.total} color="bg-indigo-400" />
          <MiniBar label="Low" count={priorityMap.low || 0} total={stats.total} color="bg-green-400" />
        </div>
      )}

      {/* Status breakdown */}
      {stats.total > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">By Status</p>
          <MiniBar label="Todo" count={statusMap.todo || 0} total={stats.total} color="bg-gray-400" />
          <MiniBar label="In Progress" count={statusMap.in_progress || 0} total={stats.total} color="bg-blue-400" />
          <MiniBar label="Done" count={statusMap.done || 0} total={stats.total} color="bg-green-400" />
        </div>
      )}
    </div>
  );
}