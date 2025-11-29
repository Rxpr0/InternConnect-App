import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { AuthResponse, authService } from '../services/auth';

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | AuthError | null;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string, name: string) => Promise<{ error: Error | AuthError | null }>;
  resetPassword: (email: string, options?: { redirectTo: string }) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  verifyResetCode: (email: string, code: string) => Promise<AuthResponse>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  signOut: async () => {},
  login: async () => {},
  register: async () => ({ error: null }),
  resetPassword: async () => {},
  updatePassword: async () => {},
  refreshUser: async () => {},
  verifyResetCode: async () => ({ success: false }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | AuthError | null>(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
    error,
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        setError(error as Error);
        throw error;
      }
    },
    login: async (email: string, password: string) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } catch (error) {
        setError(error as Error);
        throw error;
      }
    },
    register: async (email: string, password: string, role: string, name: string) => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              full_name: name,
            },
          },
        });
        if (error) {
          if (error.message.includes('User already registered')) {
            return { error: new Error('Email already registered') as Error };
          }
          return { error: error as AuthError };
        }
        return { error: null };
      } catch (error) {
        return { error: error as Error };
      }
    },
    resetPassword: async (email: string, options?: { redirectTo: string }) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: options?.redirectTo || 'intern-connect-m://reset-password',
        });
        if (error) throw error;
      } catch (error) {
        setError(error as Error);
        throw error;
      }
    },
    updatePassword: async (newPassword: string) => {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (error) throw error;
      } catch (error) {
        throw error;
      }
    },
    refreshUser: async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(data.user);
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    },
    verifyResetCode: async (email: string, code: string) => {
      return await authService.verifyResetCode(email, code);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
}; 