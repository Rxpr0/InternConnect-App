import { AppState, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto.js'

const supabaseUrl = 'https://jkqtgggxpgfsrcbashfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXRnZ2d4cGdmc3JjYmFzaGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMTk3NTAsImV4cCI6MjA1ODU5NTc1MH0.78WpD0Z0cJ9ttzUaHK0BZRn2ii7Yp-P9J0qg_WxFWDI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: Platform.OS === 'web' ? 'pkce' : 'implicit'
  },
})

// Set up auth state change handler
supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  if (event === 'PASSWORD_RECOVERY') {
    const resetPasswordScreen = Linking.createURL('screens/VerifyCodeScreen')
    Linking.openURL(resetPasswordScreen)
  }
})

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})