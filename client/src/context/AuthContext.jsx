import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Capture ?token=XXX from Google OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('jwt', token);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('jwt');
    if (!token) { setLoading(false); return; }
    try {
      const me = await api.get('/auth/me');
      setUser(me);
    } catch {
      localStorage.removeItem('jwt');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const logout = () => {
    localStorage.removeItem('jwt');
    setUser(null);
  };

  const updateUser = (data) => setUser(prev => ({ ...prev, ...data }));

  return (
    <AuthContext.Provider value={{ user, loading, logout, refetch: fetchMe, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);