import React, { useContext } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { LanguageContext } from '../context/LanguageContext';

export default function OfficerDashboard({ navigation }) {

  const { language } = useContext(LanguageContext);

  const translations = {
    EN: {
      dashboard: "Dashboard",
      logout: "Logout",
      welcome: "Welcome!",
      date: "Thursday 26th of March",
      today: "Today's Overview",
      duty: "Assigned Duty",
      location: "Negombo Junction",
      time: "8AM - 4PM",
      accidents: "Accident Count",
      violations: "Violation Count",
      pending: "Pending Cases",
      recent: "Recent Activity",
      fatal: "Fatal",
      speeding: "Speeding"
    },
    SI: {
      dashboard: "ඩෑෂ්බෝඩ්",
      logout: "ඉවත් වන්න",
      welcome: "සාදරයෙන් පිළිගනිමු!",
      date: "මාර්තු 26 බ්‍රහස්පතින්දා",
      today: "අද සාරාංශය",
      duty: "කාර්ය භාරය",
      location: "නෙගොම්බෝ හන්දිය",
      time: "පෙ.ව 8 - ප.ව 4",
      accidents: "අනතුරු ගණන",
      violations: "වැරදි ගණන",
      pending: "පවතින නඩු",
      recent: "අලුත් ක්‍රියාකාරකම්",
      fatal: "මාරාන්තික",
      speeding: "වේගයෙන් ධාවනය"
    }
  };

  const t = translations[language];

  const handleLogout = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>

          {/* LEFT - LOGOUT */}
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logout}>{t.logout}</Text>
          </TouchableOpacity>

          {/* CENTER - TITLE */}
          <Text style={styles.headerText}>{t.dashboard}</Text>

          {/* RIGHT - ICONS */}
          <View style={styles.topIcons}>
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

        {/* Welcome */}
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeText}>{t.welcome}</Text>
          <Text style={{ color: '#fff' }}>{t.date}</Text>
        </View>

        {/* Overview */}
        <Text style={styles.section}>{t.today}</Text>

        <View style={styles.grid}>

          <View style={styles.card}>
            <Text>{t.duty}</Text>
            <Text>{t.location}</Text>
            <Text style={styles.big}>{t.time}</Text>
          </View>

          <View style={styles.card}>
            <Text>{t.accidents}</Text>
            <Text style={styles.big}>2</Text>
          </View>

          <View style={styles.card}>
            <Text>{t.violations}</Text>
            <Text style={styles.big}>4</Text>
          </View>

          <View style={styles.card}>
            <Text>{t.pending}</Text>
            <Text style={styles.big}>3</Text>
          </View>

        </View>

        {/* Recent */}
        <Text style={styles.section}>{t.recent}</Text>

        <View style={styles.activity}>
          <Text>Galle Road, Colombo - {t.fatal}</Text>
        </View>

        <View style={styles.activity}>
          <Text>Kochchikade, Negombo - {t.speeding}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5'
  },

  header: {
    backgroundColor: '#1e3a8a',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },

  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },

  logout: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },

  topIcons: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  welcomeBox: {
    backgroundColor: '#1e3a8a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15
  },

  welcomeText: {
    color: '#fff',
    fontWeight: 'bold'
  },

  section: {
    marginBottom: 10,
    fontWeight: 'bold'
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  card: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },

  big: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  activity: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  }

});