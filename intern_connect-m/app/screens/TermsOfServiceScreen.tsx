"use client"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsOfServiceScreen() {
  const router = useRouter()
  const lImage = require("../../assets/image/L.png")

  return (
    <SafeAreaView style={styles.container}>
      {/* Updated header with LinearGradient like the other screens */}
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image source={lImage} style={styles.headerLogo} />
            <Text style={styles.headerTitle}>Terms of Service</Text>
          </View>
          {/* Empty view for balanced spacing */}
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.lastUpdated}>Last Updated: March 5, 2025</Text>

          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            Welcome to InternConnect. These Terms of Service ("Terms") govern your use of the InternConnect platform,
            including our website, mobile applications, and related services (collectively, the "Service"). By accessing
            or using the Service, you agree to be bound by these Terms.
          </Text>

          <Text style={styles.sectionTitle}>2. Definitions</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"User"</Text> refers to any individual who accesses or uses the Service, including
            companies, organizations, interns, and applicants.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Company"</Text> refers to any business, organization, or entity that posts
            internship opportunities on the Service.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Applicant"</Text> refers to any individual who applies for internship
            opportunities through the Service.
          </Text>

          <Text style={styles.sectionTitle}>3. Account Registration</Text>
          <Text style={styles.paragraph}>
            To use certain features of the Service, you must register for an account. You agree to provide accurate,
            current, and complete information during the registration process and to update such information to keep it
            accurate, current, and complete.
          </Text>
          <Text style={styles.paragraph}>
            You are responsible for safeguarding your password and for all activities that occur under your account. You
            agree to notify us immediately of any unauthorized use of your account.
          </Text>

          <Text style={styles.sectionTitle}>4. Company Responsibilities</Text>
          <Text style={styles.paragraph}>Companies using the Service agree to:</Text>
          <Text style={styles.bulletPoint}>• Post accurate and legitimate internship opportunities</Text>
          <Text style={styles.bulletPoint}>• Comply with all applicable labor laws and regulations</Text>
          <Text style={styles.bulletPoint}>• Maintain the confidentiality of applicant information</Text>
          <Text style={styles.bulletPoint}>• Respond to applications in a timely manner</Text>
          <Text style={styles.bulletPoint}>• Provide a safe and educational internship experience</Text>

          <Text style={styles.sectionTitle}>5. Applicant Responsibilities</Text>
          <Text style={styles.paragraph}>Applicants using the Service agree to:</Text>
          <Text style={styles.bulletPoint}>• Provide accurate information in their profiles and applications</Text>
          <Text style={styles.bulletPoint}>• Attend scheduled interviews or provide timely notice of cancellation</Text>
          <Text style={styles.bulletPoint}>• Respond to communications from companies in a timely manner</Text>
          <Text style={styles.bulletPoint}>• Honor commitments made to companies regarding internship offers</Text>

          <Text style={styles.sectionTitle}>6. Prohibited Activities</Text>
          <Text style={styles.paragraph}>Users are prohibited from:</Text>
          <Text style={styles.bulletPoint}>• Using the Service for any illegal purpose</Text>
          <Text style={styles.bulletPoint}>• Posting false, misleading, or fraudulent content</Text>
          <Text style={styles.bulletPoint}>• Harassing, threatening, or intimidating other users</Text>
          <Text style={styles.bulletPoint}>• Attempting to gain unauthorized access to the Service</Text>
          <Text style={styles.bulletPoint}>• Using the Service to distribute spam or malware</Text>
          <Text style={styles.bulletPoint}>• Scraping or collecting data from the Service without permission</Text>

          <Text style={styles.sectionTitle}>7. Content Ownership</Text>
          <Text style={styles.paragraph}>
            Users retain ownership of the content they submit to the Service. By submitting content, you grant
            InternConnect a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish,
            translate, and distribute such content in connection with providing the Service.
          </Text>

          <Text style={styles.sectionTitle}>8. Privacy</Text>
          <Text style={styles.paragraph}>
            Our Privacy Policy, available at internconnect.com/privacy, describes how we collect, use, and share
            information about you when you use the Service. By using the Service, you consent to the collection, use,
            and sharing of your information as described in the Privacy Policy.
          </Text>

          <Text style={styles.sectionTitle}>9. Termination</Text>
          <Text style={styles.paragraph}>
            We reserve the right to suspend or terminate your access to the Service at any time, with or without cause,
            and with or without notice. Upon termination, your right to use the Service will immediately cease.
          </Text>

          <Text style={styles.sectionTitle}>10. Disclaimers</Text>
          <Text style={styles.paragraph}>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS WILL BE
            CORRECTED, OR THAT THE SERVICE OR THE SERVERS THAT MAKE IT AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL
            COMPONENTS.
          </Text>

          <Text style={styles.sectionTitle}>11. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            IN NO EVENT WILL INTERNCONNECT, ITS AFFILIATES, OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS,
            OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN
            CONNECTION WITH YOUR USE OF THE SERVICE, INCLUDING ANY DIRECT, INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL,
            OR PUNITIVE DAMAGES.
          </Text>

          <Text style={styles.sectionTitle}>12. Indemnification</Text>
          <Text style={styles.paragraph}>
            You agree to defend, indemnify, and hold harmless InternConnect and its affiliates from and against any
            claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees arising out of or relating
            to your violation of these Terms or your use of the Service.
          </Text>

          <Text style={styles.sectionTitle}>13. Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms and your use of the Service shall be governed by and construed in accordance with the laws of
            the United States, without giving effect to any choice or conflict of law provision or rule.
          </Text>

          <Text style={styles.sectionTitle}>14. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We may revise these Terms from time to time. The most current version will always be posted on our website.
            By continuing to use the Service after revisions become effective, you agree to be bound by the revised
            Terms.
          </Text>

          <Text style={styles.sectionTitle}>15. Contact Information</Text>
          <Text style={styles.paragraph}>If you have any questions about these Terms, please contact us at:</Text>
          <Text style={styles.contactInfo}>
            InternConnect, Inc.{"\n"}
            King Salman Road{"\n"}
            Eastern Province, Khobar 94107{"\n"}
            support@internconnect.com{"\n"}
            (555) 123-4567
          </Text>
        </View>

        <View style={styles.acceptanceSection}>
          <Text style={styles.acceptanceText}>
            By using the InternConnect platform, you acknowledge that you have read, understood, and agree to be bound
            by these Terms of Service.
          </Text>

          <TouchableOpacity style={styles.acceptButton} onPress={() => router.back()}>
            <Text style={styles.acceptButtonText}>I Understand and Accept</Text>
          </TouchableOpacity>
        </View>
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
  lastUpdated: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    marginTop: 24,
  },
  paragraph: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 16,
    lineHeight: 24,
  },
  bulletPoint: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 8,
    marginLeft: 16,
    lineHeight: 24,
  },
  bold: {
    fontWeight: "bold",
    color: "#fff",
  },
  contactInfo: {
    fontSize: 16,
    color: "#ccc",
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 24,
    marginLeft: 16,
  },
  acceptanceSection: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "#333",
  },
  acceptanceText: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  acceptButton: {
    backgroundColor: "#0095ff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
})

