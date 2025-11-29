import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"

const lImage = require("../../assets/image/L.png")

// Shared types
type InternshipPosting = {
  id: string
  position: string
  department: string
  location: string
  deadline: string
  work_type: string
  is_paid: boolean
  stipend: number | null
  spots: number
  status: "open" | "closed"
  created_at: string
  updated_at: string
}

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

export default function CompanyInternshipsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"overview" | "internships" | "applications" | "interviews">("internships")
  const [internshipStatusFilter, setInternshipStatusFilter] = useState<"all" | "active" | "closed">("all")
  const [internships, setInternships] = useState<InternshipPosting[]>([])
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
    });
  };

  // Fetch internships from Supabase
  const fetchInternships = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('internships')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInternships(data || []);
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to fetch internships");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle closing an internship
  const handleCloseInternship = async (internshipId: string) => {
    try {
      const { error } = await supabase
        .from('internships')
        .update({ status: 'closed' })
        .eq('id', internshipId)
        .eq('company_id', user?.id);

      if (error) throw error;

      // Update local state
      setInternships(
        internships.map((internship) =>
          internship.id === internshipId ? { ...internship, status: "closed" } : internship
        )
      );

      showAlert("Success", "The internship posting has been closed.");
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to close internship");
    }
  };

  // Fetch internships when component mounts or user changes
  useEffect(() => {
    fetchInternships();
  }, [user]);

  const renderInternshipsTab = () => {
    // Filter internships based on the selected filter
    const filteredInternships = internships.filter((internship) => {
      if (internshipStatusFilter === "all") return true;
      if (internshipStatusFilter === "active") return internship.status === "open";
      if (internshipStatusFilter === "closed") return internship.status === "closed";
      return true;
    });

    // Count internships by status
    const internshipCounts = {
      all: internships.length,
      active: internships.filter((i) => i.status === "open").length,
      closed: internships.filter((i) => i.status === "closed").length,
    };

    return (
      <View style={styles.tabContent}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabTitle}>Internship Postings</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => router.push("/screens/PostInternshipScreen")}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.createButtonText}>Create New</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[styles.filterChip, internshipStatusFilter === "all" && styles.filterChipActive]}
            onPress={() => setInternshipStatusFilter("all")}
          >
            <Text style={styles.filterChipText}>All ({internshipCounts.all})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, internshipStatusFilter === "active" && styles.filterChipActive]}
            onPress={() => setInternshipStatusFilter("active")}
          >
            <Text style={styles.filterChipText}>Active ({internshipCounts.active})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, internshipStatusFilter === "closed" && styles.filterChipActive]}
            onPress={() => setInternshipStatusFilter("closed")}
          >
            <Text style={styles.filterChipText}>Closed ({internshipCounts.closed})</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>Loading internships...</Text>
          </View>
        ) : filteredInternships.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Feather name="briefcase" size={50} color="#666" />
            <Text style={styles.emptyStateText}>No internships found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your filters</Text>
          </View>
        ) : (
          filteredInternships.map((internship) => (
            <View key={internship.id} style={styles.internshipCard}>
              <View style={styles.internshipHeader}>
                <View style={styles.headerLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {internship.position.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.internshipTitle}>{internship.position}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    internship.status === "closed" && { backgroundColor: "rgba(233, 30, 99, 0.15)" },
                  ]}
                >
                  <Text style={[styles.statusText, internship.status === "closed" && { color: "#E91E63" }]}>
                    {internship.status === "open" ? "Open" : "Closed"}
                  </Text>
                </View>
              </View>
              <View style={styles.internshipDetails}>
                <View style={styles.detailItem}>
                  <Feather name="map-pin" size={14} color="#0095ff" />
                  <Text style={styles.detailText}>{internship.location}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Feather name="calendar" size={14} color="#0095ff" />
                  <Text style={styles.detailText}>Deadline: {new Date(internship.deadline).toLocaleDateString()}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Feather name="users" size={14} color="#0095ff" />
                  <Text style={styles.detailText}>{internship.spots} Spots Available</Text>
                </View>
                {internship.is_paid && (
                  <View style={styles.detailItem}>
                    <Feather name="dollar-sign" size={14} color="#0095ff" />
                    <Text style={styles.detailText}>Stipend: ${internship.stipend}</Text>
                  </View>
                )}
              </View>
              <View style={styles.internshipActions}>
                {internship.status === "open" && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.closeButton]}
                    onPress={() => handleCloseInternship(internship.id)}
                  >
                    <Feather name="x-circle" size={14} color="#E91E63" />
                    <Text style={[styles.actionButtonText, styles.closeButtonText]}>Close</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => {
                    console.log("Navigating to CompanyInternshipDetailsScreen with ID:", internship.id);
                    router.push({
                      pathname: "/screens/CompanyInternshipDetailsScreen",
                      params: { id: internship.id, source: 'company' }
                    });
                  }}
                >
                  <Feather name="eye" size={14} color="#fff" />
                  <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.headerCenter}>
          <Image source={lImage} style={styles.logo} />
          <Text style={styles.appName}>InternConnect</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push("/screens/CompanySettingsScreen")}>
          <Feather name="settings" size={24} color="#000" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>{renderInternshipsTab()}</ScrollView>

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
          onPress={() => setActiveTab("internships")}
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
          onPress={() => router.push("/screens/CompanyInterviewsScreen")}
        >
          <Feather name="calendar" size={20} color={activeTab === "interviews" ? "#0095ff" : "#666"} />
          <Text style={[styles.tabText, activeTab === "interviews" && styles.tabTextActive]}>Interviews</Text>
        </TouchableOpacity>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </SafeAreaView>
  );
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0095ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  createButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
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
  internshipCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  internshipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ADD8E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  internshipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  statusBadge: {
    backgroundColor: "rgba(0, 149, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#0095ff",
    fontWeight: "600",
  },
  internshipDetails: {
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
  internshipActions: {
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
  closeButton: {
    backgroundColor: "rgba(233, 30, 99, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(233, 30, 99, 0.3)",
  },
  closeButtonText: {
    color: "#E91E63",
  },
  viewButton: {
    backgroundColor: "#333",
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
})

