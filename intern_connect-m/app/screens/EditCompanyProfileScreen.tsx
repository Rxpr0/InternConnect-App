"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import * as DocumentPicker from "expo-document-picker"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  description: string;
  logo: string;
  website: string;
  email: string;
  phone: string;
  location: string;
  size: string;
  founded: string;
  specialties: string[];
  benefits: string[];
  social_media: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  stats: {
    employees: string;
    founded: string;
    internships: string;
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

export default function EditCompanyProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const lImage = require("../../assets/image/L.png");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onClose: () => {} });

  const showAlert = (title: string, message: string, onClose = () => {}) => {
    setAlertConfig({ title, message, onClose });
    setAlertVisible(true);
  };

  // Company state with proper typing
  const [company, setCompany] = useState<CompanyProfile>({
    id: '',
    name: "",
    industry: "",
    description: "",
    logo: "",
    website: "",
    email: "",
    phone: "",
    location: "",
    size: "",
    founded: "",
    specialties: [],
    benefits: [],
    social_media: {
      linkedin: "",
      twitter: "",
      facebook: "",
    },
    stats: {
      employees: "",
      founded: "",
      internships: "",
    },
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // First get the company name from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile data:', profileError);
        throw profileError;
      }

      // Then get the company profile
      const { data: companyData, error: companyError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (companyError) throw companyError;

      if (companyData) {
        setCompany({
          ...companyData,
          name: profileData?.full_name || companyData.name || 'Unknown Company'
        } as CompanyProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle logo change
  const handleChangeLogo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled === false) {
        const file = result.assets[0];
        // Here you would typically upload the file to storage
        // For now, we'll just update the local state
        setCompany({
          ...company,
          logo: file.uri,
        });
      }
    } catch (error) {
      showAlert("Error", "Failed to pick image. Please try again.");
    }
  };

  // Handle saving the company profile
  const handleSaveProfile = async () => {
    if (!user) {
      showAlert("Error", "You must be logged in to update your profile");
      return;
    }

    // Validate website format
    if (
      company.website &&
      !company.website.match(/^(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/)
    ) {
      showAlert("Invalid Website", "Please enter a valid website URL (e.g., www.example.com)");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase
        .from('company_profiles')
        .update({
          name: company.name,
          industry: company.industry,
          description: company.description,
          logo: company.logo,
          website: company.website,
          email: company.email,
          phone: company.phone,
          location: company.location,
          size: company.size,
          founded: company.founded,
          specialties: company.specialties,
          benefits: company.benefits,
          social_media: company.social_media,
          stats: company.stats,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      showAlert("Success", "Company profile updated successfully", () => router.back());
    } catch (err) {
      console.error('Error updating profile:', err);
      showAlert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0077b5" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading profile: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
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
            <Text style={styles.headerTitle}>Edit Company Profile</Text>
          </View>
          {/* Empty view for balanced spacing */}
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.logoContainer} onPress={handleChangeLogo}>
            {company.logo ? (
              <Image
                source={{ uri: company.logo }}
                style={styles.companyLogo}
              />
            ) : (
              <Text style={styles.noPhotoText}>No Photo</Text>
            )}
            <View style={styles.editLogoButton}>
              <Feather name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Company Name</Text>
            <TextInput
              style={styles.input}
              value={company.name}
              onChangeText={(text) => setCompany({ ...company, name: text })}
              placeholder="Enter company name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={company.description}
              onChangeText={(text) => setCompany({ ...company, description: text })}
              placeholder="Enter company description"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.verificationContainer}>
            <Text style={styles.verificationLabel}>Company Size</Text>
            <TextInput
              style={styles.input}
              value={company.size}
              onChangeText={(text) => setCompany({ ...company, size: text })}
              placeholder="Enter company size (e.g., 1-50, 51-200, etc.)"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Industry</Text>
              <TextInput
                style={styles.input}
                value={company.industry}
                onChangeText={(text) => setCompany({ ...company, industry: text })}
                placeholder="Enter industry (e.g., Technology | Software Development)"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                value={company.location}
                onChangeText={(text) => setCompany({ ...company, location: text })}
                placeholder="Enter location (e.g., San Francisco, CA)"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Website</Text>
              <TextInput
                style={styles.input}
                value={company.website}
                onChangeText={(text) => setCompany({ ...company, website: text })}
                placeholder="Enter website (e.g., www.example.com)"
                placeholderTextColor="#666"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Statistics</Text>
          <View style={styles.card}>
            <View style={styles.statsInputRow}>
              <View style={styles.statsInputContainer}>
                <Text style={styles.inputLabel}>Employees</Text>
                <TextInput
                  style={styles.input}
                  value={company.stats.employees}
                  onChangeText={(text) =>
                    setCompany({
                      ...company,
                      stats: { ...company.stats, employees: text },
                    })
                  }
                  placeholder="e.g., 500+"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.statsInputContainer}>
                <Text style={styles.inputLabel}>Founded Year</Text>
                <TextInput
                  style={styles.input}
                  value={company.stats.founded}
                  onChangeText={(text) =>
                    setCompany({
                      ...company,
                      stats: { ...company.stats, founded: text },
                    })
                  }
                  placeholder="e.g., 2010"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.statsInputContainer}>
                <Text style={styles.inputLabel}>Internships</Text>
                <TextInput
                  style={styles.input}
                  value={company.stats.internships}
                  onChangeText={(text) =>
                    setCompany({
                      ...company,
                      stats: { ...company.stats, internships: text },
                    })
                  }
                  placeholder="e.g., 12"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="check" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
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
  // Updated header styles to match the other screens
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
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#333",
    padding: 4,
    position: "relative",
  },
  companyLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editLogoButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#0095ff",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    padding: 12,
    color: "#fff",
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  verificationContainer: {
    width: "100%",
    marginTop: 8,
  },
  verificationLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  verificationToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    padding: 12,
  },
  verificationText: {
    color: "#fff",
    fontSize: 16,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  statsInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statsInputContainer: {
    flex: 1,
  },
  socialToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  socialToggleItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  socialToggleLabel: {
    color: "#fff",
    fontSize: 14,
    marginLeft: -20, // Adjust to position the text
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#0095ff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
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
    borderRadius: 8,
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
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0077b5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
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
  noPhotoText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
})

