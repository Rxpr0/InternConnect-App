"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { Feather } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

const lImage = require("../../assets/image/L.png")

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { updatePassword } = useAuth()
  const { email } = useLocalSearchParams()

  const validatePassword = () => {
    if (!newPassword.trim()) {
      setError("Please enter a new password");
      return false;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await updatePassword(newPassword.trim());
      // Show success message and redirect to login
      router.push("/screens/LoginScreen");
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image source={lImage} style={styles.logo} />
            <Text style={styles.headerTitle}>Reset Password</Text>
          </View>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Set New Password</Text>
          <View style={styles.titleLine} />

          <Text style={styles.instructions}>
            Please enter your new password below.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#666"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#666"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
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
  },
  headerTitle: {
    color: "#000",
    fontSize: 24,
    fontWeight: "600",
  },
  placeholderView: {
    width: 28,
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
    borderRadius: 8,
    marginTop: 8,
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

