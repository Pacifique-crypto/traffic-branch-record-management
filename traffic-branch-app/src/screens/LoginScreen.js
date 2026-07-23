import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
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

  const translations = {
    EN: {
      title: "SRI LANKA POLICE",
      subtitle: "Traffic Branch - Negombo",
      username: "Username",
      password: "Password",
      login: "Login",
      remember: "Remember me",
      language: "Language",
      footer: "© 2026 Sri Lanka Traffic Branch\nFor official use only",
      success: "Login successful",
      serverError: "Server error"
    },
    SI: {
      title: "ශ්‍රී ලංකා පොලීසිය",
      subtitle: "රථවාහන අංශය - නෙගොම්බෝ",
      username: "පරිශීලක නාමය",
      password: "මුරපදය",
      login: "ඇතුල් වන්න",
      remember: "මතක තබාගන්න",
      language: "භාෂාව",
      footer: "© 2026 ශ්‍රී ලංකා රථවාහන අංශය\nනිල භාවිතය සඳහා පමණි",
      success: "සාර්ථකව ඇතුල් විය",
      serverError: "සේවාදායක දෝෂයක්"
    }
  };

  const t = translations[language];

  // 🔐 LOGIN FUNCTION CONNECTED TO BACKEND
 const handleLogin = async () => {
  try {
    console.log("Trying login...");

    const response = await fetch(`${BASE_URL}/officers/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    console.log("Response:", data);

    if (response.ok) {
      console.log("LOGIN SUCCESS");
      if (data.officer && data.officer.fullName) {
        global.loggedOfficerName = data.officer.fullName;
      }
      if (data.token) {
        global.userToken = data.token;
      }
      navigation.replace("Main");
    } else {
      Alert.alert("Error", data.message);
    }
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    Alert.alert("Error", error.message);
  }
};

  return (
    <View style={styles.container}>

      {/* LOGO */}
      <Image 
        source={require('../../assets/police_logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />

      {/* TITLES */}
      <Text style={styles.mainTitle}>{t.title}</Text>
      <Text style={styles.subTitle}>{t.subtitle}</Text>

      {/* CARD */}
      <View style={styles.card}>

        {/* USERNAME */}
        <Text style={styles.label}>{t.username}</Text>
        <TextInput
          placeholder={t.username}
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />

        {/* PASSWORD */}
        <Text style={styles.label}>{t.password}</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder={t.password}
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#555"
            />
          </TouchableOpacity>
        </View>

        {/* REMEMBER */}
        <View style={styles.rememberContainer}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              rememberMe && styles.checkedBox
            ]}
            onPress={() => setRememberMe(!rememberMe)}
          >
            {rememberMe && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <Text style={styles.rememberText}>{t.remember}</Text>
        </View>

        {/* LOGIN BUTTON */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>{t.login}</Text>
        </TouchableOpacity>

        {/* LANGUAGE SWITCH */}
        <View style={styles.languageContainer}>
          <Text>{t.language}: </Text>

          <TouchableOpacity onPress={() => setLanguage('EN')}>
            <Text style={[
              styles.lang,
              language === 'EN' && styles.activeLang
            ]}>EN</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setLanguage('SI')}>
            <Text style={[
              styles.lang,
              language === 'SI' && styles.activeLang
            ]}>සි</Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer}>{t.footer}</Text>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 10,
  },

  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  subTitle: {
    fontSize: 12,
    color: 'gray',
    marginBottom: 15,
  },

  card: {
    width: '85%',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#fff',
  },

  label: {
    fontSize: 13,
    marginBottom: 5,
    marginTop: 5,
    color: '#333',
  },

  input: {
    backgroundColor: '#e5e7eb',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 10,
    paddingRight: 10,
  },

  passwordInput: {
    flex: 1,
    padding: 10,
  },

  eyeIcon: {
    padding: 4,
  },

  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#555',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkedBox: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },

  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  rememberText: {
    fontSize: 12,
    color: '#555',
  },

  button: {
    backgroundColor: '#1e3a8a',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    alignItems: 'center',
    gap: 10,
  },

  lang: {
    marginHorizontal: 5,
  },

  activeLang: {
    fontWeight: 'bold',
    color: '#1e3a8a',
  },

  footer: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 15,
    color: 'gray',
  }

});