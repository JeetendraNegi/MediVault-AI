import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Image } from 'react-native';
import { ProfileContext } from '../context/ProfileContext';
import { AuthContext } from '../context/AuthContext';
import { ProfileEditModal } from './ProfileEditModal';
import { CONFIG } from '../config';

export const HeaderBar = ({ onOpenAI }) => {
  const { profiles, activeProfile, selectProfile } = useContext(ProfileContext);
  const { logout } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState(null);

  const handleOpenAdd = () => {
    setProfileToEdit(null);
    setModalVisible(false);
    setEditModalVisible(true);
  };

  const handleOpenEdit = (profile, e) => {
    e.stopPropagation();
    setProfileToEdit(profile);
    setModalVisible(false);
    setEditModalVisible(true);
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.brandRow}>
        <View style={styles.logoTitleBox}>
          <Image source={require('../../assets/medivault_logo.png')} style={styles.headerLogo} />
          <Text style={styles.logoText}>MediVault <Text style={styles.logoSub}>AI</Text></Text>
        </View>
        
        <View style={styles.actionsRow}>
          {onOpenAI && (
            <TouchableOpacity style={styles.aiButton} onPress={onOpenAI}>
              <Text style={styles.aiButtonText}>✨ Ask AI</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.profileBadge} onPress={() => setModalVisible(true)}>
            <Text style={styles.profileAvatarText}>
              {activeProfile ? activeProfile.name.charAt(0).toUpperCase() : '👤'}
            </Text>
            <Text style={styles.profileNameText} numberOfLines={1}>
              {activeProfile ? activeProfile.name.split(' ')[0] : 'Profile'} ▾
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Selector & Management Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Family Profiles</Text>
              <TouchableOpacity style={styles.addMemberBtn} onPress={handleOpenAdd}>
                <Text style={styles.addMemberBtnText}>+ Add Profile</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={profiles}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.profileItem,
                    activeProfile?.id === item.id && styles.activeProfileItem
                  ]}
                  onPress={() => {
                    selectProfile(item);
                    setModalVisible(false);
                  }}
                >
                  <View style={styles.profileAvatarCircle}>
                    <Text style={styles.avatarLetter}>{item.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileItemName}>{item.name}</Text>
                    <Text style={styles.profileItemRel}>{item.relationship} • {item.gender || 'Gen'}, {item.blood_group || ''}</Text>
                  </View>

                  <TouchableOpacity style={styles.editIconBtn} onPress={(e) => handleOpenEdit(item, e)}>
                    <Text style={styles.editIconText}>✏️</Text>
                  </TouchableOpacity>

                  {activeProfile?.id === item.id && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={styles.logoutButton} onPress={() => { setModalVisible(false); logout(); }}>
              <Text style={styles.logoutButtonText}>🔒 Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add / Edit Profile Form Modal */}
      <ProfileEditModal
        visible={editModalVisible}
        profileToEdit={profileToEdit}
        onClose={() => setEditModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: CONFIG.THEME.bgDark,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.THEME.cardBorder,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: CONFIG.THEME.primary,
  },
  logoSub: {
    color: CONFIG.THEME.accent,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiButton: {
    backgroundColor: '#3b82f622',
    borderColor: '#60a5fa',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  aiButtonText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '700',
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CONFIG.THEME.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  profileAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CONFIG.THEME.primary,
    marginRight: 6,
  },
  profileNameText: {
    color: CONFIG.THEME.textMain,
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '65%',
    backgroundColor: CONFIG.THEME.cardBg,
    borderRadius: 16,
    padding: 20,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.THEME.textMain,
  },
  addMemberBtn: {
    backgroundColor: CONFIG.THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addMemberBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 12,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: CONFIG.THEME.bgDark,
  },
  activeProfileItem: {
    borderColor: CONFIG.THEME.primary,
    borderWidth: 1.5,
    backgroundColor: '#0284c715',
  },
  profileAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CONFIG.THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileItemName: {
    color: CONFIG.THEME.textMain,
    fontSize: 15,
    fontWeight: '600',
  },
  profileItemRel: {
    color: CONFIG.THEME.textMuted,
    fontSize: 12,
  },
  editIconBtn: {
    padding: 6,
    marginRight: 6,
  },
  editIconText: {
    fontSize: 14,
  },
  checkMark: {
    color: CONFIG.THEME.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#f8717122',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: CONFIG.THEME.danger,
    fontWeight: 'bold',
    fontSize: 14,
  }
});
