"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Image } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { Link } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from "../../lib/supabase"

const lImage = require("../../assets/image/L.png")

interface ApplicationData {
  id: string
  resume_url: string
  cover_letter_url: string | null
  phone_number: string
  portfolio_url: string | null
  available_start_date: string | null
  status: "pending" | "approved" | "rejected"
  created_at: string
  internship_id: string
  intern_id: string
  internships: {
    position: string
  }
  profile: {
    full_name: string
  }
}

type ApplicationSubmission = {
  id: string
  applicantName: string
  intern_id: string
  position: string
  resumeUrl: string
  coverLetterUrl: string | null
  phoneNumber: string
  portfolioUrl: string | null
  availableStartDate: string | null
  appliedDate: string
  status: "pending" | "approved" | "rejected"
}

export default function ViewSubmissionScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ id: string }>()
  const [application, setApplication] = useState<ApplicationSubmission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!params.id) {
      setError('No application ID provided')
      setIsLoading(false)
      return
    }
    fetchApplicationDetails(params.id)
  }, [params.id])

  const fetchApplicationDetails = async (applicationId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // First get the application with internship details
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select(`
          id,
          resume_url,
          cover_letter_url,
          phone_number,
          portfolio_url,
          available_start_date,
          status,
          created_at,
          intern_id,
          internship_id,
          internships (
            position
          )
        `)
        .eq('id', applicationId)
        .single()

      if (appError) throw appError
      if (!appData) throw new Error('Application not found')

      // Then get the profile details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', appData.intern_id)
        .single()

      if (profileError) throw profileError
      if (!profileData) throw new Error('Profile not found')

      // Get internship details
      const { data: internshipData, error: internshipError } = await supabase
        .from('internships')
        .select('position')
        .eq('id', appData.internship_id)
        .single()

      if (internshipError) throw internshipError
      if (!internshipData) throw new Error('Internship not found')

      // Combine the data
      const applicationData: ApplicationData = {
        ...appData,
        profile: profileData,
        internships: internshipData
      }

      // Transform the data to match our ApplicationSubmission type
      setApplication({
        id: applicationData.id,
        applicantName: applicationData.profile.full_name,
        intern_id: applicationData.intern_id,
        position: applicationData.internships.position,
        resumeUrl: applicationData.resume_url,
        coverLetterUrl: applicationData.cover_letter_url,
        phoneNumber: applicationData.phone_number,
        portfolioUrl: applicationData.portfolio_url,
        availableStartDate: applicationData.available_start_date,
        appliedDate: new Date(applicationData.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        status: applicationData.status
      })
    } catch (err) {
      console.error('Error fetching application:', err)
      setError('Failed to load application details')
    } finally {
      setIsLoading(false)
    }
  }

  const openDocument = async (url: string) => {
    try {
      await Linking.openURL(url)
    } catch (err) {
      console.error('Error opening document:', err)
      Alert.alert("Error", "Failed to open document")
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image source={lImage} style={styles.logo} />
            <Text style={styles.headerTitle}>Application Details</Text>
          </View>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading application details...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => params.id && fetchApplicationDetails(params.id)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : application ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.applicantCard}>
            <View style={styles.applicantHeader}>
              <View style={styles.applicantAvatar}>
                <Text style={styles.applicantAvatarText}>{application.applicantName.charAt(0)}</Text>
              </View>

              <View style={styles.applicantInfo}>
                <TouchableOpacity onPress={() => router.push(`/screens/ProfileViewScreen?id=${application.intern_id}`)}>
                  <Text style={styles.applicantName}>{application.applicantName}</Text>
                </TouchableOpacity>
                <Text style={styles.applicantPosition}>{application.position}</Text>
              </View>
            </View>

            <View style={styles.applicationMeta}>
              <View style={styles.metaItem}>
                <Feather name="calendar" size={14} color="#666" />
                <Text style={styles.metaText}>Applied: {application.appliedDate}</Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="info" size={14} color="#666" />
                <Text style={[styles.metaText, styles[application.status]]}>
                  Status: {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documents</Text>

            <TouchableOpacity 
              style={styles.documentItem} 
              onPress={() => openDocument(application.resumeUrl)}
            >
              <View style={styles.documentIcon}>
                <Feather name="file-text" size={24} color="#0095ff" />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle}>Resume/CV</Text>
                <Text style={styles.documentName}>View Resume</Text>
              </View>
              <Feather name="external-link" size={20} color="#666" />
            </TouchableOpacity>

            {application.coverLetterUrl && (
              <TouchableOpacity
                style={styles.documentItem}
                onPress={() => openDocument(application.coverLetterUrl!)}
              >
                <View style={styles.documentIcon}>
                  <Feather name="file-text" size={24} color="#0095ff" />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>Cover Letter</Text>
                  <Text style={styles.documentName}>View Cover Letter</Text>
                </View>
                <Feather name="external-link" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>

            <View style={styles.infoItem}>
              <Feather name="phone" size={16} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{application.phoneNumber}</Text>
              </View>
            </View>

            {application.portfolioUrl && (
              <TouchableOpacity 
                style={styles.infoItem} 
                onPress={() => Linking.openURL(application.portfolioUrl!)}
              >
                <Feather name="globe" size={16} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Portfolio URL</Text>
                  <Text style={styles.infoValue}>{application.portfolioUrl}</Text>
                </View>
                <Feather name="external-link" size={16} color="#0095ff" />
              </TouchableOpacity>
            )}

            {application.availableStartDate && (
              <View style={styles.infoItem}>
                <Feather name="calendar" size={16} color="#666" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Available Start Date</Text>
                  <Text style={styles.infoValue}>
                    {new Date(application.availableStartDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      ) : null}
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0095ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  applicantCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333",
  },
  applicantHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  applicantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  applicantAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  applicantPosition: {
    fontSize: 14,
    color: "#999",
  },
  applicationMeta: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 12,
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: "#999",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 149, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  documentName: {
    fontSize: 14,
    color: "#666",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#fff",
  },
  bottomSpacing: {
    height: 40,
  },
  pending: {
    color: '#ffd700',
  },
  approved: {
    color: '#4CAF50',
  },
  rejected: {
    color: '#f44336',
  },
  clickable: {
    textDecorationLine: 'underline',
  }
})

