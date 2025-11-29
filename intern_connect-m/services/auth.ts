import { supabase } from '../lib/supabase';
import { AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'intern' | 'company';

export interface CustomAuthError {
  message: string;
  name: string;
  status: number;
  code: string;
}

export interface AuthResponse {
  success: boolean;
  error?: SupabaseAuthError | CustomAuthError;
  user?: any;
}

export const authService = {
  // Register a new user
  async register(
    email: string,
    password: string,
    role: UserRole,
    fullName?: string,
    companyName?: string
  ): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName,
            company_name: companyName,
          },
        },
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: error as SupabaseAuthError,
      };
    }
  },

  // Login user
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verify user role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      return {
        success: true,
        user: {
          ...data.user,
          role: profile.role,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as SupabaseAuthError,
      };
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      // Send the reset password email
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error as SupabaseAuthError,
      };
    }
  },

  // Verify the code sent by Supabase
  async verifyResetCode(email: string, code: string): Promise<AuthResponse> {
    try {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery'
      });

      if (verifyError) {
        return {
          success: false,
          error: {
            message: 'Invalid or expired code',
            name: 'VerificationError',
            status: 401,
            code: 'INVALID_OR_EXPIRED'
          } as CustomAuthError
        };
      }

      if (verifyData.session) {
        await supabase.auth.setSession(verifyData.session);
      }

      return {
        success: true,
        user: verifyData.user
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Verification failed',
          name: 'VerificationError',
          status: 500,
          code: 'VERIFICATION_ERROR'
        } as CustomAuthError
      };
    }
  },

  // Update password
  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error as SupabaseAuthError,
      };
    }
  },

  // Logout user
  async logout(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error as SupabaseAuthError,
      };
    }
  },

  // Get current user
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;

      if (!user) {
        return {
          success: false,
          error: {
            message: 'No user found',
            name: 'UserNotFound',
            status: 404,
            code: 'USER_NOT_FOUND',
          },
        };
      }

      // Get user role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return {
        success: true,
        user: {
          ...user,
          role: profile.role,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as SupabaseAuthError,
      };
    }
  },
}; 