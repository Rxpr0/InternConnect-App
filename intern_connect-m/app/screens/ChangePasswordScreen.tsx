"use client"
import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"

const lImage = require("../../assets/image/L.png")

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

export default function ChangePasswordScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onClose: () => {} });

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

  const passwordStrength = calculatePasswordStrength(newPassword)
  const strengthLabel = getStrengthLabel(passwordStrength)
  const strengthColor = getStrengthColor(passwordStrength)

  const showAlert = (title: string, message: string, onClose = () => {}) => {
    setAlertConfig({ title, message, onClose });
    setAlertVisible(true);
  };

  const validateForm = (): boolean => {
    // Reset all errors
    setErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    // Validate current password
    if (!currentPassword.trim()) {
      setErrors(prev => ({ ...prev, currentPassword: "Current password is required" }));
      showAlert("Error", "Current password is required");
      return false;
    }

    // Validate new password
    if (!newPassword.trim()) {
      setErrors(prev => ({ ...prev, newPassword: "New password is required" }));
      showAlert("Error", "New password is required");
      return false;
    }

    if (newPassword.length < 8) {
      setErrors(prev => ({ ...prev, newPassword: "Password must be at least 8 characters" }));
      showAlert("Error", "Password must be at least 8 characters");
      return false;
    }

    if (passwordStrength < 3) {
      setErrors(prev => ({ ...prev, newPassword: "Password is too weak" }));
      showAlert("Error", "Password is too weak. Please ensure it meets all requirements");
      return false;
    }

    // Check if new password is same as current
    if (newPassword === currentPassword && newPassword.trim()) {
      setErrors(prev => ({ ...prev, newPassword: "New password must be different from current password" }));
      showAlert("Error", "New password must be different from current password");
      return false;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setErrors(prev => ({ ...prev, confirmPassword: "Please confirm your new password" }));
      showAlert("Error", "Please confirm your new password");
      return false;
    }

    if (confirmPassword !== newPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      showAlert("Error", "New password and confirmation password do not match");
      return false;
    }

    return true;
  }

  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        showAlert(
          "Error",
          "Current password is incorrect. Please try again."
        );
        setErrors(prev => ({
          ...prev,
          currentPassword: "Current password is incorrect"
        }));
        setIsSubmitting(false);
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        showAlert(
          "Error",
          "Failed to update password. Please try again later."
        );
        return;
      }

      // Show success message
      showAlert(
        "Success",
        "Your password has been updated successfully.",
        () => {
          router.back();
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }
      );

    } catch (error) {
      console.error('Error updating password:', error);
      showAlert(
        "Error",
        "An unexpected error occurred. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
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
      {/* Updated header with LinearGradient like the other screens */}
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image source={lImage} style={styles.headerLogo} />
            <Text style={styles.headerTitle}>Change Password</Text>
          </View>
          {/* Empty view for balanced spacing */}
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView style={styles.content}>
          <View style={styles.formContainer}>
            <Text style={styles.formDescription}>
              Create a strong password to protect your account. A strong password should include a mix of letters,
              numbers, and special characters.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor="#666"
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  <Feather name={showCurrentPassword ? "eye-off" : "eye"} size={20} color="#666" />
                </TouchableOpacity>
              </View>
              {errors.currentPassword ? <Text style={styles.errorText}>{errors.currentPassword}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#666"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Feather name={showNewPassword ? "eye-off" : "eye"} size={20} color="#666" />
                </TouchableOpacity>
              </View>
              {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}

              {newPassword.length > 0 && (
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

              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <View style={styles.requirementItem}>
                  <Feather
                    name={newPassword.length >= 8 ? "check-circle" : "circle"}
                    size={16}
                    color={newPassword.length >= 8 ? "#4CAF50" : "#666"}
                  />
                  <Text style={[styles.requirementText, { color: newPassword.length >= 8 ? "#4CAF50" : "#666" }]}>
                    At least 8 characters
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <Feather
                    name={/[a-z]/.test(newPassword) ? "check-circle" : "circle"}
                    size={16}
                    color={/[a-z]/.test(newPassword) ? "#4CAF50" : "#666"}
                  />
                  <Text style={[styles.requirementText, { color: /[a-z]/.test(newPassword) ? "#4CAF50" : "#666" }]}>
                    At least one lowercase letter
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <Feather
                    name={/[A-Z]/.test(newPassword) ? "check-circle" : "circle"}
                    size={16}
                    color={/[A-Z]/.test(newPassword) ? "#4CAF50" : "#666"}
                  />
                  <Text style={[styles.requirementText, { color: /[A-Z]/.test(newPassword) ? "#4CAF50" : "#666" }]}>
                    At least one uppercase letter
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <Feather
                    name={/[0-9]/.test(newPassword) ? "check-circle" : "circle"}
                    size={16}
                    color={/[0-9]/.test(newPassword) ? "#4CAF50" : "#666"}
                  />
                  <Text style={[styles.requirementText, { color: /[0-9]/.test(newPassword) ? "#4CAF50" : "#666" }]}>
                    At least one number
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <Feather
                    name={/[^A-Za-z0-9]/.test(newPassword) ? "check-circle" : "circle"}
                    size={16}
                    color={/[^A-Za-z0-9]/.test(newPassword) ? "#4CAF50" : "#666"}
                  />
                  <Text
                    style={[styles.requirementText, { color: /[^A-Za-z0-9]/.test(newPassword) ? "#4CAF50" : "#666" }]}
                  >
                    At least one special character
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#666"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#666" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              {confirmPassword && newPassword && confirmPassword === newPassword ? (
                <View style={styles.matchContainer}>
                  <Feather name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.matchText}>Passwords match</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Updating...</Text>
              ) : (
                <Text style={styles.submitButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>

            <View style={styles.securityTipContainer}>
              <Feather name="shield" size={20} color="#0095ff" />
              <Text style={styles.securityTipText}>
                Security Tip: Never share your password with anyone, including InternConnect staff. We will never ask
                for your password.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerContainer: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  headerTitle: {
    color: "#000",
    fontSize: 24,
    fontWeight: "600",
  },
  placeholderView: {
    width: 28, // Same width as the back button for balance
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  formDescription: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 24,
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  errorText: {
    color: "#E91E63",
    fontSize: 14,
    marginTop: 4,
  },
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
  submitButton: {
    backgroundColor: "#0095ff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: "#0095ff80",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  securityTipContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 149, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "rgba(0, 149, 255, 0.3)",
    alignItems: "flex-start",
  },
  securityTipText: {
    color: "#ccc",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
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
})

