import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"
import dateUtils from "../utils/dateUtils"
import { useAuth } from "../../contexts/AuthContext"

const lImage = require("../../assets/image/L.png")

// Shared types
type InternshipPosting = {
  id: string
  position: string
  location: string
  deadline: string
  applicationsCount: number
  status: "open" | "closed"
}

interface UpcomingInterview {
  id: string;
  scheduled_at: string;
  location: string | null;
  meeting_link: string | null;
  application: {
    intern: {
      full_name: string;
    };
    internship: {
      position: string;
    };
  };
}

interface Application {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  intern: {
    full_name: string;
  };
  internship: {
    position: string;
  };
}

type ApplicationStatus = "pending" | "approved" | "rejected"

interface SupabaseInternshipResponse {
  id: string;
  position: string;
  location: string;
  deadline: string;
  status: "open" | "closed";
  applications_aggregate: {
    count: number;
  };
}

interface SupabaseInterviewResponse {
  id: string;
  scheduled_at: string;
  location: string | null;
  meeting_link: string | null;
  applications: {
    intern_id: string;
    internship: {
      position: string;
    };
  };
}

interface SupabaseApplicationResponse {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  intern_id: string;
  internship: {
    position: string;
  };
}

export default function CompanyOverviewScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"overview" | "internships" | "applications" | "interviews">("overview")
  const [interviews, setInterviews] = useState<UpcomingInterview[]>([])
  const [interviewsLoading, setInterviewsLoading] = useState(false)
  const [internships, setInternships] = useState<InternshipPosting[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState("")
  const [stats, setStats] = useState({
    activePostings: 0,
    totalApplications: 0,
    totalInterviewed: 0,
    totalHired: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to view the dashboard')
        return
      }

      // Fetch company profile to get the name
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      // Then get the company profile as fallback
      const { data: companyProfile, error: companyError } = await supabase
        .from('company_profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      if (companyError) throw companyError

      // Set company name with priority to profiles.full_name
      const name = profileData?.full_name || companyProfile?.name || 'Unknown Company'
      const formattedName = name
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      setCompanyName(formattedName)

      // Get all internship IDs for this company
      const { data: companyInternships, error: internshipsError } = await supabase
        .from('internships')
        .select('id')
        .eq('company_id', user.id)

      if (internshipsError) throw internshipsError

      const internshipIds = companyInternships?.map(i => i.id) || []

      // Fetch counts in parallel
      const [activePostings, applicationsData, interviewedData, hiredData] = await Promise.all([
        // Active postings count
        supabase
          .from('internships')
          .select('id')
          .eq('company_id', user.id)
          .eq('status', 'open'),

        // Total applications count
        supabase
          .from('applications')
          .select('id')
          .in('internship_id', internshipIds),

        // Total interviewed count
        supabase
          .from('applications')
          .select('id, interviews!inner(*)')
          .in('internship_id', internshipIds),

        // Total hired count (approved applications)
        supabase
          .from('applications')
          .select('id')
          .in('internship_id', internshipIds)
          .eq('status', 'approved')
      ])

      if (activePostings.error) throw activePostings.error
      if (applicationsData.error) throw applicationsData.error
      if (interviewedData.error) throw interviewedData.error
      if (hiredData.error) throw hiredData.error

      setStats({
        activePostings: activePostings.data?.length || 0,
        totalApplications: applicationsData.data?.length || 0,
        totalInterviewed: interviewedData.data?.length || 0,
        totalHired: hiredData.data?.length || 0
      })

      // Fetch other dashboard data
      await Promise.all([
        fetchInternships(),
        fetchUpcomingInterviews(),
        fetchRecentApplications()
      ])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      Alert.alert('Error', 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchInternships = async () => {
    try {
      setLoading(true)
      const { data: internshipsData, error } = await supabase
        .from('internships')
        .select(`
          id,
          position,
          location,
          deadline,
          status,
          applications (
            count
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      if (!internshipsData) {
        setInternships([])
        return
      }

      const transformedInternships: InternshipPosting[] = internshipsData.map((internship) => ({
        id: internship.id,
        position: internship.position,
        location: internship.location,
        deadline: internship.deadline,
        applicationsCount: internship.applications.length,
        status: internship.status
      }))

      setInternships(transformedInternships)
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch internships')
      console.error('Error fetching internships:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUpcomingInterviews = async () => {
    setInterviewsLoading(true);
    try {
      const { data: interviews, error } = await supabase
        .from('interviews')
        .select(`
          id,
          scheduled_at,
          location,
          meeting_link,
          applications!inner (
            intern_id,
            internship:internships!inner (
              position
            )
          )
        `)
        .order('scheduled_at', { ascending: true })
        .limit(5);

      if (error) throw error;

      // Get all intern IDs from the interviews
      const internIds = interviews?.map(interview => {
        // Type assertion to handle the structure
        const app = interview.applications as unknown as { intern_id: string };
        return app.intern_id;
      }) || [];
      
      // Fetch profiles for all interns in a single query
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', internIds);

      if (profilesError) throw profilesError;

      // Create a map of intern IDs to profiles for easy lookup
      const profilesMap = profiles?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      const transformedInterviews: UpcomingInterview[] = (interviews as unknown as SupabaseInterviewResponse[]).map((interview) => ({
        id: interview.id,
        scheduled_at: interview.scheduled_at,
        location: interview.location,
        meeting_link: interview.meeting_link,
        application: {
          intern: {
            full_name: profilesMap[interview.applications.intern_id]?.full_name || 'Unknown'
          },
          internship: {
            position: interview.applications.internship?.position || 'Unknown Position'
          }
        }
      }));

      setInterviews(transformedInterviews);
    } catch (error) {
      console.error('Error fetching upcoming interviews:', error);
      Alert.alert('Error', 'Failed to load upcoming interviews');
    } finally {
      setInterviewsLoading(false);
    }
  };

  const fetchRecentApplications = async () => {
    try {
      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          intern_id,
          internship:internships!inner (
            position
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Get all intern IDs from applications
      const internIds = applications?.map(app => app.intern_id) || [];
      
      // Fetch profiles for all interns in a single query
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', internIds);

      if (profilesError) throw profilesError;

      // Create a map of intern IDs to profiles for easy lookup
      const profilesMap = profiles?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      const transformedApplications: Application[] = (applications as unknown as SupabaseApplicationResponse[]).map((application) => ({
        id: application.id,
        status: application.status,
        created_at: application.created_at,
        intern: {
          full_name: profilesMap[application.intern_id]?.full_name || 'Unknown'
        },
        internship: {
          position: application.internship?.position || 'Unknown Position'
        }
      }));

      setApplications(transformedApplications);
    } catch (error) {
      console.error('Error fetching recent applications:', error);
      Alert.alert('Error', 'Failed to load recent applications');
    }
  };

  const handleInterviewPress = (interviewId: string) => {
    router.push({
      pathname: "/screens/CompanyInterviewsScreen",
      params: { id: interviewId }
    });
  };

  const updateHiredCount = async () => {
    if (!user) return;

    try {
      // Get all internship IDs for this company
      const { data: companyInternships, error: internshipsError } = await supabase
        .from('internships')
        .select('id')
        .eq('company_id', user.id);

      if (internshipsError) throw internshipsError;

      const internshipIds = companyInternships?.map(i => i.id) || [];

      // Fetch total hired count (approved applications)
      const { data: hiredData, error: hiredError } = await supabase
        .from('applications')
        .select('id')
        .in('internship_id', internshipIds)
        .eq('status', 'approved');

      if (hiredError) throw hiredError;

      setStats(prev => ({
        ...prev,
        totalHired: hiredData?.length || 0
      }));
    } catch (error) {
      console.error('Error updating hired count:', error);
    }
  };

  // Update event listener for application status changes
  useEffect(() => {
    const channel = supabase
      .channel('application_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `internship_id.in.(${user?.id})`
        },
        (payload) => {
          if (payload.new.status === 'approved') {
            updateHiredCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <Text style={styles.welcomeTitle}>Welcome, {companyName}!</Text>
          <Text style={styles.welcomeSubtitle}>Here's your dashboard overview</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton} 
          onPress={() => router.push("/screens/CompanyProfileScreen")}
        >
          <Feather name="user" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(0, 149, 255, 0.15)" }]}>
              <Feather name="briefcase" size={10} color="#0095ff" />
            </View>
            <Text style={styles.statValue}>{stats.activePostings}</Text>
            <Text style={styles.statLabel}>Internships</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(76, 175, 80, 0.15)" }]}>
              <Feather name="users" size={10} color="#4CAF50" />
            </View>
            <Text style={styles.statValue}>{stats.totalApplications}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(255, 193, 7, 0.15)" }]}>
              <Feather name="star" size={10} color="#FFC107" />
            </View>
            <Text style={styles.statValue}>{stats.totalInterviewed}</Text>
            <Text style={styles.statLabel}>Interviews</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(233, 30, 99, 0.15)" }]}>
              <Feather name="check-circle" size={10} color="#E91E63" />
            </View>
            <Text style={styles.statValue}>{stats.totalHired}</Text>
            <Text style={styles.statLabel}>Hired</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Internships</Text>
          <TouchableOpacity onPress={() => router.push("/screens/CompanyInternshipsScreen")}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        {internships
          .filter((i) => i.status === "open")
          .slice(0, 2)
          .map((internship) => (
            <View key={internship.id} style={styles.internshipCard}>
              <View style={styles.applicationHeader}>
                <View style={styles.applicantInfo}>
                  <View style={styles.applicantAvatar1}>
                    <Text style={styles.applicantAvatarText1}>
                      {internship.position.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.internshipTitle}>{internship.position}</Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Open</Text>
                </View>
              </View>
              <View style={styles.internshipDetails}>
                <View style={styles.detailItem}>
                  <Feather name="map-pin" size={14} color="#780606" />
                  <Text style={styles.detailText}>{internship.location}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Feather name="calendar" size={14} color="#780606" />
                  <Text style={styles.detailText}>Deadline: {internship.deadline}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Feather name="users" size={14} color="#780606" />
                  <Text style={styles.detailText}>{internship.applicationsCount} Applications</Text>
                </View>
              </View>
              <View style={styles.internshipActions}>
              </View>
            </View>
          ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Interviews</Text>
          <TouchableOpacity onPress={() => router.push("/screens/CompanyInterviewsScreen")}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        {interviews.map((interview) => (
          <TouchableOpacity
            key={interview.id}
            style={styles.applicationCard}
            onPress={() => handleInterviewPress(interview.id)}
          >
            <View style={styles.applicationHeader}>
              <View style={styles.applicantInfo}>
                <View style={styles.applicantAvatar}>
                  <Text style={styles.applicantAvatarText}>
                    {interview.application.intern.full_name.charAt(0)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.applicantName}>
                    {interview.application.intern.full_name}
                  </Text>
                  <Text style={styles.applicantRole}>
                    {interview.application.internship.position}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.applicationDetails}>
              <View style={styles.detailItem}>
                <Feather name="clock" size={14} color="#780606" />
                <Text style={styles.detailText}>
                  {dateUtils.formatDateTime(interview.scheduled_at)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Feather name={interview.meeting_link ? "video" : "map-pin"} size={14} color="#780606" />
                <Text style={styles.detailText}>
                  {interview.meeting_link ? 'Virtual' : interview.location || 'No location set'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Applications</Text>
          <TouchableOpacity onPress={() => router.push("/screens/CompanyApplicationsScreen")}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        {applications.map((application) => (
          <View key={application.id} style={styles.applicationCard}>
            <View style={styles.applicationHeader}>
              <View style={styles.applicantInfo}>
                <View style={styles.applicantAvatar}>
                  <Text style={styles.applicantAvatarText}>
                    {application.intern.full_name.charAt(0)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.applicantName}>{application.intern.full_name}</Text>
                  <Text style={styles.applicantRole}>{application.internship.position}</Text>
                </View>
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
                  {application.status === "pending"
                    ? "Pending"
                    : application.status === "approved"
                      ? "Approved"
                      : "Rejected"}
                </Text>
              </View>
            </View>
            <View style={styles.applicationDetails}>
              <View style={styles.detailItem}>
                <Feather name="calendar" size={14} color="#780606" />
                <Text style={styles.detailText}>
                  Applied: {dateUtils.formatDate(application.created_at)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  )

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

      <ScrollView style={styles.content}>{renderOverviewTab()}</ScrollView>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "overview" && styles.tabItemActive]}
          onPress={() => setActiveTab("overview")}
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
  // Shared styles
  applicantInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
  },
  applicantAvatar1: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ADD8E6",
    justifyContent: "center",
    alignItems: "center",
  },
  applicantAvatarText1: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    textTransform: "uppercase",
  },
  applicantName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  applicantRole: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#CCCCCC",
  },
  // Container styles
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
  // Welcome section
  welcomeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  welcomeHeader: {
    flex: 1,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  profileButton: {
    position: "absolute",
    right: 0,
    padding: 8,
  },
  // Stats section
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    height: 80,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  statContent: {
    alignItems: "center",
  },
  statIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  // Section styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  seeAllButton: {
    fontSize: 14,
    color: "#0095ff",
  },
  // Card styles
  internshipCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    paddingBottom: 0,
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
  // Application styles
  applicationCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    paddingBottom: 0,
    borderWidth: 1,
    borderColor: "#333",
  },
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
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
  // Tab bar styles
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
})

