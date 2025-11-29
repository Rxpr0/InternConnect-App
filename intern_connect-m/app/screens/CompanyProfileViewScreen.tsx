"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, ScrollView, ActivityIndicator } from "react-native"
import { Feather } from "@expo/vector-icons"
import { Link, useFocusEffect, useLocalSearchParams } from "expo-router"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import React from 'react';

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
  company_name?: string;
}

const lImage = require("../../assets/image/L.png")

export default function CompanyProfileViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching profile data for ID:', id);

      // Determine if viewing own profile
      const profileId = id || user?.id;
      setIsOwnProfile(profileId === user?.id);

      if (!profileId) {
        throw new Error('No profile ID available');
      }

      // First get the company name from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', profileId)
        .single();

      if (profileError) {
        console.error('Error fetching profile data:', profileError);
        throw profileError;
      }

      // Then get the company profile
      const { data: companyData, error: companyError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (companyError) {
        console.error('Error fetching company data:', companyError);
        throw companyError;
      }

      if (companyData) {
        console.log('Profile data fetched successfully');
        setProfile({
          ...companyData,
          company_name: profileData?.company_name || profileData?.full_name || companyData.name || 'Unknown Company'
        } as CompanyProfile);
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused, fetching profile...');
      fetchProfile();
      return () => {
        console.log('Screen unfocused');
      };
    }, [id, user?.id])
  );

  const handleWebsitePress = () => {
    if (profile?.website) {
      const url = profile.website.startsWith('http') ? profile.website : `https://${profile.website}`;
      Linking.openURL(url);
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

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profile not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#808080", "rgba(128, 128, 128, 0)"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image source={lImage} style={styles.logo} />
            <Text style={styles.headerTitle}>
              {isOwnProfile ? "Your Profile" : "Company Profile"}
            </Text>
          </View>
          <View style={styles.placeholderView} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <View style={styles.logoContainer}>
            {profile.logo ? (
              <Image 
                source={{ uri: profile.logo }} 
                style={styles.companyLogo} 
              />
            ) : (
              <Text style={styles.noPhotoText}>No Photo</Text>
            )}
          </View>
          <View style={styles.companyNameContainer}>
            <Text style={styles.companyName}>
              {profile.company_name || profile.name || 'Unknown Company'}
            </Text>
            <View style={styles.verifiedBadge}>
              <Feather name="check-circle" size={14} color="#4CAF50" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Feather name="briefcase" size={20} color="#0095ff" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Industry</Text>
              <Text style={styles.infoValue}>{profile.industry}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Feather name="map-pin" size={20} color="#0095ff" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{profile.location}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Feather name="globe" size={20} color="#0095ff" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Website</Text>
              <TouchableOpacity onPress={handleWebsitePress}>
                <Text style={[styles.infoValue, styles.link]}>{profile.website}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Feather name="info" size={20} color="#0095ff" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>About</Text>
              <Text style={styles.infoValue}>{profile.description}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats?.employees || 'N/A'}</Text>
            <Text style={styles.statLabel}>Employees</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats?.founded || 'N/A'}</Text>
            <Text style={styles.statLabel}>Founded</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats?.internships || 'N/A'}</Text>
            <Text style={styles.statLabel}>Internships</Text>
          </View>
        </View>

        {/* Only show edit button if it's the company's own profile */}
        {isOwnProfile && (
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => router.push("/screens/EditCompanyProfileScreen")}
          >
            <Feather name="edit-2" size={16} color="#fff" />
            <Text style={styles.editButtonText}>Edit Info</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
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
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#333",
    padding: 4,
  },
  companyLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  companyNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  companyName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  companyTagline: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
  infoSection: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 149, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 4,
  },
  link: {
    color: "#0095ff",
  },
  statsSection: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#333",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0095ff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#333",
    marginHorizontal: 8,
  },
  socialSection: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 24,
    gap: 16,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#0095ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 32,
    gap: 8,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  noPhotoText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
})

