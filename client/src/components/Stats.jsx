import { useEffect, useState } from 'react'
import { getStats } from '../api'

function StatCard({ label, value, icon, color = 'text-white', sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  )
}

export default function Stats() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getStats().then(setStats)
  }, [])

  if (!stats) return <div className="flex items-center justify-center h-64 text-gray-600">Loading stats...</div>

  // Build 7-day trend
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const match = stats.trend.find(t => t.day === key)
    days.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), count: match?.completed || 0 })
  }
  const maxCount = Math.max(...days.map(d => d.count), 1)

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      <h2 className="text-xl font-bold text-white mb-5">Progress Overview</h2>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard label="Total Tasks" value={stats.total} icon="📋" />
        <StatCard label="Completed" value={stats.done} icon="✅" color="text-green-400" sub={`${stats.completionRate}% completion rate`} />
        <StatCard label="In Progress" value={stats.inProgress} icon="🔄" color="text-yellow-400" />
        <StatCard label="Pending" value={stats.pending} icon="⏳" color="text-gray-300" />
        <StatCard label="Due Today" value={stats.dueToday} icon="📅" color="text-indigo-400" />
        <StatCard label="Overdue" value={stats.overdue} icon="⚠️" color={stats.overdue > 0 ? 'text-red-400' : 'text-gray-400'} />
      </div>

      {/* Completion Rate Bar */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-300">Overall Completion</p>
          <p className="text-sm font-bold text-indigo-400">{stats.completionRate}%</p>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-700"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>

      {/* 7-day trend */}
      <div className="card p-5">
        <p className="text-sm font-medium text-gray-300 mb-4">Completed Tasks — Last 7 Days</p>
        <div className="flex items-end gap-2 h-24">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">{d.count || ''}</span>
              <div
                className="w-full rounded-t-md bg-indigo-600/60 transition-all duration-500"
                style={{ height: `${(d.count / maxCount) * 80}px`, minHeight: d.count ? '4px' : '0' }}
              />
              <span className="text-xs text-gray-500">{d.label}</span>
            </div>
          ))}
        </div>
        {days.every(d => d.count === 0) && (
          <p className="text-center text-gray-600 text-sm mt-2">Complete some tasks to see your trend 🚀</p>
        )}
      </div>
    </div>
  )
}
