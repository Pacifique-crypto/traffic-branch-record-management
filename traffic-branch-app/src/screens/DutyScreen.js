import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LanguageContext } from '../context/LanguageContext';
import { BASE_URL } from '../config';

export default function DutyScreen({ navigation }) {
  const { language } = useContext(LanguageContext);
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDuty, setSelectedDuty] = useState(null);

  const translations = {
    EN: {
      title: "Duty Roster",
      today: "Today's Duties",
      thisWeek: "This Week's Duties",
      morning: "Morning",
      afternoon: "Afternoon",
      night: "Night",
      onLeave: "On Leave",
      noDuties: "No duties assigned to you at this time.",
      loading: "Loading schedule...",
      location: "Location",
      dutyType: "Duty Type",
      date: "Date",
      shift: "Shift",
      details: "Duty Details",
      close: "Close"
    },
    SI: {
      title: "රාජකාරි කාලසටහන",
      today: "අද දවසේ රාජකාරි",
      thisWeek: "මේ සතියේ රාජකාරි",
      morning: "උදෑසන",
      afternoon: "දවල්",
      night: "රාත්‍රී",
      onLeave: "නිවාඩු",
      noDuties: "මෙම අවස්ථාවේදී ඔබට රාජකාරි පවරා නොමැත.",
      loading: "රාජකාරි පූරණය වෙමින්...",
      location: "ස්ථානය",
      dutyType: "රාජකාරි වර්ගය",
      date: "දිනය",
      shift: "මුරය",
      details: "රාජකාරි විස්තර",
      close: "වසා දමන්න"
    }
  };

  const t = translations[language];

  const fetchDuties = async () => {
    try {
      setLoading(true);
      const policeId = global.loggedOfficerPoliceId || "PC0001";
      const headers = {
        "Content-Type": "application/json",
        ...(global.userToken ? { "Authorization": `Bearer ${global.userToken}` } : {})
      };

      const response = await fetch(`${BASE_URL}/duties/officer/${policeId}`, { headers });
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        setDuties(data);
      } else {
        setDuties([]);
      }
    } catch (err) {
      console.log("Error loading duties:", err);
      Alert.alert("Connection Error", "Could not fetch duty schedule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuties();
  }, []);

  const getTodayDuties = () => {
    const todayStr = new Date().toDateString();
    return duties.filter(d => new Date(d.date).toDateString() === todayStr);
  };

  const getWeeklyDuties = () => {
    const todayStr = new Date().toDateString();
    return duties.filter(d => new Date(d.date).toDateString() !== todayStr);
  };

  const getShiftColor = (shift) => {
    switch (shift) {
      case "Morning": return "#facc15";
      case "Afternoon": return "#fb923c";
      case "Night": return "#475569";
      default: return "#94a3b8";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{t.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons 
            name="refresh-outline"
            size={22}
            color="#fff"
            style={{ marginRight: 15 }}
            onPress={fetchDuties}
          />
          <Ionicons 
            name="notifications-outline" 
            size={22} 
            color="#fff" 
            style={{ marginRight: 15 }} 
            onPress={() => navigation.navigate('Notifications')}
          />
          <Ionicons 
            name="person-circle-outline" 
            size={24} 
            color="#fff" 
            onPress={() => navigation.navigate('Profile')}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={{ marginTop: 10, color: '#64748b' }}>{t.loading}</Text>
        </View>
      ) : duties.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
          <Text style={{ marginTop: 10, color: '#64748b', textAlign: 'center', paddingHorizontal: 40 }}>{t.noDuties}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* TODAY'S DUTIES */}
          {getTodayDuties().length > 0 && (
            <View>
              <Text style={styles.sectionHeader}>{t.today}</Text>
              {getTodayDuties().map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.shiftCard, { borderTopColor: getShiftColor(item.shift) }]}
                  onPress={() => setSelectedDuty(item)}
                >
                  <Text style={styles.shiftTitle}>{item.shift} Shift</Text>
                  <Text style={styles.dutyType}>{item.dutyType}</Text>
                  <Text style={styles.location}>📍 {item.location}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* WEEKLY DUTIES */}
          {getWeeklyDuties().length > 0 && (
            <View>
              <Text style={styles.sectionHeader}>{t.thisWeek}</Text>
              {getWeeklyDuties().map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.shiftCard, { borderTopColor: getShiftColor(item.shift) }]}
                  onPress={() => setSelectedDuty(item)}
                >
                  <Text style={styles.shiftTitle}>{new Date(item.date).toDateString()} - {item.shift}</Text>
                  <Text style={styles.dutyType}>{item.dutyType}</Text>
                  <Text style={styles.location}>📍 {item.location}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* DETAIL MODAL */}
      <Modal
        visible={selectedDuty !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedDuty(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.details}</Text>
            
            {selectedDuty && (
              <View style={styles.modalBody}>
                <Text style={styles.detailLabel}>{t.date}:</Text>
                <Text style={styles.detailValue}>{new Date(selectedDuty.date).toDateString()}</Text>

                <Text style={styles.detailLabel}>{t.shift}:</Text>
                <Text style={styles.detailValue}>{selectedDuty.shift}</Text>

                <Text style={styles.detailLabel}>{t.location}:</Text>
                <Text style={styles.detailValue}>{selectedDuty.location}</Text>

                <Text style={styles.detailLabel}>{t.dutyType}:</Text>
                <Text style={styles.detailValue}>{selectedDuty.dutyType}</Text>
                
                <Text style={[styles.detailLabel, { marginTop: 10 }]}>Status:</Text>
                <Text style={[styles.detailValue, { color: '#16a34a', fontWeight: 'bold' }]}>Published by OIC</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setSelectedDuty(null)}
            >
              <Text style={styles.closeButtonText}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  header: {
    backgroundColor: '#1e3a8a',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 15,
    marginTop: 20,
    marginBottom: 5
  },
  shiftCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 5,
    padding: 15,
    borderRadius: 10,
    borderTopWidth: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 }
  },
  shiftTitle: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  dutyType: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 4
  },
  location: {
    color: '#475569',
    fontSize: 13
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 15,
    padding: 20,
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 15,
    textAlign: 'center'
  },
  modalBody: {
    marginBottom: 20
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8
  },
  detailValue: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500'
  },
  closeButton: {
    backgroundColor: '#1e3a8a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});