import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LanguageContext } from '../context/LanguageContext';

export default function DutyScreen() {
  const { language } = useContext(LanguageContext);

  const translations = {
    EN: {
      title: "Duty Roster",
      badge: "Module Under Development",
      message: "The Duty Roster module is currently being reconstructed for upcoming release.",
      note: "Please contact your Traffic Branch OIC or IT Administrator for manual duty assignments."
    },
    SI: {
      title: "රාජකාරි කාලසටහන",
      badge: "මොඩියුලය සංවර්ධනය වෙමින් පවතී",
      message: "රාජකාරි කාලසටහන මොඩියුලය ඉදිරි නිකුතුව සඳහා සංවර්ධනය වෙමින් පවතී.",
      note: "අතින් පවරන ලද රාජකාරි සඳහා කරුණාකර ඔබගේ OIC හෝ IT පරිපාලක අමතන්න."
    }
  };

  const t = translations[language] || translations.EN;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.title}</Text>
      </View>

      {/* PLACEHOLDER CONTENT */}
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="calendar-outline" size={44} color="#2563EB" />
        </View>

        <View style={styles.badgeContainer}>
          <Ionicons name="time-outline" size={14} color="#2563EB" style={{ marginRight: 6 }} />
          <Text style={styles.badgeText}>{t.badge}</Text>
        </View>

        <Text style={styles.messageText}>{t.message}</Text>
        <Text style={styles.noteText}>{t.note}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    marginTop: -40,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  messageText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  noteText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});