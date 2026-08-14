import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LanguageContext } from '../context/LanguageContext';
import { BASE_URL } from '../config';

export default function ProfileScreen({ navigation }) {
  const { language } = useContext(LanguageContext);
  const [officer, setOfficer] = useState(global.loggedOfficer || {});
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    contactNo: '',
    email: '',
    address: '',
    station: '',
    assignedArea: ''
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const headers = { 'Content-Type': 'application/json' };
      if (global.userToken) {
        headers['Authorization'] = `Bearer ${global.userToken}`;
      }
      const response = await fetch(`${BASE_URL}/officers/me`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data && data._id) {
          setOfficer(data);
          global.loggedOfficer = data;
        }
      }
    } catch (err) {
      console.log('Error fetching officer profile from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const openEditModal = () => {
    setEditForm({
      contactNo: officer.contactNo || '071 234 5678',
      email: officer.email || 'kamal.perera@police.lk',
      address: officer.address || 'No. 15, Galle Road, Colombo 03',
      station: officer.station || 'Traffic Branch - Negombo',
      assignedArea: officer.assignedArea || 'Negombo City Area'
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const headers = { 'Content-Type': 'application/json' };
      if (global.userToken) {
        headers['Authorization'] = `Bearer ${global.userToken}`;
      }

      const response = await fetch(`${BASE_URL}/officers/me`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updated = await response.json();
        setOfficer(updated);
        global.loggedOfficer = updated;
        setShowEditModal(false);
        Alert.alert('Success', 'Profile information updated successfully!');
      } else {
        const errData = await response.json();
        Alert.alert('Error', errData.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.log('Error saving profile:', err);
      Alert.alert('Error', 'Connection error to server.');
    } finally {
      setSaving(false);
    }
  };

  // Format Display Values from Database
  const fullName = officer.fullName || global.loggedOfficerName || 'Kamal Perera';
  const policeId = officer.policeId || global.loggedOfficerPoliceId || 'OF001';
  const rank = officer.rank || 'Traffic Officer';
  const station = officer.station || 'Traffic Branch - Negombo';
  const nic = officer.nic || officer.policeId || '199123456789';
  const contactNo = officer.contactNo || '071 234 5678';
  const email = officer.email || 'kamal.perera@police.lk';
  const address = officer.address || 'No. 15, Galle Road, Colombo 03';
  const assignedArea = officer.assignedArea || 'Negombo City Area';

  const joinedDate = officer.joinedDate
    ? new Date(officer.joinedDate).toISOString().split('T')[0]
    : officer.createdAt
    ? new Date(officer.createdAt).toISOString().split('T')[0]
    : '2024-02-15';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── TOP HEADER BAR ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Profile</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-vertical" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0b1d3a" />
            <Text style={{ marginTop: 10, color: '#64748b', fontSize: 13 }}>Loading Officer Profile...</Text>
          </View>
        ) : null}

        {/* ── PROFILE HEADER SUMMARY CARD ── */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={{
                uri: officer.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
              }}
              style={styles.avatarImage}
            />
            <TouchableOpacity style={styles.cameraBadge} activeOpacity={0.8}>
              <Ionicons name="camera" size={15} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.nameText}>{fullName}</Text>
          <Text style={styles.officerIdText}>Officer ID: {policeId}</Text>
          <Text style={styles.rankText}>{rank}</Text>

          <View style={styles.branchBadge}>
            <Ionicons name="shield-outline" size={14} color="#2563eb" style={{ marginRight: 6 }} />
            <Text style={styles.branchBadgeText}>{station}</Text>
          </View>
        </View>

        {/* ── SECTION 1: PERSONAL INFORMATION ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="person" size={18} color="#2563eb" />
            </View>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{fullName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="card" size={18} color="#2563eb" />
            </View>
            <Text style={styles.infoLabel}>NIC / Officer ID</Text>
            <Text style={styles.infoValue}>{nic}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="call" size={18} color="#2563eb" />
            </View>
            <Text style={styles.infoLabel}>Contact Number</Text>
            <Text style={styles.infoValue}>{contactNo}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="mail" size={18} color="#2563eb" />
            </View>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{email}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="location" size={18} color="#2563eb" />
            </View>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>{address}</Text>
          </View>
        </View>

        {/* ── SECTION 2: WORK INFORMATION ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Work Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="shield-checkmark" size={18} color="#2563eb" />
            </View>
            <Text style={styles.infoLabel}>Rank</Text>
            <Text style={styles.infoValue}>{rank}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="business" size={18} color="#2563eb" />
            </View>
            <Text style={styles.infoLabel}>Station / Branch</Text>
            <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>{station}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="calendar" size={18} color="#2563eb" />
            </View>
            <Text style={styles.infoLabel}>Joined Date</Text>
            <Text style={styles.infoValue}>{joinedDate}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="map" size={18} color="#2563eb" />
            </View>
            <Text style={styles.infoLabel}>Assigned Area</Text>
            <Text style={styles.infoValue}>{assignedArea}</Text>
          </View>
        </View>

        {/* ── EDIT PROFILE BUTTON ── */}
        <TouchableOpacity style={styles.editProfileBtn} onPress={openEditModal} activeOpacity={0.85}>
          <Ionicons name="create-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.editProfileBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── EDIT PROFILE MODAL ── */}
      <Modal visible={showEditModal} animationType="slide" transparent={true} onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Edit Profile Information</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 20, paddingTop: 10 }}>
              <Text style={styles.fieldLabel}>CONTACT NUMBER</Text>
              <TextInput
                style={styles.fieldInput}
                value={editForm.contactNo}
                onChangeText={(val) => setEditForm({ ...editForm, contactNo: val })}
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.fieldInput}
                value={editForm.email}
                onChangeText={(val) => setEditForm({ ...editForm, email: val })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>RESIDENTIAL ADDRESS</Text>
              <TextInput
                style={[styles.fieldInput, { height: 70, textAlignVertical: 'top' }]}
                value={editForm.address}
                onChangeText={(val) => setEditForm({ ...editForm, address: val })}
                multiline={true}
              />

              <Text style={styles.fieldLabel}>STATION / BRANCH</Text>
              <TextInput
                style={styles.fieldInput}
                value={editForm.station}
                onChangeText={(val) => setEditForm({ ...editForm, station: val })}
              />

              <Text style={styles.fieldLabel}>ASSIGNED AREA</Text>
              <TextInput
                style={styles.fieldInput}
                value={editForm.assignedArea}
                onChangeText={(val) => setEditForm({ ...editForm, assignedArea: val })}
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1d3a'
  },

  topBar: {
    backgroundColor: '#0b1d3a',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },

  topBarTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700'
  },

  iconBtn: {
    padding: 6
  },

  scrollContent: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30
  },

  loadingBox: {
    paddingVertical: 12,
    alignItems: 'center'
  },

  // ── Profile Header Card ──
  profileHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },

  avatarWrap: {
    position: 'relative',
    marginBottom: 14
  },

  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#ffffff'
  },

  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0b1d3a',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center'
  },

  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'center'
  },

  officerIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 4
  },

  rankText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 12
  },

  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf5ff',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20
  },

  branchBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb'
  },

  // ── Section Card ──
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },

  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#edf5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },

  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500'
  },

  infoValue: {
    marginLeft: 'auto',
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700'
  },

  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4
  },

  // ── Edit Button ──
  editProfileBtn: {
    backgroundColor: '#0b1d3a',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0b1d3a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },

  editProfileBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end'
  },

  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },

  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a'
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 6
  },

  fieldInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a'
  },

  saveBtn: {
    backgroundColor: '#0b1d3a',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },

  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },

  cancelBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },

  cancelBtnText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600'
  }
});