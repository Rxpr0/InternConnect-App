import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useRouter } from 'expo-router';
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../contexts/AuthContext"
import dateUtils from "../utils/dateUtils"

const lImage = require("../../assets/image/L.png");

type NotificationType = 
  | "internship_posted" 
  | "application_approved" 
  | "application_rejected"
  | "interview_scheduled"
  | "hired"
  | "not_hired";

interface NotificationItem {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  created_at: string
  read: boolean
  metadata?: {
    internship_id?: string
    application_id?: string
    interview_id?: string
  }
}

function NotificationCard({ item, onPress }: { item: NotificationItem; onPress?: () => void }) {
  const getIcon = () => {
    switch (item.type) {
      case "internship_posted":
        return "briefcase"
      case "application_approved":
      case "hired":
        return "check-circle"
      case "application_rejected":
      case "not_hired":
        return "x-circle"
      case "interview_scheduled":
        return "calendar"
      default:
        return "bell"
    }
  }

  const getIconColor = () => {
    switch (item.type) {
      case "application_approved":
      case "hired":
        return "#4CAF50"
      case "application_rejected":
      case "not_hired":
        return "#E91E63"
      default:
        return "#0095ff"
    }
  }

  return (
    <TouchableOpacity style={[styles.card, !item.read && styles.unreadCard]} onPress={onPress}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMessage}>{item.message}</Text>
        <Text style={styles.cardTimestamp}>{dateUtils.formatDateTime(item.created_at)}</Text>
      </View>
      <View style={styles.cardIcon}>
        <Feather name={getIcon()} size={20} color={getIconColor()} />
      </View>
    </TouchableOpacity>
  )
}

export default function NotificationsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return;
    
    fetchNotifications()
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as NotificationItem;
          
          // Check if a similar notification already exists
          setNotifications(current => {
            // Check for duplicate based on type and metadata
            const isDuplicate = current.some(notification => 
              notification.type === newNotification.type &&
              JSON.stringify(notification.metadata) === JSON.stringify(newNotification.metadata) &&
              // Only consider notifications within the last minute as potential duplicates
              Date.now() - new Date(notification.created_at).getTime() < 60000
            );

            if (isDuplicate) {
              return current;
            }
            return [newNotification, ...current];
          });
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Remove duplicates from initial fetch
      const uniqueNotifications = data?.reduce((acc: NotificationItem[], notification) => {
        const isDuplicate = acc.some(n => 
          n.type === notification.type &&
          JSON.stringify(n.metadata) === JSON.stringify(notification.metadata) &&
          Math.abs(new Date(n.created_at).getTime() - new Date(notification.created_at).getTime()) < 60000
        );

        if (!isDuplicate) {
          acc.push(notification);
        }
        return acc;
      }, []) || [];

      setNotifications(uniqueNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationPress = async (notification: NotificationItem) => {
    // Mark as read
    if (!notification.read) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notification.id)

        setNotifications(current =>
          current.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        )
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Navigate based on notification type
    if (notification.metadata) {
      switch (notification.type) {
        case "internship_posted":
          if (notification.metadata.internship_id) {
            router.push({
              pathname: "/screens/InternshipDetailsScreen",
              params: { id: notification.metadata.internship_id }
            })
          }
          break;
        case "application_approved":
        case "application_rejected":
          if (notification.metadata.application_id) {
            router.push({
              pathname: "/screens/CompanyApplicationsScreen",
              params: { id: notification.metadata.application_id }
            })
          }
          break;
        case "interview_scheduled":
          if (notification.metadata.interview_id) {
            router.push({
              pathname: "/screens/InternshipDetailsScreen",
              params: { id: notification.metadata.interview_id }
            })
          }
          break;
        case "hired":
        case "not_hired":
          if (notification.metadata.application_id) {
            router.push({
              pathname: "/screens/CompanyApplicationsScreen",
              params: { id: notification.metadata.application_id }
            })
          }
          break;
      }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#808080', 'rgba(128, 128, 128, 0)']}
        style={styles.headerContainer}
      >
        <View style={styles.headerCenter}>
          <Image source={lImage} style={styles.logo} />
          <Text style={styles.appName}>Notifications</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.notificationsList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0095ff" />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="bell-off" size={50} color="#666" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>We'll notify you when something happens</Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <NotificationCard 
                key={notification.id} 
                item={notification}
                onPress={() => handleNotificationPress(notification)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/DashboardScreen")}>
          <Feather name="home" size={24} color="#666" />
          <Text style={styles.navItemText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/screens/BrowseInternshipsScreen")}>
          <Feather name="search" size={24} color="#666" />
          <Text style={styles.navItemText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.notificationContainer}>
            <Feather name="bell" size={24} color="#0095ff" />
          </View>
          <Text style={styles.navItemActiveText}>Notifications</Text>
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
    color: "#000",
    fontSize: 26,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  notificationsList: {
    padding: 20,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    marginBottom: 16,
    padding: 20,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#333",
  },
  unreadCard: {
    borderColor: "#0095ff",
    backgroundColor: "rgba(0, 149, 255, 0.05)",
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardMessage: {
    color: "#999",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  cardTimestamp: {
    color: "#666",
    fontSize: 12,
  },
  cardIcon: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 1,
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
});

