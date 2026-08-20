import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LanguageContext } from "../context/LanguageContext";

export default function SettingsScreen({ navigation }) {
  const { language, setLanguage } = useContext(LanguageContext);

  const toggleLanguage = () => {
    const nextLang = language === "EN" ? "SI" : "EN";
    if (setLanguage) {
      setLanguage(nextLang);
    }
    Alert.alert(
      "Language Updated",
      `App language set to ${nextLang === "EN" ? "English" : "සිංහල"}`
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of Traffic Branch System?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            global.userToken = null;
            global.loggedOfficer = null;
            global.loggedOfficerName = null;
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* GROUP 1: ACCOUNT */}
        <Text style={styles.groupTitle}>ACCOUNT</Text>
        <View style={styles.cardGroup}>
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                "Privacy & Security",
                "Your officer credentials and record submissions are encrypted and secured in accordance with Sri Lanka Police IT Regulations."
              )
            }
          >
            <View style={[styles.iconBox, { backgroundColor: "#f3e8ff" }]}>
              <Ionicons name="shield-checkmark" size={20} color="#7c3aed" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Privacy & Security</Text>
              <Text style={styles.itemSub}>Manage your privacy and security</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* GROUP 2: APP SETTINGS */}
        <Text style={styles.groupTitle}>APP SETTINGS</Text>
        <View style={styles.cardGroup}>
          {/* Notifications */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Notifications")}
          >
            <View style={[styles.iconBox, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="notifications" size={20} color="#d97706" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Notifications</Text>
              <Text style={styles.itemSub}>Manage notification preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Language */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.7}
            onPress={toggleLanguage}
          >
            <View style={[styles.iconBox, { backgroundColor: "#dbeafe" }]}>
              <Ionicons name="globe-outline" size={20} color="#2563eb" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Language</Text>
              <Text style={styles.itemSub}>Select your preferred language</Text>
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillText}>
                {language === "SI" ? "සිංහල" : "English"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Theme */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                "Theme Setting",
                "Light theme is set as standard for high readability during field traffic duties."
              )
            }
          >
            <View style={[styles.iconBox, { backgroundColor: "#f3e8ff" }]}>
              <Ionicons name="moon" size={20} color="#7c3aed" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Theme</Text>
              <Text style={styles.itemSub}>Choose light or dark theme</Text>
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillText}>Light</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* GROUP 3: OTHER */}
        <Text style={styles.groupTitle}>OTHER</Text>
        <View style={styles.cardGroup}>
          {/* Help & Support */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                "Help & Support",
                "Negombo Traffic Division HQ\nHotline: 031-2222222\nPolice Emergency: 119\nEmail: support@traffic.police.lk"
              )
            }
          >
            <View style={[styles.iconBox, { backgroundColor: "#dcfce7" }]}>
              <Ionicons name="help-circle" size={20} color="#16a34a" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Help & Support</Text>
              <Text style={styles.itemSub}>Get help and contact support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* About System */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                "About System",
                "Traffic Branch Record Management Mobile App\nVersion 2.4.0\nDeveloped for Sri Lanka Police Department."
              )
            }
          >
            <View style={[styles.iconBox, { backgroundColor: "#dbeafe" }]}>
              <Ionicons name="information-circle" size={20} color="#2563eb" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>About System</Text>
              <Text style={styles.itemSub}>Learn more about the system</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Terms & Conditions */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                "Terms & Conditions",
                "This application is restricted for authorized Sri Lanka Police Traffic Branch personnel only. Unauthorized access or data tampering is prohibited by law."
              )
            }
          >
            <View style={[styles.iconBox, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="document-text" size={20} color="#d97706" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Terms & Conditions</Text>
              <Text style={styles.itemSub}>Read our terms and conditions</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0b1d3a",
  },
  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#0b1d3a",
  },
  iconBtn: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  scrollContent: {
    padding: 16,
    backgroundColor: "#f8fafc",
    flexGrow: 1,
    paddingBottom: 40,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  itemSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  pillBadge: {
    backgroundColor: "#eff6ff",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginLeft: 68,
  },
  logoutBtn: {
    marginTop: 28,
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ef4444",
  },
});
