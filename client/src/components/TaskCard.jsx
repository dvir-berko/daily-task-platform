import { updateTask, deleteTask } from '../api'
import { useState } from 'react'

const PRIORITY_COLORS = { high: 'text-red-400 bg-red-400/10', medium: 'text-yellow-400 bg-yellow-400/10', low: 'text-green-400 bg-green-400/10' }
const STATUS_LABELS = { pending: 'Pending', in_progress: 'In Progress', done: 'Done' }

export default function TaskCard({ task, onRefresh, onEdit }) {
  const [loading, setLoading] = useState(false)

  // Fix: append T00:00:00 so the date is parsed as LOCAL midnight, not UTC midnight
  // Otherwise tasks in UTC+ timezones show incorrect overdue status
  const isOverdue = task.due_date && task.status !== 'done' &&
    new Date(task.due_date + 'T00:00:00') < new Date(new Date().toDateString())

  async function cycleStatus() {
    const next = { pending: 'in_progress', in_progress: 'done', done: 'pending' }
    setLoading(true)
    try {
      await updateTask(task.id, { status: next[task.status] })
      onRefresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this task?')) return
    await deleteTask(task.id)
    onRefresh()
  }

  return (
    <div className={`card p-4 flex gap-3 group hover:border-gray-700 transition-all ${task.status === 'done' ? 'opacity-60' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={cycleStatus}
        disabled={loading}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
          task.status === 'done'
            ? 'bg-indigo-600 border-indigo-600 text-white'
            : task.status === 'in_progress'
            ? 'border-yellow-400'
            : 'border-gray-600 hover:border-indigo-500'
        }`}
      >
        {task.status === 'done' && <span className="text-xs">✓</span>}
        {task.status === 'in_progress' && <span className="w-2 h-2 bg-yellow-400 rounded-full" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>
            {task.title}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority}
          </span>
          {task.category_name && (
            <span className="text-xs px-1.5 py-0.5 rounded-full text-gray-300" style={{ backgroundColor: task.category_color + '33', border: `1px solid ${task.category_color}55` }}>
              {task.category_name}
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>
        )}

        <div className="flex items-center gap-3 mt-2">
          {task.due_date && (
            <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
              📅 {isOverdue ? 'Overdue · ' : ''}{new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          <span className="text-xs text-gray-600">{STATUS_LABELS[task.status]}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={() => onEdit(task)} className="btn-ghost p-1.5 text-xs">✏️</button>
        <button onClick={handleDelete} className="btn-danger p-1.5 text-xs">🗑️</button>
      </div>
    </div>
  )
}