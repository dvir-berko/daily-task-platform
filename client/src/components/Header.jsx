import { useState } from 'react'

export default function Header({ onNewTask, activeView, setActiveView }) {
  const views = [
    { id: 'tasks', label: 'Tasks' },
    { id: 'stats', label: 'Progress' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">✓</div>
        <span className="font-semibold text-white text-lg">DailyTask</span>
      </div>

      <nav className="flex items-center gap-1 bg-gray-900 rounded-lg p-1">
        {views.map(v => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeView === v.id
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {v.label}
          </button>
        ))}
      </nav>

      <button className="btn-primary" onClick={onNewTask}>
        <span className="text-lg leading-none">+</span> New Task
      </button>
    </header>
  )
}
