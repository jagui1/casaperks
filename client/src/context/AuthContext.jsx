import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiClient.get('/api/me');
      setProfile(res.data);
    } catch {
      setProfile(null);
    }
  }, [token]);

  useEffect(() => {
    if (token && user?.role === 'resident') {
      refreshProfile();
    } else {
      setProfile(null);
    }
  }, [token, user?.role, refreshProfile]);

  const login = async (username, password) => {
    const response = await apiClient.post('/api/auth/login', { username, password });
    const newToken = response.data.token;
    setToken(newToken);
    setAuthToken(newToken);

    try {
      const [, payload] = newToken.split('.');
      const json = JSON.parse(atob(payload));
      setUser({ userId: json.userId, username: json.username, role: json.role });
      if (json.role === 'admin') {
        setProfile(null);
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setUser(null);
      setProfile(null);
      navigate('/dashboard', { replace: true });
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setProfile(null);
    setAuthToken(null);
    navigate('/', { replace: true });
  };

  const value = useMemo(
    () => ({
      token,
      user,
      profile,
      setProfile,
      refreshProfile,
      login,
      logout
    }),
    [token, user, profile, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

