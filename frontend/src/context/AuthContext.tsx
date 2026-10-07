import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  phone?: string;
  avatarUrl?: string;
  patient?: {
    id: string;
    healthId: string;
    bloodGroup: string;
    district: string;
    allergies: string;
    chronicConditions: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  };
  doctor?: {
    id: string;
    licenseNumber: string;
    specialty: string;
    hospital?: {
      id: string;
      name: string;
      district: string;
    };
  };
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  unreadNotifications: number;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  fetchNotificationsCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('smarthealth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  const fetchNotificationsCount = async () => {
    if (!token) return;
    try {
      const res = await api.get('/notifications');
      setUnreadNotifications(res.data.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('smarthealth_token');
      const savedUser = localStorage.getItem('smarthealth_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('smarthealth_user', JSON.stringify(res.data));
          fetchNotificationsCount();
        } catch {
          // Token invalid
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      localStorage.setItem('smarthealth_user', JSON.stringify(res.data));
    } catch {
      // ignore
    }
  };

  const login = (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('smarthealth_token', newToken);
    localStorage.setItem('smarthealth_user', JSON.stringify(newUser));
    fetchNotificationsCount();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('smarthealth_token');
    localStorage.removeItem('smarthealth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        unreadNotifications,
        login,
        logout,
        refreshUser,
        fetchNotificationsCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
