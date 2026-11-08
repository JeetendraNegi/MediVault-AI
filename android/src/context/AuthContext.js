import React, { createContext, useState, useEffect } from 'react';
import { authAPI, setAuthToken } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      setToken(data.access_token);
      setAuthToken(data.access_token);
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      let errMsg = 'Login failed. Please check your credentials.';
      if (error.response?.data?.detail) {
        errMsg = error.response.data.detail;
      } else if (error.message?.includes('Network Error') || !error.response) {
        errMsg = `Network Error: Unable to reach backend server. Please verify backend is running. (${error.message || 'Connection refused'})`;
      }
      return { 
        success: false, 
        error: errMsg 
      };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      await authAPI.register(userData);
      return await login(userData.email, userData.password);
    } catch (error) {
      setLoading(false);
      let errMsg = 'Registration failed.';
      if (error.response?.data?.detail) {
        errMsg = error.response.data.detail;
      } else if (error.message?.includes('Network Error') || !error.response) {
        errMsg = `Network Error: Unable to reach backend server. (${error.message || 'Connection refused'})`;
      }
      return { 
        success: false, 
        error: errMsg 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
