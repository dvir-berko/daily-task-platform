import { useEffect, useState, useCallback } from 'react'
import { getTasks } from '../api'
import TaskCard from './TaskCard'

export default function TaskList({ filter, categories, onEditTask }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter === 'today') params.date = new Date().toISOString().split('T')[0]
      else if (filter === 'pending') params.status = 'pending'
      else if (filter === 'in_progress') params.status = 'in_progress'
      else if (filter === 'done') params.status = 'done'
      else if (filter?.startsWith('cat_')) params.category_id = filter.replace('cat_', '')

      const data = await getTasks(params)
      setTasks(data)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const visible = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = {
    high: visible.filter(t => t.priority === 'high' && t.status !== 'done'),
    medium: visible.filter(t => t.priority === 'medium' && t.status !== 'done'),
    low: visible.filter(t => t.priority === 'low' && t.status !== 'done'),
    done: visible.filter(t => t.status === 'done'),
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search */}
      <div className="mb-4">
        <input
          className="input"
          placeholder="Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-600">Loading...</div>
      ) : visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-gray-400 font-medium">No tasks here</p>
          <p className="text-gray-600 text-sm mt-1">Click <strong>+ New Task</strong> to get started</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 overflow-y-auto pb-6">
          {['high','medium','low'].map(priority => grouped[priority].length > 0 && (
            <section key={priority}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                {priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢'} {priority} priority
                <span className="bg-gray-800 text-gray-400 text-xs px-1.5 py-0.5 rounded-full">{grouped[priority].length}</span>
              </p>
              <div className="flex flex-col gap-2">
                {grouped[priority].map(t => <TaskCard key={t.id} task={t} onRefresh={load} onEdit={onEditTask} />)}
              </div>
            </section>
          ))}

          {grouped.done.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                ✅ completed
                <span className="bg-gray-800 text-gray-400 text-xs px-1.5 py-0.5 rounded-full">{grouped.done.length}</span>
              </p>
              <div className="flex flex-col gap-2">
                {grouped.done.map(t => <TaskCard key={t.id} task={t} onRefresh={load} onEdit={onEditTask} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
