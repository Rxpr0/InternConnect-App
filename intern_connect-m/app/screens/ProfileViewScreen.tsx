"use client"

import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const lImage = require("../../assets/image/L.png")

interface Certification {
  name: string
  issuer: string
  date: string
}

interface UserProfile {
  id: string
  full_name: string
  phone?: string
  location?: string
  avatar_url?: string
  bio?: string
  education_degree?: string
  education_university?: string
  education_graduation_year?: string
  experience?: Array<{
    title: string
    company: string
    duration: string
    description: string
  }>
  skills?: string[]
  certifications?: string[]
  languages?: string[]
}

export default function ProfileViewScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!id) {
          throw new Error('No profile ID provided')
        }

        // First get basic profile info
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', id)
          .single()

        if (profileError) {
          throw profileError
        }

        if (!profileData) {
          throw new Error('Profile not found')
        }

        if (profileData.role !== 'intern') {
          throw new Error('This profile is not an intern profile')
        }

        // Then get detailed intern profile
        const { data: internData, error: internError } = await supabase
          .from('intern_profiles')
          .select(`
            id,
            name,
            title,
            photo,
            email,
            phone,
            location,
            education,
            skills,
            experience,
            certifications,
            languages
          `)
          .eq('id', id)
          .single()

        if (internError) {
          throw internError
        }

        if (!internData) {
          throw new Error('Intern profile details not found')
        }

        // Combine the data
        setProfile({
          id: profileData.id,
          full_name: internData.name || profileData.full_name || 'No name provided',
          phone: internData.phone || 'No phone provided',
          location: internData.location || 'No location provided',
          avatar_url: internData.photo || '',
          bio: internData.title || 'Student',
          education_degree: (internData.education?.degree && internData.education.degree.trim() !== '') 
            ? internData.education.degree 
            : 'Not specified',
          education_university: (internData.education?.university && internData.education.university.trim() !== '') 
            ? internData.education.university 
            : 'Not specified',
          education_graduation_year: (internData.education?.graduationYear && internData.education.graduationYear.trim() !== '') 
            ? internData.education.graduationYear 
            : 'Not specified',
          experience: Array.isArray(internData.experience) && internData.experience.length > 0 
            ? internData.experience 
            : [],
          skills: Array.isArray(internData.skills) && internData.skills.length > 0 
            ? internData.skills 
            : [],
          certifications: Array.isArray(internData.certifications) && internData.certifications.length > 0
            ? internData.certifications
            : [],
          languages: Array.isArray(internData.languages) && internData.languages.length > 0
            ? internData.languages
            : []
        })

        console.log('Fetched intern data:', internData) // For debugging
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while fetching the profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [id])

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Updated header with LinearGradient like the other screens */}
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image source={lImage} style={styles.logo} />
            <Text style={styles.headerTitle}>Intern Profile</Text>
          </View>
          {/* Empty view for balanced spacing */}
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {profile.avatar_url ? (
              <Image 
                source={{ uri: profile.avatar_url }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.noPhotoContainer]}>
                <Text style={styles.noPhotoText}>No Photo</Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{profile.full_name}</Text>
          <Text style={styles.title}>{profile.bio}</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          <View style={styles.card}>
            {profile.phone && (
              <View style={styles.infoItem}>
                <Feather name="phone" size={16} color="#666" />
                <Text style={styles.infoText}>{profile.phone}</Text>
              </View>
            )}
            {profile.location && (
              <View style={styles.infoItem}>
                <Feather name="map-pin" size={16} color="#666" />
                <Text style={styles.infoText}>{profile.location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Education */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="book" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Education Background</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.educationDegree}>{profile.education_degree}</Text>
            <Text style={styles.educationSchool}>{profile.education_university}</Text>
            <Text style={styles.educationYear}>
              {profile.education_graduation_year !== 'Not specified' 
                ? `Graduated: ${profile.education_graduation_year}`
                : 'Graduation year not specified'}
            </Text>
          </View>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="briefcase" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Experience</Text>
          </View>
          {profile.experience?.length === 0 ? (
            <View style={styles.card}>
              <Text style={[styles.infoText, styles.emptyText]}>No experience listed</Text>
            </View>
          ) : (
            profile.experience?.map((exp, index) => (
              <View key={index} style={styles.card}>
                <Text style={styles.experienceTitle}>{exp.title}</Text>
                <Text style={styles.experienceCompany}>{exp.company}</Text>
                <Text style={styles.experienceDuration}>{exp.duration}</Text>
                <Text style={styles.experienceDescription}>{exp.description}</Text>
              </View>
            ))
          )}
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="code" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Skills</Text>
          </View>
          <View style={styles.card}>
            {profile.skills?.length === 0 ? (
              <Text style={[styles.infoText, styles.emptyText]}>No skills listed</Text>
            ) : (
              <View style={styles.skillsContainer}>
                {profile.skills?.map((skill, index) => (
                  <View key={index} style={styles.skillChip}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Certifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="award" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Certifications</Text>
          </View>
          <View style={styles.card}>
            {profile.certifications?.length === 0 ? (
              <Text style={[styles.infoText, styles.emptyText]}>No certifications listed</Text>
            ) : (
              profile.certifications?.map((cert, index) => (
                <View key={index} style={styles.certificationItem}>
                  <Feather name="check-circle" size={16} color="#0077b5" />
                  <Text style={styles.certificationText}>{cert}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Languages */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="globe" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Languages</Text>
          </View>
          <View style={styles.card}>
            {profile.languages?.length === 0 ? (
              <Text style={[styles.infoText, styles.emptyText]}>No languages listed</Text>
            ) : (
              <View style={styles.skillsContainer}>
                {profile.languages?.map((language, index) => (
                  <View key={index} style={styles.skillChip}>
                    <Text style={styles.skillText}>{language}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  // Updated header styles to match other screens
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
    width: 28, // Same width as the back button for balance
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
  bottomSpacing: {
    height: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
  },
  noPhotoContainer: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
})


