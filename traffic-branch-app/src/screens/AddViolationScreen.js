import React, { useState, useContext } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Picker } from "@react-native-picker/picker";

import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

import axios from "axios";

import { LanguageContext } from "../context/LanguageContext"; 
import { BASE_URL } from "../config";


export default function AddViolationScreen({ navigation }) {

  const { language } = useContext(LanguageContext);

 

  
    // ================================
// STEP NAVIGATION
// ================================

const [step, setStep] = useState(1);

// ================================
// VIOLATION DETAILS
// ================================

const [violationType, setViolationType] = useState("");
const [fineAmount, setFineAmount] = useState("");

const [lawSection, setLawSection] = useState("");

const [actionTaken, setActionTaken] = useState("");

const [location, setLocation] = useState("");

const [dateTime, setDateTime] = useState("");

// ================================
// DRIVER DETAILS
// ================================

const [driverName, setDriverName] = useState("");

const [driverAddress, setDriverAddress] = useState("");

const [driverNIC, setDriverNIC] = useState("");

const [drivingLicence, setDrivingLicence] = useState("");

// ================================
// VEHICLE DETAILS
// ================================

const [vehicleNumber, setVehicleNumber] = useState("");

const [vehicleType, setVehicleType] = useState("");

const [assistantOfficer, setAssistantOfficer] = useState("");

// ================================
// DESCRIPTION
// ================================

const [description, setDescription] = useState("");

// ================================
// EVIDENCE
// ================================

const [image, setImage] = useState(null);

const [attachment, setAttachment] = useState(null);

const [voiceNote, setVoiceNote] = useState(null);

const [recording, setRecording] = useState(null);

const [isRecording, setIsRecording] = useState(false);

const [recordingDuration, setRecordingDuration] = useState(0);



// ================================
// STEP FUNCTIONS
// ================================

const nextStep = () => {

  if (step < 4) {

    setStep(step + 1);

  }

};

const previousStep = () => {

  if (step > 1) {

    setStep(step - 1);

  }

};

const pickDocument = async () => {

  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
  });

  if (result.canceled) return;

  setAttachment(result.assets[0]);

  Alert.alert(
    "Attachment Added",
    result.assets[0].name
  );

};

const recordVoice = async () => {

  try {

    if (!isRecording) {

      const permission =
        await Audio.requestPermissionsAsync();

      if (!permission.granted) {

        Alert.alert(
          "Permission required",
          "Please allow microphone access."
        );

        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } =
        await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

      setRecording(recording);
      setIsRecording(true);

    } else {

      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();

      setVoiceNote(uri);

      setRecording(null);

      setIsRecording(false);

      Alert.alert(
        "Voice Note Saved",
        "Recording attached successfully."
      );

    }

  } catch (error) {

    console.log(error);

    Alert.alert(
      "Error",
      "Unable to record audio."
    );

  }

};


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
  !driverName ||
  !driverNIC ||
  !vehicleNumber ||
  !vehicleType ||
  !location ||
  !dateTime
)

{
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
            driver: driverName,
            driverNIC,
            vehicle: vehicleNumber,
            vehicleType,
            violationDate: dateTime,
            remarks: description,
            assistantOfficer,
            lawSection,
            actionTaken,
            driverAddress,
            drivingLicence,
            attachment,
            voiceNote,
            evidencePhoto: image,
            status: "Pending",
            violationType,
            location,
            fineAmount,
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

    
   
    <SafeAreaView style={styles.container}>

<ScrollView
showsVerticalScrollIndicator={false}
contentContainerStyle={styles.scroll}
>

{/* HEADER */}

<View style={styles.header}>

<TouchableOpacity
onPress={() => navigation.goBack()}
>

<Ionicons
name="arrow-back"
size={24}
color="#1e3a8a"
/>

</TouchableOpacity>

<Text style={styles.headerTitle}>

Add Violation

</Text>

<View style={{ width: 24 }} />

</View>

{/* PROGRESS */}

<View style={styles.progressContainer}>

{[1,2,3,4].map((item)=>(

<React.Fragment key={item}>

<View
style={[
styles.circle,
step>=item && styles.activeCircle
]}
>

<Text
style={[
styles.circleText,
step>=item && styles.activeCircleText
]}
>

{item}

</Text>

</View>

{item!==4 && (

<View
style={[
styles.line,
step>item && styles.activeLine
]}
/>

)}

</React.Fragment>

))}

</View>

{/* STEP TITLE */}

<Text style={styles.pageTitle}>

{step===1 && "Violation Details"}

{step===2 && "Driver Details"}

{step===3 && "Vehicle Details"}

{step===4 && "Evidence"}

</Text>

{step===1 && (

<View style={styles.card}>

<Text style={styles.label}>
Date & Time
</Text>

<TextInput
style={styles.input}
placeholder="Select Date & Time"
value={dateTime}
onChangeText={setDateTime}
/>

<Text style={styles.label}>
Name of Offence
</Text>

<View style={styles.pickerBox}>

<Picker
selectedValue={violationType}
onValueChange={setViolationType}
>

<Picker.Item
label="Select Offence"
value=""
/>

<Picker.Item
label="Speeding"
value="Speeding"
/>

<Picker.Item
label="No Helmet"
value="No Helmet"
/>

<Picker.Item
label="Seat Belt"
value="Seat Belt"
/>

<Picker.Item
label="Dangerous Driving"
value="Dangerous Driving"
/>

</Picker>

</View>

<Text style={styles.label}>
Law Section
</Text>

<TextInput
  style={styles.input}
  placeholder="Enter Law Section"
  value={lawSection}
  onChangeText={setLawSection}
/>

<Text style={styles.label}>
Place of Offence
</Text>

<TextInput
  style={styles.input}
  placeholder="Enter Location"
  value={location}
  onChangeText={setLocation}
/>

<Text style={styles.label}>
Action Taken
</Text>

<View style={styles.pickerBox}>

<Picker
selectedValue={actionTaken}
onValueChange={setActionTaken}
>

<Picker.Item
label="Select Action"
value=""
/>

<Picker.Item
label="Warning"
value="Warning"
/>

<Picker.Item
label="Fine"
value="Fine"
/>

<Picker.Item
label="Court"
value="Court"
/>

</Picker>

</View>

<TouchableOpacity

style={styles.nextButton}

onPress={nextStep}

>

<Text style={styles.buttonText}>

Continue →

</Text>

</TouchableOpacity>


</View>

)}

{step === 2 && (

<View style={styles.card}>

<Text style={styles.label}>
Driver Full Name
</Text>

<TextInput
style={styles.input}
placeholder="Enter Driver Name"
value={driverName}
onChangeText={setDriverName}
/>

<Text style={styles.label}>
Driver Address
</Text>

<TextInput
style={styles.input}
placeholder="Enter Driver Address"
value={driverAddress}
onChangeText={setDriverAddress}
multiline
/>

<Text style={styles.label}>
Driving Licence No.
</Text>

<TextInput
style={styles.input}
placeholder="Enter Driving Licence No."
value={drivingLicence}
onChangeText={setDrivingLicence}
/>

<Text style={styles.label}>
Driver NIC
</Text>

<TextInput
style={styles.input}
placeholder="Enter Driver NIC"
value={driverNIC}
onChangeText={setDriverNIC}
/>

<View
style={{
flexDirection: "row",
justifyContent: "space-between",
marginTop: 20,
}}
>

<TouchableOpacity
style={[styles.nextButton,{backgroundColor:"#6b7280",flex:0.47}]}
onPress={previousStep}
>

<Text style={styles.buttonText}>
← Previous
</Text>

</TouchableOpacity>

<TouchableOpacity
style={[styles.nextButton,{flex:0.47}]}
onPress={nextStep}
>

<Text style={styles.buttonText}>
Continue →
</Text>

</TouchableOpacity>

</View>

</View>

)}

{step === 3 && (

<View style={styles.card}>

<Text style={styles.label}>
Vehicle Number
</Text>

<TextInput
style={styles.input}
placeholder="Enter Vehicle Number"
value={vehicleNumber}
onChangeText={setVehicleNumber}
/>

<Text style={styles.label}>
Vehicle Type
</Text>

<View style={styles.pickerBox}>

<Picker
selectedValue={vehicleType}
onValueChange={setVehicleType}
>

<Picker.Item label="Select Vehicle Type" value="" />
<Picker.Item label="Car" value="Car" />
<Picker.Item label="Motorcycle" value="Motorcycle" />
<Picker.Item label="Bus" value="Bus" />
<Picker.Item label="Van" value="Van" />
<Picker.Item label="Lorry" value="Lorry" />

</Picker>

</View>

<Text style={styles.label}>
Assistant Officer
</Text>

<TextInput
style={styles.input}
placeholder="Enter Assistant Officer"
value={assistantOfficer}
onChangeText={setAssistantOfficer}
/>

<View
style={{
flexDirection:"row",
justifyContent:"space-between",
marginTop:20,
}}
>

<TouchableOpacity
style={[styles.nextButton,{backgroundColor:"#6b7280",flex:0.47}]}
onPress={previousStep}
>

<Text style={styles.buttonText}>
← Previous
</Text>

</TouchableOpacity>

<TouchableOpacity
style={[styles.nextButton,{flex:0.47}]}
onPress={nextStep}
>

<Text style={styles.buttonText}>
Continue →
</Text>

</TouchableOpacity>

</View>

</View>

)}

{step === 4 && (

<View style={styles.card}>

<Text style={styles.label}>
Description
</Text>

<TextInput
style={[styles.input,{height:120}]}
placeholder="Enter Description"
value={description}
onChangeText={setDescription}
multiline
/>

<Text style={styles.label}>
Upload Evidence
</Text>

<View style={{ flexDirection: "row", justifyContent: "space-between" }}>

<TouchableOpacity
style={[styles.uploadButton,{width:"48%"}]}
onPress={openCamera}
>

<Ionicons
name="camera"
size={30}
color="#1e3a8a"
/>

<Text style={styles.uploadText}>
Camera
</Text>

</TouchableOpacity>

<TouchableOpacity
style={[styles.uploadButton,{width:"48%"}]}
onPress={pickImage}
>

<Ionicons
name="images"
size={30}
color="#1e3a8a"
/>

<Text style={styles.uploadText}>
Gallery
</Text>

</TouchableOpacity>

</View>

<TouchableOpacity
style={[styles.uploadButton,{marginTop:15}]}
onPress={pickDocument}
>

<Ionicons
name="attach"
size={30}
color="#1e3a8a"
/>

<Text style={styles.uploadText}>
Attach File
</Text>

</TouchableOpacity>

{image && (

<Image
source={{ uri: image }}
style={styles.preview}
/>

)}

{attachment && (

<View
style={{
marginTop:15,
padding:12,
backgroundColor:"#eef2ff",
borderRadius:10,
}}
>

<Text
style={{
color:"#1e3a8a",
fontWeight:"600",
}}
>

📎 {attachment.name}

</Text>

</View>

)}

<View style={{marginTop:15}}>

<TouchableOpacity
style={[
styles.voiceButton,
isRecording && {
backgroundColor:"#dc2626"
}
]}

onPress={recordVoice}
>

<Ionicons
name={isRecording ? "stop-circle" : "mic"}
size={28}
color="white"
/>

<Text style={styles.voiceText}>

{isRecording
? "Stop Recording"
: "Record Voice Note"}

</Text>

</TouchableOpacity>

</View>
{voiceNote && (

<View
style={{
marginTop:15,
padding:12,
backgroundColor:"#eef2ff",
borderRadius:10,
}}
>

<Text
style={{
fontWeight:"600",
color:"#1e3a8a",
}}
>

🎤 Voice note attached

</Text>

</View>

)}2

<View
style={{
flexDirection:"row",
justifyContent:"space-between",
marginTop:30,
}}
>

<TouchableOpacity
style={[styles.nextButton,{backgroundColor:"#6b7280",flex:0.47}]}
onPress={previousStep}
>

<Text style={styles.buttonText}>
← Previous
</Text>

</TouchableOpacity>

<TouchableOpacity
style={[styles.nextButton,{flex:0.47}]}
onPress={handleSubmit}
>

<Text style={styles.buttonText}>
Submit
</Text>

</TouchableOpacity>

</View>

</View>

)}

</ScrollView>

</SafeAreaView>

);

} 

const styles = StyleSheet.create({

  container: {
  flex: 1,
  backgroundColor: "#f3f4f6",
},

scroll: {
  padding: 20,
  paddingBottom: 40,
},

header: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 25,
},

headerTitle: {
  fontSize: 22,
  fontWeight: "bold",
  color: "#1e3a8a",
},

pageTitle: {
  fontSize: 20,
  fontWeight: "700",
  textAlign: "center",
  color: "#1e3a8a",
  marginBottom: 20,
},

progressContainer: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 25,
},

circle: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: "#d1d5db",
  justifyContent: "center",
  alignItems: "center",
},

activeCircle: {
  backgroundColor: "#1e3a8a",
},

circleText: {
  color: "#555",
  fontWeight: "bold",
},

activeCircleText: {
  color: "#fff",
},

line: {
  width: 40,
  height: 3,
  backgroundColor: "#d1d5db",
},

activeLine: {
  backgroundColor: "#1e3a8a",
},

card: {
  backgroundColor: "#fff",
  borderRadius: 15,
  padding: 20,
  elevation: 3,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  marginBottom: 20,
},

label: {
  fontSize: 14,
  fontWeight: "600",
  color: "#374151",
  marginBottom: 6,
  marginTop: 12,
},

input: {
  backgroundColor: "#f9fafb",
  borderWidth: 1,
  borderColor: "#d1d5db",
  borderRadius: 10,
  paddingHorizontal: 15,
  paddingVertical: 12,
  fontSize: 15,
  marginBottom: 15,
},

pickerBox: {
  borderWidth: 1,
  borderColor: "#d1d5db",
  borderRadius: 10,
  backgroundColor: "#f9fafb",
  marginBottom: 15,
  overflow: "hidden",
},

nextButton: {
  backgroundColor: "#1e3a8a",
  paddingVertical: 15,
  borderRadius: 10,
  justifyContent: "center",
  alignItems: "center",
  marginTop: 15,
},

buttonText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "bold",
},

uploadBtn: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#e0e7ff",
  borderWidth: 1,
  borderColor: "#1e3a8a",
  borderRadius: 10,
  padding: 14,
  marginTop: 12,
},



preview: {
  width: "100%",
  height: 220,
  borderRadius: 12,
  marginTop: 15,
  resizeMode: "cover",
},



attachmentButton: {
  backgroundColor: "#16a34a",
  borderRadius: 10,
  paddingVertical: 15,
  justifyContent: "center",
  alignItems: "center",
  marginTop: 15,
},

attachmentText: {
  color: "#fff",
  fontWeight: "bold",
},

imageButtons: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 10,
},

smallButton: {
  width: "48%",
  backgroundColor: "#1e3a8a",
  borderRadius: 10,
  paddingVertical: 14,
  justifyContent: "center",
  alignItems: "center",
},

smallButtonText: {
  color: "#fff",
  fontWeight: "bold",
},

uploadButton:{
height:100,
borderWidth:1,
borderColor:"#d1d5db",
borderRadius:12,
justifyContent:"center",
alignItems:"center",
backgroundColor:"#fff",
padding:10,
},

uploadText:{
marginTop:10,
fontWeight:"600",
color:"#1e3a8a",
},

voiceButton:{
marginTop:10,
backgroundColor:"#1e3a8a",
padding:15,
borderRadius:12,
flexDirection:"row",
justifyContent:"center",
alignItems:"center",
},

voiceText:{
color:"#fff",
fontWeight:"bold",
marginLeft:10,
},


});
