import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { ProfileContext } from '../context/ProfileContext';
import { ConfirmModal } from './ConfirmModal';
import { CONFIG } from '../config';

const RELATIONSHIPS = ['Self', 'Father', 'Mother', 'Spouse', 'Child', 'Sister', 'Brother', 'Grandparent', 'Other'];
const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const ProfileEditModal = ({ visible, profileToEdit, onClose }) => {
  const { profiles, addProfile, updateProfile, deleteProfile } = useContext(ProfileContext);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Self');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (profileToEdit) {
      setName(profileToEdit.name || '');
      setRelationship(profileToEdit.relationship || 'Self');
      setGender(profileToEdit.gender || 'Male');
      setBloodGroup(profileToEdit.blood_group || 'O+');
    } else {
      setName('');
      setRelationship('Family Member');
      setGender('Male');
      setBloodGroup('O+');
    }
  }, [profileToEdit, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter profile name.');
      return;
    }

    setLoading(true);
    const profileData = {
      name: name.trim(),
      relationship,
      gender,
      blood_group: bloodGroup
    };

    let res;
    if (profileToEdit) {
      res = await updateProfile(profileToEdit.id, profileData);
    } else {
      res = await addProfile(profileData);
    }

    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      Alert.alert('Error', res.error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!profileToEdit) return;
    setDeleteLoading(true);
    const res = await deleteProfile(profileToEdit.id);
    setDeleteLoading(false);
    setShowConfirmDelete(false);
    if (res.success) {
      onClose();
    } else {
      Alert.alert('Error', res.error);
    }
  };

  const handleDeleteTrigger = () => {
    if (!profileToEdit) return;

    if (profiles.length <= 1) {
      Alert.alert('Cannot Delete', 'Cannot delete primary profile when only 1 profile exists.');
      return;
    }

    setShowConfirmDelete(true);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.headerRow}>
              <Text style={styles.modalTitle}>
                {profileToEdit ? `Edit Profile: ${profileToEdit.name}` : '➕ Add Family Member'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh Negi"
                placeholderTextColor={CONFIG.THEME.textMuted}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Relationship</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {RELATIONSHIPS.map(rel => (
                  <TouchableOpacity
                    key={rel}
                    style={[styles.chip, relationship === rel && styles.activeChip]}
                    onPress={() => setRelationship(rel)}
                  >
                    <Text style={[styles.chipText, relationship === rel && styles.activeChipText]}>{rel}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Gender</Text>
              <View style={styles.rowGrid}>
                {GENDERS.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.gridChip, gender === g && styles.activeChip]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.chipText, gender === g && styles.activeChipText]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Blood Group</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {BLOOD_GROUPS.map(bg => (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.chip, bloodGroup === bg && styles.activeChip]}
                    onPress={() => setBloodGroup(bg)}
                  >
                    <Text style={[styles.chipText, bloodGroup === bg && styles.activeChipText]}>{bg}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.saveBtnText}>{profileToEdit ? 'Save Changes' : 'Create Family Profile'}</Text>
              )}
            </TouchableOpacity>

            {profileToEdit && profiles.length > 1 && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteTrigger} disabled={loading}>
                <Text style={styles.deleteBtnText}>🗑️ Delete Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Styled Confirm Deletion Modal */}
      <ConfirmModal
        visible={showConfirmDelete}
        title="Delete Family Profile"
        message={`Are you sure you want to delete profile for "${profileToEdit?.name}"? All associated vaulted documents and health trends will be permanently removed.`}
        confirmText="Delete Profile"
        cancelText="Cancel"
        danger={true}
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: CONFIG.THEME.cardBg,
    borderRadius: 20,
    padding: 20,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.THEME.textMain,
    flex: 1,
  },
  closeText: {
    color: CONFIG.THEME.textMuted,
    fontSize: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: CONFIG.THEME.textMain,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: CONFIG.THEME.bgDark,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: CONFIG.THEME.textMain,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: CONFIG.THEME.bgDark,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
    marginRight: 6,
  },
  gridChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: CONFIG.THEME.bgDark,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
    alignItems: 'center',
  },
  rowGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  activeChip: {
    backgroundColor: CONFIG.THEME.primary,
    borderColor: CONFIG.THEME.primary,
  },
  chipText: {
    color: CONFIG.THEME.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: CONFIG.THEME.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: '#f8717122',
    borderColor: '#f8717144',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteBtnText: {
    color: CONFIG.THEME.danger,
    fontSize: 14,
    fontWeight: 'bold',
  }
});
