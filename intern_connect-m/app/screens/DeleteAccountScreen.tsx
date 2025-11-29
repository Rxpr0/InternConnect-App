"use client"
import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"

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

export default function DeleteAccountScreen() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const lImage = require("../../assets/image/L.png")

  const [password, setPassword] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({
    password: "",
    confirmText: "",
  })
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onClose: () => {} })

  const showAlert = (title: string, message: string, onClose = () => {}) => {
    setAlertConfig({ title, message, onClose })
    setAlertVisible(true)
  }

  const validateStep1 = async () => {
    let isValid = true
    const newErrors = { password: "", confirmText: "" }

    if (!password.trim()) {
      newErrors.password = "Please enter your password to continue"
      isValid = false
    } else {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: password,
      })

      if (signInError) {
        newErrors.password = "Incorrect password"
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const validateStep2 = () => {
    let isValid = true
    const newErrors = { password: "", confirmText: "" }

    if (confirmText !== "DELETE") {
      newErrors.confirmText = "Please type DELETE to confirm"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleNextStep = async () => {
    if (await validateStep1()) {
      setStep(2)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setErrors({ password: "", confirmText: "" });

      if (!user?.email) {
        throw new Error('No user email found');
      }

      // First verify the password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (signInError) {
        throw new Error('Incorrect password');
      }

      // Delete user data based on role
      if (user?.role === 'intern') {
        const { error: internError } = await supabase
          .from('intern_profiles')
          .delete()
          .eq('id', user.id);

        if (internError) throw internError;
      } else if (user?.role === 'company') {
        const { error: companyError } = await supabase
          .from('company_profiles')
          .delete()
          .eq('id', user.id);

        if (companyError) throw companyError;
      }

      // Delete the auth user using client method
      const { error: deleteError } = await supabase.rpc('delete_user');

      if (deleteError) throw deleteError;

      // Sign out after successful deletion
      await signOut();
      showAlert('Success', 'Your account has been deleted successfully.');
      router.replace('/');

    } catch (error: any) {
      console.error('Error deleting account:', error);
      setErrors({ password: "", confirmText: "" });
      showAlert('Error', `Error deleting account: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertVisible(false)
          alertConfig.onClose()
        }}
      />
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image source={lImage} style={styles.headerLogo} />
            <Text style={styles.headerTitle}>Delete Account</Text>
          </View>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <View style={styles.section}>
            <View style={styles.warningContainer}>
              <Feather name="alert-triangle" size={32} color="#E91E63" style={styles.warningIcon} />
              <Text style={styles.warningTitle}>Delete Your Account</Text>
              <Text style={styles.warningText}>
                We're sorry to see you go. Before you proceed, please understand what deleting your account means:
              </Text>
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Feather name="x-circle" size={20} color="#E91E63" />
                <Text style={styles.infoText}>
                  Your profile, applications, and all personal data will be permanently deleted
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Feather name="x-circle" size={20} color="#E91E63" />
                <Text style={styles.infoText}>
                  You will lose access to all internship applications and communications
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Feather name="x-circle" size={20} color="#E91E63" />
                <Text style={styles.infoText}>
                  This action cannot be undone - you'll need to create a new account if you wish to use InternConnect
                  again
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Feather name="clock" size={20} color="#FFC107" />
                <Text style={styles.infoText}>
                  Some information may be retained for legal purposes for up to 30 days after deletion
                </Text>
              </View>
            </View>

            <View style={styles.passwordSection}>
              <Text style={styles.sectionTitle}>Verify Your Identity</Text>
              <Text style={styles.sectionDescription}>
                Please enter your password to confirm your identity before proceeding.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>

              <TouchableOpacity style={styles.continueButton} onPress={handleNextStep}>
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.finalWarningContainer}>
              <Feather name="alert-octagon" size={48} color="#E91E63" style={styles.warningIcon} />
              <Text style={styles.finalWarningTitle}>Final Confirmation</Text>
              <Text style={styles.finalWarningText}>
                This action is permanent and cannot be undone. All your data will be deleted from our systems.
              </Text>
            </View>

            <View style={styles.confirmationContainer}>
              <Text style={styles.confirmationText}>
                To confirm account deletion, please type "DELETE" in the field below:
              </Text>

              <TextInput
                style={styles.confirmInput}
                placeholder="Type DELETE here"
                placeholderTextColor="#666"
                value={confirmText}
                onChangeText={setConfirmText}
                autoCapitalize="characters"
              />

              {errors.confirmText ? <Text style={styles.errorText}>{errors.confirmText}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              onPress={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <View style={styles.deleteButtonContent}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.deleteButtonText}>Deleting Account...</Text>
                </View>
              ) : (
                <View style={styles.deleteButtonContent}>
                  <Feather name="trash-2" size={20} color="#fff" />
                  <Text style={styles.deleteButtonText}>Delete My Account</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.goBackButton} onPress={() => setStep(1)} disabled={isDeleting}>
              <Text style={styles.goBackButtonText}>Go Back</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isDeleting}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  warningContainer: {
    backgroundColor: "rgba(233, 30, 99, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.3)",
  },
  warningIcon: {
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E91E63",
    marginBottom: 8,
    textAlign: "center",
  },
  warningText: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 24,
  },
  infoContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333",
  },
  infoItem: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  infoText: {
    fontSize: 15,
    color: "#ccc",
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  passwordSection: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 15,
    color: "#ccc",
    marginBottom: 16,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 16,
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
    backgroundColor: "#333",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
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
  continueButton: {
    backgroundColor: "#E91E63",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#333",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  finalWarningContainer: {
    backgroundColor: "rgba(233, 30, 99, 0.15)",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.4)",
  },
  finalWarningTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#E91E63",
    marginBottom: 12,
    textAlign: "center",
  },
  finalWarningText: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 24,
  },
  confirmationContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333",
  },
  confirmationText: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 16,
    lineHeight: 24,
  },
  confirmInput: {
    backgroundColor: "#333",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    padding: 12,
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 2,
  },
  deleteButton: {
    backgroundColor: "#E91E63",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  deleteButtonDisabled: {
    backgroundColor: "rgba(233, 30, 99, 0.5)",
  },
  deleteButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  goBackButton: {
    backgroundColor: "#333",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  goBackButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  supportSection: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "#333",
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  supportText: {
    fontSize: 15,
    color: "#ccc",
    marginBottom: 16,
    lineHeight: 22,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  supportButtonText: {
    color: "#0095ff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContainer: {
    backgroundColor: '#4d0000',
    padding: 20,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButton: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ffffff',
    minWidth: 80,
  },
  alertButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})

