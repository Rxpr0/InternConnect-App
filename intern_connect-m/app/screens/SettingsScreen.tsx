"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, Modal, Alert } from "react-native"
import { Feather } from "@expo/vector-icons"
import { Link, useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const lImage = require("../../assets/image/L.png")

const CustomAlert = ({ visible, title, message, onClose, onConfirm }: { 
  visible: boolean; 
  title: string; 
  message: string; 
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <Modal
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.alertContainer}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        <View style={styles.alertButtonsContainer}>
          <TouchableOpacity style={styles.alertButton} onPress={onClose}>
            <Text style={styles.alertButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.alertButton} onPress={onConfirm}>
            <Text style={styles.alertButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

export default function SettingsScreen() {
  const router = useRouter()
  const { signOut, user } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false)

  // Fetch initial notification preferences
  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('id', user?.id)
          .single()

        if (error) throw error

        setNotifications(data?.notification_preferences?.push_enabled ?? true)
      } catch (error) {
        console.error('Error fetching notification preferences:', error)
      }
    }

    if (user?.id) {
      fetchNotificationPreferences()
    }
  }, [user?.id])

  // Handle notification toggle
  const handleNotificationToggle = async () => {
    try {
      const newValue = !notifications
      const { data, error } = await supabase
        .rpc('update_notification_preferences', {
          push_enabled: newValue
        })

      if (error) throw error

      // Check if we got a valid response with preferences
      if (data?.[0]?.preferences?.push_enabled !== undefined) {
        setNotifications(data[0].preferences.push_enabled)
      } else {
        setNotifications(newValue)
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      Alert.alert('Error', 'Failed to update notification preferences')
      // Revert the toggle if there was an error
      setNotifications(!notifications)
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await signOut()
      router.replace('/')
    } catch (error) {
      console.error('Error logging out:', error)
      setAlertVisible(true)
    } finally {
      setIsLoading(false)
    }
  }

  const confirmLogout = () => {
    setAlertVisible(true)
  }

  const SettingSwitch = ({
    value,
    onValueChange,
    label,
  }: { value: boolean; onValueChange: () => void; label: string }) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingText}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#666", true: "#0077b5" }}
        thumbColor={value ? "#fff" : "#f4f3f4"}
      />
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#000" }]}>
      <CustomAlert
        visible={alertVisible}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        onClose={() => setAlertVisible(false)}
        onConfirm={handleLogout}
      />
      <LinearGradient 
        colors={['#808080', 'rgba(128, 128, 128, 0)']} 
        style={styles.headerContainer}
      >
        <View style={styles.headerCenter}>
          <Image source={lImage} style={styles.logo} />
          <Text style={styles.appName}>Settings</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={20} color="#fff" />
            <Text style={[styles.sectionTitle, { color: "#fff" }]}>Account</Text>
          </View>
          <View style={[styles.card, { backgroundColor: "#1a1a1a" }]}>
            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: "#333" }]} onPress={() => router.push("/screens/EditProfileScreen")}>
              <View style={styles.settingContent}>
                <Feather name="user" size={20} color="#fff" />
                <Text style={[styles.settingLabel, { color: "#fff" }]}>Edit Profile</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: "#333" }]} onPress={() => router.push("/screens/ChangePasswordScreen")}>
              <View style={styles.settingContent}>
                <Feather name="lock" size={20} color="#fff" />
                <Text style={[styles.settingLabel, { color: "#fff" }]}>Change Password</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="bell" size={20} color="#fff" />
            <Text style={[styles.sectionTitle, { color: "#fff" }]}>Notifications</Text>
          </View>
          <View style={[styles.card, { backgroundColor: "#1a1a1a" }]}>
            <View style={[styles.settingRow, { borderBottomColor: "#333" }]}>
              <Text style={[styles.settingText, { color: "#fff" }]}>Push Notifications</Text>
              <Switch
                value={notifications}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: "#666", true: "#0077b5" }}
                thumbColor={notifications ? "#fff" : "#f4f3f4"}
              />
            </View>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="help-circle" size={20} color="#fff" />
            <Text style={[styles.sectionTitle, { color: "#fff" }]}>Support</Text>
          </View>
          <View style={[styles.card, { backgroundColor: "#1a1a1a" }]}>
            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: "#333" }]} onPress={() => router.push("/screens/TermsOfServiceScreen")}>
              <View style={styles.settingContent}>
                <Feather name="file-text" size={20} color="#fff" />
                <Text style={[styles.settingLabel, { color: "#fff" }]}>Terms of Service</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: "#333" }]} onPress={() => router.push("/screens/PrivacyPolicyScreen")}>
              <View style={styles.settingContent}>
                <Feather name="lock" size={20} color="#fff" />
                <Text style={[styles.settingLabel, { color: "#fff" }]}>Privacy Policy</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="book-open" size={20} color="#fff" />
            <Text style={[styles.sectionTitle, { color: "#fff" }]}>Instructions</Text>
          </View>
          <View style={[styles.card, { backgroundColor: "#1a1a1a" }]}>
            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: "#333" }]} onPress={() => router.push("/screens/README")}>
              <View style={styles.settingContent}>
                <Feather name="file" size={20} color="#fff" />
                <Text style={[styles.settingLabel, { color: "#fff" }]}>Technical Documentation</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="alert-triangle" size={20} color="#ff4444" />
            <Text style={[styles.sectionTitle, { color: "#ff4444" }]}>Danger Zone</Text>
          </View>
          <View style={[styles.card, { backgroundColor: "#1a1a1a" }]}>
            <TouchableOpacity 
              style={[
                styles.dangerButton, 
                { borderBottomColor: "#333" },
                isLoading && styles.disabledButton
              ]} 
              onPress={confirmLogout}
              disabled={isLoading}
            >
              <Feather name="log-out" size={20} color="#ff4444" />
              <Text style={styles.dangerButtonText}>
                {isLoading ? 'Logging out...' : 'Log Out'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dangerButton, styles.deleteButton]} 
              onPress={() => router.push("/screens/DeleteAccountScreen")}
            >
              <Feather name="trash-2" size={20} color="#ff4444" />
              <Text style={styles.dangerButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={[styles.versionText, { color: "#fff" }]}>InternConnect v1.0.0</Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { 
        backgroundColor: "#1a1a1a",
        borderTopColor: "#333" 
      }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/DashboardScreen")}>
          <Feather name="home" size={24} color="#fff" />
          <Text style={[styles.navItemText, { color: "#fff" }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/BrowseInternshipsScreen")}>
          <Feather name="search" size={24} color="#fff" />
          <Text style={[styles.navItemText, { color: "#fff" }]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/NotificationsScreen")}>
          <View style={styles.notificationContainer}>
            <Feather name="bell" size={24} color="#fff" />
          </View>
          <Text style={[styles.navItemText, { color: "#fff" }]}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/SettingsScreen")}>
          <Feather name="settings" size={24} color="#0095ff" />
          <Text style={styles.navItemActiveText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/ProfileInfoScreen")}>
          <Feather name="user" size={24} color="#fff" />
          <Text style={[styles.navItemText, { color: "#fff" }]}>Profile</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  appName: {
    color: '#000',
    fontSize: 26,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
    marginTop: 16,
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
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingValueText: {
    fontSize: 14,
    color: "#666",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  settingText: {
    fontSize: 16,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  deleteButton: {
    borderBottomWidth: 0,
  },
  dangerButtonText: {
    fontSize: 16,
    color: "#ff4444",
    fontWeight: "500",
  },
  versionInfo: {
    alignItems: "center",
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
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
  alertButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 60,
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
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 0,
    paddingLeft: 25,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navItemText: {
    fontSize: 10,
    marginTop: 4,
  },
  navItemActiveText: {
    fontSize: 10,
    color: "#0095ff",
    marginTop: 4,
  },
  notificationContainer: {
    position: "relative",
  },
})

