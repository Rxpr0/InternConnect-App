"use client"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
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
            <Text style={styles.headerTitle}>Privacy Policy</Text>
          </View>
          {/* Empty view for balanced spacing */}
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.lastUpdated}>Last Updated: March 20, 2025</Text>

          <Text style={styles.introText}>
            At InternConnect, we take your privacy seriously. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our platform. Please read this privacy policy
            carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
          </Text>

          <Text style={styles.sectionTitle}>1. Information We Collect</Text>

          <Text style={styles.subSectionTitle}>1.1 Personal Information</Text>
          <Text style={styles.paragraph}>
            We may collect personal information that you voluntarily provide to us when you:
          </Text>
          <Text style={styles.bulletPoint}>• Register for an account</Text>
          <Text style={styles.bulletPoint}>• Complete your profile</Text>
          <Text style={styles.bulletPoint}>• Apply for internships</Text>
          <Text style={styles.bulletPoint}>• Post internship opportunities</Text>
          <Text style={styles.bulletPoint}>• Contact our support team</Text>
          <Text style={styles.paragraph}>This information may include:</Text>
          <Text style={styles.bulletPoint}>• Name, email address, and phone number</Text>
          <Text style={styles.bulletPoint}>• Educational background and work experience</Text>
          <Text style={styles.bulletPoint}>• Resume, cover letters, and portfolio materials</Text>
          <Text style={styles.bulletPoint}>• Profile photos and other images you upload</Text>
          <Text style={styles.bulletPoint}>• Company information (for employers)</Text>

          <Text style={styles.subSectionTitle}>1.2 Automatically Collected Information</Text>
          <Text style={styles.paragraph}>
            When you access our platform, we may automatically collect certain information about your device, including:
          </Text>
          <Text style={styles.bulletPoint}>• Device type, operating system, and browser type</Text>
          <Text style={styles.bulletPoint}>• IP address and geographic location</Text>
          <Text style={styles.bulletPoint}>• Usage patterns and interaction with features</Text>
          <Text style={styles.bulletPoint}>• Time spent on the platform and pages visited</Text>
          <Text style={styles.bulletPoint}>• Referring websites or applications</Text>

          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We may use the information we collect for various purposes, including to:
          </Text>
          <Text style={styles.bulletPoint}>• Create and manage your account</Text>
          <Text style={styles.bulletPoint}>• Connect applicants with appropriate internship opportunities</Text>
          <Text style={styles.bulletPoint}>• Facilitate communication between companies and applicants</Text>
          <Text style={styles.bulletPoint}>• Improve and optimize our platform and services</Text>
          <Text style={styles.bulletPoint}>• Send you notifications, updates, and promotional materials</Text>
          <Text style={styles.bulletPoint}>• Respond to your inquiries and provide customer support</Text>
          <Text style={styles.bulletPoint}>• Ensure compliance with our terms of service</Text>
          <Text style={styles.bulletPoint}>• Protect against fraudulent or illegal activity</Text>

          <Text style={styles.sectionTitle}>3. Sharing Your Information</Text>
          <Text style={styles.paragraph}>We may share your information in the following situations:</Text>

          <Text style={styles.subSectionTitle}>3.1 With Companies and Applicants</Text>
          <Text style={styles.paragraph}>
            When you apply for an internship, your profile information, resume, and application materials will be shared
            with the company offering the position. Similarly, when companies post internship opportunities, certain
            company information will be visible to potential applicants.
          </Text>

          <Text style={styles.subSectionTitle}>3.2 With Service Providers</Text>
          <Text style={styles.paragraph}>
            We may share your information with third-party vendors, service providers, and contractors who perform
            services for us or on our behalf, such as data analysis, payment processing, email delivery, hosting
            services, and customer service.
          </Text>

          <Text style={styles.subSectionTitle}>3.3 For Business Transfers</Text>
          <Text style={styles.paragraph}>
            If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may
            be transferred as part of that transaction.
          </Text>

          <Text style={styles.subSectionTitle}>3.4 For Legal Compliance</Text>
          <Text style={styles.paragraph}>
            We may disclose your information where required by law or if we believe that such action is necessary to
            comply with legal obligations, protect our rights, or investigate potential violations of our Terms of
            Service.
          </Text>

          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate technical and organizational measures to protect the security of your personal
            information. However, please be aware that no method of transmission over the internet or electronic storage
            is 100% secure, and we cannot guarantee absolute security.
          </Text>
          <Text style={styles.paragraph}>
            We use industry-standard encryption, secure server infrastructure, and regular security assessments to
            safeguard your data. Access to your personal information is restricted to authorized personnel only.
          </Text>

          <Text style={styles.sectionTitle}>5. Your Privacy Rights</Text>
          <Text style={styles.paragraph}>
            Depending on your location, you may have certain rights regarding your personal information, including:
          </Text>
          <Text style={styles.bulletPoint}>• The right to access the personal information we have about you</Text>
          <Text style={styles.bulletPoint}>• The right to request correction of inaccurate information</Text>
          <Text style={styles.bulletPoint}>• The right to request deletion of your personal information</Text>
          <Text style={styles.bulletPoint}>• The right to restrict or object to processing of your information</Text>
          <Text style={styles.bulletPoint}>• The right to data portability</Text>
          <Text style={styles.bulletPoint}>• The right to withdraw consent at any time</Text>
          <Text style={styles.paragraph}>
            To exercise these rights, please contact us using the information provided in the "Contact Us" section
            below.
          </Text>

          <Text style={styles.sectionTitle}>6. Cookies and Tracking Technologies</Text>
          <Text style={styles.paragraph}>
            We use cookies and similar tracking technologies to collect and track information about your browsing
            activities on our platform. You can instruct your browser to refuse all cookies or to indicate when a cookie
            is being sent. However, if you do not accept cookies, you may not be able to use some portions of our
            platform.
          </Text>

          <Text style={styles.sectionTitle}>7. Third-Party Links</Text>
          <Text style={styles.paragraph}>
            Our platform may contain links to third-party websites or services that are not owned or controlled by
            InternConnect. We have no control over and assume no responsibility for the content, privacy policies, or
            practices of any third-party websites or services.
          </Text>

          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Our platform is not intended for individuals under the age of 16. We do not knowingly collect personal
            information from children under 16. If you are a parent or guardian and believe that your child has provided
            us with personal information, please contact us so that we can take necessary actions.
          </Text>

          <Text style={styles.sectionTitle}>9. International Data Transfers</Text>
          <Text style={styles.paragraph}>
            Your information may be transferred to and processed in countries other than the country in which you
            reside. These countries may have data protection laws that are different from the laws of your country. We
            take appropriate measures to ensure that your personal information remains protected in accordance with this
            Privacy Policy.
          </Text>

          <Text style={styles.sectionTitle}>10. Changes to This Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy
            Policy periodically for any changes.
          </Text>

          <Text style={styles.sectionTitle}>11. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>
            InternConnect, Inc.{"\n"}
            King Salman Road{"\n"}
            Eastern Province, Khobar 94107{"\n"}
            privacy@internconnect.com{"\n"}
            (555) 123-4567
          </Text>
        </View>

        <View style={styles.acceptanceSection}>
          <Text style={styles.acceptanceText}>
            By using the InternConnect platform, you acknowledge that you have read and understood this Privacy Policy
            and agree to its terms.
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
    marginBottom: 16,
    fontStyle: "italic",
  },
  introText: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 24,
    lineHeight: 24,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    marginTop: 24,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0095ff",
    marginBottom: 8,
    marginTop: 16,
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

