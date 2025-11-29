"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { Link, useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from "../../lib/supabase"

const lImage = require("../../assets/image/L.png")

interface InternshipListing {
  id: string
  position: string
  company_id: string
  company_name?: string
  location: string
  work_type: "remote" | "onsite" | "hybrid"
  duration: string
  is_paid: boolean
  stipend: number | null
  deadline: string
  created_at: string
  requirements: string
  responsibilities: string
  skills: string[]
  status: string
  department: string
  spots: number
  company_avatar?: string | null
}

type FilterOption = "All" | "Remote" | "Onsite" | "Hybrid" | "Paid" | "Recent"

export default function BrowsingInternshipsScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All")
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [internships, setInternships] = useState<InternshipListing[]>([])
  const [error, setError] = useState<string | null>(null)

  // Add state for advanced filters
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "salary">("relevance")
  const [duration, setDuration] = useState<"All" | "1-3" | "4-6" | "6+">("All")

  const filterOptions: FilterOption[] = ["All", "Remote", "Onsite", "Hybrid", "Paid", "Recent"]

  const handleFilterChange = async (option: FilterOption) => {
    setActiveFilter(option)
    try {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from('internships')
        .select('*')

      // Apply filters based on the selected option
      switch (option) {
        case "Remote":
          query = query.eq('work_type', 'remote')
          break
        case "Onsite":
          query = query.eq('work_type', 'onsite')
          break
        case "Hybrid":
          query = query.eq('work_type', 'hybrid')
          break
        case "Paid":
          query = query.eq('is_paid', true)
          break
        case "Recent":
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          query = query.gte('created_at', sevenDaysAgo.toISOString())
          break
        case "All":
          // No additional filters needed
          break
      }

      // Apply duration filter if set
      if (duration !== "All") {
        if (duration === "1-3") {
          query = query.lte('duration', '3')
        } else if (duration === "4-6") {
          query = query.gte('duration', '4').lte('duration', '6')
        } else if (duration === "6+") {
          query = query.gte('duration', '6')
        }
      }

      // Apply sorting
      if (sortBy === "date") {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === "salary") {
        query = query.order('stipend', { ascending: false, nullsFirst: false })
      }

      const { data: internshipsData, error: internshipsError } = await query

      if (internshipsError) {
        throw internshipsError
      }

      // Fetch company profiles
      const companyIds = [...new Set(internshipsData?.map(item => item.company_id) || [])]
      const { data: companyData, error: companyError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', companyIds)

      if (companyError) {
        throw companyError
      }

      // Create company map
      const companyMap = new Map(companyData?.map(company => [company.id, {
        name: company.full_name
      }]))

      // Transform the data
      const transformedData: InternshipListing[] = internshipsData.map(item => ({
        ...item,
        company_name: companyMap.get(item.company_id)?.name || 'Unknown Company',
        company_avatar: null,
        skills: Array.isArray(item.skills) ? item.skills : []
      }))

      setInternships(transformedData)
    } catch (error: any) {
      console.error('Error fetching internships:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    handleFilterChange("All") // Initial load with "All" filter
  }, []) // Only fetch on initial load

  const filteredInternships = internships.filter((internship) => {
    if (!searchQuery) return true

    const searchLower = searchQuery.toLowerCase()
    return (
      internship.position.toLowerCase().includes(searchLower) ||
      (internship.company_name?.toLowerCase() || '').includes(searchLower) ||
      internship.skills.some(skill => skill.toLowerCase().includes(searchLower))
    )
  })

  // Apply advanced filters
  const applyAdvancedFilters = () => {
    handleFilterChange("All")
    setShowFilters(false)
  }

  // Reset all filters
  const resetFilters = () => {
    setActiveFilter("All")
    setSortBy("relevance")
    setDuration("All")
    setSearchQuery("")
    setShowFilters(false)
    handleFilterChange("All") // Fetch with reset filters
  }

  const renderInternshipItem = ({ item }: { item: InternshipListing }) => (
    <TouchableOpacity 
      style={styles.internshipCard}
      onPress={() => router.push({
        pathname: "/screens/InternshipDetailsScreen",
        params: { id: item.id }
      })}
    >
      <View style={styles.internshipHeader}>
        <View style={styles.companyInfo}>
          <View style={styles.logoContainer}>
            <Text style={styles.companyAvatarText}>{item.company_name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.position}>{item.position}</Text>
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: "/screens/CompanyProfileViewScreen",
                params: { id: item.company_id }
              })}
            >
              <Text style={styles.company}>{item.company_name}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Feather name="map-pin" size={14} color="#666" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.detailItem}>
          <Feather name="clock" size={14} color="#666" />
          <Text style={styles.detailText}>{item.duration}</Text>
        </View>
        {item.is_paid && (
          <View style={styles.detailItem}>
            <Feather name="dollar-sign" size={14} color="#666" />
            <Text style={styles.detailText}>${item.stipend}/month</Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <Feather name="calendar" size={14} color="#666" />
          <Text style={styles.detailText}>Deadline: {new Date(item.deadline).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.typeContainer}>
        <View
          style={[
            styles.typeBadge,
            item.work_type === "remote"
              ? styles.remoteBadge
              : item.work_type === "onsite"
                ? styles.onsiteBadge
                : styles.hybridBadge,
          ]}
        >
          <Feather
            name={item.work_type === "remote" ? "wifi" : item.work_type === "onsite" ? "map-pin" : "git-merge"}
            size={12}
            color={item.work_type === "remote" ? "#2196F3" : item.work_type === "onsite" ? "#E91E63" : "#FF9800"}
          />
          <Text
            style={[
              styles.typeText,
              item.work_type === "remote"
                ? styles.remoteText
                : item.work_type === "onsite"
                  ? styles.onsiteText
                  : styles.hybridText,
            ]}
          >
            {item.work_type.charAt(0).toUpperCase() + item.work_type.slice(1)}
          </Text>
        </View>
        <Text style={styles.postedText}>
          Posted {getTimeAgo(new Date(item.created_at))}
        </Text>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {item.requirements}
      </Text>

      <View style={styles.skillsContainer}>
        {item.skills.map((skill, index) => (
          <View key={index} style={styles.skillBadge}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.viewButton} 
          onPress={() => router.push({
            pathname: "/screens/InternshipDetailsScreen",
            params: { id: item.id }
          })}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.applyButton} 
          onPress={() => router.push({
            pathname: "/screens/SubmitApplicationScreen",
            params: { internshipId: item.id }
          })}
        >
          <Text style={styles.applyButtonText}>Quick Apply</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  // Helper function to format time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return new Date(date).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095ff" />
          <Text style={styles.loadingText}>Loading internships...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Updated header with LinearGradient like the dashboard screen */}
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.headerCenter}>
          <Image source={lImage} style={styles.logo} />
          <Text style={styles.appName}>Browse Internships</Text>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search positions, companies, skills..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
          <Feather name="sliders" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filterRow}>
            <Text style={styles.filterTitle}>Sort by:</Text>
            <View style={styles.sortOptions}>
              <TouchableOpacity
                style={[styles.sortOption, sortBy === "relevance" && styles.sortOptionActive]}
                onPress={() => setSortBy("relevance")}
              >
                <Text style={sortBy === "relevance" ? styles.sortOptionActiveText : styles.sortOptionText}>
                  Relevance
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortOption, sortBy === "date" && styles.sortOptionActive]}
                onPress={() => setSortBy("date")}
              >
                <Text style={sortBy === "date" ? styles.sortOptionActiveText : styles.sortOptionText}>Date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortOption, sortBy === "salary" && styles.sortOptionActive]}
                onPress={() => setSortBy("salary")}
              >
                <Text style={sortBy === "salary" ? styles.sortOptionActiveText : styles.sortOptionText}>Salary</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterTitle}>Duration:</Text>
            <View style={styles.durationOptions}>
              <TouchableOpacity
                style={[styles.durationOption, duration === "All" && styles.durationOptionActive]}
                onPress={() => setDuration("All")}
              >
                <Text style={duration === "All" ? styles.durationOptionActiveText : styles.durationOptionText}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.durationOption, duration === "1-3" && styles.durationOptionActive]}
                onPress={() => setDuration("1-3")}
              >
                <Text style={duration === "1-3" ? styles.durationOptionActiveText : styles.durationOptionText}>
                  1-3 months
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.durationOption, duration === "4-6" && styles.durationOptionActive]}
                onPress={() => setDuration("4-6")}
              >
                <Text style={duration === "4-6" ? styles.durationOptionActiveText : styles.durationOptionText}>
                  4-6 months
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.durationOption, duration === "6+" && styles.durationOptionActive]}
                onPress={() => setDuration("6+")}
              >
                <Text style={duration === "6+" ? styles.durationOptionActiveText : styles.durationOptionText}>
                  6+ months
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.applyFiltersButton} onPress={applyAdvancedFilters}>
              <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.filterTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.filterTab, activeFilter === option && styles.activeFilterTab]}
              onPress={() => handleFilterChange(option)}
            >
              <Text style={[styles.filterTabText, activeFilter === option && styles.activeFilterTabText]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{filteredInternships.length} Internships Found</Text>
        </View>

        <FlatList
          data={filteredInternships}
          renderItem={renderInternshipItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.internshipsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="search" size={50} color="#666" />
              <Text style={styles.emptyTitle}>No internships found</Text>
              <Text style={styles.emptyText}>
                {error || "Try adjusting your search or filters to find more opportunities"}
              </Text>
            </View>
          }
        />
      </View>

      {/* Update the bottom navigation section in the return statement to remove any extra padding or styling issues */}
      <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/DashboardScreen")}>
            <Feather name="home" size={24} color="#666" />
            <Text style={styles.navItemText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, styles.navItem]} onPress={() => router.push("/screens/BrowseInternshipsScreen")}>
            <Feather name="search" size={24} color="#0095ff" />
            <Text style={styles.navItemActiveText}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/NotificationsScreen")}>
            <View style={styles.notificationContainer}>
              <Feather name="bell" size={24} color="#666" />
            </View>
            <Text style={styles.navItemText1}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/SettingsScreen")}>
          <View style={styles.settingContainer}>
            <Feather name="settings" size={24} color="#666" />
            </View>
            <Text style={styles.navItemText2}>Settings</Text>
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
  // Updated header styles to match the dashboard screen
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
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: "#fff",
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: "#333",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  filtersPanel: {
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    padding: 16,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  sortOptions: {
    flexDirection: "row",
    gap: 8,
  },
  sortOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#444",
  },
  sortOptionActive: {
    backgroundColor: "rgba(0, 149, 255, 0.15)",
    borderColor: "#0095ff",
  },
  sortOptionText: {
    fontSize: 12,
    color: "#999",
  },
  sortOptionActiveText: {
    fontSize: 12,
    color: "#0095ff",
    fontWeight: "600",
  },
  durationOptions: {
    flexDirection: "row",
    gap: 8,
  },
  durationOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#444",
  },
  durationOptionActive: {
    backgroundColor: "rgba(0, 149, 255, 0.15)",
    borderColor: "#0095ff",
  },
  durationOptionText: {
    fontSize: 12,
    color: "#999",
  },
  durationOptionActiveText: {
    fontSize: 12,
    color: "#0095ff",
    fontWeight: "600",
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  applyFiltersButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#0095ff",
  },
  applyFiltersButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  filterTabsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  filterTabs: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
  },
  activeFilterTab: {
    backgroundColor: "rgba(0, 149, 255, 0.15)",
    borderColor: "#0095ff",
  },
  filterTabText: {
    fontSize: 12,
    color: "#999",
  },
  activeFilterTabText: {
    color: "#0095ff",
    fontWeight: "600",
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: "#999",
  },
  savedButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  savedButtonText: {
    fontSize: 14,
    color: "#0095ff",
  },
  internshipsList: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
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
    alignItems: "flex-start",
    marginBottom: 12,
  },
  companyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
    borderColor: "#444",
  },
  headerText: {
    flex: 1,
  },
  position: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  company: {
    fontSize: 14,
    color: "#999",
  },
  saveButton: {
    padding: 4,
  },
  savedIcon: {
    color: "#0095ff",
  },
  detailsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#999",
  },
  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  remoteBadge: {
    backgroundColor: "rgba(33, 150, 243, 0.1)",
  },
  onsiteBadge: {
    backgroundColor: "rgba(233, 30, 99, 0.1)",
  },
  hybridBadge: {
    backgroundColor: "rgba(255, 152, 0, 0.1)",
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  remoteText: {
    color: "#2196F3",
  },
  onsiteText: {
    color: "#E91E63",
  },
  hybridText: {
    color: "#FF9800",
  },
  postedText: {
    fontSize: 12,
    color: "#666",
  },
  description: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  skillBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#444",
  },
  skillText: {
    fontSize: 12,
    color: "#999",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#333",
    alignItems: "center",
  },
  viewButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#0095ff",
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  // Updated bottom navigation styles for even spacing
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 12,
    paddingBottom: 24,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "space-evenly", // This ensures even spacing between items
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    width: "20%", // Each item takes exactly 20% of the width (5 items)
  },
  navItemText: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  navItemText2: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
    paddingLeft: 25,
  },
  navItemText1: {
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
  settingContainer: {
    position: "relative",
    paddingLeft:24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  companyAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
})

