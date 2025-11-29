import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

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

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onClose: () => {} });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Password strength calculation with proper type annotation and default return
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0

    let strength = 0
    // Length check
    if (password.length >= 8) strength += 1
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1
    // Contains number
    if (/[0-9]/.test(password)) strength += 1
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    return strength
  }

  // Get strength label with proper type annotation and default return
  const getStrengthLabel = (strength: number): string => {
    if (strength === 0) return "Very Weak"
    if (strength === 1) return "Weak"
    if (strength === 2) return "Fair"
    if (strength === 3) return "Good"
    if (strength === 4) return "Strong"
    if (strength === 5) return "Very Strong"
    return "Unknown" // Default return for any other value
  }

  // Get strength color with proper type annotation and default return
  const getStrengthColor = (strength: number): string => {
    if (strength === 0) return "#ff0000"
    if (strength === 1) return "#ff4500"
    if (strength === 2) return "#ffa500"
    if (strength === 3) return "#ffff00"
    if (strength === 4) return "#9acd32"
    if (strength === 5) return "#008000"
    return "#666666" // Default return for any other value
  }

  const passwordStrength = calculatePasswordStrength(formData.password);
  const strengthLabel = getStrengthLabel(passwordStrength);
  const strengthColor = getStrengthColor(passwordStrength);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple email regex
    return emailRegex.test(email);
  };

  const validateName = (name: string): boolean => {
    const nameRegex = /^[A-Za-z\s]+$/;  // Only letters and spaces allowed
    return nameRegex.test(name) && name.trim().length > 2;
  };

  const validatePassword = (password: string): { isValid: boolean; error: string } => {
    if (!password.trim()) {
      return { isValid: false, error: "Password is required" };
    }
    if (password.length < 8) {
      return { isValid: false, error: "Password must be at least 8 characters" };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: "Password must contain at least one capital letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, error: "Password must contain at least one number" };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return { isValid: false, error: "Password must contain at least one special character" };
    }
    return { isValid: true, error: "" };
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (!validateName(formData.name)) {
      if (formData.name.trim().length <= 2) {
        newErrors.name = "Name must be longer than 2 characters";
      } else {
        newErrors.name = "Name can only contain letters and spaces";
      }
      isValid = false;
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error;
      isValid = false;
    }

    // Validate confirm password
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const showAlert = (title: string, message: string, onClose = () => {}) => {
    setAlertConfig({ title, message, onClose });
    setAlertVisible(true);
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await register(
        formData.email.trim(),
        formData.password.trim(),
        'intern',
        formData.name.trim()
      );

      if (error) {
        if (error.message === 'Email already registered') {
          showAlert(
            "Registration Failed",
            "This email is already registered. Please use a different email or try logging in."
          );
          return;
        }
        return;
      }

      showAlert(
        "Registration Successful",
        "Your account has been created successfully. Please log in.",
        () => router.push("/screens/LoginScreen")
      );
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
      {/* Updated header with LinearGradient like the role selection screen */}
      <LinearGradient
        colors={['#808080', 'rgba(128, 128, 128, 0)']}
        style={styles.headerContainer}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image source={lImage} style={styles.logo} /> 
          <Text style={styles.appName}>Registration</Text>
        </View>
        <View style={styles.placeholderView} />
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join InternConnect and start your journey</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={[styles.inputWrapper, errors.name ? styles.inputError : null]}>
                  <Feather name="user" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#666"
                    value={formData.name}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
                  />
                </View>
                {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
                  <Feather name="mail" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#666"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
                  />
                </View>
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                  <Feather name="lock" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, password: text }))}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                {formData.password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <Text style={styles.strengthLabel}>Password Strength: </Text>
                    <Text style={[styles.strengthValue, { color: strengthColor }]}>{strengthLabel}</Text>
                    <View style={styles.strengthBarContainer}>
                      <View
                        style={[
                          styles.strengthBar,
                          { width: `${(passwordStrength / 5) * 100}%`, backgroundColor: strengthColor },
                        ]}
                      />
                    </View>
                  </View>
                )}

                {formData.password.length > 0 && (
                  <View style={styles.passwordRequirements}>
                    <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                    <View style={styles.requirementItem}>
                      <Feather
                        name={formData.password.length >= 8 ? "check-circle" : "circle"}
                        size={16}
                        color={formData.password.length >= 8 ? "#4CAF50" : "#666"}
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          { color: formData.password.length >= 8 ? "#4CAF50" : "#666" },
                        ]}
                      >
                        At least 8 characters
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Feather
                        name={/[a-z]/.test(formData.password) ? "check-circle" : "circle"}
                        size={16}
                        color={/[a-z]/.test(formData.password) ? "#4CAF50" : "#666"}
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          { color: /[a-z]/.test(formData.password) ? "#4CAF50" : "#666" },
                        ]}
                      >
                        At least one lowercase letter
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Feather
                        name={/[A-Z]/.test(formData.password) ? "check-circle" : "circle"}
                        size={16}
                        color={/[A-Z]/.test(formData.password) ? "#4CAF50" : "#666"}
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          { color: /[A-Z]/.test(formData.password) ? "#4CAF50" : "#666" },
                        ]}
                      >
                        At least one uppercase letter
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Feather
                        name={/[0-9]/.test(formData.password) ? "check-circle" : "circle"}
                        size={16}
                        color={/[0-9]/.test(formData.password) ? "#4CAF50" : "#666"}
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          { color: /[0-9]/.test(formData.password) ? "#4CAF50" : "#666" },
                        ]}
                      >
                        At least one number
                      </Text>
                    </View>
                    <View style={styles.requirementItem}>
                      <Feather
                        name={/[^A-Za-z0-9]/.test(formData.password) ? "check-circle" : "circle"}
                        size={16}
                        color={/[^A-Za-z0-9]/.test(formData.password) ? "#4CAF50" : "#666"}
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          { color: /[^A-Za-z0-9]/.test(formData.password) ? "#4CAF50" : "#666" },
                        ]}
                      >
                        At least one special character
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputWrapper, errors.confirmPassword ? styles.inputError : null]}>
                  <Feather name="lock" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showConfirmPassword}
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, confirmPassword: text }))}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                ) : null}
                {formData.confirmPassword && formData.password && formData.confirmPassword === formData.password ? (
                  <View style={styles.matchContainer}>
                    <Feather name="check-circle" size={16} color="#4CAF50" />
                    <Text style={styles.matchText}>Passwords match</Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.createAccountButton, isLoading && styles.createAccountButtonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.createAccountButtonContent}>
                    <Text style={styles.createAccountButtonText}>Create Account</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account?</Text>
                  <TouchableOpacity onPress={() => router.push("/screens/LoginScreen")}>
                    <Text style={styles.loginLink}>Log in</Text>
                  </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  // Updated header styles to match role selection screen
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: "#E91E63",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: "#E91E63",
    fontSize: 14,
    marginTop: 4,
  },
  createAccountButton: {
    backgroundColor: "#0077b5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  createAccountButtonDisabled: {
    backgroundColor: "rgba(0, 119, 181, 0.5)",
  },
  createAccountButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  createAccountButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: "#0077b5",
    fontSize: 14,
    fontWeight: "600",
  },
  // Password strength styles
  strengthContainer: {
    marginTop: 12,
  },
  strengthLabel: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 4,
  },
  strengthValue: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  strengthBarContainer: {
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    overflow: "hidden",
  },
  strengthBar: {
    height: "100%",
  },
  passwordRequirements: {
    marginTop: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    marginLeft: 8,
  },
  matchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  matchText: {
    color: "#4CAF50",
    fontSize: 14,
    marginLeft: 8,
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