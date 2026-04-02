import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthData, clearAuthData, isAuthenticated, isAdmin } from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on app load
    const authData = getAuthData();
    if (authData?.isAuthenticated) {
      setUser(authData.user);
      setIsAuthenticated(true);
      setIsAdminUser(authData.isAdmin || false);
    }
    setLoading(false);
  }, []);

  const login = (userData, isAdmin = false) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsAdminUser(isAdmin);
  };

  const logout = () => {
    clearAuthData();
    setUser(null);
    setIsAuthenticated(false);
    setIsAdminUser(false);
  };

  const value = {
    user,
    isAuthenticated,
    isAdmin: isAdminUser,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
