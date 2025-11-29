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
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import * as DocumentPicker from "expo-document-picker"
import { SafeAreaView } from 'react-native-safe-area-context'
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

type InternshipDetails = {
  id: string
  company_name: string
  position: string
}

interface CompanyProfile {
  full_name: string
}

export default function SubmitApplicationScreen() {
  const router = useRouter()
  const { internshipId } = useLocalSearchParams()
  const [resumeFile, setResumeFile] = useState<DocumentPicker.DocumentPickerResult | null>(null)
  const [coverLetterFile, setCoverLetterFile] = useState<DocumentPicker.DocumentPickerResult | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [portfolioUrl, setPortfolioUrl] = useState("")
  const [availableDate, setAvailableDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [internshipDetails, setInternshipDetails] = useState<InternshipDetails | null>(null)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onClose: () => {} })

  useEffect(() => {
    fetchInternshipDetails()
  }, [internshipId])

  const fetchInternshipDetails = async () => {
    try {
      const { data: internship, error: internshipError } = await supabase
        .from('internships')
        .select('id, position, company_id')
        .eq('id', internshipId)
        .single()

      if (internshipError) throw internshipError
      if (!internship) throw new Error('Internship not found')

      const { data: companyProfile, error: companyError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', internship.company_id)
        .single()

      if (companyError) throw companyError

      setInternshipDetails({
        id: internship.id,
        position: internship.position,
        company_name: companyProfile?.full_name || 'Unknown Company'
      })
    } catch (error) {
      console.error('Error fetching internship details:', error)
      showAlert('Error', 'Failed to load internship details')
    }
  }

  const uploadFile = async (file: DocumentPicker.DocumentPickerAsset, path: string) => {
    try {
      // Validate file type
      if (!file.mimeType || !file.mimeType.toLowerCase().includes('pdf')) {
        throw new Error('Only PDF files are allowed')
      }

      // Validate file size (max 10MB)
      if (file.size && file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB')
      }

      console.log('Starting file upload process...', {
        name: file.name,
        size: file.size,
        type: file.mimeType,
        uri: file.uri
      })

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw sessionError
      }
      if (!session) {
        console.error('No active session found')
        throw new Error('No active session')
      }

      // Read the file
      const fileResponse = await fetch(file.uri)
      if (!fileResponse.ok) {
        throw new Error(`Failed to read file: ${fileResponse.statusText}`)
      }

      const fileData = await fileResponse.arrayBuffer()

      // Upload directly using arrayBuffer
      const { data, error } = await supabase.storage
        .from('applications')
        .upload(path, fileData, {
          contentType: 'application/pdf'
        })

      if (error) {
        console.error('Upload error:', error)
        throw error
      }

      console.log('File uploaded successfully')

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('applications')
        .getPublicUrl(path)

      return publicUrl
    } catch (error) {
      console.error('Upload error details:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      })
      throw new Error('Failed to upload file. Please try again.')
    }
  }

  const showAlert = (title: string, message: string, onClose = () => {}) => {
    setAlertConfig({ title, message, onClose })
    setAlertVisible(true)
  }

  const validateFields = () => {
    if (!resumeFile || resumeFile.canceled) {
      showAlert("Missing Resume", "Please upload your resume to continue.")
      return false
    }
    if (!phoneNumber) {
      showAlert("Missing Phone Number", "Please enter your phone number.")
      return false
    }
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(phoneNumber)) {
      showAlert("Invalid Phone Number", "Please enter a valid 10-digit phone number.")
      return false
    }
    if (availableDate) {
      const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/
      if (!dateRegex.test(availableDate)) {
        showAlert("Invalid Date", "Please enter a valid date in MM/DD/YYYY format.")
        return false
      }
      // Validate if the date is not in the past
      const [month, day, year] = availableDate.split('/')
      const inputDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (inputDate < today) {
        showAlert("Invalid Date", "Start date cannot be in the past.")
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateFields()) return

    try {
      setIsLoading(true)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('Not authenticated')

      // Check for existing application
      const { data: existingApplication } = await supabase
        .from('applications')
        .select('id')
        .eq('intern_id', user.id)
        .eq('internship_id', internshipId)
        .single()

      if (existingApplication) {
        showAlert('Already Applied', 'You have already applied for this internship')
        return
      }

      if (!resumeFile?.assets?.[0]) {
        throw new Error('Resume file is required')
      }

      try {
        // Upload resume
        const resumePath = `${user.id}/${internshipId}/resume-${Date.now()}.pdf`
        const resumeUrl = await uploadFile(resumeFile.assets[0], resumePath)

        // Upload cover letter if provided
        let coverLetterUrl = null
        if (coverLetterFile?.assets?.[0]) {
          const coverLetterPath = `${user.id}/${internshipId}/cover-letter-${Date.now()}.pdf`
          coverLetterUrl = await uploadFile(coverLetterFile.assets[0], coverLetterPath)
        }

        // Convert date from MM/DD/YYYY to ISO format
        let formattedDate = null
        if (availableDate) {
          const [month, day, year] = availableDate.split('/')
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
          if (isValidDate(date)) {
            formattedDate = date.toISOString().split('T')[0]
          }
        }

        // Create application record
        const { error: applicationError } = await supabase
          .from('applications')
          .insert({
            intern_id: user.id,
            internship_id: internshipId,
            status: 'pending',
            resume_url: resumeUrl,
            cover_letter_url: coverLetterUrl,
            phone_number: phoneNumber,
            portfolio_url: portfolioUrl || null,
            available_start_date: formattedDate
          })

        if (applicationError) {
          console.error('Application insert error:', applicationError)
          throw new Error('Failed to create application record')
        }

        showAlert(
          "Application Submitted",
          "Your application has been submitted successfully!",
          () => router.back()
        )
      } catch (uploadError: any) {
        console.error('Error during file upload:', uploadError)
        throw new Error(uploadError.message || 'Failed to upload files')
      }
    } catch (error: any) {
      console.error('Error submitting application:', error)
      showAlert('Error', error.message || 'Failed to submit application. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const pickDocument = async (type: "resume" | "coverLetter") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      })

      if (!result.canceled) {
        if (type === "resume") {
          setResumeFile(result)
        } else {
          setCoverLetterFile(result)
        }
      }
    } catch (error) {
      console.error('Error picking document:', error)
      Alert.alert("Error", "Failed to pick document. Please try again.")
    }
  }

  // Add helper function to validate date
  const isValidDate = (date: Date) => {
    return date instanceof Date && !isNaN(date.getTime())
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image source={lImage} style={styles.logo} />
            <Text style={styles.headerTitle}>Submit Application</Text>
          </View>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {internshipDetails && (
          <View style={styles.internshipCard}>
            <View style={styles.internshipHeader}>
              <View style={styles.logoContainer}>
                <Text style={styles.companyAvatarText}>
                  {internshipDetails.company_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.internshipInfo}>
                <Text style={styles.companyName}>{internshipDetails.company_name}</Text>
                <Text style={styles.positionName}>{internshipDetails.position}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Documents</Text>

          <TouchableOpacity
            style={[styles.uploadButton, resumeFile && !resumeFile.canceled ? styles.uploadComplete : {}]}
            onPress={() => pickDocument("resume")}
          >
            <Feather
              name={resumeFile && !resumeFile.canceled ? "check-circle" : "file-text"}
              size={24}
              color={resumeFile && !resumeFile.canceled ? "#4CAF50" : "#666"}
            />
            <View style={styles.uploadContent}>
              <Text style={styles.uploadTitle}>Resume/CV <Text style={styles.required}>*</Text></Text>
              <Text style={styles.uploadSubtitle}>
                {resumeFile && !resumeFile.canceled ? resumeFile.assets[0].name : "Upload your resume (PDF)"}
              </Text>
            </View>
            <Feather name="upload" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadButton, coverLetterFile && !coverLetterFile.canceled ? styles.uploadComplete : {}]}
            onPress={() => pickDocument("coverLetter")}
          >
            <Feather
              name={coverLetterFile && !coverLetterFile.canceled ? "check-circle" : "file-text"}
              size={24}
              color={coverLetterFile && !coverLetterFile.canceled ? "#4CAF50" : "#666"}
            />
            <View style={styles.uploadContent}>
              <Text style={styles.uploadTitle}>Cover Letter (Optional)</Text>
              <Text style={styles.uploadSubtitle}>
                {coverLetterFile && !coverLetterFile.canceled ? coverLetterFile.assets[0].name : "Upload your cover letter (PDF)"}
              </Text>
            </View>
            <Feather name="upload" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#666"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Portfolio URL (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://your-portfolio.com"
              placeholderTextColor="#666"
              value={portfolioUrl}
              onChangeText={setPortfolioUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Available Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#666"
              value={availableDate}
              onChangeText={setAvailableDate}
            />
          </View>
        </View>

        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? "Submitting..." : "Submit Application"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By submitting this application, you agree to our Terms and Privacy Policy.
          </Text>
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
  internshipCard: {
    margin: 16,
    padding: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  internshipHeader: {
    flexDirection: "row",
    alignItems: "center",
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
  internshipInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    color: "#999",
    marginBottom: 4,
  },
  positionName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  uploadComplete: {
    borderColor: "rgba(76, 175, 80, 0.3)",
    backgroundColor: "rgba(76, 175, 80, 0.05)",
  },
  uploadContent: {
    flex: 1,
    marginLeft: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
  },
  submitContainer: {
    padding: 16,
    marginBottom: 32,
  },
  submitButton: {
    backgroundColor: "#0095ff",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disclaimer: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  required: {
    color: "red",
  },
  submitButtonDisabled: {
    opacity: 0.7,
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
