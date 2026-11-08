import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('medivault_token');
    if (token) {
      authAPI.me()
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('medivault_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    localStorage.setItem('medivault_token', res.data.access_token);
    setUser({ id: res.data.user_id, email: res.data.email, full_name: res.data.full_name });
    return res.data;
  };

  const register = async (email, password, fullName) => {
    const res = await authAPI.register(email, password, fullName);
    localStorage.setItem('medivault_token', res.data.access_token);
    setUser({ id: res.data.user_id, email: res.data.email, full_name: res.data.full_name });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('medivault_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
