import { useState, useEffect } from 'react'
import { createTask, updateTask } from '../api'

export default function TaskModal({ task, categories, onClose, onSaved }) {
  const isEdit = !!task?.id
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    category_id: task?.category_id || '',
    priority: task?.priority || 'medium',
    due_date: task?.due_date || '',
    status: task?.status || 'pending',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setLoading(true); setError('')
    try {
      const payload = { ...form, category_id: form.category_id || null, due_date: form.due_date || null }
      if (isEdit) await updateTask(task.id, payload)
      else await createTask(payload)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 text-gray-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && <div className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{error}</div>}

          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="What needs to be done?" value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} placeholder="Add details..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                <option value="">No Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            {isEdit && (
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
