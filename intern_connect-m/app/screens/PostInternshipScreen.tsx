import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Switch,
  Modal,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"

const lImage = require("../../assets/image/L.png")

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
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
  );
};

export default function PostInternship() {
  const router = useRouter()
  const { user } = useAuth()

  interface FormState {
    position: string
    department: string
    requirements: string
    responsibilities: string
    deadline: string
    duration: string
    workType: string
    isPaid: boolean
    stipend: string
    skills: string[]
    location: string
    spots: string
  }

  const [form, setForm] = useState<FormState>({
    position: "",
    department: "",
    requirements: "",
    responsibilities: "",
    deadline: "",
    duration: "",
    workType: "onsite",
    isPaid: true,
    stipend: "",
    skills: [],
    location: "",
    spots: "1",
  })

  const [focused, setFocused] = useState("")
  const [currentSkill, setCurrentSkill] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
  })

  const workTypes = ["onsite", "remote", "hybrid"]

  const showAlert = (title: string, message: string, onClose?: () => void) => {
    setAlertConfig({
      visible: true,
      title,
      message,
    });
    if (onClose) {
      setTimeout(() => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        onClose();
      }, 2000);
    }
  };

  const addSkill = () => {
    if (currentSkill && !form.skills.includes(currentSkill)) {
      setForm({ ...form, skills: [...form.skills, currentSkill] })
      setCurrentSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) })
  }

  const validateField = (name: string, value: string) => {
    let error = ""

    switch (name) {
      case "position":
        if (!value.trim()) error = "Position title is required"
        break
      case "deadline":
        if (!value.trim()) error = "Application deadline is required"
        else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) error = "Deadline must be in YYYY-MM-DD format"
        break
      case "spots":
        if (isNaN(Number(value)) || Number(value) <= 0) error = "Number of spots must be a valid number"
        break
      case "stipend":
        if (form.isPaid && (isNaN(Number(value)) || value.trim() === ""))
          error = "Stipend must be a valid number"
        break
      case "location":
        if (!value.trim() && form.workType !== "remote") error = "Location is required"
        break
      case "requirements":
        if (!value.trim()) error = "Requirements are required"
        break
      case "responsibilities":
        if (!value.trim()) error = "Responsibilities are required"
        break
      case "duration":
        if (!value.trim()) error = "Duration is required"
        break
      default:
        break
    }

    setErrors((prev) => ({ ...prev, [name]: error }))
    return !error
  }

  const validateForm = () => {
    let isValid = true

    // Validate all fields
    isValid = validateField("position", form.position) && isValid
    isValid = validateField("deadline", form.deadline) && isValid
    isValid = validateField("spots", form.spots) && isValid
    isValid = validateField("stipend", form.stipend) && isValid
    isValid = validateField("location", form.location) && isValid
    isValid = validateField("requirements", form.requirements) && isValid
    isValid = validateField("responsibilities", form.responsibilities) && isValid
    isValid = validateField("duration", form.duration) && isValid

    return isValid
  }

  const handleSubmit = async () => {
    if (!user) {
      showAlert("Error", "You must be logged in to post an internship");
      return;
    }

    if (validateForm()) {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('internships')
          .insert([
            {
              company_id: user.id,
              position: form.position,
              department: form.department,
              requirements: form.requirements,
              responsibilities: form.responsibilities,
              deadline: form.deadline,
              duration: form.duration,
              work_type: form.workType,
              is_paid: form.isPaid,
              stipend: form.isPaid ? Number(form.stipend) : null,
              skills: form.skills,
              location: form.location,
              spots: Number(form.spots),
              status: "open"
            }
          ])
          .select();

        if (error) throw error;

        showAlert("Success", "Internship posted successfully!", () => {
          router.back();
        });
      } catch (error: any) {
        showAlert("Error", error.message || "Failed to post internship");
      } finally {
        setIsLoading(false);
      }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image source={lImage} style={styles.logo} />
            <Text style={styles.headerTitle}>Post Internship</Text>
          </View>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>Fill in the details to post your internship opportunity</Text>

          <View style={styles.form}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Position Title*</Text>
                <TextInput
                  style={[styles.input, focused === "position" && styles.inputFocused]}
                  placeholder="e.g., Frontend Developer Intern"
                  placeholderTextColor="#666"
                  value={form.position}
                  onChangeText={(text) => setForm({ ...form, position: text })}
                  onFocus={() => setFocused("position")}
                  onBlur={() => {
                    setFocused("")
                    validateField("position", form.position)
                  }}
                />
                {errors.position && <Text style={styles.errorText}>{errors.position}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Department*</Text>
                <TextInput
                  style={[styles.input, focused === "department" && styles.inputFocused]}
                  placeholder="e.g., Engineering"
                  placeholderTextColor="#666"
                  value={form.department}
                  onChangeText={(text) => setForm({ ...form, department: text })}
                  onFocus={() => setFocused("department")}
                  onBlur={() => setFocused("")}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Number of Spots*</Text>
                <TextInput
                  style={[styles.input, focused === "spots" && styles.inputFocused]}
                  placeholder="Enter number of positions"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  value={form.spots}
                  onChangeText={(text) => setForm({ ...form, spots: text })}
                  onFocus={() => setFocused("spots")}
                  onBlur={() => {
                    setFocused("")
                    validateField("spots", form.spots)
                  }}
                />
                {errors.spots && <Text style={styles.errorText}>{errors.spots}</Text>}
              </View>
            </View>

            {/* Work Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Work Type*</Text>
              <View style={styles.workTypeContainer}>
                {workTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.workTypeButton, form.workType === type && styles.workTypeButtonActive]}
                    onPress={() => setForm({ ...form, workType: type })}
                  >
                    <Text style={[styles.workTypeText, form.workType === type && styles.workTypeTextActive]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location*</Text>
              <TextInput
                style={[styles.input, focused === "location" && styles.inputFocused]}
                placeholder="Enter work location"
                placeholderTextColor="#666"
                value={form.location}
                onChangeText={(text) => setForm({ ...form, location: text })}
                onFocus={() => setFocused("location")}
                onBlur={() => {
                  setFocused("")
                  validateField("location", form.location)
                }}
              />
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </View>

            {/* Compensation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compensation</Text>
              <View style={styles.compensationContainer}>
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Paid Internship*</Text>
                  <Switch
                    value={form.isPaid}
                    onValueChange={(value) => setForm({ ...form, isPaid: value })}
                    trackColor={{ false: "#333", true: "#0066CC" }}
                    thumbColor={form.isPaid ? "#FFFFFF" : "#666"}
                  />
                </View>
                {form.isPaid && (
                  <>
                    <TextInput
                      style={[styles.input, focused === "stipend" && styles.inputFocused]}
                      placeholder="Enter stipend amount"
                      placeholderTextColor="#666"
                      keyboardType="number-pad"
                      value={form.stipend}
                      onChangeText={(text) => setForm({ ...form, stipend: text })}
                      onFocus={() => setFocused("stipend")}
                      onBlur={() => {
                        setFocused("")
                        validateField("stipend", form.stipend)
                      }}
                    />
                    {errors.stipend && <Text style={styles.errorText}>{errors.stipend}</Text>}
                  </>
                )}
              </View>
            </View>

            {/* Skills */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Required Skills*</Text>
              <View style={styles.skillsContainer}>
                <View style={styles.skillInputContainer}>
                  <TextInput
                    style={[styles.skillInput, focused === "skills" && styles.inputFocused]}
                    placeholder="Add required skills"
                    placeholderTextColor="#666"
                    value={currentSkill}
                    onChangeText={setCurrentSkill}
                    onFocus={() => setFocused("skills")}
                    onBlur={() => setFocused("")}
                    onSubmitEditing={addSkill}
                  />
                  <TouchableOpacity style={styles.addSkillButton} onPress={addSkill}>
                    <Feather name="plus" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <View style={styles.skillTags}>
                  {form.skills.map((skill, index) => (
                    <TouchableOpacity key={index} style={styles.skillTag} onPress={() => removeSkill(skill)}>
                      <Text style={styles.skillTagText}>{skill}</Text>
                      <Feather name="x" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Requirements */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements*</Text>
              <TextInput
                style={[styles.textArea, focused === "requirements" && styles.inputFocused]}
                placeholder="Enter internship requirements"
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                value={form.requirements}
                onChangeText={(text) => setForm({ ...form, requirements: text })}
                onFocus={() => setFocused("requirements")}
                onBlur={() => {
                  setFocused("")
                  validateField("requirements", form.requirements)
                }}
              />
              {errors.requirements && <Text style={styles.errorText}>{errors.requirements}</Text>}
            </View>

            {/* Responsibilities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Responsibilities*</Text>
              <TextInput
                style={[styles.textArea, focused === "responsibilities" && styles.inputFocused]}
                placeholder="Enter intern responsibilities"
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                value={form.responsibilities}
                onChangeText={(text) => setForm({ ...form, responsibilities: text })}
                onFocus={() => setFocused("responsibilities")}
                onBlur={() => {
                  setFocused("")
                  validateField("responsibilities", form.responsibilities)
                }}
              />
              {errors.responsibilities && <Text style={styles.errorText}>{errors.responsibilities}</Text>}
            </View>

            {/* Duration & Deadline */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Duration & Deadline</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Duration*</Text>
                <TextInput
                  style={[styles.input, focused === "duration" && styles.inputFocused]}
                  placeholder="e.g., 3 months"
                  placeholderTextColor="#666"
                  value={form.duration}
                  onChangeText={(text) => setForm({ ...form, duration: text })}
                  onFocus={() => setFocused("duration")}
                  onBlur={() => {
                    setFocused("")
                    validateField("duration", form.duration)
                  }}
                />
                {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Application Deadline*</Text>
                <TextInput
                  style={[styles.input, focused === "deadline" && styles.inputFocused]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#666"
                  value={form.deadline}
                  onChangeText={(text) => setForm({ ...form, deadline: text })}
                  onFocus={() => setFocused("deadline")}
                  onBlur={() => {
                    setFocused("")
                    validateField("deadline", form.deadline)
                  }}
                />
                {errors.deadline && <Text style={styles.errorText}>{errors.deadline}</Text>}
              </View>
            </View>

            {/* Submit Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Post Internship</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: "#000000",
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  form: {
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#333",
  },
  inputFocused: {
    borderColor: "#0066CC",
    backgroundColor: "#1F1F1F",
  },
  textArea: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#333",
    height: 120,
    textAlignVertical: "top",
  },
  workTypeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  workTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
  },
  workTypeButtonActive: {
    backgroundColor: "#0066CC",
  },
  workTypeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  workTypeTextActive: {
    color: "#FFFFFF",
  },
  compensationContainer: {
    gap: 16,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  skillsContainer: {
    gap: 12,
  },
  skillInputContainer: {
    flexDirection: "row",
    gap: 12,
  },
  skillInput: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#333",
  },
  addSkillButton: {
    backgroundColor: "#0066CC",
    width: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  skillTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
  },
  skillTagText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#0066CC",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginTop: 4,
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