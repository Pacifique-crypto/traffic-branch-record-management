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

import * as ImagePicker from "expo-image-picker";

import * as DocumentPicker from "expo-document-picker";

import { Audio } from "expo-av";

import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as FileSystem from "expo-file-system/legacy";
import { LanguageContext } from "../context/LanguageContext";
import { BASE_URL } from "../config";

const convertToBase64 = async (uri, mimeType) => {
  if (!uri) return "";
  try {
    const decodedUri = decodeURIComponent(uri);
    const base64Data = await FileSystem.readAsStringAsync(decodedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:${mimeType};base64,${base64Data}`;
  } catch (err) {
    console.log("Error converting file to Base64:", err);
    Alert.alert("Upload Error", `Failed to read file: ${err.message}`);
    return "";
  }
};

export default function AddAccidentScreen({ navigation }) {

  const { language } = useContext(LanguageContext);

  // ============================
  // STEP NAVIGATION
  // ============================

  const [step, setStep] = useState(1);

  // ============================
  // STEP 1
  // ============================

  const [dateTime, setDateTime] = useState("");

  const [station, setStation] = useState("");

  const [location, setLocation] = useState("");

  const [assistantOfficer, setAssistantOfficer] = useState("");
  const [severity, setSeverity] = useState("MINOR");

  // ============================
  // STEP 2
  // ============================

  const [vehicleNumber, setVehicleNumber] = useState("");

  const [vehicleClass, setVehicleClass] = useState("");

  const [vehicleAge, setVehicleAge] = useState("");

  const [driverName, setDriverName] = useState("");

  const [driverAddress, setDriverAddress] = useState("");

  const [driverAge, setDriverAge] = useState("");

  const [drivingLicence, setDrivingLicence] = useState("");

  // ============================
  // STEP 3
  // ============================

  const [victimName, setVictimName] = useState("");

  const [victimAddress, setVictimAddress] = useState("");

  const [victimAge, setVictimAge] = useState("");

  const [gender, setGender] = useState("");

  // ============================
  // STEP 4
  // ============================

  const [description, setDescription] = useState("");

  const [images, setImages] = useState([]);

  const [attachment, setAttachment] = useState(null);

  const [voiceNote, setVoiceNote] = useState(null);

  const [recording, setRecording] = useState(null);

  // ============================
  // STEP FUNCTIONS
  // ============================

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

    // ============================
  // CAMERA
  // ============================

  const openCamera = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "You can upload up to 5 images.");
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission required");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });
    if (!result.canceled) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "You can upload up to 5 images.");
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
    });
    if (!result.canceled) {
      const selectedUris = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...selectedUris].slice(0, 5));
    }
  };

    // ============================
  // DOCUMENT PICKER
  // ============================

  const pickDocument = async () => {

    const result =
      await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

    if (!result.canceled) {
      setAttachment(result.assets[0]);
    }

  };

    // ============================
  // START RECORDING
  // ============================

  const startRecording = async () => {

    try {

      await Audio.requestPermissionsAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } =
        await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

      setRecording(recording);

    } catch (err) {

      console.log(err);

    }

  };

  // ============================
  // STOP RECORDING
  // ============================

  const stopRecording = async () => {

    try {

      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();

      setVoiceNote(uri);

      setRecording(null);

      Alert.alert("Voice note saved");

    } catch (err) {

      console.log(err);

    }

  };

    // ============================
  // SUBMIT
  // ============================

  const handleSubmit = async () => {

   // Required field validation
   if (
     !dateTime ||
     !station ||
     !location ||
     !assistantOfficer ||
     !vehicleNumber ||
     !vehicleClass ||
     !vehicleAge ||
     !driverName ||
     !driverAddress ||
     !driverAge ||
     !drivingLicence ||
     !victimName ||
     !victimAddress ||
     !victimAge ||
     !gender ||
     !description
   ) {

     Alert.alert(
       "Missing Information",
       "Please complete all required fields."
     );

     return;
   }

   try {
     const base64Images = await Promise.all(
       images.map(img => convertToBase64(img, "image/jpeg"))
     );
     const base64Voice = voiceNote ? await convertToBase64(voiceNote, "audio/m4a") : "";
     const base64Attachment = attachment ? await convertToBase64(attachment.uri, attachment.mimeType || "application/octet-stream") : "";

     const response = await fetch(
       `${BASE_URL}/accidents`,
       {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },

         body: JSON.stringify({

           dateTime,
           station,
           location,
           assistantOfficer,

           vehicleNumber,
           vehicleClass,
           vehicleAge,

           driverName,
           driverAddress,
           driverAge,
           drivingLicence,

           victimName,
           victimAddress,
           victimAge,
           gender,

           description,

           evidencePhoto: base64Images,
           attachment: base64Attachment,
           voiceNote: base64Voice,

           status: "Pending",
           severity,
           submittingOfficer: global.loggedOfficerName || "",

         }),
       }
     );

     const data = await response.json();

     if (response.ok) {

       Alert.alert(
         "Success",
         "Accident submitted successfully."
       );

       navigation.goBack();

     } else {

       Alert.alert(
         "Error",
         data.error || "Submission failed"
       );

     }

   } catch (error) {

     console.log(error);

     Alert.alert(
       "Server Error",
       "Unable to connect to server."
     );

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
Add Accident
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

<Text style={styles.pageTitle}>

{step===1 && "Accident Details"}

{step===2 && "Vehicle & Driver"}

{step===3 && "Victim Details"}

{step===4 && "Evidence"}

</Text>

{step===1 && (

<View style={styles.card}>

<Text style={styles.label}>
Date & Time
</Text>

<TextInput
style={styles.input}
placeholder="Enter Date & Time"
value={dateTime}
onChangeText={setDateTime}
/>

<Text style={styles.label}>
Police Station
</Text>

<TextInput
style={styles.input}
placeholder="Enter Police Station"
value={station}
onChangeText={setStation}
/>

<Text style={styles.label}>
Accident Location
</Text>

<TextInput
style={styles.input}
placeholder="Enter Location"
value={location}
onChangeText={setLocation}
/>

<Text style={styles.label}>
Accident Severity
</Text>

<View style={styles.pickerBox}>

<Picker
selectedValue={severity}
onValueChange={setSeverity}
>

<Picker.Item
label="Minor"
value="MINOR"
/>

<Picker.Item
label="Serious"
value="SERIOUS"
/>

<Picker.Item
label="Fatal"
value="FATAL"
/>

<Picker.Item
label="Property Damage Only"
value="PROPERTY"
/>

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

{step===2 && (

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
Vehicle Class
</Text>

<TextInput
style={styles.input}
placeholder="Car / Bus / Motorcycle"
value={vehicleClass}
onChangeText={setVehicleClass}
/>

<Text style={styles.label}>
Vehicle Age
</Text>

<TextInput
style={styles.input}
placeholder="Enter Vehicle Age"
value={vehicleAge}
onChangeText={setVehicleAge}
/>

<Text style={styles.label}>
Driver Name
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
/>

<Text style={styles.label}>
Driver Age
</Text>

<TextInput
style={styles.input}
placeholder="Enter Driver Age"
value={driverAge}
onChangeText={setDriverAge}
/>

<Text style={styles.label}>
Driving Licence No.
</Text>

<TextInput
style={styles.input}
placeholder="Enter Driving Licence Number"
value={drivingLicence}
onChangeText={setDrivingLicence}
/>

<View
style={{
flexDirection:"row",
justifyContent:"space-between",
marginTop:20,
}}
>

<TouchableOpacity
style={[
styles.nextButton,
{
backgroundColor:"#6b7280",
flex:0.47,
}
]}
onPress={previousStep}
>

<Text style={styles.buttonText}>
← Previous
</Text>

</TouchableOpacity>

<TouchableOpacity
style={[
styles.nextButton,
{
flex:0.47,
}
]}
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
Assistant Officer
</Text>

<TextInput
style={styles.input}
placeholder="Enter Assistant Officer"
value={assistantOfficer}
onChangeText={setAssistantOfficer}
/>

<Text style={styles.label}>
Killed / Injured Name
</Text>

<TextInput
style={styles.input}
placeholder="Enter Name"
value={victimName}
onChangeText={setVictimName}
/>

<Text style={styles.label}>
Address
</Text>

<TextInput
style={styles.input}
placeholder="Enter Address"
value={victimAddress}
onChangeText={setVictimAddress}
multiline
/>

<Text style={styles.label}>
Age
</Text>

<TextInput
style={styles.input}
placeholder="Enter Age"
value={victimAge}
onChangeText={setVictimAge}
keyboardType="numeric"
/>

<Text style={styles.label}>
Gender
</Text>

<View style={styles.pickerBox}>

<Picker
selectedValue={gender}
onValueChange={setGender}
>

<Picker.Item
label="Select Gender"
value=""
/>

<Picker.Item
label="Male"
value="Male"
/>

<Picker.Item
label="Female"
value="Female"
/>

<Picker.Item
label="Other"
value="Other"
/>

</Picker>

</View>

<View
style={{
flexDirection:"row",
justifyContent:"space-between",
marginTop:20,
}}
>

<TouchableOpacity
style={[
styles.nextButton,
{
backgroundColor:"#6b7280",
flex:0.47,
}
]}
onPress={previousStep}
>

<Text style={styles.buttonText}>
← Previous
</Text>

</TouchableOpacity>

<TouchableOpacity
style={[
styles.nextButton,
{
flex:0.47,
}
]}
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
placeholder="Enter Accident Description"
value={description}
onChangeText={setDescription}
multiline
/>

<Text style={styles.label}>
Upload Evidence
</Text>

{/* Camera & Gallery */}

<View
style={{
flexDirection:"row",
justifyContent:"space-between",
marginBottom:15,
}}
>

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

{/* Attach File */}

<TouchableOpacity
style={[styles.uploadButton,{marginBottom:15}]}
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

{/* Image Preview */}

{images.length > 0 && (
  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 15, marginBottom: 15 }}>
    {images.map((imgUri, index) => (
      <View key={index} style={{ position: "relative", marginRight: 8, marginBottom: 8 }}>
        <Image source={{ uri: imgUri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
        <TouchableOpacity
          onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}
          style={{
            position: "absolute",
            top: -5,
            right: -5,
            backgroundColor: "#dc2626",
            borderRadius: 10,
            width: 20,
            height: 20,
            justifyContent: "center",
            alignItems: "center",
            elevation: 2,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.41,
          }}
        >
          <Ionicons name="close" size={14} color="white" />
        </TouchableOpacity>
      </View>
    ))}
  </View>
)}

{/* Attachment Preview */}

{attachment && (

<View
style={{
backgroundColor:"#eef2ff",
padding:12,
borderRadius:10,
marginTop:15,
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

{/* Voice Recording */}

<View style={{marginTop:15}}>

<TouchableOpacity
style={[
styles.voiceButton,
recording && {
backgroundColor:"#dc2626"
}
]}
onPress={
recording
? stopRecording
: startRecording
}
>

<Ionicons
name={
recording
? "stop-circle"
: "mic"
}
size={28}
color="white"
/>

<Text style={styles.voiceText}>

{recording
? "Stop Recording"
: "Record Voice Note"}

</Text>

</TouchableOpacity>

</View>

{/* Voice Preview */}

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

)}

<View
style={{
flexDirection:"row",
justifyContent:"space-between",
marginTop:30,
}}
>

<TouchableOpacity
style={[
styles.nextButton,
{
backgroundColor:"#6b7280",
flex:0.47,
}
]}
onPress={previousStep}
>

<Text style={styles.buttonText}>
← Previous
</Text>

</TouchableOpacity>

<TouchableOpacity
style={[
styles.nextButton,
{
flex:0.47,
}
]}
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

container:{
flex:1,
backgroundColor:"#f3f4f6",
},

scroll:{
padding:20,
paddingBottom:40,
},

header:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
marginBottom:25,
},

headerTitle:{
fontSize:22,
fontWeight:"bold",
color:"#1e3a8a",
},

pageTitle:{
fontSize:20,
fontWeight:"700",
textAlign:"center",
color:"#1e3a8a",
marginBottom:20,
},

progressContainer:{
flexDirection:"row",
justifyContent:"center",
alignItems:"center",
marginBottom:25,
},

circle:{
width:36,
height:36,
borderRadius:18,
backgroundColor:"#d1d5db",
justifyContent:"center",
alignItems:"center",
},

activeCircle:{
backgroundColor:"#1e3a8a",
},

circleText:{
color:"#555",
fontWeight:"bold",
},

activeCircleText:{
color:"#fff",
},

line:{
width:40,
height:3,
backgroundColor:"#d1d5db",
},

activeLine:{
backgroundColor:"#1e3a8a",
},

card:{
backgroundColor:"#fff",
borderRadius:15,
padding:20,
elevation:3,
shadowColor:"#000",
shadowOpacity:0.08,
shadowRadius:6,
marginBottom:20,
},

label:{
fontSize:14,
fontWeight:"600",
color:"#374151",
marginBottom:6,
marginTop:12,
},

input:{
backgroundColor:"#f9fafb",
borderWidth:1,
borderColor:"#d1d5db",
borderRadius:10,
paddingHorizontal:15,
paddingVertical:12,
fontSize:15,
marginBottom:15,
},

pickerBox:{
borderWidth:1,
borderColor:"#d1d5db",
borderRadius:10,
backgroundColor:"#f9fafb",
marginBottom:15,
overflow:"hidden",
},

nextButton:{
backgroundColor:"#1e3a8a",
paddingVertical:15,
borderRadius:10,
justifyContent:"center",
alignItems:"center",
marginTop:15,
},

buttonText:{
color:"#fff",
fontSize:16,
fontWeight:"bold",
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

preview:{
width:"100%",
height:220,
borderRadius:12,
marginTop:15,
resizeMode:"cover",
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

