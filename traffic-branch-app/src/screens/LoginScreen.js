import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ImageBackground,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LanguageContext } from '../context/LanguageContext';
import { BASE_URL } from '../config';

export default function LoginScreen({ navigation }) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { language, setLanguage } = useContext(LanguageContext);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const translations = {
    EN: {
      title: "SRI LANKA POLICE",
      subtitle: "TRAFFIC BRANCH - NEGOMBO",
      tagline: "DISCIPLINE  |  SERVICE  |  SAFETY",
      username: "Username",
      usernamePlaceholder: "Enter your username",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      login: "LOGIN",
      remember: "Remember me",
      forgotPassword: "Forgot password?",
      language: "Language:",
      footerGroup: "Group 13 – Traffic Branch Digital Operations & Reporting System",
      footerDept: "Sri Lanka Police - Traffic Branch, Negombo",
      footerCopy: "© 2026 | All rights reserved.",
      together: "TOGETHER FOR A",
      safer: "SAFER SRI LANKA",
      success: "Login successful",
      serverError: "Server error",
      forgotAlertTitle: "Forgot Password",
      forgotAlertMsg: "Please contact your Traffic Branch IT Administrator or OIC to reset your password.",
    },
    SI: {
      title: "ශ්‍රී ලංකා පොලීසිය",
      subtitle: "රථවාහන අංශය - නෙගොම්බෝ",
      tagline: "විනය  |  සේවය  |  ආරක්ෂාව",
      username: "පරිශීලක නාමය",
      usernamePlaceholder: "ඔබගේ පරිශීලක නාමය ඇතුළත් කරන්න",
      password: "මුරපදය",
      passwordPlaceholder: "ඔබගේ මුරපදය ඇතුළත් කරන්න",
      login: "ඇතුල් වන්න",
      remember: "මතක තබාගන්න",
      forgotPassword: "මුරපදය අමතකද?",
      language: "භාෂාව:",
      footerGroup: "කාණ්ඩය 13 – රථවාහන අංශයේ ඩිජිටල් මෙහෙයුම් පද්ධතිය",
      footerDept: "ශ්‍රී ලංකා පොලීසිය - රථවාහන අංශය, නෙගොම්බෝ",
      footerCopy: "© 2026 | සියලුම හිමිකම් ඇවිරිණි.",
      together: "එක්ව ගොඩනඟමු",
      safer: "ආරක්ෂිත ශ්‍රී ලංකාවක්",
      success: "සාර්ථකව ඇතුල් විය",
      serverError: "සේවාදායක දෝෂයක්",
      forgotAlertTitle: "මුරපදය අමතකද?",
      forgotAlertMsg: "ඔබගේ මුරපදය නැවත සැකසීමට කරුණාකර IT පරිපාලක හෝ OIC අමතන්න.",
    }
  };

  const t = translations[language] || translations.EN;

  // 🔐 LOGIN FUNCTION CONNECTED TO BACKEND (UNTOUCHED LOGIC)
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Missing Input", "Please enter both username and password.");
      return;
    }

    try {
      console.log("Trying login for:", username.trim());
      setLoading(true);

      const response = await fetch(`${BASE_URL}/officers/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const responseText = await response.text();
      console.log("Server login response status:", response.status);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        console.log("Non-JSON response from server:", responseText);
        Alert.alert(
          "Connection / Server Error",
          `Server returned an invalid response (${response.status}). Please check server status or backend URL.`
        );
        return;
      }

      if (response.ok) {
        console.log("LOGIN SUCCESS");
        if (data.officer) {
          global.loggedOfficer = data.officer;
          global.loggedOfficerName = data.officer.fullName || username.trim();
          global.loggedOfficerUsername = data.officer.username || username.trim();
          if (data.officer.policeId) {
            global.loggedOfficerPoliceId = data.officer.policeId;
          }
        } else {
          global.loggedOfficerUsername = username.trim();
        }
        if (data.token) {
          global.userToken = data.token;
        }
        navigation.replace("Main");
      } else {
        Alert.alert("Login Failed", data.message || data.error || "Invalid username or password.");
      }
    } catch (error) {
      console.log("LOGIN ERROR:", error);
      Alert.alert("Connection Error", `Unable to connect to backend server. (${error.message || "Network request failed"})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#072B54" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* TOP HERO AREA */}
          <ImageBackground
            source={require('../../assets/traffic_police_bg.jpg')}
            style={styles.heroBackground}
            resizeMode="cover"
          >
            <View style={styles.heroOverlay}>
              {/* TOP RIGHT QUOTE SECTION */}
              <View style={styles.topRightQuoteContainer}>
                <Text style={styles.quoteLine}>“Safer Roads</Text>
                <Text style={styles.quoteLine}>Brighter Tomorrows”</Text>
                <Text style={styles.commitmentTitle}>OUR COMMITMENT</Text>
                <Text style={styles.commitmentSub}>YOUR SAFETY</Text>
                <View style={styles.commitmentLine} />
              </View>

              {/* CENTER POLICE EMBLEM */}
              <View style={styles.emblemWrapper}>
                <Image
                  source={require('../../assets/police_logo.png')}
                  style={styles.emblemImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </ImageBackground>

          {/* SRI LANKA POLICE TITLES & TAGLINE */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>{t.title}</Text>
            <Text style={styles.subTitle}>{t.subtitle}</Text>

            <View style={styles.taglineRow}>
              <View style={styles.horizontalRule} />
              <Text style={styles.taglineText}>{t.tagline}</Text>
              <View style={styles.horizontalRule} />
            </View>
          </View>

          {/* LOGIN CARD */}
          <View style={styles.cardWrapper}>
            <View style={styles.card}>
              {/* USERNAME FIELD */}
              <View style={styles.fieldHeaderRow}>
                <Ionicons name="person" size={16} color="#082A54" style={{ marginRight: 6 }} />
                <Text style={styles.fieldLabel}>{t.username}</Text>
              </View>
              <View style={[
                styles.inputBox,
                usernameFocused && styles.inputBoxFocused
              ]}>
                <Ionicons name="person-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  placeholder={t.usernamePlaceholder}
                  placeholderTextColor="#94A3B8"
                  style={styles.inputField}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* PASSWORD FIELD */}
              <View style={styles.fieldHeaderRow}>
                <Ionicons name="lock-closed" size={16} color="#082A54" style={{ marginRight: 6 }} />
                <Text style={styles.fieldLabel}>{t.password}</Text>
              </View>
              <View style={[
                styles.inputBox,
                passwordFocused && styles.inputBoxFocused
              ]}>
                <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  placeholder={t.passwordPlaceholder}
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  style={styles.inputField}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* REMEMBER ME */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberTouch}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkedBox]}>
                    {rememberMe && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.rememberText}>{t.remember}</Text>
                </TouchableOpacity>
              </View>

              {/* LOGIN BUTTON */}
              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.btnRow}>
                    <Text style={styles.loginBtnText}>{t.login}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </View>
                )}
              </TouchableOpacity>

              {/* LANGUAGE SELECTOR */}
              <View style={styles.languageRow}>
                <Text style={styles.languagePrefix}>{t.language}  </Text>
                <TouchableOpacity onPress={() => setLanguage('EN')}>
                  <Text style={[styles.langText, language === 'EN' && styles.activeLangText]}>EN</Text>
                </TouchableOpacity>
                <Text style={styles.langDivider}>  |  </Text>
                <TouchableOpacity onPress={() => setLanguage('SI')}>
                  <Text style={[styles.langText, language === 'SI' && styles.activeLangText]}>සිං</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* GROUP 13 FOOTER */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerGroupText}>{t.footerGroup}</Text>
            <Text style={styles.footerDeptText}>{t.footerDept}</Text>
            <Text style={styles.footerCopyText}>{t.footerCopy}</Text>
          </View>


        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EBF3FB',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#EBF3FB',
    paddingBottom: 24,
  },

  /* HERO HEADER */
  heroBackground: {
    width: '100%',
    height: 220,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 35, 71, 0.65)',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 10,
  },
  topRightQuoteContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  quoteLine: {
    color: '#FFFFFF',
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '700',
    textAlign: 'right',
  },
  commitmentTitle: {
    color: '#DBEAFE',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 10,
    textAlign: 'right',
  },
  commitmentSub: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'right',
  },
  commitmentLine: {
    width: 32,
    height: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 3,
  },

  /* EMBLEM */
  emblemWrapper: {
    alignSelf: 'center',
    marginBottom: -45,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#072A52',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  emblemImage: {
    width: 82,
    height: 82,
  },

  /* TITLE SECTION */
  titleSection: {
    marginTop: 52,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#072A52',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#072A52',
    letterSpacing: 0.8,
    marginTop: 2,
    textAlign: 'center',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    width: '90%',
  },
  horizontalRule: {
    flex: 1,
    height: 1,
    backgroundColor: '#94A3B8',
  },
  taglineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E3A8A',
    letterSpacing: 0.8,
    marginHorizontal: 10,
  },

  /* CARD AREA */
  cardWrapper: {
    alignItems: 'center',
    marginTop: 18,
  },
  card: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: '#072A52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#072A52',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputBoxFocused: {
    borderColor: '#1D4ED8',
    backgroundColor: '#F0F6FF',
  },
  inputField: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 20,
  },
  rememberTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  checkedBox: {
    backgroundColor: '#072A52',
    borderColor: '#072A52',
  },
  rememberText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  loginBtn: {
    backgroundColor: '#072B54',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#072B54',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  languagePrefix: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  langText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeLangText: {
    fontWeight: '800',
    color: '#1D4ED8',
  },
  langDivider: {
    fontSize: 13,
    color: '#CBD5E1',
  },

  /* FOOTER */
  footerContainer: {
    marginTop: 22,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerGroupText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#072A52',
    textAlign: 'center',
    marginBottom: 2,
  },
  footerDeptText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 2,
  },
  footerCopyText: {
    fontSize: 10,
    fontWeight: '400',
    color: '#94A3B8',
    textAlign: 'center',
  },

  /* BOTTOM GRAPHIC BADGE */
  bottomGraphicContainer: {
    marginTop: 30,
    paddingLeft: 24,
    marginBottom: 10,
  },
  togetherText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  saferText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#072B54',
    letterSpacing: 0.8,
  },
});