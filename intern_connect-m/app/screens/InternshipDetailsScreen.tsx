"use client"

import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, ActivityIndicator } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"

const lImage = require("../../assets/image/L.png")

interface InternshipData {
  id: string
  position: string
  company_id: string
  company_name?: string
  department: string
  work_type: string
  location: string
  is_paid: boolean
  stipend: number | null
  skills: string[]
  requirements: string
  responsibilities: string
  duration: string
  deadline: string
  spots: number
  status: string
  created_at: string
  updated_at: string
}

interface CustomAlertProps {
  visible: boolean
  title: string
  message: string
  onClose: () => void
}

const CustomAlert: React.FC<CustomAlertProps> = ({ visible, title, message, onClose }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <TouchableOpacity style={styles.alertButton} onPress={onClose}>
            <Text style={styles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export default function InternshipDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const { user } = useAuth()
  const [internshipData, setInternshipData] = useState<InternshipData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
  })

  const showAlert = (title: string, message: string) => {
    setAlertConfig({
      visible: true,
      title,
      message,
    })
  }

  const fetchInternshipDetails = async () => {
    const internshipId = id as string
    console.log("Fetching internship details for ID:", internshipId)
    
    if (!internshipId) {
      console.error("No internship ID provided")
      showAlert("Error", "Invalid internship ID")
      return
    }

    try {
      setIsLoading(true)
      console.log("Making Supabase query for internship:", internshipId)
      
      // First, fetch the internship details
      const { data: internshipData, error: internshipError } = await supabase
        .from('internships')
        .select('*')
        .eq('id', internshipId)
        .single()

      if (internshipError) {
        console.error("Error fetching internship:", internshipError)
        throw internshipError
      }

      if (!internshipData) {
        console.error("No internship found for ID:", internshipId)
        showAlert("Error", "Internship not found")
        return
      }

      console.log("Fetched internship data:", internshipData)

      // Then, fetch the company profile
      const { data: companyData, error: companyError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', internshipData.company_id)
        .single()

      if (companyError) {
        console.error("Error fetching company:", companyError)
        throw companyError
      }

      console.log("Fetched company data:", companyData)

      const fullInternshipData = {
        ...internshipData,
        company_name: companyData?.full_name || 'Unknown Company'
      }
      
      console.log("Setting internship data:", fullInternshipData)
      setInternshipData(fullInternshipData)
    } catch (error: any) {
      console.error("Error in fetchInternshipDetails:", error)
      showAlert("Error", error.message || "Failed to fetch internship details")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log("InternshipDetailsScreen mounted with ID:", id)
    fetchInternshipDetails()
  }, [id])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095ff" />
        </View>
      </SafeAreaView>
    )
  }

  if (!internshipData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load internship details</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image source={lImage} style={styles.logo} />
          <Text style={styles.headerTitle}>Internship Details</Text>
        </View>
        <View style={styles.placeholderView} />
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.positionTitle}>{internshipData.position}</Text>
            <View style={styles.companyRow}>
              <View style={styles.logoContainer}>
                <Text style={styles.companyAvatarText}>
                  {internshipData.company_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => router.push({
                  pathname: "/screens/CompanyProfileViewScreen",
                  params: { id: internshipData.company_id }
                })}
              >
                <Text style={styles.companyName}>{internshipData.company_name}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Feather name="briefcase" size={14} color="#0095ff" />
                <Text style={styles.badgeText}>{internshipData.department}</Text>
              </View>
              <View style={styles.badge}>
                <Feather
                  name={
                    internshipData.work_type === "remote"
                      ? "wifi"
                      : internshipData.work_type === "hybrid"
                        ? "home"
                        : "map-pin"
                  }
                  size={14}
                  color="#0095ff"
                />
                <Text style={styles.badgeText}>
                  {internshipData.work_type.charAt(0).toUpperCase() + internshipData.work_type.slice(1)}
                </Text>
              </View>
              <View style={styles.badge}>
                <Feather name="users" size={14} color="#0095ff" />
                <Text style={styles.badgeText}>{internshipData.spots} Positions</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="info" size={18} color="#0095ff" />
              <Text style={styles.sectionTitle}>Overview</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{internshipData.location}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{internshipData.duration}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Stipend</Text>
                <Text style={styles.infoValue}>
                  {internshipData.is_paid ? `$${internshipData.stipend}/month` : "Unpaid"}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Apply By</Text>
                <Text style={styles.infoValue}>{new Date(internshipData.deadline).toLocaleDateString()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="check-square" size={18} color="#0095ff" />
              <Text style={styles.sectionTitle}>Required Skills</Text>
            </View>
            <View style={styles.skillsContainer}>
              {internshipData.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="list" size={18} color="#0095ff" />
              <Text style={styles.sectionTitle}>Requirements</Text>
            </View>
            <Text style={styles.descriptionText}>{internshipData.requirements}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="clipboard" size={18} color="#0095ff" />
              <Text style={styles.sectionTitle}>Responsibilities</Text>
            </View>
            <Text style={styles.descriptionText}>{internshipData.responsibilities}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="calendar" size={18} color="#0095ff" />
              <Text style={styles.sectionTitle}>Additional Information</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Posted On</Text>
                <Text style={styles.infoValue}>
                  {new Date(internshipData.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Positions</Text>
                <Text style={styles.infoValue}>{internshipData.spots}</Text>
              </View>
            </View>
          </View>

          <View style={styles.applicationSection}>
            <Text style={styles.applicationDeadline}>
              Application Deadline:{" "}
              <Text style={styles.deadlineDate}>
                {new Date(internshipData.deadline).toLocaleDateString()}
              </Text>
            </Text>
            <TouchableOpacity 
              style={[
                styles.applyButton,
                internshipData.status === "closed" && styles.applyButtonDisabled
              ]} 
              onPress={() => router.push({
                pathname: "/screens/SubmitApplicationScreen",
                params: { internshipId: internshipData.id }
              })}
              disabled={internshipData.status === "closed"}
            >
              <Text style={styles.applyButtonText}>
                {internshipData.status === "closed" ? "Applications Closed" : "Apply Now"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
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
    padding: 0,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderView: {
    width: 24, // Same width as the back button to ensure proper centering
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  headerTitle: {
    color: '#000',
    fontSize: 26,
    fontWeight: '600',
  },
  shareButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  positionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  companyLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  companyName: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 149, 255, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  badgeText: {
    color: "#0095ff",
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillTag: {
    backgroundColor: "#333",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  skillTagText: {
    color: "#fff",
    fontSize: 14,
  },
  descriptionText: {
    color: "#ccc",
    fontSize: 15,
    lineHeight: 22,
  },
  applicationSection: {
    marginTop: 8,
    marginBottom: 32,
    alignItems: "center",
  },
  applicationDeadline: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  deadlineDate: {
    color: "#0095ff",
    fontWeight: "500",
  },
  applyButton: {
    backgroundColor: "#0095ff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: '#4d0000',
    padding: 20,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButton: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ffffff',
    minWidth: 80,
  },
  alertButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#0095ff",
  },
  companyAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
})

