import React, { useState, useContext } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { LanguageContext } from "../context/LanguageContext";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

export default function AddViolationScreen() {

  const { language } = useContext(LanguageContext);

  const BASE_URL =
    "https://traffic-branch-backend.onrender.com/api";

  const [image, setImage] = useState(null);

  const [violationType, setViolationType] = useState("");
  const [driver, setDriver] = useState("");
  const [driverNIC, setDriverNIC] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [location, setLocation] = useState("");
  const [violationDate, setViolationDate] = useState("");
  const [fineAmount, setFineAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  const translations = {
    EN: {
      title: "Add Violation",
      violation: "Violation Type",
      driver: "Driver Name",
      nic: "Driver NIC",
      vehicle: "Vehicle Number",
      vehicleType: "Vehicle Type",
      location: "Location",
      date: "Date & Time",
      fine: "Fine Amount",
      remarks: "Remarks",
      upload: "Upload Evidence",
      submit: "Submit",
    },

    SI: {
      title: "වරදි එක් කරන්න",
      violation: "වරද",
      driver: "රියදුරුගේ නම",
      nic: "ජාතික හැඳුනුම්පත",
      vehicle: "වාහන අංකය",
      vehicleType: "වාහන වර්ගය",
      location: "ස්ථානය",
      date: "දිනය හා වේලාව",
      fine: "දඩ මුදල",
      remarks: "සටහන්",
      upload: "සාක්ෂි උඩුගත කරන්න",
      submit: "යවන්න",
    },
  };

  const t = translations[language];

  const violationOptions = [
    "Speeding",
    "No Helmet",
    "Seat Belt Violation",
    "Signal Violation",
    "Using Mobile Phone",
    "Dangerous Driving",
    "No Driving License",
    "Parking Offence",
    "Drunk Driving",
    "Other",
  ];

  const vehicleOptions = [
    "Motorcycle",
    "Three Wheeler",
    "Car",
    "Van",
    "Bus",
    "Lorry",
    "Other",
  ];

  const calculateFine = (value) => {

    setViolationType(value);

    switch (value) {

      case "Speeding":
        setFineAmount("3000");
        break;

      case "No Helmet":
        setFineAmount("2000");
        break;

      case "Seat Belt Violation":
        setFineAmount("2500");
        break;

      case "Signal Violation":
        setFineAmount("5000");
        break;

      case "Using Mobile Phone":
        setFineAmount("3000");
        break;

      case "Dangerous Driving":
        setFineAmount("25000");
        break;

      case "No Driving License":
        setFineAmount("5000");
        break;

      case "Parking Offence":
        setFineAmount("1500");
        break;

      case "Drunk Driving":
        setFineAmount("25000");
        break;

      default:
        setFineAmount("");
    }

  };

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

  const handleSubmit = async () => {

    if (
      !violationType ||
      !driver ||
      !driverNIC ||
      !vehicle ||
      !vehicleType ||
      !location ||
      !violationDate
    ) {
      Alert.alert("Please fill all fields");
      return;
    }

    try {

      const response = await fetch(
        `${BASE_URL}/violations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            violationType,
            driver,
            driverNIC,
            vehicle,
            vehicleType,
            location,
            violationDate,
            fineAmount,
            remarks,
            evidencePhoto: image,
            status: "Pending",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {

        Alert.alert(
          "Success",
          "Violation submitted successfully"
        );

      } else {

        Alert.alert(
          "Error",
          data.error || "Submission failed"
        );

      }

    } catch (err) {

      console.log(err);
      Alert.alert("Server Error");

    }

  };
  return (
  <ScrollView
  style={styles.container}
  contentContainerStyle={{ paddingBottom: 40 }}
  showsVerticalScrollIndicator={false}
>

    <Text style={styles.header}>
      {t.title}
    </Text>

    {/* Violation Type */}

    <View style={styles.pickerBox}>
      <Picker
        selectedValue={violationType}
        onValueChange={calculateFine}
      >
        <Picker.Item
          label={t.violation}
          value=""
        />

        {violationOptions.map((item) => (
          <Picker.Item
            key={item}
            label={item}
            value={item}
          />
        ))}

      </Picker>
   </View>

    {/* Driver */}

    <TextInput
      placeholder={t.driver}
      style={styles.input}
      value={driver}
      onChangeText={setDriver}
    />

    {/* Driver NIC */}

    <TextInput
      placeholder={t.nic}
      style={styles.input}
      value={driverNIC}
      onChangeText={setDriverNIC}
    />

    {/* Vehicle */}

    <TextInput
      placeholder={t.vehicle}
      style={styles.input}
      value={vehicle}
      onChangeText={setVehicle}
    />

    {/* Vehicle Type */}

    <View style={styles.pickerBox}>

      <Picker
        selectedValue={vehicleType}
        onValueChange={setVehicleType}
      >

        <Picker.Item
          label={t.vehicleType}
          value=""
        />

        {vehicleOptions.map((item) => (

          <Picker.Item
            key={item}
            label={item}
            value={item}
          />

        ))}

      </Picker>

    </View>

    {/* Location */}

    <TextInput
      placeholder={t.location}
      style={styles.input}
      value={location}
      onChangeText={setLocation}
    />

    {/* Date */}

    <TextInput
      placeholder={t.date}
      style={styles.input}
      value={violationDate}
      onChangeText={setViolationDate}
    />

    {/* Fine */}

    <TextInput
      placeholder={t.fine}
      style={styles.input}
      value={fineAmount}
      editable={false}
    />

    {/* Remarks */}

    <TextInput
      placeholder={t.remarks}
      style={[
        styles.input,
        {
          height: 90,
          textAlignVertical: "top",
        },
      ]}
      multiline
      value={remarks}
      onChangeText={setRemarks}
    />

    {/* Upload */}

    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
      }}
    >

      <TouchableOpacity
        style={styles.uploadBtn}
        onPress={pickImage}
      >

        <Text>
          {t.upload}
        </Text>

      </TouchableOpacity>

      <Ionicons
        name="camera"
        size={30}
        style={{
          marginLeft: 15,
        }}
        onPress={openCamera}
      />

    </View>

    {/* Preview */}

    {image && (

      <Image
        source={{
          uri: image,
        }}
        style={styles.preview}
      />

    )}

    {/* Submit */}

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

</ScrollView>
);

} 

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f3f4f6",
  },

  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1e3a8a",
  },

  input: {
    backgroundColor: "#fff",
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },

  pickerBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    overflow: "hidden",
  },

  uploadBtn: {
    borderWidth: 1,
    borderColor: "#1e3a8a",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  preview: {
    width: "100%",
    height: 220,
    marginTop: 20,
    borderRadius: 12,
    resizeMode: "cover",
  },

  btn: {
    backgroundColor: "#1e3a8a",
    padding: 16,
    alignItems: "center",
    borderRadius: 10,
    marginTop: 25,
    marginBottom: 20,
 },

});
