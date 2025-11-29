import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from "react-native";
import { useRouter } from "expo-router"; // Import Link for navigation
import { SafeAreaView } from 'react-native-safe-area-context';


const { width } = Dimensions.get("window");
const IMAGE_SIZE = Math.min(width * 0.7, 250);

export default function HomePage() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.centerContainer}>
          <Image source={require("../../assets/image/L.png")} style={styles.networkImage} resizeMode="contain" />
          <Text style={styles.title}>
            Welcome to{"\n"}
            <Text>InternConnect</Text>
          </Text>
          <Text style={styles.subtitle}>
            Your gateway to exciting internship{"\n"}opportunities and professional growth.
          </Text>
            <TouchableOpacity style= {styles.button} onPress={() => router.push("/screens/RoleSelectionScreen")}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // Dark background
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  centerContainer: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 24,
  },
  networkImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 40,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 48,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#90D5FF",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: "100%",
    maxWidth: 300,
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});