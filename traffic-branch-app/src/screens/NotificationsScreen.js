import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LanguageContext } from '../context/LanguageContext';
import { BASE_URL } from '../config';

export default function NotificationsScreen({ navigation }) {
  const { language } = useContext(LanguageContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const translations = {
    EN: {
      title: "Notifications",
      unread: "unread notifications",
      noNotifs: "No notifications available",
      markAllRead: "Mark all as read",
      system: "System Maintenance",
      shift: "Shift Update",
      emergency: "Emergency Alert"
    },
    SI: {
      title: "දැනුම්දීම්",
      unread: "නොකියවූ දැනුම්දීම්",
      noNotifs: "දැනුම්දීම් නොමැත",
      markAllRead: "සියල්ල කියවූ ලෙස ලකුණු කරන්න",
      system: "පද්ධති නඩත්තු",
      shift: "කාලසටහන යාවත්කාලීන",
      emergency: "හදිසි අනතුරු ඇඟවීම"
    }
  };

  const t = translations[language];

  // Fetch real notifications from backend
  const fetchNotifications = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (global.userToken) {
        headers['Authorization'] = `Bearer ${global.userToken}`;
      }

      const response = await fetch(`${BASE_URL}/notifications/me`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      }
    } catch (error) {
      console.log("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Mark single notification as read
  const handleMarkAsRead = async (id, isAlreadyRead) => {
    if (isAlreadyRead) return;

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (global.userToken) {
        headers['Authorization'] = `Bearer ${global.userToken}`;
      }

      const response = await fetch(`${BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(item => (item._id === id ? { ...item, isRead: true } : item))
        );
      }
    } catch (error) {
      console.log("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (global.userToken) {
        headers['Authorization'] = `Bearer ${global.userToken}`;
      }

      const response = await fetch(`${BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers
      });

      if (response.ok) {
        setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
      }
    } catch (error) {
      console.log("Error marking all as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER BAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{t.title}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllBtnText}>{t.markAllRead}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* UNREAD STATUS BANNER */}
      <View style={styles.statusBanner}>
        <Ionicons name="notifications" size={18} color="#1e3a8a" style={{ marginRight: 6 }} />
        <Text style={styles.unreadText}>
          {unreadCount} {t.unread}
        </Text>
      </View>

      {/* NOTIFICATIONS LIST */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1e3a8a']} />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="notifications-off-outline" size={40} color="#94a3b8" />
              <Text style={styles.emptyText}>{t.noNotifs}</Text>
            </View>
          ) : (
            notifications.map((item) => {
              const isApproved = item.type === "LEAVE_APPROVED";
              const isRejected = item.type === "LEAVE_REJECTED";
              const iconName = isApproved ? "checkmark-circle" : isRejected ? "close-circle" : "information-circle";
              const iconColor = isApproved ? "#16a34a" : isRejected ? "#dc2626" : "#2563eb";
              const formattedTime = new Date(item.createdAt || Date.now()).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <TouchableOpacity
                  key={item._id}
                  style={[
                    styles.card,
                    !item.isRead && styles.cardUnread,
                    isRejected && styles.cardRejectedBorder
                  ]}
                  onPress={() => handleMarkAsRead(item._id, item.isRead)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons name={iconName} size={22} color={iconColor} style={{ marginRight: 8 }} />
                      <Text style={[styles.title, !item.isRead && { fontWeight: '800' }]}>
                        {item.title}
                      </Text>
                    </View>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={styles.messageText}>{item.message}</Text>

                  {item.rejectionRemarks ? (
                    <View style={styles.rejectionCallout}>
                      <Text style={styles.rejectionTitle}>REJECTION REASON:</Text>
                      <Text style={styles.rejectionBody}>"{item.rejectionRemarks}"</Text>
                    </View>
                  ) : null}

                  <Text style={styles.timeText}>{formattedTime}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  header: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1
  },

  markAllBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },

  markAllBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe'
  },

  unreadText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e3a8a'
  },

  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 36,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },

  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 10,
    fontWeight: '600'
  },

  card: {
    backgroundColor: '#ffffff',
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },

  cardUnread: {
    backgroundColor: '#ffffff',
    borderColor: '#3b82f6',
    borderLeftWidth: 4
  },

  cardRejectedBorder: {
    borderColor: '#fca5a5'
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },

  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb'
  },

  messageText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 6
  },

  rejectionCallout: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 8,
    padding: 8,
    marginVertical: 4
  },

  rejectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#b91c1c'
  },

  rejectionBody: {
    fontSize: 12,
    color: '#991b1b',
    fontStyle: 'italic',
    marginTop: 2
  },

  timeText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4
  }
});