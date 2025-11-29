"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { Link, useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from "../../lib/supabase"

const { width } = Dimensions.get("window")
const lImage = require("../../assets/image/L.png")

type ApplicationStatus = "approved" | "pending" | "rejected"

interface CompanyProfile {
  id: string
  name: string
  logo: string | null
}

interface Internship {
  id: string
  position: string
  location: string
  company_id: string
}

interface Application {
  id: string
  status: string
  created_at: string
  internship: Internship
}

interface Interview {
  id: string
  scheduled_at: string
  location: string | null
  meeting_link: string | null
  application: {
    id: string
    internship: Internship
  }
}

interface RawApplication {
  id: string
  status: ApplicationStatus
  created_at: string
  internship: {
    id: string
    position: string
    location: string
    company_id: string
  }
}

interface RawInterview {
  id: string
  scheduled_at: string
  location: string | null
  meeting_link: string | null
  application: {
    id: string
    internship: {
      id: string
      position: string
      company_id: string
    }
  }
}

interface InternshipApplication {
  id: string
  company: string
  position: string
  logo: string | null
  status: ApplicationStatus
  date: string
  location: string
}

interface UpcomingInterview {
  id: string
  company: string
  position: string
  logo: string | null
  date: string
  time: string
  medium: "online" | "in-person"
  location?: string
  meetingLink?: string
}

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<"all" | "approved" | "pending" | "rejected">("all")
  const [applications, setApplications] = useState<InternshipApplication[]>([])
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
    fetchApplications()
    fetchUpcomingInterviews()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      if (!user) {
        router.replace("/screens/LoginScreen")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('intern_profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      setUserName(profile?.name || "User")
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchApplications = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) return

      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          internship:internships (
            id,
            position,
            location,
            company_id
          )
        `)
        .eq('intern_id', user.id)
        .order('created_at', { ascending: false })
        .returns<Application[]>()

      if (error) throw error
      if (!applications || applications.length === 0) {
        setApplications([])
        return
      }

      console.log('Raw applications data:', JSON.stringify(applications, null, 2))

      // Safely transform applications
      const transformedApplications: InternshipApplication[] = applications
        .filter((app: any) => {
          const hasValidInternship = app?.internship && 
                                   typeof app.internship === 'object' &&
                                   'company_id' in app.internship &&
                                   'position' in app.internship &&
                                   'location' in app.internship
          if (!hasValidInternship) {
            console.log('Filtering out application due to missing data:', app.id)
          }
          return hasValidInternship
        })
        .map((app: any) => ({
          id: app.id,
          company: 'Unknown Company',
          position: app.internship.position,
          logo: null,
          status: app.status,
          date: new Date(app.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          location: app.internship.location
        }))

      if (transformedApplications.length === 0) {
        setApplications([])
        return
      }

      // Get unique company IDs
      const companyIds = [...new Set(applications
        .filter((app: any) => app?.internship && typeof app.internship === 'object' && 'company_id' in app.internship)
        .map((app: any) => app.internship.company_id)
      )]

      if (companyIds.length === 0) {
        setApplications(transformedApplications)
        return
      }

      // Fetch company data
      const { data: companyProfiles, error: companyError } = await supabase
        .from('profiles')
        .select('id, full_name, company_name')
        .in('id', companyIds)

      if (companyError) {
        console.error('Error fetching company profiles:', companyError)
        // Continue to try company_profiles as fallback
      }

      // Create initial company map from profiles
      const companyMap = (companyProfiles || []).reduce((acc, profile) => {
        if (profile.company_name || profile.full_name) {
          acc[profile.id] = {
            id: profile.id,
            name: profile.company_name || profile.full_name,
            logo: null // Will be updated from company_profiles if available
          }
        }
        return acc
      }, {} as Record<string, CompanyProfile>)

      // Fetch from company_profiles as fallback
      const { data: companyProfilesData, error: companyProfilesError } = await supabase
        .from('company_profiles')
        .select('id, name, logo')
        .in('id', companyIds)

      if (companyProfilesError) {
        console.error('Error fetching company_profiles:', companyProfilesError)
      } else {
        // Update company map with any additional data from company_profiles
        (companyProfilesData || []).forEach(company => {
          if (companyMap[company.id]) {
            // Update existing entry with logo
            companyMap[company.id].logo = company.logo
          } else {
            // Create new entry if not exists
            companyMap[company.id] = {
              id: company.id,
              name: company.name,
              logo: company.logo
            }
          }
        })
      }

      // Update applications with company data
      const finalApplications = transformedApplications.map(app => {
        const originalApp = applications.find((a: any) => a.id === app.id)
        const companyId = originalApp?.internship?.company_id
        const company = companyId ? companyMap[companyId] : null
        return {
          ...app,
          company: company?.name || 'Unknown Company',
          logo: company?.logo || null
        }
      })

      setApplications(finalApplications)
    } catch (error) {
      console.error('Error fetching applications:', error)
      Alert.alert('Error', 'Failed to load applications')
      setApplications([])
    }
  }

  const fetchUpcomingInterviews = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) return

      const { data: interviews, error } = await supabase
        .from('interviews')
        .select(`
          id,
          scheduled_at,
          location,
          meeting_link,
          application:applications (
            id,
            internship:internships (
              id,
              position,
              company_id
            )
          )
        `)
        .eq('applications.intern_id', user.id)
        .gt('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .returns<Interview[]>()

      if (error) throw error
      if (!interviews || interviews.length === 0) {
        setUpcomingInterviews([])
        return
      }

      console.log('Raw interviews data:', JSON.stringify(interviews, null, 2))

      // Safely transform interviews
      const transformedInterviews = interviews
        .filter((interview: any) => {
          const hasValidData = interview?.application && 
                             typeof interview.application === 'object' &&
                             interview.application.internship &&
                             typeof interview.application.internship === 'object' &&
                             'company_id' in interview.application.internship &&
                             'position' in interview.application.internship
          if (!hasValidData) {
            console.log('Filtering out interview due to missing data:', interview.id)
          }
          return hasValidData
        })
        .map((interview: any) => {
          const internship = interview.application.internship
          const scheduledDate = new Date(interview.scheduled_at)
          
          return {
            id: interview.id,
            company: 'Unknown Company',
            position: internship.position,
            logo: null,
            date: scheduledDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }),
            time: scheduledDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            medium: interview.meeting_link ? 'online' as const : 'in-person' as const,
            location: interview.location || undefined,
            meetingLink: interview.meeting_link || undefined
          }
        })

      if (transformedInterviews.length === 0) {
        setUpcomingInterviews([])
        return
      }

      // Get unique company IDs
      const companyIds = [...new Set(interviews
        .filter((interview: any) => 
          interview?.application?.internship && 
          typeof interview.application.internship === 'object' && 
          'company_id' in interview.application.internship
        )
        .map((interview: any) => interview.application.internship.company_id)
      )]

      if (companyIds.length === 0) {
        setUpcomingInterviews(transformedInterviews)
        return
      }

      // Fetch company data
      const { data: companyProfiles, error: companyError } = await supabase
        .from('profiles')
        .select('id, full_name, company_name')
        .in('id', companyIds)

      if (companyError) {
        console.error('Error fetching company profiles:', companyError)
        // Continue to try company_profiles as fallback
      }

      // Create initial company map from profiles
      const companyMap = (companyProfiles || []).reduce((acc, profile) => {
        if (profile.company_name || profile.full_name) {
          acc[profile.id] = {
            id: profile.id,
            name: profile.company_name || profile.full_name,
            logo: null // Will be updated from company_profiles if available
          }
        }
        return acc
      }, {} as Record<string, CompanyProfile>)

      // Fetch from company_profiles as fallback
      const { data: companyProfilesData, error: companyProfilesError } = await supabase
        .from('company_profiles')
        .select('id, name, logo')
        .in('id', companyIds)

      if (companyProfilesError) {
        console.error('Error fetching company_profiles:', companyProfilesError)
      } else {
        // Update company map with any additional data from company_profiles
        (companyProfilesData || []).forEach(company => {
          if (companyMap[company.id]) {
            // Update existing entry with logo
            companyMap[company.id].logo = company.logo
          } else {
            // Create new entry if not exists
            companyMap[company.id] = {
              id: company.id,
              name: company.name,
              logo: company.logo
            }
          }
        })
      }

      // Update interviews with company data
      const finalInterviews = transformedInterviews.map(interview => {
        const originalInterview = interviews.find((i: any) => i.id === interview.id)
        const companyId = originalInterview?.application?.internship?.company_id
        const company = companyId ? companyMap[companyId] : null
        return {
          ...interview,
          company: company?.name || 'Unknown Company',
          logo: company?.logo || null,
          medium: interview.medium
        }
      })

      setUpcomingInterviews(finalInterviews)
    } catch (error) {
      console.error('Error fetching interviews:', error)
      Alert.alert('Error', 'Failed to load upcoming interviews')
      setUpcomingInterviews([])
    }
  }

  const filteredApplications = applications.filter((app) => {
    if (activeTab === "all") return true
    return app.status === activeTab
  })

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "approved":
        return "#4CAF50"
      case "pending":
        return "#FFC107"
      case "rejected":
        return "#E91E63"
      default:
        return "#666"
    }
  }

  const getStatusText = (status: ApplicationStatus) => {
    switch (status) {
      case "approved":
        return "Approved"
      case "pending":
        return "Pending"
      case "rejected":
        return "Rejected"
      default:
        return status
    }
  }

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case "approved":
        return "check-circle"
      case "pending":
        return "clock"
      case "rejected":
        return "x-circle"
      default:
        return "info"
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Updated header with LinearGradient like the other screens, but without back button */}
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.headerCenter}>
          <Image source={lImage} style={styles.logo} />
          <Text style={styles.appName}>Dashboard</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <LinearGradient
            colors={["rgba(236, 236, 236, 0.1)", "rgba(5, 5, 5, 0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeGradient}
          >
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>Welcome, {userName}!</Text>
              <Text style={styles.welcomeSubtitle}>Track your internship journey</Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{applications.length}</Text>
                <Text style={styles.statLabel}>Applications</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{applications.filter((app) => app.status === "approved").length}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{upcomingInterviews.length}</Text>
                <Text style={styles.statLabel}>Interviews</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {upcomingInterviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Interviews</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.interviewsScrollView}>
              {upcomingInterviews.map((interview) => (
                <TouchableOpacity key={interview.id} style={styles.interviewCard}>
                  <LinearGradient
                    colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 253, 253, 0.05)"]}
                    style={styles.interviewGradient}
                  >
                    <View style={styles.interviewHeader}>
                      <View style={styles.companyLogoContainer}>
                        {interview.logo ? (
                          <Image
                            source={{ uri: interview.logo }}
                            style={styles.companyLogo}
                            defaultSource={require("../../assets/image/L.png")}
                          />
                        ) : (
                          <Text style={styles.avatarLetter}>
                            {interview.company.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={styles.interviewInfo}>
                        <Text style={styles.interviewCompany}>{interview.company}</Text>
                        <Text style={styles.interviewPosition}>{interview.position}</Text>
                      </View>
                    </View>
                    <View style={styles.interviewDetails}>
                      <View style={styles.interviewDetailItem}>
                        <Feather name="calendar" size={14} color="#780606" />
                        <Text style={styles.interviewDetailText}>{interview.date}</Text>
                      </View>
                      <View style={styles.interviewDetailItem}>
                        <Feather name="clock" size={14} color="#780606" />
                        <Text style={styles.interviewDetailText}>{interview.time}</Text>
                      </View>
                      <View style={styles.interviewDetailItem}>
                        <Feather name={interview.medium === "online" ? "video" : "map-pin"} size={14} color="#780606" />
                        <Text style={styles.interviewDetailText}>
                          {interview.medium === "online" ? "Online Interview" : "In-person Interview"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.interviewActions}>
                      {interview.medium === "online" && (
                        <TouchableOpacity style={[styles.interviewButton, styles.joinButton]}>
                          <Feather name="video" size={14} color="#000" />
                          <Text style={styles.interviewButtonText}>Join Meeting</Text>
                        </TouchableOpacity>
                      )}
                      {/* In-Person Interviews View Location Button */}
                      {interview.medium !== "online" && (
                        <TouchableOpacity style={[styles.interviewButton, styles.viewLocationButton]}>
                          <Feather name="map" size={14} color="#fff" />
                          <Text style={styles.interviewButtonText1}>View Location</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Applications</Text>
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScrollView}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "all" && styles.activeTab]}
                onPress={() => setActiveTab("all")}
              >
                <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "approved" && styles.activeTab]}
                onPress={() => setActiveTab("approved")}
              >
                <Text style={[styles.tabText, activeTab === "approved" && styles.activeTabText]}>Approved</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "pending" && styles.activeTab]}
                onPress={() => setActiveTab("pending")}
              >
                <Text style={[styles.tabText, activeTab === "pending" && styles.activeTabText]}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "rejected" && styles.activeTab]}
                onPress={() => setActiveTab("rejected")}
              >
                <Text style={[styles.tabText, activeTab === "rejected" && styles.activeTabText]}>Rejected</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.applicationsContainer}>
            {filteredApplications.map((application) => (
              <TouchableOpacity key={application.id} style={styles.applicationCard}>
                <View style={styles.applicationHeader}>
                  <View style={styles.applicationCompanyInfo}>
                    <View style={styles.applicationLogoContainer}>
                      {application.logo ? (
                        <Image
                          source={{ uri: application.logo }}
                          style={styles.applicationLogo}
                          defaultSource={require("../../assets/image/L.png")}
                        />
                      ) : (
                        <Text style={styles.avatarLetter}>
                          {application.company.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.applicationTextInfo}>
                    <TouchableOpacity onPress={() => router.push("/screens/CompanyProfileViewScreen")}>
                      <Text style={styles.applicationCompany}>{application.company}</Text>
                      </TouchableOpacity>
                      <Text style={styles.applicationPosition}>{application.position}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.applicationStatusBadge,
                      { backgroundColor: `${getStatusColor(application.status)}20` },
                    ]}
                  >
                    <Feather
                      name={getStatusIcon(application.status)}
                      size={12}
                      color={getStatusColor(application.status)}
                    />
                    <Text style={[styles.applicationStatusText, { color: getStatusColor(application.status) }]}>
                      {getStatusText(application.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.applicationDetails}>
                  <View style={styles.applicationDetailItem}>
                    <Feather name="calendar" size={14} color="#780606" />
                    <Text style={styles.applicationDetailText}>Applied: {application.date}</Text>
                  </View>
                  <View style={styles.applicationDetailItem}>
                    <Feather name="map-pin" size={14} color="#780606" />
                    <Text style={styles.applicationDetailText}>{application.location}</Text>
                  </View>
                </View>
                <View style={styles.applicationActions}>
                  <TouchableOpacity
                    style={styles.applicationButton}
                    onPress={() => router.push({
                      pathname: "/screens/AppliedInternshipDetailsScreen",
                      params: { id: application.id }
                    })}
                  >
                    <Feather name="eye" size={14} color="#fff" />
                    <Text style={styles.applicationButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.bottomNav}>
          <TouchableOpacity style={[styles.navItem, styles.navItem]} onPress={() => router.push("/screens/DashboardScreen")}>
            <Feather name="home" size={24} color="#0095ff" />
            <Text style={styles.navItemActiveText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/BrowseInternshipsScreen")}>
            <Feather name="search" size={24} color="#666" />
            <Text style={styles.navItemText}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/NotificationsScreen")}>
            <View style={styles.notificationContainer}>
              <Feather name="bell" size={24} color="#666" />
            </View>
            <Text style={styles.navItemText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/SettingsScreen")}>
            <Feather name="settings" size={24} color="#666" />
            <Text style={styles.navItemText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/ProfileInfoScreen")}>
            <Feather name="user" size={24} color="#666" />
            <Text style={styles.navItemText}>Profile</Text>
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
  // Updated header styles to match the other screens
  headerContainer: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
  profileImage: {
    width: "100%",
    height: "100%",
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  welcomeGradient: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 149, 255, 0.2)",
  },
  welcomeContent: {
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#999",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#780606",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
  },
  statDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  interviewsScrollView: {
    marginLeft: -8,
    paddingLeft: 8,
  },
  interviewCard: {
    width: width * 0.85,
    marginRight: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  interviewGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(33, 150, 243, 0.2)",
    borderRadius: 16,
  },
  interviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  companyLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  companyLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  interviewInfo: {
    flex: 1,
  },
  interviewCompany: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  interviewPosition: {
    fontSize: 14,
    color: "#999",
  },
  interviewDetails: {
    marginBottom: 16,
  },
  interviewDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  interviewDetailText: {
    fontSize: 14,
    color: "#999",
  },
  interviewActions: {
    flexDirection: "row",
    gap: 8,
  },
  interviewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  joinButton: {
    backgroundColor: "#90d6ff",
  },
  interviewButtonText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
  },
  interviewButtonText1: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tabsScrollView: {
    marginLeft: -8,
    paddingLeft: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
  },
  activeTab: {
    backgroundColor: "rgba(0, 149, 255, 0.15)",
    borderColor: "#0095ff",
  },
  tabText: {
    fontSize: 14,
    color: "#999",
  },
  activeTabText: {
    color: "#0095ff",
    fontWeight: "600",
  },
  applicationsContainer: {
    gap: 16,
  },
  applicationCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  applicationCompanyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  applicationLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  applicationLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  applicationTextInfo: {
    flex: 1,
  },
  applicationCompany: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  applicationPosition: {
    fontSize: 14,
    color: "#999",
  },
  applicationStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  applicationStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  applicationDetails: {
    marginBottom: 16,
  },
  applicationDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  applicationDetailText: {
    fontSize: 14,
    color: "#999",
  },
  applicationActions: {
    flexDirection: "row",
    gap: 8,
  },
  applicationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  viewLocationButton: {
    backgroundColor: "#06402B",
  },
  applicationButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  recommendationsScrollView: {
    marginLeft: -8,
    paddingLeft: 8,
  },
  recommendationCard: {
    width: width * 0.7,
    height: 220,
    marginRight: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
  },
  recommendationBackground: {
    flex: 1,
    resizeMode: "cover",
  },
  recommendationContent: {
    flex: 1,
    padding: 16,
    backgroundColor: "rgba(26, 26, 26, 0.9)",
  },
  recommendationLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  recommendationLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  recommendationCompany: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  recommendationPosition: {
    fontSize: 14,
    color: "#999",
    marginBottom: 12,
  },
  recommendationDetails: {
    marginBottom: 16,
  },
  recommendationDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    gap: 6,
  },
  recommendationDetailText: {
    fontSize: 12,
    color: "#999",
  },
  applyButton: {
    backgroundColor: "#0095ff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 0,
  },
  applyButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  spacer: {
    height: 100,
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
    color: "#666",
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
  avatarLetter: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
})

