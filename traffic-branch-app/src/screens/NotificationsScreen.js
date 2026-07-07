import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LanguageContext } from '../context/LanguageContext';

export default function NotificationsScreen() {

  const { language } = useContext(LanguageContext);

  const translations = {
    EN: {
      title: "Notifications",
      unread: "3 unread notifications",
      system: "System Maintenance",
      shift: "Shift Update",
      emergency: "Emergency Alert"
    },
    SI: {
      title: "දැනුම්දීම්",
      unread: "නව දැනුම්දීම් 3ක්",
      system: "පද්ධති නඩත්තු",
      shift: "කාලසටහන යාවත්කාලීන",
      emergency: "හදිසි අනතුරු ඇඟවීම"
    }
  };

  const t = translations[language];

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerText}>{t.title}</Text>
      </View>

      <Text style={styles.unread}>{t.unread}</Text>

      <View style={styles.card}>
        <Text style={styles.title}>{t.system}</Text>
        <Text>2 days ago</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t.shift}</Text>
        <Text>2 hours ago</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t.emergency}</Text>
        <Text>15 min ago</Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  header: {
    backgroundColor: '#1e3a8a',
    padding: 15
  },

  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },

  unread: {
    padding: 10,
    fontWeight: 'bold'
  },

  card: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10
  },

  title: {
    fontWeight: 'bold'
  }
});