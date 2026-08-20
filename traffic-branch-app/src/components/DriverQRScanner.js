import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

let CameraViewComponent = null;
let useCameraPermissionsHook = null;

try {
  const expoCamera = require('expo-camera');
  const mod = expoCamera.default || expoCamera;
  CameraViewComponent = mod.CameraView || mod.Camera || expoCamera.CameraView || expoCamera.Camera;
  useCameraPermissionsHook = mod.useCameraPermissions || expoCamera.useCameraPermissions;
} catch (e) {
  console.log('Safe expo-camera resolution fallback:', e ? e.message : 'Not available');
}

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.72;

export default function DriverQRScanner({ visible, onClose, onScanSuccess }) {
  let permission = null;
  let requestPermission = () => {};

  if (useCameraPermissionsHook) {
    try {
      const [perm, reqPerm] = useCameraPermissionsHook();
      permission = perm;
      requestPermission = reqPerm;
    } catch (e) {
      console.log('Permission hook notice:', e);
    }
  }

  const [scanned, setScanned] = useState(false);
  const [enableTorch, setEnableTorch] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setEnableTorch(false);
      if (requestPermission && (!permission || !permission.granted)) {
        requestPermission();
      }
    }
  }, [visible]);

  const parseQRData = (rawData) => {
    if (!rawData) return null;
    let trimmed = rawData.trim();

    let extracted = {
      licenseNo: '',
      name: '',
      nic: '',
      address: '',
      age: ''
    };

    // 1. Try parsing JSON format
    try {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        extracted.licenseNo = parsed.licenseNo || parsed.drivingLicence || parsed.licenceNo || parsed.license || parsed.dlNo || '';
        extracted.name = parsed.name || parsed.driverName || parsed.fullName || '';
        extracted.nic = parsed.nic || parsed.driverNIC || parsed.nicNo || parsed.nationalId || '';
        extracted.address = parsed.address || parsed.driverAddress || parsed.residence || '';
        extracted.age = parsed.age || parsed.driverAge || '';
        if (extracted.licenseNo || extracted.name || extracted.nic) {
          return extracted;
        }
      }
    } catch (e) {
      console.log('JSON QR parse fallback');
    }

    // 2. Multiline key-value text format (e.g. License: B1234567\nName: John Doe\nNIC: 901234567V\nAddress: Negombo)
    const lines = trimmed.split(/\r?\n/);
    lines.forEach(line => {
      const parts = line.split(/[:=]/);
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase();
        const val = parts.slice(1).join(':').trim();
        if (key.includes('license') || key.includes('licence') || key.includes('dl')) extracted.licenseNo = val;
        else if (key.includes('name')) extracted.name = val;
        else if (key.includes('nic') || key.includes('id')) extracted.nic = val;
        else if (key.includes('address')) extracted.address = val;
        else if (key.includes('age')) extracted.age = val;
      }
    });

    if (extracted.licenseNo || extracted.name || extracted.nic) {
      return extracted;
    }

    // 3. Pipe or Comma separated values (e.g. B9876543|K. L. Perera|912345678V|Negombo Main St)
    const delimiter = trimmed.includes('|') ? '|' : trimmed.includes(',') ? ',' : null;
    if (delimiter) {
      const tokens = trimmed.split(delimiter).map(t => t.trim());
      if (tokens.length >= 2) {
        extracted.licenseNo = tokens[0] || '';
        extracted.name = tokens[1] || '';
        if (tokens[2]) extracted.nic = tokens[2];
        if (tokens[3]) extracted.address = tokens[3];
        return extracted;
      }
    }

    // 4. Raw text string fallback (assume it's the license number or NIC)
    if (trimmed.length > 3) {
      if (/^[A-Za-z0-9]+$/.test(trimmed)) {
        extracted.licenseNo = trimmed;
      } else {
        extracted.name = trimmed;
      }
      return extracted;
    }

    return null;
  };

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);

    const parsed = parseQRData(data);
    if (parsed) {
      onScanSuccess(parsed);
      Alert.alert(
        'QR Code Scanned!',
        `Successfully extracted details:\n• License: ${parsed.licenseNo || 'N/A'}\n• Name: ${parsed.name || 'N/A'}\n• NIC: ${parsed.nic || 'N/A'}`,
        [{ text: 'OK', onPress: onClose }]
      );
    } else {
      Alert.alert('Invalid QR Code', 'Could not extract driver license details from this QR code.', [
        { text: 'Try Again', onPress: () => setScanned(false) }
      ]);
    }
  };

  const handleDemoScan = () => {
    setScanned(true);
    const demoData = {
      licenseNo: 'B' + Math.floor(1000000 + Math.random() * 9000000),
      name: 'W. A. Kamal Gunaratne',
      nic: '882345981V',
      address: 'No. 45, Main Street, Negombo',
      age: '36'
    };
    onScanSuccess(demoData);
    Alert.alert(
      'Demo License Scanned!',
      `Auto-filled sample driver details:\n• License: ${demoData.licenseNo}\n• Name: ${demoData.name}\n• NIC: ${demoData.nic}\n• Address: ${demoData.address}`,
      [{ text: 'OK', onPress: onClose }]
    );
  };

  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Scan Driver's License</Text>
            <Text style={styles.headerSubtitle}>Align QR code inside frame</Text>
          </View>
          <TouchableOpacity
            style={[styles.torchBtn, enableTorch && styles.torchActive]}
            onPress={() => setEnableTorch(!enableTorch)}
          >
            <Ionicons name={enableTorch ? 'flash' : 'flash-outline'} size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Camera Scanner View */}
        <View style={styles.cameraContainer}>
          {CameraViewComponent ? (
            <CameraViewComponent
              style={StyleSheet.absoluteFillObject}
              enableTorch={enableTorch}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'code128', 'pdf417', 'aztec']
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
          ) : (
            <View style={styles.permissionWrap}>
              <Ionicons name="camera-outline" size={64} color="#38bdf8" />
              <Text style={styles.permissionText}>
                Camera permission / module ready. Tap below to test auto-filling driver details or scan directly.
              </Text>
              <TouchableOpacity style={styles.grantBtn} onPress={handleDemoScan}>
                <Text style={styles.grantBtnText}>Auto-Fill Sample Driver QR</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scanner Viewfinder Box Overlay */}
          {CameraViewComponent && (
            <View style={styles.overlayContainer}>
              <View style={styles.scanBox}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>
          )}
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.demoBtn} onPress={handleDemoScan}>
            <Ionicons name="qr-code-outline" size={20} color="#38bdf8" />
            <Text style={styles.demoBtnText}>Auto-Fill Demo QR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1e293b'
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTextWrap: {
    alignItems: 'center'
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700'
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2
  },
  torchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  torchActive: {
    backgroundColor: '#f59e0b'
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  permissionWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30
  },
  permissionText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20
  },
  grantBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8
  },
  grantBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justify: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)'
  },
  scanBox: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    position: 'relative',
    backgroundColor: 'transparent'
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#38bdf8',
    borderWidth: 3.5
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justify.content: 'space-between',
    alignItems: 'center'
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8
  },
  demoBtnText: {
    color: '#38bdf8',
    fontWeight: '600',
    fontSize: 13
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14
  }
});
