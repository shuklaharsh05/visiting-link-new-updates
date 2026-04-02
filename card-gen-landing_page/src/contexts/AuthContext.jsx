import { createContext, useContext, useEffect, useState } from 'react';
import { apiService } from '../lib/api.js';
import { classifyIdentifier, getIdentifierErrorMessage } from '../utils/identifier.js';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('AuthProvider rendering, user:', user, 'loading:', loading);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is authenticated first
      if (!apiService.isAuthenticated()) {
        setLoading(false);
        return;
      }

      const response = await apiService.getCurrentUser();
      console.log('AuthContext - getCurrentUser response:', response);
      if (response.success && response.data) {
        console.log('AuthContext - Setting user data:', response.data);
        setUser(response.data);
      } else {
        // If profile fetch fails, clear the token
        localStorage.removeItem('auth_token');
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signUp = async (identifier, password, name, email) => {
    if (!email || !email.trim()) {
      return { error: { message: 'Email is required' } };
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return { error: { message: 'Please enter a valid email' } };
    }

    const identifierData = classifyIdentifier(identifier);

    if (!identifierData.isValid || identifierData.type !== 'phone') {
      return { error: { message: 'Please enter a valid phone number' } };
    }

    const normalizedPhone = identifierData.value;
    const payload = {
      name,
      password,
      phone: normalizedPhone,
      email: trimmedEmail,
    };

    const response = await apiService.signup(payload);
    if (!response.success) {
      return { error: { message: response.error || 'Signup failed' } };
    }
    
    // If signup is successful, fetch the complete user profile with inquiries
    const userResponse = await apiService.getCurrentUser();
    let userData = null;
    if (userResponse.success && userResponse.data) {
      console.log('AuthContext - Signup user data (full profile):', userResponse.data);
      userData = userResponse.data;
      setUser(userData);
    } else {
      if (response.data) {
        console.log('AuthContext - Signup user data (fallback):', response.data);
        userData = response.data;
        setUser(userData);
      }
    }
    return { error: null, user: userData };
  };

  const signIn = async (identifier, password) => {
    const identifierData = classifyIdentifier(identifier);

    if (!identifierData.isValid || identifierData.type !== 'phone') {
      return { error: { message: 'Please enter a valid phone number' } };
    }

    const normalizedPhone = identifierData.value;
    const credentials = {
      password,
      phone: normalizedPhone,
    };

    const response = await apiService.login(credentials);
    if (!response.success) {
      return { error: { message: response.error || 'Login failed' } };
    }
    
    // If login is successful, fetch the complete user profile with inquiries
    const userResponse = await apiService.getCurrentUser();
    let userData = null;
    if (userResponse.success && userResponse.data) {
      console.log('AuthContext - Login user data (full profile):', userResponse.data);
      userData = userResponse.data;
      setUser(userData);
    } else {
      if (response.data) {
        console.log('AuthContext - Login user data (fallback):', response.data);
        userData = response.data;
        setUser(userData);
      }
    }
    return { error: null, user: userData };
  };

  const signInWithGoogle = async (idToken) => {
    const response = await apiService.googleAuth(idToken);
    if (!response.success) {
      return { error: { message: response.error || 'Google authentication failed' } };
    }
    
    // If Google auth is successful, fetch the complete user profile with inquiries
    const userResponse = await apiService.getCurrentUser();
    let userData = null;
    if (userResponse.success && userResponse.data) {
      console.log('AuthContext - Google auth user data (full profile):', userResponse.data);
      userData = userResponse.data;
      setUser(userData);
    } else {
      if (response.data) {
        console.log('AuthContext - Google auth user data (fallback):', response.data);
        userData = response.data;
        setUser(userData);
      }
    }
    return { error: null, user: userData };
  };

  const signOut = async () => {
    await apiService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    if (!apiService.isAuthenticated()) {
      setUser(null);
      return;
    }

    const response = await apiService.getCurrentUser();
    if (response.success && response.data) {
      console.log('AuthContext - Refreshed user data:', response.data);
      setUser(response.data);
      return response.data;
    } else {
      // If profile fetch fails, clear the token
      localStorage.removeItem('auth_token');
      setUser(null);
      return null;
    }
  };

  const linkCredentials = async (phone, password) => {
    const response = await apiService.linkCredentials({ phone, password });
    if (!response.success) {
      return { error: { message: response.error || 'Failed to link credentials' } };
    }
    await refreshUser();
    return { error: null };
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUser,
    linkCredentials,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
