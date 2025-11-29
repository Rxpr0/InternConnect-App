"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions, Modal } from "react-native"
import { useRouter } from "expo-router"
import { Feather } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import * as Linking from 'expo-linking';

const lImage = require("../../assets/image/L.png")
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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { resetPassword } = useAuth()
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onClose: () => {} })
  const [error, setError] = useState("")

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const showAlert = (title: string, message: string, onClose = () => {}) => {
    setAlertConfig({ title, message, onClose });
    setAlertVisible(true);
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await resetPassword(email.trim());
      router.push({
        pathname: "/screens/VerifyCodeScreen",
        params: { email: email.trim() }
      });
    } catch (err) {
      setError("Failed to send verification code. Please try again.");
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
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image 
              source={lImage} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Forgot Password</Text>
          </View>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Reset Your Password</Text>
          <View style={styles.titleLine} />

          <Text style={styles.instructions}>
            Enter your email address and we'll send you a verification code to reset your password.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleSendCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Verification Code</Text>
            )}
          </TouchableOpacity>

        </View>
      </View>
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
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
    resizeMode: 'contain',
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  titleLine: {
    width: "100%",
    height: 1,
    backgroundColor: "#333",
    marginBottom: 24,
  },
  instructions: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 24,
  },
  label: {
    color: "#fff",
    fontSize: 15,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 15,
    width: "100%",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#0095ff",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  backLink: {
    marginTop: 16,
  },
  backLinkText: {
    color: "#0095ff",
    fontSize: 15,
    textAlign: "center",
  },
  buttonDisabled: {
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
})

