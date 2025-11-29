import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from "@expo/vector-icons";

export default function README() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image 
              source={require('../../assets/image/L.png')} 
              style={styles.appLogo} 
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Documentation</Text>
          </View>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.introductionBox}>
            <Text style={styles.introduction}>
              InternConnect is designed to bridge the gap between students seeking internships and companies offering internship opportunities. 
            </Text>
          </View>

          <Section title="🎯 Features">
            <SubSection title="For Students">
              <GroupTitle text="Account Creation & Profile Management" />
              <BulletPoint text="Create a personal account" />
              <BulletPoint text="Set up your profile with educational background and skills" />
              <BulletPoint text="Upload your resume/CV" />
              <BulletPoint text="Track your application status" />

              <GroupTitle text="Internship Search" />
              <BulletPoint text="Browse available internships" />
              <BulletPoint text="Filter by location, industry, and duration" />
              <BulletPoint text="View detailed internship descriptions" />
              <BulletPoint text="Save interesting opportunities" />
              <BulletPoint text="View recent internships (posted within the last 7 days)" />

              <GroupTitle text="Application Process" />
              <BulletPoint text="Apply directly through the app" />
              <BulletPoint text="Track application status" />
              <BulletPoint text="Receive notifications about application updates" />
              <BulletPoint text="View application history" />
            </SubSection>

            <SubSection title="For Companies">
              <GroupTitle text="Company Profile Management" />
              <BulletPoint text="Create and manage company profile" />
              <BulletPoint text="Add company description and details" />
              <BulletPoint text="Upload company logo" />
              <BulletPoint text="Manage team access" />

              <GroupTitle text="Internship Management" />
              <BulletPoint text="Post new internship opportunities" />
              <BulletPoint text="Edit existing internship posts" />
              <BulletPoint text="View and manage applications" />
              <BulletPoint text="Track applicant status" />
            </SubSection>
          </Section>

          <Section title="📱 How to Use">
            <SubSection title="For Students">
              <Text style={styles.stepTitle}>1. Getting Started</Text>
              <BulletPoint text="Download and install the app" />
              <BulletPoint text="Create a new account or sign in with existing credentials" />
              <BulletPoint text="Complete your profile setup" />

              <Text style={styles.stepTitle}>2. Finding Internships</Text>
              <BulletPoint text="Use the search bar to find specific opportunities" />
              <BulletPoint text="Apply filters to narrow down results" />
              <BulletPoint text="Browse through the 'Recent' section for new postings" />
              <BulletPoint text="Save interesting internships for later" />
              <BulletPoint text="To view a company's profile, tap on the company name in any internship listing" />

              <Text style={styles.stepTitle}>3. Applying for Internships</Text>
              <BulletPoint text="Click on an internship to view details" />
              <BulletPoint text="Click 'Apply' on internships you're interested in" />
              <BulletPoint text="Fill out the application form" />
              <BulletPoint text="Upload required documents" />
              <BulletPoint text="Submit your application" />

              <Text style={styles.stepTitle}>4. Managing Applications</Text>
              <BulletPoint text="View all your applications in the 'My Applications' section" />
              <BulletPoint text="Track the status of each application" />
              <BulletPoint text="Receive notifications about updates" />
              <BulletPoint text="View application history" />
            </SubSection>

            <SubSection title="For Companies">
              <Text style={styles.stepTitle}>1. Getting Started</Text>
              <BulletPoint text="Create a company account" />
              <BulletPoint text="Complete company profile setup" />
              <BulletPoint text="Add company details and logo" />

              <Text style={styles.stepTitle}>2. Posting Internships</Text>
              <BulletPoint text="Click 'Post New Internship'" />
              <BulletPoint text="Fill out internship details:" />
              <IndentedPoint text="Position title" />
              <IndentedPoint text="Description" />
              <IndentedPoint text="Requirements" />
              <IndentedPoint text="Duration" />
              <IndentedPoint text="Location" />
              <IndentedPoint text="Compensation (if any)" />
              <BulletPoint text="Review and publish" />

              <Text style={styles.stepTitle}>3. Managing Applications</Text>
              <BulletPoint text="View all received applications" />
              <BulletPoint text="Filter and sort applications" />
              <BulletPoint text="Update application status" />
              <BulletPoint text="Communicate with applicants" />
              <BulletPoint text="Track applicant progress" />
              <BulletPoint text="To view an applicant's profile, tap on their name in the application details" />
            </SubSection>
          </Section>

          <Section title="🔐 Account Management">
            <SubSection title="Password Reset">
              <Text style={styles.normalText}>If you forget your password:</Text>
              <Text style={styles.codeText}>
                1. Click "Forgot Password" on the login screen{'\n'}
                2. Enter your email address{'\n'}
                3. Check your email for reset instructions{'\n'}
                4. Click the reset link in the email{'\n'}
                5. Set your new password
              </Text>
            </SubSection>

            <SubSection title="Profile Updates">
              <BulletPoint text="Access profile settings through the settings icon" />
              <BulletPoint text="Update personal/company information" />
              <BulletPoint text="Change password" />
              <BulletPoint text="Manage notification preferences" />
            </SubSection>
          </Section>

          <Section title="💡 Tips for Success">
            <SubSection title="For Students">
              <BulletPoint text="Keep your profile up-to-date" />
              <BulletPoint text="Upload a professional resume" />
              <BulletPoint text="Apply to internships promptly" />
              <BulletPoint text="Check the app regularly for new opportunities" />
              <BulletPoint text="Complete all application fields thoroughly" />
            </SubSection>

            <SubSection title="For Companies">
              <BulletPoint text="Provide detailed internship descriptions" />
              <BulletPoint text="Respond to applications in a timely manner" />
              <BulletPoint text="Keep internship postings current" />
              <BulletPoint text="Update application statuses regularly" />
            </SubSection>
          </Section>

          

          <Section title="🔒 Privacy & Security">
            <BulletPoint text="All personal information is encrypted" />
            <BulletPoint text="Data is stored securely" />
            <BulletPoint text="Credentials are never shared with third parties" />
            <BulletPoint text="Regular security updates are implemented" />
          </Section>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Thank you for choosing InternConnect! We're committed to helping students and companies create meaningful internship opportunities.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.subSection}>
    <Text style={styles.subSectionTitle}>{title}</Text>
    <View style={styles.subSectionContent}>{children}</View>
  </View>
);

const BulletPoint = ({ text }: { text: string }) => (
  <View style={styles.bulletPoint}>
    <Text style={styles.bullet}>•</Text>
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

const GroupTitle = ({ text }: { text: string }) => (
  <Text style={styles.groupTitle}>{text}</Text>
);

const IndentedPoint = ({ text }: { text: string }) => (
  <View style={[styles.bulletPoint, styles.indented]}>
    <Text style={styles.bullet}>•</Text>
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerContainer: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#000',
    fontSize: 24,
    fontWeight: '600',
  },
  placeholderView: {
    width: 24,
    height: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  sectionContent: {
    marginLeft: 8,
  },
  subSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  subSectionContent: {
    marginLeft: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    color: '#fff',
    marginRight: 8,
    fontSize: 16,
  },
  bulletText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  codeText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 14,
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
  },
  introductionBox: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#d9f2ff',
  },
  introduction: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: 'System',
    fontWeight: '700',
  },
  groupTitle: {
    color: '#0095ff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  normalText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  indented: {
    marginLeft: 16,
  },
  footer: {
    marginTop: 32,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appLogo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
}); 