"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"

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

type Candidate = {
  id: string
  name: string
  position: string
  avatar?: string
}

// Types for the raw data returned from Supabase
type ApplicationData = {
  id: string
  intern_id: string
  internship_id: string
  internship: {
    position: string
  }
}

// Application type for the component state
type Application = {
  id: string
  intern_id: string
  internship_id: string
  intern_profile: {
    full_name: string
    photo?: string
  }
  internship: {
    position: string
  }
}

export default function ScheduleInterviewScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const params = useLocalSearchParams()
  const applicationId = params.id as string

  // State variables
  const [isLoading, setIsLoading] = useState(true)
  const [application, setApplication] = useState<Application | null>(null)
  const [dateInput, setDateInput] = useState("")
  const [timeInput, setTimeInput] = useState("")
  const [duration, setDuration] = useState("60")
  const [isVirtual, setIsVirtual] = useState(true)
  const [meetingLink, setMeetingLink] = useState("")
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onClose: () => {} })

  const showAlert = (title: string, message: string, onClose = () => {}) => {
    setAlertConfig({ title, message, onClose })
    setAlertVisible(true)
  }

  useEffect(() => {
    if (applicationId) {
      fetchApplication()
    } else {
      setIsLoading(false)
      showAlert("Error", "No application ID provided", () => router.back())
    }
  }, [applicationId])

  const fetchApplication = async () => {
    try {
      setIsLoading(true)
      
      // First fetch the basic application data
      const { data: applicationData, error: applicationError } = await supabase
        .from('applications')
        .select('id, intern_id, internship_id')
        .eq('id', applicationId)
        .single()

      if (applicationError) throw applicationError
      
      if (!applicationData) {
        showAlert("Error", "Application not found", () => router.back())
        return
      }

      // Fetch the internship data
      const { data: internshipData, error: internshipError } = await supabase
        .from('internships')
        .select('position')
        .eq('id', applicationData.internship_id)
        .single()

      if (internshipError) throw internshipError

      // Fetch the intern profile data
      const { data: profileData, error: profileError } = await supabase
        .from('intern_profiles')
        .select('name, photo')
        .eq('id', applicationData.intern_id)
        .single()

      if (profileError) throw profileError

      // Combine all the data
      const applicationWithProfile: Application = {
        id: applicationData.id,
        intern_id: applicationData.intern_id,
        internship_id: applicationData.internship_id,
        intern_profile: {
          full_name: profileData.name,
          photo: profileData.photo
        },
        internship: {
          position: internshipData.position
        }
      }
      
      // Set the application state
      setApplication(applicationWithProfile)
    } catch (error) {
      console.error("Error fetching application:", error)
      showAlert("Error", "Failed to load application details", () => router.back())
    } finally {
      setIsLoading(false)
    }
  }

  // Handle scheduling the interview
  const handleScheduleInterview = async () => {
    if (!application) return

    if (!dateInput) {
      showAlert("Error", "Please enter a date")
      return
    }

    if (!timeInput) {
      showAlert("Error", "Please enter a time")
      return
    }

    if (isVirtual && !meetingLink) {
      showAlert("Error", "Please provide a meeting link")
      return
    }

    if (!isVirtual && !location) {
      showAlert("Error", "Please provide a location")
      return
    }

    try {
      setIsSubmitting(true)
      
      // Check session before proceeding
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        // If session is invalid, try to refresh it
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError || !refreshedSession) {
          throw new Error("Authentication error. Please log in again.")
        }
      }
      
      // Parse date and time
      const [month, day, year] = dateInput.split('/').map(Number)
      const [hours, minutes, period] = timeInput.match(/(\d+):(\d+)\s*(AM|PM)/i)?.slice(1) || []
      
      let hour = parseInt(hours)
      if (period.toUpperCase() === 'PM' && hour < 12) hour += 12
      if (period.toUpperCase() === 'AM' && hour === 12) hour = 0
      
      const scheduledDate = new Date(year, month - 1, day, hour, parseInt(minutes))

      // Ensure we have valid strings for required fields
      const interviewLocation = isVirtual ? 'Virtual Meeting' : location || ''
      const interviewMeetingLink = isVirtual ? (meetingLink || '') : ''
      
      // Insert interview record
      const { data, error } = await supabase
        .from('interviews')
        .insert({
          application_id: applicationId,
          scheduled_at: scheduledDate.toISOString(),
          duration_minutes: parseInt(duration),
          location: interviewLocation,
          meeting_link: interviewMeetingLink,
          notes: notes || '',
          status: 'scheduled'
        })
        .select()
        .single()

      if (error) {
        if (error.message.includes('Invalid Refresh Token')) {
          showAlert(
            "Session Expired",
            "Your session has expired. Please log in again.",
            () => router.push("/screens/LoginScreen")
          )
          return
        }
        throw error
      }

      showAlert(
        "Success", 
        `Interview with ${application.intern_profile.full_name} scheduled for ${dateInput} at ${timeInput}`,
        () => router.push("/screens/CompanyInterviewsScreen")
      )
    } catch (error: any) {
      console.error("Error scheduling interview:", error)
      if (error.message.includes('Invalid Refresh Token')) {
        showAlert(
          "Session Expired",
          "Your session has expired. Please log in again.",
          () => router.push("/screens/LoginScreen")
        )
      } else {
        showAlert("Error", "Failed to schedule interview. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095ff" />
          <Text style={styles.loadingText}>Loading application details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Application not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
      {/* Updated header with LinearGradient like the other screens */}
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image source={lImage} style={styles.logo} />
            <Text style={styles.headerTitle}>Schedule Interview</Text>
          </View>
          {/* Empty view for balanced spacing */}
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Candidate Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Candidate Information</Text>
            <View style={styles.candidateCard}>
              <View style={styles.selectedCandidateContainer}>
                <View style={styles.avatarContainer}>
                  {application.intern_profile.photo ? (
                    <Image
                      source={{ uri: application.intern_profile.photo }}
                      style={styles.avatar}
                      defaultSource={lImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {application.intern_profile.full_name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.candidateInfo}>
                  <Text style={styles.candidateName}>{application.intern_profile.full_name}</Text>
                  <Text style={styles.candidatePosition}>{application.internship.position}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Date and Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date & Time</Text>
            <View style={styles.dateTimeContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#666"
                  value={dateInput}
                  onChangeText={setDateInput}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM AM/PM"
                  placeholderTextColor="#666"
                  value={timeInput}
                  onChangeText={setTimeInput}
                />
              </View>
            </View>

            <View style={styles.durationContainer}>
              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <View style={styles.durationButtonsContainer}>
                {["15", "30", "45", "60"].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.durationButton, duration === value && styles.durationButtonActive]}
                    onPress={() => setDuration(value)}
                  >
                    <Text style={[styles.durationButtonText, duration === value && styles.durationButtonTextActive]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Interview Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interview Type</Text>
            <View style={styles.interviewTypeContainer}>
              <TouchableOpacity
                style={[styles.typeButton, isVirtual && styles.typeButtonActive]}
                onPress={() => setIsVirtual(true)}
              >
                <Feather name="video" size={20} color={isVirtual ? "#0095ff" : "#666"} />
                <Text style={[styles.typeButtonText, isVirtual && styles.typeButtonTextActive]}>Virtual</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, !isVirtual && styles.typeButtonActive]}
                onPress={() => setIsVirtual(false)}
              >
                <Feather name="map-pin" size={20} color={!isVirtual ? "#0095ff" : "#666"} />
                <Text style={[styles.typeButtonText, !isVirtual && styles.typeButtonTextActive]}>On-site</Text>
              </TouchableOpacity>
            </View>

            {isVirtual ? (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Meeting Link</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://zoom.us/j/123456789"
                  placeholderTextColor="#666"
                  value={meetingLink}
                  onChangeText={setMeetingLink}
                  autoCapitalize="none"
                />
                <View style={styles.platformButtons}>
                  <TouchableOpacity style={styles.platformButton} onPress={() => setMeetingLink("https://zoom.us/j/")}>
                    <Text style={styles.platformButtonText}>Zoom</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.platformButton}
                    onPress={() => setMeetingLink("https://meet.google.com/")}
                  >
                    <Text style={styles.platformButtonText}>Google Meet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.platformButton}
                    onPress={() => setMeetingLink("https://teams.microsoft.com/l/meetup-join/")}
                  >
                    <Text style={styles.platformButtonText}>Teams</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Office address or meeting room"
                  placeholderTextColor="#666"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            )}
          </View>

          {/* Additional Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Add any additional information for the candidate..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Schedule Button */}
          <TouchableOpacity 
            style={[styles.scheduleButton, isSubmitting && styles.scheduleButtonDisabled]} 
            onPress={handleScheduleInterview}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.scheduleButtonText}>Schedule Interview</Text>
            )}
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  dropdownButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 16,
  },
  dropdownButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownPlaceholder: {
    color: "#666",
    fontSize: 16,
  },
  selectedCandidateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  candidatePosition: {
    fontSize: 14,
    color: "#666",
  },
  dropdownMenu: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginTop: 8,
    padding: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  dateTimeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 16,
    color: "#fff",
    fontSize: 16,
  },
  durationContainer: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
  },
  durationButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  durationButton: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 12,
    alignItems: "center",
  },
  durationButtonActive: {
    backgroundColor: "rgba(0, 149, 255, 0.15)",
    borderColor: "#0095ff",
  },
  durationButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  durationButtonTextActive: {
    color: "#0095ff",
  },
  interviewTypeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 16,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: "rgba(0, 149, 255, 0.15)",
    borderColor: "#0095ff",
  },
  typeButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  typeButtonTextActive: {
    color: "#0095ff",
  },
  platformButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  platformButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 8,
  },
  platformButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  textArea: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 16,
    color: "#fff",
    fontSize: 16,
    height: 120,
    textAlignVertical: "top",
  },
  scheduleButton: {
    backgroundColor: "#0095ff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  scheduleButtonDisabled: {
    backgroundColor: "#0066cc",
    opacity: 0.7,
  },
  scheduleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  candidateCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  backButtonText: {
    color: "#0095ff",
    fontSize: 16,
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
})

