import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import Stats from './components/Stats';
import Settings from './components/Settings';
import Header from './components/Header';
import AdminDashboard from './components/AdminDashboard';
import { api } from './api';

function AppInner() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('tasks');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    try {
      const t = await api.get('/tasks');
      setTasks(t);
    } catch (err) {
      console.error('[App] loadTasks:', err.message);
    }
  }, [user]);

  const loadCategories = useCallback(async () => {
    if (!user) return;
    try {
      const c = await api.get('/categories');
      setCategories(c);
    } catch (err) {
      console.error('[App] loadCategories:', err.message);
    }
  }, [user]);

  useEffect(() => {
    if (user) { loadTasks(); loadCategories(); }
  }, [user, loadTasks, loadCategories]);

  // Loading splash
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // Not logged in → show Login page
  if (!user) return <Login />;

  const handleTaskSaved = () => {
    loadTasks();
    setSelectedFilter(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Header
        onMenuClick={() => setSidebarOpen(o => !o)}
        onAdminClick={() => setShowAdmin(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 top-16 z-40 w-64 bg-gray-950 border-r border-gray-800 transition-transform duration-200
          lg:relative lg:translate-x-0 lg:top-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar
            activeView={activeView}
            onViewChange={(v) => { setActiveView(v); setSidebarOpen(false); }}
            selectedCategory={selectedCategory}
            onCategorySelect={(c) => { setSelectedCategory(c); setActiveView('tasks'); setSidebarOpen(false); }}
            selectedFilter={selectedFilter}
            onFilterSelect={(f) => { setSelectedFilter(f); setActiveView('tasks'); setSidebarOpen(false); }}
            categories={categories}
            onCategoriesChange={loadCategories}
          />
        </div>

        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {activeView === 'tasks' && (
            <TaskList
              selectedCategory={selectedCategory}
              selectedFilter={selectedFilter}
              onTaskSaved={handleTaskSaved}
              categories={categories}
            />
          )}
          {activeView === 'stats' && <Stats />}
          {activeView === 'settings' && (
            <Settings
              tasks={tasks}
              onTasksImported={loadTasks}
            />
          )}
        </main>
      </div>

      {/* Admin modal */}
      {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}