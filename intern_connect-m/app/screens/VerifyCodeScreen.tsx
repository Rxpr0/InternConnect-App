import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

const lImage = require("../../assets/image/L.png");

export default function VerifyCodeScreen() {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { verifyResetCode } = useAuth();
  const { email, code } = useLocalSearchParams();

  const handleVerifyCode = async () => {
    if (!email) {
      setError("Email is required for verification");
      return;
    }

    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    if (verificationCode.length !== 6) {
      setError("Please enter all 6 digits of the code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await verifyResetCode(email as string, verificationCode.trim());

      if (response.success && response.user) {
        router.push({
          pathname: "/screens/ResetPasswordScreen",
          params: { email: email as string }
        });
      } else {
        setError("Invalid or expired code.");
      }
    } catch (err: any) {
      setError("An error occurred. Please try again.");
      return false;
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
            <Text style={styles.headerTitle}>Verify Code</Text>
          </View>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Enter Verification Code</Text>
          <View style={styles.titleLine} />

          <Text style={styles.instructions}>
            Please enter the 6-digit verification code sent to your email.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={6}
              value={verificationCode}
              onChangeText={setVerificationCode}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleVerifyCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify Code</Text>
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
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 24,
    width: "100%",
    textAlign: "center",
    letterSpacing: 8,
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
  }
}); 