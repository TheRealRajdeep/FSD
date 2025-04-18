import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  sapId: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'reviewer';
  department: string;
  team: string | null;
  skills: string[];
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => { },
  register: async () => { },
  logout: () => { },
  clearError: () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Set auth token for axios requests
  useEffect(() => {
    if (user && user.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user]);

  const login = async (identifier: string, password: string) => {
    try {
      setLoading(true);

      const { data } = await axios.post('/api/auth/login', { identifier, password });

      localStorage.setItem('user', JSON.stringify(data));

      setUser(data);
      setLoading(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/register', userData);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during registration');
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;