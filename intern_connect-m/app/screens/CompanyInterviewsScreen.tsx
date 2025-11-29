import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Linking, ActivityIndicator, Modal, TextInput } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"

const lImage = require("../../assets/image/L.png")

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

// Types from database schema
interface Interview {
  id: string
  application_id: string
  scheduled_at: string
  duration_minutes: number
  meeting_link: string | null
  location: string | null
  notes: string | null
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  created_at: string
  updated_at: string
  application: {
    id: string
    status: 'pending' | 'approved' | 'rejected'
    internship_id: string
    intern_id: string
    intern: {
      id: string
      name: string
      email: string
    }
  }
  hiringDecision?: 'hired' | 'not_hired' | null
}

export default function CompanyInterviewsScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"overview" | "internships" | "applications" | "interviews">("interviews")
  const [interviewFilter, setInterviewFilter] = useState<"all" | "scheduled" | "completed">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onClose: () => {} })

  const showAlert = (title: string, message: string, onClose = () => {}) => {
    setAlertConfig({ title, message, onClose })
    setAlertVisible(true)
  }

  // Fetch interviews
  const fetchInterviews = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get current user's company ID
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // First get all internships for this company
      const { data: internships, error: internshipsError } = await supabase
        .from('internships')
        .select('id')
        .eq('company_id', user.id)

      if (internshipsError) throw internshipsError
      if (!internships) return setInterviews([])

      // Get all applications for these internships
      const { data: applications, error: applicationsError } = await supabase
        .from('applications')
        .select('id, status, intern_id, internship_id')
        .in('internship_id', internships.map(i => i.id))

      if (applicationsError) throw applicationsError
      if (!applications) return setInterviews([])

      // Get all interviews for these applications
      const { data: interviews, error: interviewsError } = await supabase
        .from('interviews')
        .select(`
          id,
          application_id,
          scheduled_at,
          duration_minutes,
          meeting_link,
          location,
          notes,
          status,
          created_at,
          updated_at
        `)
        .in('application_id', applications.map(a => a.id))
        .order('scheduled_at', { ascending: true })

      if (interviewsError) throw interviewsError
      if (!interviews) return setInterviews([])

      // Get intern profiles for all applications
      const { data: interns, error: internsError } = await supabase
        .from('intern_profiles')
        .select('id, name, email')
        .in('id', applications.map(a => a.intern_id))

      if (internsError) throw internsError
      if (!interns) return setInterviews([])

      // Combine all the data
      const transformedInterviews = interviews.map(interview => {
        const application = applications.find(a => a.id === interview.application_id)
        const intern = interns.find(i => i.id === application?.intern_id)

        return {
          ...interview,
          application: {
            id: application?.id || '',
            status: application?.status || 'pending',
            internship_id: application?.internship_id || '',
            intern_id: application?.intern_id || '',
            intern: intern || {
              id: '',
              name: 'Unknown',
              email: ''
            }
          },
          hiringDecision: application?.status === 'approved'
            ? 'hired' as const
            : application?.status === 'rejected'
              ? 'not_hired' as const
              : null
        } as Interview
      })

      setInterviews(transformedInterviews)
    } catch (error: any) {
      console.error('Error fetching interviews:', error)
      setError(error?.message || 'Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchInterviews()
  }, [])

  // Handle closing an interview
  const handleCloseInterview = async (interviewId: string) => {
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ status: 'completed' })
        .eq('id', interviewId)

      if (error) throw error

      // Update local state
      setInterviews(interviews.map(interview =>
        interview.id === interviewId 
          ? { ...interview, status: 'completed', hiringDecision: null }
          : interview
      ))

      showAlert(
        "Interview Closed",
        "Please make a hiring decision for this candidate."
      )
    } catch (error) {
      console.error('Error closing interview:', error)
      showAlert('Error', 'Failed to close the interview')
    }
  }

  // Handle hiring decision
  const handleHiringDecision = async (applicationId: string, decision: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: decision })
        .eq('id', applicationId)

      if (error) throw error

      // Update local state
      setInterviews(interviews.map(interview =>
        interview.application.id === applicationId
          ? { 
              ...interview, 
              application: { ...interview.application, status: decision },
              hiringDecision: decision === 'approved' ? 'hired' : 'not_hired'
            }
          : interview
      ))

      showAlert(
        decision === 'approved' ? "Candidate Hired" : "Candidate Not Hired",
        `The candidate has been notified about your ${decision === 'approved' ? 'acceptance' : 'rejection'}.`
      )

      // Refresh interviews
      fetchInterviews()
    } catch (error) {
      console.error('Error updating application status:', error)
      showAlert('Error', 'Failed to update hiring decision')
    }
  }

  // Handle hire candidate
  const handleHireCandidate = (interviewId: string) => {
    const interview = interviews.find(i => i.id === interviewId)
    if (interview) {
      handleHiringDecision(interview.application.id, 'approved')
    }
  }

  // Handle don't hire candidate
  const handleDontHireCandidate = (interviewId: string) => {
    const interview = interviews.find(i => i.id === interviewId)
    if (interview) {
      handleHiringDecision(interview.application.id, 'rejected')
    }
  }

  // Format date and time for display
  const formatDate = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderInterviewsTab = () => {
    // Filter interviews based on the selected filter and search query
    const filteredInterviews = interviews.filter((interview) => {
      const matchesFilter = interviewFilter === "all" || interview.status === (interviewFilter === "scheduled" ? "scheduled" : "completed")
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        interview.application.intern.name.toLowerCase().includes(searchLower)
      return matchesFilter && matchesSearch
    })

    // Count interviews by status
    const interviewCounts = {
      all: interviews.length,
      scheduled: interviews.filter((i) => i.status === "scheduled").length,
      completed: interviews.filter((i) => i.status === "completed").length,
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095ff" />
          <Text style={styles.loadingText}>Loading interviews...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={50} color="#E91E63" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchInterviews}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabTitle}>Interviews</Text>
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
            style={[styles.filterChip, interviewFilter === "all" && styles.filterChipActive]}
            onPress={() => setInterviewFilter("all")}
          >
            <Text style={styles.filterChipText}>All ({interviewCounts.all})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, interviewFilter === "scheduled" && styles.filterChipActive]}
            onPress={() => setInterviewFilter("scheduled")}
          >
            <Text style={styles.filterChipText}>Scheduled ({interviewCounts.scheduled})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, interviewFilter === "completed" && styles.filterChipActive]}
            onPress={() => setInterviewFilter("completed")}
          >
            <Text style={styles.filterChipText}>Completed ({interviewCounts.completed})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.interviewsContainer}>
          {filteredInterviews.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Feather name="calendar" size={50} color="#666" />
              <Text style={styles.emptyStateText}>No interviews found</Text>
              <Text style={styles.emptyStateSubtext}>Try adjusting your filters</Text>
            </View>
          ) : (
            filteredInterviews.map((interview) => (
              <View key={interview.id} style={styles.interviewCardLarge}>
                <View style={styles.interviewCardHeader}>
                  <View style={styles.interviewAvatar}>
                    <Text style={styles.interviewAvatarText}>
                      {interview.application.intern.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.interviewInfo}>
                    <Text style={styles.interviewName}>{interview.application.intern.name}</Text>
                    <Text style={styles.interviewPosition}>
                      {interview.application.intern.email}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.interviewStatusBadge,
                      interview.status === "completed" && styles.interviewStatusBadgeEnded,
                    ]}
                  >
                    <Text
                      style={[
                        styles.interviewStatusText,
                        interview.status === "completed" && styles.interviewStatusTextEnded,
                      ]}
                    >
                      {interview.status === "scheduled" ? "Scheduled" : "Completed"}
                    </Text>
                  </View>
                </View>

                <View style={styles.interviewCardDetails}>
                  <View style={styles.interviewDetailItem}>
                    <Feather name="calendar" size={16} color="#0095ff" />
                    <Text style={styles.interviewDetailText}>
                      {formatDate(interview.scheduled_at)}
                    </Text>
                  </View>
                  <View style={styles.interviewDetailItem}>
                    <Feather name="watch" size={16} color="#0095ff" />
                    <Text style={styles.interviewDetailText}>
                      {formatTime(interview.scheduled_at)}
                    </Text>
                  </View>
                  <View style={styles.interviewDetailItem}>
                    {interview.meeting_link ? (
                      <>
                        <Feather name="video" size={16} color="#0095ff" />
                        <Text style={styles.interviewDetailText}>Virtual</Text>
                      </>
                    ) : interview.location ? (
                      <>
                        <Feather name="map-pin" size={16} color="#0095ff" />
                        <Text style={styles.interviewDetailText}>On-site</Text>
                      </>
                    ) : null}
                  </View>
                  <View style={styles.interviewDetailItem}>
                    <Feather name="clock" size={16} color="#0095ff" />
                    <Text style={styles.interviewDetailText}>Duration: {interview.duration_minutes} minutes</Text>
                  </View>
                  {interview.notes && (
                    <View style={styles.interviewDetailItem}>
                      <Feather name="file-text" size={16} color="#0095ff" />
                      <Text style={styles.interviewDetailText}>{interview.notes}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.interviewCardActions}>
                  {interview.status === "completed" && !interview.hiringDecision && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleHireCandidate(interview.id)}
                      >
                        <Feather name="user-check" size={14} color="#fff" />
                        <Text style={styles.actionButtonText}>Hire</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleDontHireCandidate(interview.id)}
                      >
                        <Feather name="user-x" size={14} color="#fff" />
                        <Text style={styles.actionButtonText}>Don't Hire</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {interview.status === "completed" && interview.hiringDecision === "hired" && (
                    <View style={[styles.actionButton, styles.hiredButton]}>
                      <Feather name="check-circle" size={14} color="#fff" />
                      <Text style={styles.actionButtonText}>Hired</Text>
                    </View>
                  )}
                  {interview.status === "completed" && interview.hiringDecision === "not_hired" && (
                    <View style={[styles.actionButton, styles.notHiredButton]}>
                      <Feather name="x-circle" size={14} color="#fff" />
                      <Text style={styles.actionButtonText}>Not Hired</Text>
                    </View>
                  )}
                </View>

                <View style={styles.interviewCardActions}>
                  {interview.status === "scheduled" && (
                    <>
                      {interview.meeting_link && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.joinButton]}
                          onPress={() => Linking.openURL(interview.meeting_link || "")}
                        >
                          <Feather name="video" size={14} color="#000" />
                          <Text style={styles.actionButtonText1}>Join Meeting</Text>
                        </TouchableOpacity>
                      )}

                      {!interview.meeting_link && interview.location && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.locationButton]}
                          onPress={() =>
                            Linking.openURL(
                              `https://maps.google.com/?q=${encodeURIComponent(interview.location || "")}`,
                            )
                          }
                        >
                          <Feather name="map" size={14} color="#fff" />
                          <Text style={styles.actionButtonText}>View Location</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => handleCloseInterview(interview.id)}
                      >
                        <Feather name="x" size={14} color="#E91E63" />
                        <Text style={[styles.actionButtonText, styles.closeButtonText]}>Close</Text>
                      </TouchableOpacity>
                    </>
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

      <ScrollView style={styles.content}>{renderInterviewsTab()}</ScrollView>

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
          onPress={() => router.push("/screens/CompanyApplicationsScreen")}
        >
          <Feather name="users" size={20} color={activeTab === "applications" ? "#0095ff" : "#666"} />
          <Text style={[styles.tabText, activeTab === "applications" && styles.tabTextActive]}>Applications</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "interviews" && styles.tabItemActive]}
          onPress={() => setActiveTab("interviews")}
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
    textAlign: "center",
    fontFamily: "System",
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
  interviewsContainer: {
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
  interviewCardLarge: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 16,
  },
  interviewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "space-between",
  },
  interviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  interviewAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
  },
  interviewInfo: {
    flex: 1,
  },
  interviewName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  interviewPosition: {
    fontSize: 12,
    color: "#666",
  },
  interviewCardDetails: {
    marginBottom: 16,
  },
  interviewDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  interviewDetailText: {
    fontSize: 14,
    color: "#666",
  },
  interviewCardActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
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
  actionButtonText1: {
    fontSize: 12,
    color: "#000",
    fontWeight: "600",
  },
  joinButton: {
    backgroundColor: "#ADD8E6",
  },
  locationButton: {
    backgroundColor: "#3CB371",
  },
  cancelButton: {
    backgroundColor: "rgba(233, 30, 99, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.3)",
  },
  closeButtonText: {
    color: "#E91E63",
  },
  approveButton: {
    backgroundColor: "#006400",
  },
  rejectButton: {
    backgroundColor: "#8b0000",
  },
  hiredButton: {
    backgroundColor: "#006400",
  },
  notHiredButton: {
    backgroundColor: "#8B0000",
  },
  interviewStatusBadge: {
    backgroundColor: "rgba(0, 149, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interviewStatusBadgeEnded: {
    backgroundColor: "rgba(233, 30, 99, 0.15)",
  },
  interviewStatusText: {
    fontSize: 12,
    color: "#0095ff",
    fontWeight: "600",
  },
  interviewStatusTextEnded: {
    color: "#E91E63",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#0095ff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#fff",
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
})

