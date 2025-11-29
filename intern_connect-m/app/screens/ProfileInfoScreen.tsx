import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity} from "react-native"
import { Feather } from "@expo/vector-icons"
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useCallback } from 'react';

const lImage = require("../../assets/image/L.png");

type Experience = {
  title: string;
  company: string;
  duration: string;
  description: string;
};

type UserProfile = {
  name: string;
  title: string;
  photo: string;
  email: string;
  phone: string;
  location: string;
  education: {
    degree: string;
    university: string;
    graduationYear: string;
  };
  skills: string[];
  experience: Experience[];
  certifications: string[];
  languages: string[];
};

export default function ProfileInfoScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: user?.user_metadata?.full_name || "User",
    title: user?.user_metadata?.title || "Student",
    photo: user?.user_metadata?.avatar_url || "",
    email: user?.email || "No email provided",
    phone: user?.user_metadata?.phone || "No phone provided",
    location: user?.user_metadata?.location || "No location provided",
    education: {
      degree: user?.user_metadata?.degree || "Not specified",
      university: user?.user_metadata?.university || "Not specified",
      graduationYear: user?.user_metadata?.graduation_year || "Not specified",
    },
    skills: user?.user_metadata?.skills || ["No skills listed"],
    experience: user?.user_metadata?.experience || [{
      title: "No experience listed",
      company: "Not specified",
      duration: "Not specified",
      description: "No description available",
    }],
    certifications: user?.user_metadata?.certifications || ["No certifications listed"],
    languages: user?.user_metadata?.languages || ["No languages listed"],
  });

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          // Refresh user data to get the latest metadata
          await refreshUser();
          
          // Update the profile with the latest user data
          setUserProfile({
            name: user?.user_metadata?.full_name || "User",
            title: user?.user_metadata?.title || "Student",
            photo: user?.user_metadata?.avatar_url || "",
            email: user?.email || "No email provided",
            phone: user?.user_metadata?.phone || "No phone provided",
            location: user?.user_metadata?.location || "No location provided",
            education: {
              degree: user?.user_metadata?.degree || "Not specified",
              university: user?.user_metadata?.university || "Not specified",
              graduationYear: user?.user_metadata?.graduation_year || "Not specified",
            },
            skills: user?.user_metadata?.skills || ["No skills listed"],
            experience: user?.user_metadata?.experience || [{
              title: "No experience listed",
              company: "Not specified",
              duration: "Not specified",
              description: "No description available",
            }],
            certifications: user?.user_metadata?.certifications || ["No certifications listed"],
            languages: user?.user_metadata?.languages || ["No languages listed"],
          });
        } catch (error) {
          console.error("Error refreshing profile:", error);
        }
      };
      
      loadProfile();
    }, [user, refreshUser])
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Updated header with back button, and centered logo and title */}
      <LinearGradient
        colors={['#808080', 'rgba(128, 128, 128, 0)']}
        style={styles.headerContainer}
      >
        <View style={styles.headerCenter}>
          <Image source={lImage} style={styles.logo} />
          <Text style={styles.appName}>Your Profile</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {userProfile.photo ? (
              <Image
                source={{ uri: userProfile.photo }}
                style={styles.profileImage}
              />
            ) : (
              <Text style={styles.noPhotoText}>No Photo</Text>
            )}
          </View>
          <Text style={styles.name}>{userProfile.name}</Text>
          <Text style={styles.title}>{userProfile.title}</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.infoItem}>
              <Feather name="mail" size={16} color="#666" />
              <Text style={styles.infoText}>{userProfile.email}</Text>
            </View>
            <View style={styles.infoItem}>
              <Feather name="phone" size={16} color="#666" />
              <Text style={styles.infoText}>{userProfile.phone}</Text>
            </View>
            <View style={styles.infoItem}>
              <Feather name="map-pin" size={16} color="#666" />
              <Text style={styles.infoText}>{userProfile.location}</Text>
            </View>
          </View>
        </View>

        {/* Education */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="book" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Education Background</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.educationDegree}>{userProfile.education.degree}</Text>
            <Text style={styles.educationSchool}>{userProfile.education.university}</Text>
            <Text style={styles.educationYear}>Graduated: {userProfile.education.graduationYear}</Text>
          </View>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="briefcase" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Experience</Text>
          </View>
          {userProfile.experience.map((exp: Experience, index: number) => (
            <View key={index} style={styles.card}>
              <Text style={styles.experienceTitle}>{exp.title}</Text>
              <Text style={styles.experienceCompany}>{exp.company}</Text>
              <Text style={styles.experienceDuration}>{exp.duration}</Text>
              <Text style={styles.experienceDescription}>{exp.description}</Text>
            </View>
          ))}
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="code" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Skills</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.skillsContainer}>
              {userProfile.skills.map((skill: string, index: number) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Certifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="award" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Certifications</Text>
          </View>
          <View style={styles.card}>
            {userProfile.certifications.map((cert: string, index: number) => (
              <View key={index} style={styles.certificationItem}>
                <Feather name="check-circle" size={16} color="#0077b5" />
                <Text style={styles.certificationText}>{cert}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Languages */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="globe" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Languages</Text>
          </View>
          <View style={styles.card}>
            {userProfile.languages.map((language: string, index: number) => (
              <Text key={index} style={styles.languageText}>
                {language}
              </Text>
            ))}
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editButton} onPress={() => router.push("/screens/EditProfileScreen")}>
          <Feather name="edit-2" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/DashboardScreen")}>
          <Feather name="home" size={24} color="#666" />
          <Text style={styles.navItemText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/BrowseInternshipsScreen")}>
          <Feather name="search" size={24} color="#666" />
          <Text style={styles.navItemText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/NotificationsScreen")}>
          <View style={styles.notificationContainer}>
            <Feather name="bell" size={24} color="#666" />
          </View>
          <Text style={styles.navItemText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/SettingsScreen")}>
          <Feather name="settings" size={24} color="#666" />
          <Text style={styles.navItemText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/ProfileInfoScreen")}>
          <Feather name="user" size={24} color="#0095ff" />
          <Text style={styles.navItemActiveText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  // Updated header styles with back button and centered logo/title
  headerContainer: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  appName: {
    color: '#000',
    fontSize: 26,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#333",
    padding: 4,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: "#999",
    marginBottom: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    color: "#e0e0e0",
    fontSize: 15,
    flex: 1,
  },
  educationDegree: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  educationSchool: {
    color: "#e0e0e0",
    fontSize: 15,
    marginBottom: 4,
  },
  educationYear: {
    color: "#999",
    fontSize: 14,
  },
  experienceTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  experienceCompany: {
    color: "#e0e0e0",
    fontSize: 15,
    marginBottom: 4,
  },
  experienceDuration: {
    color: "#999",
    fontSize: 14,
    marginBottom: 8,
  },
  experienceDescription: {
    color: "#e0e0e0",
    fontSize: 14,
    lineHeight: 20,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    color: "#fff",
    fontSize: 14,
  },
  certificationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  certificationText: {
    color: "#e0e0e0",
    fontSize: 15,
  },
  languageText: {
    color: "#e0e0e0",
    fontSize: 15,
    marginBottom: 8,
  },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#0077b5",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 20,
  },
  noPhotoText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 0,
    paddingLeft: 25,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navItemText: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  navItemActiveText: {
    fontSize: 10,
    color: "#0095ff",
    marginTop: 4,
  },
  notificationContainer: {
    position: "relative",
  },
})