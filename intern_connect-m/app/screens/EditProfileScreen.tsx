"use client"
import { useState } from "react"
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import * as DocumentPicker from "expo-document-picker"
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

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

export default function EditProfileScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const lImage = require("../../assets/image/L.png")
  const [loading, setLoading] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onClose: () => {} });

  // Initial profile data (in a real app, this would come from props or context)
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.user_metadata?.full_name || "",
    title: user?.user_metadata?.title || "",
    photo: user?.user_metadata?.avatar_url || "",
    email: user?.email || "",
    phone: user?.user_metadata?.phone || "",
    location: user?.user_metadata?.location || "",
    education: {
      degree: user?.user_metadata?.degree || "",
      university: user?.user_metadata?.university || "",
      graduationYear: user?.user_metadata?.graduation_year || "",
    },
    skills: user?.user_metadata?.skills || [],
    experience: user?.user_metadata?.experience || [{
      title: "",
      company: "",
      duration: "",
      description: "",
    }],
    certifications: user?.user_metadata?.certifications || [],
    languages: user?.user_metadata?.languages || [],
  })

  // State for new skill and certification inputs
  const [newSkill, setNewSkill] = useState("")
  const [newCertification, setNewCertification] = useState("")
  const [newLanguage, setNewLanguage] = useState("")

  const showAlert = (title: string, message: string, onClose = () => {}) => {
    setAlertConfig({ title, message, onClose });
    setAlertVisible(true);
  };

  // Handle profile photo change
  const handleChangePhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      })

      if (result.canceled === false) {
        // For newer versions of expo-document-picker
        const file = result.assets[0]
        setProfile({
          ...profile,
          photo: file.uri,
        })
      }
    } catch (error) {
      showAlert("Error", "Failed to pick image. Please try again.");
    }
  }

  // Handle adding a new skill
  const handleAddSkill = () => {
    if (newSkill.trim() === "") return
    setProfile({
      ...profile,
      skills: [...profile.skills, newSkill.trim()],
    })
    setNewSkill("")
  }

  // Handle removing a skill
  const handleRemoveSkill = (index: number) => {
    const updatedSkills = [...profile.skills]
    updatedSkills.splice(index, 1)
    setProfile({
      ...profile,
      skills: updatedSkills,
    })
  }

  // Handle adding a new certification
  const handleAddCertification = () => {
    if (newCertification.trim() === "") return
    setProfile({
      ...profile,
      certifications: [...profile.certifications, newCertification.trim()],
    })
    setNewCertification("")
  }

  // Handle removing a certification
  const handleRemoveCertification = (index: number) => {
    const updatedCertifications = [...profile.certifications]
    updatedCertifications.splice(index, 1)
    setProfile({
      ...profile,
      certifications: updatedCertifications,
    })
  }

  // Handle adding a new language
  const handleAddLanguage = () => {
    if (newLanguage.trim() === "") return
    setProfile({
      ...profile,
      languages: [...profile.languages, newLanguage.trim()],
    })
    setNewLanguage("")
  }

  // Handle removing a language
  const handleRemoveLanguage = (index: number) => {
    const updatedLanguages = [...profile.languages]
    updatedLanguages.splice(index, 1)
    setProfile({
      ...profile,
      languages: updatedLanguages,
    })
  }

  // Handle saving the profile
  const handleSaveProfile = async () => {
    try {
      setLoading(true)
      
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.name,
        })
        .eq('id', user?.id)

      if (profileError) throw profileError

      // Update intern_profiles table
      const { error: internProfileError } = await supabase
        .from('intern_profiles')
        .update({
          name: profile.name,
          title: profile.title,
          photo: profile.photo,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          education: {
            degree: profile.education.degree,
            university: profile.education.university,
            graduationYear: profile.education.graduationYear
          },
          skills: profile.skills,
          experience: profile.experience,
          certifications: profile.certifications,
          languages: profile.languages,
        })
        .eq('id', user?.id)

      if (internProfileError) throw internProfileError

      // Also update user metadata for backward compatibility
      const { error: userError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.name,
          title: profile.title,
          phone: profile.phone,
          location: profile.location,
          degree: profile.education.degree,
          university: profile.education.university,
          graduation_year: profile.education.graduationYear,
          skills: profile.skills,
          experience: profile.experience,
          certifications: profile.certifications,
          languages: profile.languages,
          avatar_url: profile.photo,
        }
      })

      if (userError) throw userError

      showAlert("Success", "Profile updated successfully!", () => router.back())
    } catch (error) {
      console.error('Error updating profile:', error)
      showAlert("Error", "Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const addExperience = () => {
    setProfile(prev => ({
      ...prev,
      experience: [...prev.experience, { title: "", company: "", duration: "", description: "" }]
    }))
  }

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.map((exp: Experience, i: number) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const addSkill = () => {
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, ""]
    }))
  }

  const updateSkill = (index: number, value: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.map((skill: string, i: number) => i === index ? value : skill)
    }))
  }

  const addCertification = () => {
    setProfile(prev => ({
      ...prev,
      certifications: [...prev.certifications, ""]
    }))
  }

  const updateCertification = (index: number, value: string) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert: string, i: number) => i === index ? value : cert)
    }))
  }

  const addLanguage = () => {
    setProfile(prev => ({
      ...prev,
      languages: [...prev.languages, ""]
    }))
  }

  const updateLanguage = (index: number, value: string) => {
    setProfile(prev => ({
      ...prev,
      languages: prev.languages.map((lang: string, i: number) => i === index ? value : lang)
    }))
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertVisible(false);
          alertConfig.onClose();
        }}
      />

      {/* Updated header with LinearGradient like the other screens */}
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image source={lImage} style={styles.headerLogo} />
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>
          {/* Empty view for balanced spacing */}
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {profile.photo ? (
              <Image
                source={{ uri: profile.photo }}
                style={styles.profileImage}
              />
            ) : (
              <Text style={styles.noPhotoText}>No Photo</Text>
            )}
            <TouchableOpacity style={styles.editPhotoButton} onPress={handleChangePhoto}>
              <Feather name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
                placeholder="Enter your full name"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Professional Title</Text>
              <TextInput
                style={styles.input}
                value={profile.title}
                onChangeText={(text) => setProfile({ ...profile, title: text })}
                placeholder="Enter your professional title"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={profile.email}
                onChangeText={(text) => setProfile({ ...profile, email: text })}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={profile.phone}
                onChangeText={(text) => setProfile({ ...profile, phone: text })}
                placeholder="Enter your phone number"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                value={profile.location}
                onChangeText={(text) => setProfile({ ...profile, location: text })}
                placeholder="Enter your location"
                placeholderTextColor="#666"
              />
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
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Degree</Text>
              <TextInput
                style={styles.input}
                value={profile.education.degree}
                onChangeText={(text) =>
                  setProfile({
                    ...profile,
                    education: { ...profile.education, degree: text },
                  })
                }
                placeholder="Enter your degree"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>University/Institution</Text>
              <TextInput
                style={styles.input}
                value={profile.education.university}
                onChangeText={(text) =>
                  setProfile({
                    ...profile,
                    education: { ...profile.education, university: text },
                  })
                }
                placeholder="Enter your university/institution"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Graduation Year</Text>
              <TextInput
                style={styles.input}
                value={profile.education.graduationYear}
                onChangeText={(text) =>
                  setProfile({
                    ...profile,
                    education: { ...profile.education, graduationYear: text },
                  })
                }
                placeholder="Enter your graduation year"
                placeholderTextColor="#666"
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="briefcase" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Experience</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Job Title</Text>
              <TextInput
                style={styles.input}
                value={profile.experience[0].title}
                onChangeText={(text) => {
                  const updatedExperience = [...profile.experience]
                  updatedExperience[0] = { ...updatedExperience[0], title: text }
                  setProfile({ ...profile, experience: updatedExperience })
                }}
                placeholder="Enter your job title"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Company</Text>
              <TextInput
                style={styles.input}
                value={profile.experience[0].company}
                onChangeText={(text) => {
                  const updatedExperience = [...profile.experience]
                  updatedExperience[0] = { ...updatedExperience[0], company: text }
                  setProfile({ ...profile, experience: updatedExperience })
                }}
                placeholder="Enter company name"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Duration</Text>
              <TextInput
                style={styles.input}
                value={profile.experience[0].duration}
                onChangeText={(text) => {
                  const updatedExperience = [...profile.experience]
                  updatedExperience[0] = { ...updatedExperience[0], duration: text }
                  setProfile({ ...profile, experience: updatedExperience })
                }}
                placeholder="Enter duration (e.g., 3 months)"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={profile.experience[0].description}
                onChangeText={(text) => {
                  const updatedExperience = [...profile.experience]
                  updatedExperience[0] = { ...updatedExperience[0], description: text }
                  setProfile({ ...profile, experience: updatedExperience })
                }}
                placeholder="Enter job description"
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="code" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Skills</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.skillsContainer}>
              {profile.skills.map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                  <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveSkill(index)}>
                    <Feather name="x" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.addItemContainer}>
              <TextInput
                style={styles.addItemInput}
                value={newSkill}
                onChangeText={setNewSkill}
                placeholder="Add a new skill"
                placeholderTextColor="#666"
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddSkill}>
                <Feather name="plus" size={20} color="#fff" />
              </TouchableOpacity>
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
            {profile.certifications.map((cert, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Feather name="check-circle" size={16} color="#0077b5" />
                  <Text style={styles.listItemText}>{cert}</Text>
                </View>
                <TouchableOpacity style={styles.removeListItemButton} onPress={() => handleRemoveCertification(index)}>
                  <Feather name="trash-2" size={16} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addItemContainer}>
              <TextInput
                style={styles.addItemInput}
                value={newCertification}
                onChangeText={setNewCertification}
                placeholder="Add a new certification"
                placeholderTextColor="#666"
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddCertification}>
                <Feather name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Languages */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="globe" size={20} color="#fff" />
            <Text style={styles.sectionTitle}>Languages</Text>
          </View>
          <View style={styles.card}>
            {profile.languages.map((language, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>{language}</Text>
                <TouchableOpacity style={styles.removeListItemButton} onPress={() => handleRemoveLanguage(index)}>
                  <Feather name="trash-2" size={16} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addItemContainer}>
              <TextInput
                style={styles.addItemInput}
                value={newLanguage}
                onChangeText={setNewLanguage}
                placeholder="Add a new language"
                placeholderTextColor="#666"
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddLanguage}>
                <Feather name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Feather name="x" size={20} color="#fff" />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

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
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editPhotoButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#0077b5",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#999",
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  skillChip: {
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  skillText: {
    color: "#fff",
    fontSize: 14,
  },
  removeButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255, 107, 107, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  addItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 15,
  },
  addButton: {
    backgroundColor: "#0077b5",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  listItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listItemText: {
    color: "#e0e0e0",
    fontSize: 15,
  },
  removeListItemButton: {
    padding: 4,
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#0077b5",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    flexDirection: "row",
    backgroundColor: "#333",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 20,
  },
  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "400",
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
  noPhotoText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
})

