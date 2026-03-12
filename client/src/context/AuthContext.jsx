import { createContext, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      // If decoding fails, just treat as logged-in resident and go to dashboard.
      setUser(null);
      navigate('/dashboard', { replace: true });
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    navigate('/', { replace: true });
  };

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout
    }),
    [token, user]
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

