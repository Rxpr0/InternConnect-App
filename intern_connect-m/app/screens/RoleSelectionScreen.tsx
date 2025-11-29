import { useState } from "react"
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity, 
  Image, 
  Animated, 
  ScrollView,
  Dimensions
} from "react-native"
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from "@expo/vector-icons/Feather"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { StatusBar } from 'react-native'

const lImage = require("../../assets/image/L.png");
const windowHeight = Dimensions.get('window').height;

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"student" | "company" | null>(null)
  const [studentScale] = useState(new Animated.Value(1))
  const [companyScale] = useState(new Animated.Value(1))

  const handleRoleSelect = (role: "student" | "company") => {
    setSelectedRole(role)
    router.push(role === "student" ? "/screens/RegisterScreen" : "/screens/CompanyRegistrationScreen")
  }

  const handleGoBack = () => {
    router.back();
  }

  const animatePress = (scale: Animated.Value) => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start()
  }

  return (
    <> 
      {/* StatusBar for light content on dark background */}
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#808080', 'rgba(128, 128, 128, 0)']}
          style={styles.headerContainer}
        >
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image source={lImage} style={styles.logo} /> 
            <Text style={styles.appName}>Role Selection</Text>
          </View>
          <View style={styles.placeholderView} />
        </LinearGradient>

        <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Select how you want to use InternConnect. You can always change this later in settings.
          </Text>

          <View style={styles.cardsContainer}>
            {/* Intern Card */}
            <Animated.View style={{ transform: [{ scale: studentScale }] }}>
              <TouchableOpacity
                style={[styles.card, selectedRole === "student" && styles.selectedCard]}
                onPress={() => {
                  animatePress(studentScale)
                  handleRoleSelect("student")
                }}
                activeOpacity={0.9}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Feather name="book" size={32} color="#0077b5" />
                  </View>
                  <Text style={styles.cardTitle}>Intern</Text>
                </View>
                <Text style={styles.cardDescription}>
                  Find internships, build your profile, and connect with companies
                </Text>
                <View style={styles.benefitsContainer}>
                  <View style={styles.benefitItem}>
                    <Feather name="book-open" size={16} color="#666" />
                    <Text style={styles.benefitText}>Access to learning resources</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Feather name="users" size={16} color="#666" />
                    <Text style={styles.benefitText}>Network with professionals</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Feather name="award" size={16} color="#666" />
                    <Text style={styles.benefitText}>Earn certifications</Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <TouchableOpacity 
                    style={styles.getStartedButton} 
                    onPress={() => router.push("/screens/RegisterScreen")}
                  >
                    <Text style={styles.getStarted}>Get Started</Text>
                    <Feather name="chevron-right" size={20} color="#0077b5" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Company Card */}
            <Animated.View style={{ transform: [{ scale: companyScale }] }}>
              <TouchableOpacity
                style={[styles.card, selectedRole === "company" && styles.selectedCard]}
                onPress={() => {
                  animatePress(companyScale)
                  handleRoleSelect("company")
                }}
                activeOpacity={0.9}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Feather name="briefcase" size={32} color="#0077b5" />
                  </View>
                  <Text style={styles.cardTitle}>Company</Text>
                </View>
                <Text style={styles.cardDescription}>
                  Post internship opportunities and find talented students
                </Text>
                <View style={styles.benefitsContainer}>
                  <View style={styles.benefitItem}>
                    <Feather name="users" size={16} color="#666" />
                    <Text style={styles.benefitText}>Access talent pool</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Feather name="briefcase" size={16} color="#666" />
                    <Text style={styles.benefitText}>Post unlimited positions</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Feather name="award" size={16} color="#666" />
                    <Text style={styles.benefitText}>Brand promotion</Text>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <TouchableOpacity 
                    style={styles.getStartedButton} 
                    onPress={() => router.push("/screens/CompanyRegistrationScreen")}
                  >
                    <Text style={styles.getStarted}>Get Started</Text>
                    <Feather name="chevron-right" size={20} color="#0077b5" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Text style={styles.footer}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#000" 
  },
  headerContainer: {
    paddingTop: 10,
     paddingBottom: 20, 
     paddingHorizontal: 20,
    borderBottomWidth: 1,
     borderBottomColor: '#000',
    flexDirection: 'row',
     alignItems: 'center',
      justifyContent: 'space-between',
  },
  backButton: {
     padding: 0
     },
  headerCenter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center'
   },
  placeholderView: {
     width: 40 
    },
  logo: { 
    width: 50,
     height: 50,
      marginRight: 10
     },
  appName: { 
    color: '#000',
     fontSize: 26,
      fontWeight: '600'
     },
  content: { 
    flex: 1, 
    padding: 24 
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold",
     color: "#fff",
      marginBottom: 12 
    },
  subtitle: { 
    fontSize: 16, 
    color: "#666",
     marginBottom: 32,
      lineHeight: 24
     },
  cardsContainer: {
     gap: 20 
    },
  card: { 
    backgroundColor: "#1a1a1a",
     borderRadius: 16,
     padding: 24,
      borderWidth: 1,
       borderColor: "#333" 
      },
  selectedCard: { 
    borderColor: "#0077b5",
     backgroundColor: "#1a1a1a"
     },
  cardHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 16
   },
  iconContainer: {
     width: 56, 
     height: 56, 
     borderRadius: 28,
      backgroundColor: "rgba(0, 119, 181, 0.1)",
       justifyContent: "center", 
       alignItems: "center",
        marginRight: 16
       },
  cardTitle: { 
    fontSize: 24, 
    fontWeight: "bold",
     color: "#fff"
     },
  cardDescription: { 
    fontSize: 16,
     color: "#666", 
     marginBottom: 24,
      lineHeight: 24 
    },
  benefitsContainer: { 
    gap: 12, 
    marginBottom: 24
   },
  benefitItem: { 
    flexDirection: "row",
     alignItems: "center",
      gap: 12 
    },
  benefitText: { 
    color: "#666", 
    fontSize: 14 
  },
  cardFooter: { 
    flexDirection: "row",
     alignItems: "center",
      justifyContent: "space-between",
       paddingTop: 16,
       borderTopWidth: 1,
        borderTopColor: "#333" 
      },
  getStartedButton: { 
    flexDirection: "row", 
    alignItems: "center"
   },
  getStarted: { 
    color: "#0077b5",
     fontSize: 16,
      fontWeight: "600"
     },
  footer: {
     color: "#666", 
     fontSize: 12,
      textAlign: "center", 
      marginTop: 32, 
      marginBottom: 16 
    },
})