import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { LanguageContext } from '../context/LanguageContext';
import { BASE_URL } from '../config';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function AddAccidentScreen() {
  const { language } = useContext(LanguageContext);

  const [image, setImage] = useState(null);

  const [severity, setSeverity] = useState("");
  const [driver, setDriver] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [vehicle, setVehicle] = useState("");

  const translations = {
    EN: {
      title: "Add Accident",
      severity: "Severity Type",
      driver: "Driver Details",
      location: "Location",
      date: "Date & Time",
      vehicle: "Vehicle Details",
      upload: "Upload Evidence",
      submit: "Submit",
    },
    SI: {
      title: "අනතුර එක් කරන්න",
      severity: "බරපතලත්වය",
      driver: "රියදුරු විස්තර",
      location: "ස්ථානය",
      date: "දිනය හා වේලාව",
      vehicle: "වාහන විස්තර",
      upload: "සාක්ෂි උඩුගත කරන්න",
      submit: "යවන්න",
    },
  };

  const t = translations[language];

  // Gallery
  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Camera
  const openCamera = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Camera permission required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Submit Accident
  const handleSubmit = async () => {
    if (
      !severity ||
      !driver ||
      !location ||
      !date ||
      !vehicle
    ) {
      Alert.alert("Please fill all fields");
      return;
    }

    try {
    
  console.log("Submitting Accident:");
  console.log({
    severity,
    driver,
    location,
    accidentDate: date,
    vehicle,
    evidencePhoto: image,
  });

  const response = await fetch(`${BASE_URL}/accidents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      body: JSON.stringify({
  severity,
  driver,
  location,
  accidentDate: date,
  vehicle,
  evidencePhoto: image,
}),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Accident submitted successfully");

        setSeverity("");
        setDriver("");
        setLocation("");
        setDate("");
        setVehicle("");
        setImage(null);
      } else {
        Alert.alert("Error", data.error || "Failed to submit");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Server error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t.title}</Text>

      <TextInput
        placeholder={t.severity}
        style={styles.input}
        value={severity}
        onChangeText={setSeverity}
      />

      <TextInput
        placeholder={t.driver}
        style={styles.input}
        value={driver}
        onChangeText={setDriver}
      />

      <TextInput
        placeholder={t.location}
        style={styles.input}
        value={location}
        onChangeText={setLocation}
      />

      <TextInput
        placeholder={t.date}
        style={styles.input}
        value={date}
        onChangeText={setDate}
      />

      <TextInput
        placeholder={t.vehicle}
        style={styles.input}
        value={vehicle}
        onChangeText={setVehicle}
      />

      <View style={styles.uploadRow}>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={pickImage}
        >
          <Text>{t.upload}</Text>
        </TouchableOpacity>

        <Ionicons
          name="camera"
          size={28}
          style={{ marginLeft: 15 }}
          onPress={openCamera}
        />
      </View>

      {image && (
        <Image
          source={{ uri: image }}
          style={styles.preview}
        />
      )}

      <TouchableOpacity
        style={styles.btn}
        onPress={handleSubmit}
      >
        <Text
          style={{
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          {t.submit}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f6fa",
  },

  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
  },

  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  uploadBtn: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    borderColor: "#1e3a8a",
  },

  preview: {
    width: "100%",
    height: 150,
    marginTop: 15,
    borderRadius: 10,
  },

  btn: {
    backgroundColor: "#1e3a8a",
    padding: 15,
    alignItems: "center",
    borderRadius: 10,
    marginTop: 25,
  },
});