import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const lImage = require("../../assets/image/L.png");
const windowHeight = Dimensions.get('window').height;

const CustomAlert = ({ visible, title, message, onClose }: { visible: boolean; title: string; message: string; onClose: () => void }) => (
  <Modal
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.alertContainer}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        <TouchableOpacity style={styles.alertButton} onPress={onClose}>
          <Text style={styles.alertButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default function CompanyLoginScreen() {
  const router = useRouter();
  const { login, error: authError } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onClose: () => {} });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      showAlert("Error", "Please enter both email and password.");
      return false;
    }

    if (!validateEmail(formData.email)) {
      showAlert("Error", "Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const showAlert = (title: string, message: string, onClose = () => {}) => {
    setAlertConfig({ title, message, onClose });
    setAlertVisible(true);
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password.trim(),
      });

      if (signInError) {
        showAlert("Login Failed", "Incorrect email or password.");
        return;
      }

      // Check if user is a company using the verify_user_role_access function
      const { data, error: roleError } = await supabase
        .rpc('verify_user_role_access', {
          required_role: 'company'
        });

      if (roleError) {
        console.error("Role verification failed:", roleError);
        showAlert("Error", "Failed to verify user role");
        await supabase.auth.signOut();
        return;
      }

      if (!data) {
        showAlert(
          "Access Denied",
          "This login is for companies only. Please use the intern login if you are an intern.",
          async () => {
            await supabase.auth.signOut();
          }
        );
        return;
      }

      router.push("/screens/CompanyOverviewScreen");
    } catch (error) {
      console.error("Login failed:", error);
      showAlert("Login Failed", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertVisible(false);
          alertConfig.onClose();
        }}
      />
      {/* Updated header with back button and centered logo */}
      <LinearGradient
        colors={['#808080', 'rgba(128, 128, 128, 0)']}
        style={styles.headerContainer}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image source={lImage} style={styles.logo} />
          <Text style={styles.appName}>Login Page</Text>
        </View>
        <View style={styles.placeholderView} />
      </LinearGradient>

      {/* Main content container with flex to center content but positioned slightly higher */}
      <View style={styles.contentWrapper}>
        <View style={styles.content}>
          <View style={styles.welcomeSection}>
            <Text style={styles.subText}>
              Log in to access your company dashboard or register to start posting internship opportunities.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Business Email"
              placeholderTextColor="#666"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
            />

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password Link */}
              <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => router.push("/screens/ForgotPasswordScreen")}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.noAccountText}>Don't have a company account?</Text>
                <TouchableOpacity style={styles.registerButton} onPress={() => router.push("/screens/CompanyRegistrationScreen")}>
                  <Text style={styles.registerButtonText}>Register Now</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Updated header styles to match the login screen
  headerContainer: {
    paddingTop: 10,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 0,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderView: {
    width: 40, // Same width as the back button to ensure proper centering
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  appName: {
    color: '#000',
    fontSize: 26,
    fontWeight: '600',
  },
  // Adjusted wrapper to position content slightly higher
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60, // This pushes the content up a bit
  },
  content: {
    paddingHorizontal: 24,
  },
  welcomeSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  subText: {
    color: '#999',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  form: {
    justifyContent: 'center',
    marginTop: 10,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    color: '#fff',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#0077b5',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    alignItems: 'center',
    gap: 15,
  },
  noAccountText: {
    color: '#666',
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    width: '100%',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContainer: {
    backgroundColor: '#4d0000', // darker maroon background
    padding: 20,
    borderRadius: 25, // more curved edges
    width: '80%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000', // black border
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', // white text
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    color: '#ffffff', // white text
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButton: {
    backgroundColor: '#000000', // black button
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ffffff', // white border
    minWidth: 80,
  },
  alertButtonText: {
    color: '#ffffff', // white text
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});