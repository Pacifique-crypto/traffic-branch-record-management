import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch
} from 'react-native';
import { LanguageContext } from '../context/LanguageContext';

export default function ProfileScreen({ navigation }) {

  const { language } = useContext(LanguageContext);

  const translations = {
    EN: {
      title: "Profile",
      edit: "Edit",
      settings: "Settings",
      dark: "Dark Mode",
      notification: "Notification Setting",
      logout: "Logout"
    },
    SI: {
      title: "පැතිකඩ",
      edit: "සංස්කරණය",
      settings: "සැකසුම්",
      dark: "අඳුරු මාදිලිය",
      notification: "දැනුම්දීම් සැකසුම්",
      logout: "ඉවත් වන්න"
    }
  };

  const t = translations[language];

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerText}>{t.title}</Text>
      </View>

      {/* USER CARD */}
      <View style={styles.card}>
        <Text>ID: 12345</Text>
        <Text>Name: Officer Silva</Text>
        <Text>Rank: Sergeant</Text>

        <TouchableOpacity style={styles.editBtn}>
          <Text style={{ color: '#fff' }}>{t.edit}</Text>
        </TouchableOpacity>
      </View>

      {/* SETTINGS */}
      <View style={styles.card}>
        <Text style={{ fontWeight: 'bold' }}>{t.settings}</Text>

        <View style={styles.row}>
          <Text>{t.dark}</Text>
          <Switch />
        </View>

        <View style={styles.row}>
          <Text>{t.notification}</Text>
        </View>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity 
        style={styles.logoutBtn}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={{ color: '#fff' }}>{t.logout}</Text>
      </TouchableOpacity>

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

  card: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10
  },

  editBtn: {
    backgroundColor: '#1e3a8a',
    padding: 8,
    marginTop: 10,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },

  logoutBtn: {
    backgroundColor: '#1e3a8a',
    margin: 20,
    padding: 15,
    alignItems: 'center',
    borderRadius: 10
  }
});