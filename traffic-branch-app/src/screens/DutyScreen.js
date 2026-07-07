import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LanguageContext } from '../context/LanguageContext';

export default function DutyScreen({ navigation }) {   // ✅ FIX HERE

  const { language } = useContext(LanguageContext);

  const translations = {
    EN: {
      title: "Duty Roster",
      today: "Today",
      morning: "Morning",
      afternoon: "Afternoon",
      night: "Night",
      onLeave: "On Leave",
      morningShift: "Morning Shift",
      afternoonShift: "Afternoon Shift",
      nightShift: "Night Shift"
    },
    SI: {
      title: "රාජකාරි",
      today: "අද",
      morning: "උදෑසන",
      afternoon: "දවල්",
      night: "රාත්‍රී",
      onLeave: "නිවාඩු",
      morningShift: "උදෑසන රාජකාරි",
      afternoonShift: "දවල් රාජකාරි",
      nightShift: "රාත්‍රී රාජකාරි"
    }
  };

  const t = translations[language];

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{t.title}</Text>

        <View style={{ flexDirection: 'row' }}>
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

      {/* SUMMARY */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text>{t.today}</Text>
          <Text style={styles.summaryNumber}>2</Text>
          <Text>{t.morning}</Text>
        </View>

        <View style={styles.summaryBox}>
          <Text>{t.today}</Text>
          <Text style={styles.summaryNumber}>2</Text>
          <Text>{t.afternoon}</Text>
        </View>

        <View style={styles.summaryBox}>
          <Text>{t.today}</Text>
          <Text style={styles.summaryNumber}>2</Text>
          <Text>{t.night}</Text>
        </View>

        <View style={styles.summaryBox}>
          <Text>{t.today}</Text>
          <Text style={styles.summaryNumber}>1</Text>
          <Text>{t.onLeave}</Text>
        </View>
      </View>

      {/* MORNING */}
      <View style={[styles.shiftCard, { borderTopColor: '#facc15' }]}>
        <Text style={styles.shiftTitle}>{t.morningShift}</Text>
        <Text style={styles.name}>Sgt Nimal Perera</Text>
        <Text style={styles.location}>Negombo Town Junction</Text>
      </View>

      {/* AFTERNOON */}
      <View style={[styles.shiftCard, { borderTopColor: '#fb923c' }]}>
        <Text style={styles.shiftTitle}>{t.afternoonShift}</Text>
        <Text style={styles.name}>Sgt Kamal Dharmasena</Text>
        <Text style={styles.location}>Kochchikade Junction</Text>
      </View>

      {/* NIGHT */}
      <View style={[styles.shiftCard, { borderTopColor: '#94a3b8' }]}>
        <Text style={styles.shiftTitle}>{t.nightShift}</Text>
        <Text style={styles.name}>Sgt Sugath Pitawala</Text>
        <Text style={styles.location}>Beach Road, Negombo</Text>
      </View>

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
    alignItems: 'center' // ✅ small UI fix
  },

  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10
  },

  summaryBox: {
    alignItems: 'center'
  },

  summaryNumber: {
    fontWeight: 'bold',
    fontSize: 16
  },

  shiftCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    borderTopWidth: 6
  },

  shiftTitle: {
    fontWeight: 'bold',
    marginBottom: 5
  },

  name: {
    fontWeight: 'bold'
  },

  location: {
    color: '#555'
  }
});