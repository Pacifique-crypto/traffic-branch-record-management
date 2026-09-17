import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LanguageContext } from '../context/LanguageContext';
import { BASE_URL } from '../config';

export default function DutyScreen({ route, navigation }) {
  const { language } = useContext(LanguageContext);
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const translations = {
    EN: {
      title: "My Duty Roster",
      subTitle: "Published assignments for your station",
      todayHeader: "Today's Duty",
      upcomingHeader: "Upcoming Duties",
      noDutyToday: "No duty assigned for today",
      noDuties: "No active duty assignments found",
      noDutiesSub: "Duty rosters published by your OIC will appear here automatically.",
      location: "Location",
      shift: "Shift",
      rosterRef: "Roster Ref",
      status: "Active"
    },
    SI: {
      title: "මාගේ රාජකාරි කාලසටහන",
      subTitle: "ප්‍රකාශිත රාජකාරි පැවරුම්",
      todayHeader: "අද දින රාජකාරිය",
      upcomingHeader: "ඉදිරි රාජකාරි",
      noDutyToday: "අද දින සඳහා රාජකාරියක් නොමැත",
      noDuties: "ක්‍රියාකාරී රාජකාරි පැවරුම් නොමැත",
      noDutiesSub: "OIC විසින් ප්‍රකාශයට පත් කරන ලද රාජකාරි කාලසටහන් මෙහි දර්ශනය වේ.",
      location: "ස්ථානය",
      shift: "කාලසීමාව",
      rosterRef: "කාලසටහන් අංකය",
      status: "සක්‍රිය"
    }
  };

  const t = translations[language] || translations.EN;

  const fetchMyDuties = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (global.userToken) {
        headers['Authorization'] = `Bearer ${global.userToken}`;
      }

      const res = await fetch(`${BASE_URL}/duties/my`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.duties)) {
          setDuties(data.duties);
        }
      }
    } catch (err) {
      console.log("Error fetching my duties:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyDuties();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyDuties();
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const todayDuties = duties.filter(d => {
    const dStr = d.date ? d.date.substring(0, 10) : '';
    return dStr === todayStr;
  });

  const upcomingDuties = duties.filter(d => {
    const dStr = d.date ? d.date.substring(0, 10) : '';
    return dStr > todayStr || dStr < todayStr;
  });

  const renderDutyCard = (item, isToday = false) => {
    const dutyTitle = item.dutyType === 'Special Duty'
      ? (item.specialDutyText || 'Special Duty')
      : item.dutyType;

    const formattedDate = new Date(item.date).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const isHighlight = route?.params?.dutyId === item._id;

    return (
      <View
        key={item._id}
        style={[
          styles.dutyCard,
          isToday && styles.todayCard,
          isHighlight && styles.highlightCard
        ]}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <View style={styles.dutyTypeBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#1e3a8a" style={{ marginRight: 4 }} />
              <Text style={styles.dutyTypeText}>{dutyTitle}</Text>
            </View>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          {isToday && (
            <View style={styles.todayPill}>
              <Text style={styles.todayPillText}>TODAY</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#475569" style={styles.infoIcon} />
          <View>
            <Text style={styles.infoLabel}>{t.shift}</Text>
            <Text style={styles.infoVal}>{item.shift || '06:00 - 14:00'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#475569" style={styles.infoIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>{t.location}</Text>
            <Text style={styles.infoVal}>{item.location || 'Main Station / Field'}</Text>
          </View>
        </View>

        {item.roster?.rosterReference ? (
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={16} color="#475569" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>{t.rosterRef}</Text>
              <Text style={styles.rosterRefVal}>{item.roster.rosterReference}</Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#1e3a8a" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <Text style={styles.headerSub}>{t.subTitle}</Text>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1e3a8a']} />
          }
        >
          {/* TODAY'S DUTY SECTION */}
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-sharp" size={18} color="#1e3a8a" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>{t.todayHeader}</Text>
          </View>

          {todayDuties.length > 0 ? (
            todayDuties.map(item => renderDutyCard(item, true))
          ) : (
            <View style={styles.emptySubCard}>
              <Ionicons name="checkmark-done-circle-outline" size={32} color="#94a3b8" />
              <Text style={styles.emptySubText}>{t.noDutyToday}</Text>
            </View>
          )}

          {/* UPCOMING / ALL DUTIES SECTION */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Ionicons name="list" size={18} color="#1e3a8a" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>{t.upcomingHeader}</Text>
          </View>

          {upcomingDuties.length > 0 ? (
            upcomingDuties.map(item => renderDutyCard(item, false))
          ) : (
            duties.length === 0 && (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
                <Text style={styles.emptyText}>{t.noDuties}</Text>
                <Text style={styles.emptySubTextFull}>{t.noDutiesSub}</Text>
              </View>
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1E3A8A',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 12,
    color: '#93C5FD',
    marginTop: 2,
    fontWeight: '500',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dutyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  todayCard: {
    borderColor: '#2563EB',
    borderLeftWidth: 5,
  },
  highlightCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dutyTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  dutyTypeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  todayPill: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  todayPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 10,
    width: 20,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  rosterRefVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  emptySubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  emptySubText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 36,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubTextFull: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});