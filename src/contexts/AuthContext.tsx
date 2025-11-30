import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, profiles } from '../lib/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'citizen' | 'authority';
}

interface AuthContextType {
  user: User | null;
  profile: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string, role?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profiles.getMe();
      setUser(data);
      setProfile(data);
      setError(null);
    } catch (err: any) {
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string, role?: string) => {
    try {
      setError(null);
      const { user: userData, token } = await auth.register({
        email,
        password,
        full_name: fullName,
        phone,
        role,
      });

      localStorage.setItem('token', token);
      setUser(userData);
      setProfile(userData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { user: userData, token } = await auth.login({ email, password });

      localStorage.setItem('token', token);
      setUser(userData);
      setProfile(userData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
