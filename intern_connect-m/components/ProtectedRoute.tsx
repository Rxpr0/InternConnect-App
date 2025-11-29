import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

// Define the UserRole type
type UserRole = 'intern' | 'company';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

// Type guard to check if a value is a valid UserRole
const isValidRole = (role: any): role is UserRole => {
  return role === 'intern' || role === 'company';
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigation = useNavigation();

  React.useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      navigation.navigate('Login' as never);
    } else if (!loading && user) {
      const userRole = user.role;
      // Check if the user has a valid role and if it's allowed
      if (!isValidRole(userRole) || !allowedRoles.includes(userRole)) {
        // Redirect to home if user's role is not allowed
        navigation.navigate('Home' as never);
      }
    }
  }, [user, loading, allowedRoles, navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0095ff" />
      </View>
    );
  }

  // Check if user exists and has a valid role that's allowed
  if (!user || !isValidRole(user.role) || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
} 