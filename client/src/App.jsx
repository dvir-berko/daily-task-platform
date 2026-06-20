import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import TaskList from './components/TaskList'
import TaskModal from './components/TaskModal'
import Stats from './components/Stats'
import Settings from './components/Settings'
import { getCategories } from './api'

export default function App() {
  const [view, setView] = useState('tasks')
  const [selectedFilter, setSelectedFilter] = useState(null)
  const [categories, setCategories] = useState([])
  const [modal, setModal] = useState(null) // null | { task? }
  const [taskListKey, setTaskListKey] = useState(0)

  const loadCategories = useCallback(() => {
    getCategories().then(setCategories)
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])

  function openNewTask() { setModal({}); setView('tasks') }
  function openEditTask(task) { setModal({ task }) }
  function closeModal() { setModal(null) }
  function onTaskSaved() {
    setModal(null)
    setTaskListKey(k => k + 1)
    loadCategories()
    setSelectedFilter(null) // reset to All Tasks so the saved task is always visible
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNewTask={openNewTask} activeView={view} setActiveView={setView} />

      <div className="flex flex-1 overflow-hidden">
        {view === 'tasks' && (
          <Sidebar
            categories={categories}
            selectedCategory={selectedFilter}
            onSelect={setSelectedFilter}
            onRefresh={loadCategories}
          />
        )}

        <main className="flex-1 overflow-hidden flex flex-col p-6">
          {view === 'tasks' && (
            <TaskList
              key={taskListKey}
              filter={selectedFilter}
              categories={categories}
              onEditTask={openEditTask}
            />
          )}
          {view === 'stats' && <Stats />}
          {view === 'settings' && <Settings />}
        </main>
      </div>

      {modal !== null && (
        <TaskModal
          task={modal.task}
          categories={categories}
          onClose={closeModal}
          onSaved={onTaskSaved}
        />
      )}
    </div>
  )
}