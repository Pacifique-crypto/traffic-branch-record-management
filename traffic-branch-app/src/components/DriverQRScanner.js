import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
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
  const [scannedResult, setScannedResult] = useState('');
  const [enableTorch, setEnableTorch] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setScannedResult('');
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
        if (extracted.licenseNo) {
          return extracted;
        }
      }
    } catch (e) {
      console.log('JSON QR parse fallback');
    }

    // 2. Multiline key-value text format
    const lines = trimmed.split(/\r?\n/);
    lines.forEach(line => {
      const parts = line.split(/[:=]/);
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase();
        const val = parts.slice(1).join(':').trim();
        if (key.includes('license') || key.includes('licence') || key.includes('dl')) extracted.licenseNo = val;
      }
    });

    if (extracted.licenseNo) {
      return extracted;
    }

    // 3. Pipe or Comma separated values
    const delimiter = trimmed.includes('|') ? '|' : trimmed.includes(',') ? ',' : null;
    if (delimiter) {
      const tokens = trimmed.split(delimiter).map(t => t.trim());
      if (tokens.length >= 1 && tokens[0]) {
        extracted.licenseNo = tokens[0];
        return extracted;
      }
    }

    // 4. Raw text string fallback (assume full string is license number)
    extracted.licenseNo = trimmed;
    return extracted;
  };

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);

    const parsed = parseQRData(data);
    const scannedVal = parsed && parsed.licenseNo ? parsed.licenseNo : (data ? data.trim() : '');
    setScannedResult(scannedVal);
  };

  const handleDemoScan = () => {
    setScanned(true);
    setScannedResult('DL-B1234567');
  };

  const handleUseQRValue = () => {
    if (scannedResult) {
      onScanSuccess(scannedResult);
    }
    handleClose();
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScannedResult('');
  };

  const handleClose = () => {
    setScanned(false);
    setScannedResult('');
    setEnableTorch(false);
    onClose();
  };

  if (!visible) return null;

  // Render Permission Denied Screen if permission explicit denied
  if (permission && permission.status === 'denied' && !permission.granted) {
    return (
      <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={handleClose}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={handleClose}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Driving Licence</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={styles.permissionWrap}>
            <Ionicons name="camera-outline" size={64} color="#f59e0b" />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              Camera permission is required to scan the driving licence QR code.
            </Text>
            <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
              <Ionicons name="key-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelPermissionBtn} onPress={handleClose}>
              <Text style={styles.cancelPermissionBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleClose}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Scan Driving Licence</Text>
            <Text style={styles.headerSubtitle}>Position the QR code inside the frame</Text>
          </View>

          <TouchableOpacity
            style={[styles.torchBtn, enableTorch && styles.torchActive]}
            onPress={() => setEnableTorch(!enableTorch)}
          >
            <Ionicons name={enableTorch ? 'flash' : 'flash-outline'} size={20} color="#fff" />
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
                Camera preview inactive. Tap below to simulate scanning test QR code DL-B1234567.
              </Text>
              <TouchableOpacity style={styles.grantBtn} onPress={handleDemoScan}>
                <Text style={styles.grantBtnText}>Test Scan (DL-B1234567)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scanner Viewfinder Box Overlay */}
          {CameraViewComponent && !scanned && (
            <View style={styles.overlayContainer}>
              <View style={styles.scanBox}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanInstructionText}>
                Scan the QR code on the driving licence
              </Text>
            </View>
          )}

          {/* Confirmation Overlay upon scan */}
          {scanned && (
            <View style={styles.confirmationOverlay}>
              <View style={styles.confirmationCard}>
                <Ionicons name="checkmark-circle" size={54} color="#22c55e" style={{ marginBottom: 10 }} />
                <Text style={styles.confirmationTitle}>QR Scanned Successfully</Text>
                
                <Text style={styles.scannedLabel}>Scanned ID:</Text>
                <View style={styles.scannedValueBox}>
                  <Text style={styles.scannedValueText}>{scannedResult || 'DL-B1234567'}</Text>
                </View>

                <View style={styles.confirmActionsRow}>
                  <TouchableOpacity style={styles.useValueBtn} onPress={handleUseQRValue}>
                    <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.useValueBtnText}>Use QR Value</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.scanAgainBtn} onPress={handleScanAgain}>
                    <Ionicons name="refresh" size={18} color="#0284c7" style={{ marginRight: 6 }} />
                    <Text style={styles.scanAgainBtnText}>Scan Again</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.demoBtn} onPress={handleDemoScan}>
            <Ionicons name="qr-code-outline" size={18} color="#38bdf8" />
            <Text style={styles.demoBtnText}>Test QR (DL-B1234567)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1e293b'
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  backBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 2
  },
  headerTextWrap: {
    alignItems: 'center'
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700'
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2
  },
  torchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  permissionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8
  },
  permissionText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 20
  },
  grantBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  grantBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  cancelPermissionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20
  },
  cancelPermissionBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600'
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
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
  scanInstructionText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden'
  },
  confirmationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24
  },
  confirmationCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  confirmationTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16
  },
  scannedLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    alignSelf: 'flex-start'
  },
  scannedValueBox: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginBottom: 20,
    alignItems: 'center'
  },
  scannedValueText: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1
  },
  confirmActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10
  },
  useValueBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10
  },
  useValueBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14
  },
  scanAgainBtn: {
    flex: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38bdf8',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10
  },
  scanAgainBtnText: {
    color: '#38bdf8',
    fontWeight: '700',
    fontSize: 14
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38bdf8',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6
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

