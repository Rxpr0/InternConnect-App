"use client"

import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Modal, ActivityIndicator } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"

const lImage = require("../../assets/image/L.png")

// Types
type ApplicationStatus = "pending" | "approved" | "rejected"

interface Application {
  id: string
  intern_id: string
  internship_id: string
  status: ApplicationStatus
  created_at: string
  resume_url: string
  cover_letter_url: string | null
  phone_number: string
  portfolio_url: string | null
  intern_profile: {
    name: string
    photo: string | null
  }
  internship: {
    position: string
  }
  has_interview: boolean
}

interface ApplicationWithInternship {
  id: string;
  internship: {
    company_id: string;
  };
}

const CustomAlert = ({ visible, title, message, onClose }: { visible: boolean; title: string; message: string; onClose: () => void }) => (
  <Modal
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
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
);

export default function CompanyApplicationsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"overview" | "internships" | "applications" | "interviews">("applications")
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<ApplicationStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onClose: () => {} })

  const showAlert = (title: string, message: string, onClose = () => {}) => {
    setAlertConfig({ title, message, onClose })
    setAlertVisible(true)
  }

  useEffect(() => {
    fetchApplications()
  }, [applicationStatusFilter])

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      if (!user) {
        showAlert('Error', 'You must be logged in to view applications')
        return
      }

      // First get all internships for this company
      const { data: internships, error: internshipsError } = await supabase
        .from('internships')
        .select('id')
        .eq('company_id', user.id)

      if (internshipsError) throw internshipsError
      if (!internships?.length) {
        setApplications([])
        return
      }

      const internshipIds = internships.map(i => i.id)

      // Then get applications for these internships with interview information
      let query = supabase
        .from('applications')
        .select(`
          *,
          internship:internship_id (
            id,
            position,
            company_id
          ),
          interviews!left (
            id
          )
        `)
        .in('internship_id', internshipIds)
        .order('created_at', { ascending: false })

      if (applicationStatusFilter !== 'all') {
        query = query.eq('status', applicationStatusFilter)
      }

      const { data: applications, error: applicationsError } = await query

      if (applicationsError) throw applicationsError

      // Get all intern IDs from applications
      const internIds = applications?.map(app => app.intern_id) || []
      
      // Fetch profiles for all interns in a single query
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', internIds)

      if (profilesError) throw profilesError

      // Create a map of intern IDs to profiles for easy lookup
      const profilesMap = profiles?.reduce((acc, profile) => {
        acc[profile.id] = profile
        return acc
      }, {} as Record<string, any>) || {}

      // Transform the data to match our Application interface
      const transformedApplications = applications?.map(app => ({
        id: app.id,
        intern_id: app.intern_id,
        internship_id: app.internship_id,
        status: app.status,
        created_at: app.created_at,
        resume_url: app.resume_url,
        cover_letter_url: app.cover_letter_url,
        phone_number: app.phone_number,
        portfolio_url: app.portfolio_url,
        intern_profile: {
          name: profilesMap[app.intern_id]?.full_name || 'Unknown',
          photo: null
        },
        internship: {
          position: app.internship?.position || 'Unknown Position'
        },
        has_interview: app.interviews && app.interviews.length > 0
      })) || []

      setApplications(transformedApplications)
    } catch (error: any) {
      console.error('Error fetching applications:', error)
      showAlert('Error', 'Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveApplication = async (applicationId: string) => {
    try {
      // First verify the application exists and belongs to one of the company's internships
      const { data: application, error: fetchError } = await supabase
        .from('applications')
        .select(`
          id,
          internship:internships!inner(company_id)
        `)
        .eq('id', applicationId)
        .single() as { data: ApplicationWithInternship | null, error: any }

      if (fetchError) throw fetchError
      if (!application) throw new Error('Application not found')
      
      // Verify the company owns this application
      if (application.internship.company_id !== user?.id) {
        throw new Error('Unauthorized')
      }

      // Update the application status
      const { error: updateError } = await supabase
        .from('applications')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (updateError) throw updateError

      // Update local state
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app.id === applicationId ? { ...app, status: "approved" } : app
        )
      )

      showAlert("Success", "Application has been approved")
    } catch (error: any) {
      console.error('Error accepting application:', error)
      showAlert('Error', error.message || 'Failed to accept application')
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    try {
      // First verify the application exists and belongs to one of the company's internships
      const { data: application, error: fetchError } = await supabase
        .from('applications')
        .select(`
          id,
          internship:internships!inner(company_id)
        `)
        .eq('id', applicationId)
        .single() as { data: ApplicationWithInternship | null, error: any }

      if (fetchError) throw fetchError
      if (!application) throw new Error('Application not found')
      
      // Verify the company owns this application
      if (application.internship.company_id !== user?.id) {
        throw new Error('Unauthorized')
      }

      // Update the application status
      const { error: updateError } = await supabase
        .from('applications')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (updateError) throw updateError

      // Update local state
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app.id === applicationId ? { ...app, status: "rejected" } : app
        )
      )

      showAlert("Success", "Application has been rejected")
    } catch (error: any) {
      console.error('Error rejecting application:', error)
      showAlert('Error', error.message || 'Failed to reject application')
    }
  }

  const renderApplicationsTab = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095ff" />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      )
    }

    const filteredApplications = applications.filter((app) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        (!searchQuery ||
          app.intern_profile.name.toLowerCase().includes(searchLower) ||
          app.internship.position.toLowerCase().includes(searchLower))
      )
    })

    return (
      <View style={styles.tabContent}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabTitle}>Applications</Text>
        </View>
        <View style={styles.searchBarContainer}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={16} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search candidates..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather name="x" size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[styles.filterChip, applicationStatusFilter === "all" && styles.filterChipActive]}
            onPress={() => setApplicationStatusFilter("all")}
          >
            <Text style={styles.filterChipText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, applicationStatusFilter === "pending" && styles.filterChipActive]}
            onPress={() => setApplicationStatusFilter("pending")}
          >
            <Text style={styles.filterChipText}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, applicationStatusFilter === "approved" && styles.filterChipActive]}
            onPress={() => setApplicationStatusFilter("approved")}
          >
            <Text style={styles.filterChipText}>Approved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, applicationStatusFilter === "rejected" && styles.filterChipActive]}
            onPress={() => setApplicationStatusFilter("rejected")}
          >
            <Text style={styles.filterChipText}>Rejected</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.applicationsContainer}>
          {filteredApplications.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Feather name="search" size={50} color="#666" />
              <Text style={styles.emptyStateText}>No applications found</Text>
              <Text style={styles.emptyStateSubtext}>Try adjusting your filters</Text>
            </View>
          ) : (
            filteredApplications.map((application) => (
              <View key={application.id} style={styles.applicationCard}>
                <View style={styles.applicationHeader}>
                  <View style={styles.applicantInfo}>
                    <View style={styles.applicantAvatar}>
                      <Text style={styles.applicantAvatarText}>
                        {application.intern_profile.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push({
                      pathname: "/screens/ProfileViewScreen",
                      params: { id: application.intern_id }
                    })}>
                      <Text style={styles.applicantName}>{application.intern_profile.name}</Text>
                      <Text style={styles.applicantRole}>{application.internship.position}</Text>
                    </TouchableOpacity>
                  </View>
                  <View
                    style={[
                      styles.applicationBadge,
                      {
                        backgroundColor:
                          application.status === "pending"
                            ? "rgba(255, 193, 7, 0.15)"
                            : application.status === "approved"
                            ? "rgba(76, 175, 80, 0.15)"
                            : "rgba(233, 30, 99, 0.15)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.applicationBadgeText,
                        {
                          color:
                            application.status === "pending"
                              ? "#FFC107"
                              : application.status === "approved"
                              ? "#4CAF50"
                              : "#E91E63",
                        },
                      ]}
                    >
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.applicationDetails}>
                  <View style={styles.detailItem}>
                    <Feather name="calendar" size={14} color="#0095ff" />
                    <Text style={styles.detailText}>
                      Applied: {new Date(application.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Feather name="phone" size={14} color="#0095ff" />
                    <Text style={styles.detailText}>{application.phone_number}</Text>
                  </View>
                </View>
                <View style={styles.applicationActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.viewButton]} 
                    onPress={() => router.push({
                      pathname: "/screens/ViewSubmissionScreen",
                      params: { id: application.id }
                    })}
                  >
                    <Feather name="eye" size={14} color="#0095ff" />
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>

                  {application.status === "pending" && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApproveApplication(application.id)}
                      >
                        <Feather name="check" size={14} color="#0095ff" />
                        <Text style={styles.actionButtonText}>Approve</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectApplication(application.id)}
                      >
                        <Feather name="x" size={14} color="#0095ff" />
                        <Text style={styles.actionButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {application.status === "approved" && !application.has_interview && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.scheduleButton]}
                      onPress={() => router.push({
                        pathname: "/screens/ScheduleInterviewScreen",
                        params: { id: application.id }
                      })}
                    >
                      <Feather name="calendar" size={14} color="#0095ff" />
                      <Text style={styles.actionButtonText}>Schedule</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertVisible(false)
          alertConfig.onClose()
        }}
      />
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.headerCenter}>
          <Image source={lImage} style={styles.logo} />
          <Text style={styles.appName}>InternConnect</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push("/screens/CompanySettingsScreen")}>
          <Feather name="settings" size={24} color="#000" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>{renderApplicationsTab()}</ScrollView>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "overview" && styles.tabItemActive]}
          onPress={() => router.push("/screens/CompanyOverviewScreen")}
        >
          <Feather name="grid" size={20} color={activeTab === "overview" ? "#0095ff" : "#666"} />
          <Text style={[styles.tabText, activeTab === "overview" && styles.tabTextActive]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "internships" && styles.tabItemActive]}
          onPress={() => router.push("/screens/CompanyInternshipsScreen")}
        >
          <Feather name="briefcase" size={20} color={activeTab === "internships" ? "#0095ff" : "#666"} />
          <Text style={[styles.tabText, activeTab === "internships" && styles.tabTextActive]}>Internships</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "applications" && styles.tabItemActive]}
          onPress={() => setActiveTab("applications")}
        >
          <Feather name="users" size={20} color={activeTab === "applications" ? "#0095ff" : "#666"} />
          <Text style={[styles.tabText, activeTab === "applications" && styles.tabTextActive]}>Applications</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "interviews" && styles.tabItemActive]}
          onPress={() => router.push("/screens/CompanyInterviewsScreen")}
        >
          <Feather name="calendar" size={20} color={activeTab === "interviews" ? "#0095ff" : "#666"} />
          <Text style={[styles.tabText, activeTab === "interviews" && styles.tabTextActive]}>Interviews</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

// Styles
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
    borderBottomColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  appName: {
    color: "#000",
    fontSize: 26,
    fontWeight: "600",
  },
  settingsButton: {
    padding: 0,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  tabHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    fontFamily: "System",
    letterSpacing: 1,
  },
  searchBarContainer: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    color: "#fff",
  },
  filterSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  filterChipActive: {
    backgroundColor: "rgba(0, 149, 255, 0.15)",
    borderColor: "#0095ff",
  },
  filterChipText: {
    fontSize: 12,
    color: "#fff",
  },
  applicationsContainer: {
    gap: 16,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  applicationCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 16,
  },
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  applicantInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  applicantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  applicantAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  applicantName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  applicantRole: {
    fontSize: 12,
    color: "#666",
  },
  applicationBadge: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  applicationBadgeText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  applicationDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
  },
  applicationActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  actionButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  viewButton: {
    backgroundColor: "#333",
  },
  approveButton: {
    backgroundColor: "#006400",
  },
  rejectButton: {
    backgroundColor: "#8b0000",
  },
  scheduleButton: {
    backgroundColor: "#0096c7",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingVertical: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#0095ff",
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  tabTextActive: {
    color: "#0095ff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0095ff",
    marginTop: 10,
  },
})

