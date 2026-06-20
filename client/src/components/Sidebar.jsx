import { useState } from 'react'
import { createCategory, deleteCategory } from '../api'

const COLORS = ['#6366f1','#f59e0b','#10b981','#3b82f6','#ec4899','#f97316','#8b5cf6','#14b8a6']

export default function Sidebar({ categories, selectedCategory, onSelect, onRefresh }) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const statusFilters = [
    { id: null, label: 'All Tasks', icon: '📋' },
    { id: 'today', label: 'Due Today', icon: '📅' },
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'in_progress', label: 'In Progress', icon: '🔄' },
    { id: 'done', label: 'Completed', icon: '✅' },
  ]

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setLoading(true)
    try {
      await createCategory({ name: newName.trim(), color: newColor })
      setNewName('')
      setAdding(false)
      onRefresh()
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this category? Tasks will be unassigned.')) return
    await deleteCategory(id)
    onRefresh()
    // fix: selectedCategory uses "cat_" prefix, must match the same format
    if (selectedCategory === `cat_${id}`) onSelect(null)
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col gap-4 py-6 px-3">
      {/* Status filters */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Filter</p>
        {statusFilters.map(f => (
          <button
            key={f.id ?? 'all'}
            onClick={() => onSelect(f.id)}
            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all mb-0.5 ${
              selectedCategory === f.id
                ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categories</p>
          <button onClick={() => setAdding(!adding)} className="text-gray-500 hover:text-indigo-400 text-lg leading-none transition-colors">+</button>
        </div>

        {adding && (
          <form onSubmit={handleAdd} className="mb-2 p-2 card rounded-lg">
            <input
              className="input mb-2 text-xs"
              placeholder="Category name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-1 flex-wrap mb-2">
              {COLORS.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-5 h-5 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-gray-900' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <button type="submit" disabled={loading} className="btn-primary text-xs py-1 px-2 flex-1">Add</button>
              <button type="button" onClick={() => setAdding(false)} className="btn-ghost text-xs py-1 px-2">Cancel</button>
            </div>
          </form>
        )}

        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(`cat_${cat.id}`)}
            className={`group w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all mb-0.5 ${
              selectedCategory === `cat_${cat.id}`
                ? 'bg-gray-800 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="flex-1 text-left truncate">{cat.name}</span>
            <span className="text-xs text-gray-600 group-hover:text-gray-400">{cat.task_count}</span>
            <span
              onClick={e => handleDelete(cat.id, e)}
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs ml-1 transition-all"
            >✕</span>
          </button>
        ))}
      </div>
    </aside>
  )
}