import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { ProfileContext } from '../context/ProfileContext';
import { analyticsAPI, documentAPI } from '../services/api';
import { ProfileEditModal } from '../components/ProfileEditModal';
import { CONFIG } from '../config';

export const HomeScreen = ({ navigation, onOpenAI }) => {
  const { activeProfile } = useContext(ProfileContext);
  const [trends, setTrends] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const loadDashboardData = async () => {
    if (!activeProfile) return;
    try {
      const [trendData, docData] = await Promise.all([
        analyticsAPI.getTrends(activeProfile.id),
        documentAPI.getDocuments(activeProfile.id)
      ]);
      setTrends(trendData);
      setDocuments(docData);
    } catch (error) {
      console.error('Error loading mobile dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const highParameters = trends.filter(t => t.latest_status === 'High');
  const lowParameters = trends.filter(t => t.latest_status === 'Low');
  const normalParameters = trends.filter(t => t.latest_status === 'Normal');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CONFIG.THEME.primary} />}
    >
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{activeProfile?.name?.charAt(0) || '👤'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileHeaderName}>{activeProfile?.name || 'User Profile'}</Text>
          <Text style={styles.profileHeaderSub}>
            {activeProfile?.relationship} • {activeProfile?.gender || 'Male'}, {activeProfile?.blood_group || 'O+'}
          </Text>
          <Text style={styles.docCountTag}>📁 {documents.length} Medical Documents Vaulted</Text>
        </View>

        <TouchableOpacity style={styles.editProfileCardBtn} onPress={() => setEditModalVisible(true)}>
          <Text style={styles.editProfileCardBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionTileBtn} onPress={onOpenAI}>
          <Text style={styles.actionTileIcon}>✨</Text>
          <Text style={styles.actionTileTitle}>Ask AI</Text>
          <Text style={styles.actionTileSub}>Clinical Health Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionTileBtn} onPress={() => navigation.navigate('Vault')}>
          <Text style={styles.actionTileIcon}>📄</Text>
          <Text style={styles.actionTileTitle}>Medical Vault</Text>
          <Text style={styles.actionTileSub}>View & Upload PDFs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionTileBtn} onPress={() => navigation.navigate('Trends')}>
          <Text style={styles.actionTileIcon}>📈</Text>
          <Text style={styles.actionTileTitle}>Health Trends</Text>
          <Text style={styles.actionTileSub}>Interactive Charts</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Health Overview Summary</Text>
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { borderLeftColor: CONFIG.THEME.primary }]}>
          <Text style={styles.metricValue}>{trends.length}</Text>
          <Text style={styles.metricLabel}>Total Tracked</Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: CONFIG.THEME.success }]}>
          <Text style={[styles.metricValue, { color: CONFIG.THEME.success }]}>{normalParameters.length}</Text>
          <Text style={styles.metricLabel}>Normal Bounds</Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: CONFIG.THEME.danger }]}>
          <Text style={[styles.metricValue, { color: CONFIG.THEME.danger }]}>{highParameters.length + lowParameters.length}</Text>
          <Text style={styles.metricLabel}>Out of Range</Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Key Diagnostic Highlights</Text>
      {loading ? (
        <ActivityIndicator color={CONFIG.THEME.primary} style={{ marginTop: 20 }} />
      ) : trends.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No diagnostic lab results vaulted yet for this profile.</Text>
          <TouchableOpacity style={styles.uploadPromptBtn} onPress={() => navigation.navigate('Vault')}>
            <Text style={styles.uploadPromptBtnText}>Upload Lab Report PDF</Text>
          </TouchableOpacity>
        </View>
      ) : (
        trends.slice(0, 8).map((item, idx) => (
          <View key={idx} style={styles.paramRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.paramName}>{item.parameter_name}</Text>
              <Text style={styles.paramRef}>Range: {item.reference_range}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.paramValue}>{item.latest_value} <Text style={styles.paramUnit}>{item.unit}</Text></Text>
              <View style={[
                styles.statusBadge,
                item.latest_status === 'High' ? styles.badgeHigh : item.latest_status === 'Low' ? styles.badgeLow : styles.badgeNormal
              ]}>
                <Text style={styles.statusBadgeText}>{item.latest_status}</Text>
              </View>
            </View>
          </View>
        ))
      )}

      <ProfileEditModal
        visible={editModalVisible}
        profileToEdit={activeProfile}
        onClose={() => setEditModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.THEME.bgDark,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CONFIG.THEME.cardBg,
    borderRadius: 16,
    padding: 16,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
    marginBottom: 20,
  },
  avatarLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: CONFIG.THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarLargeText: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileHeaderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CONFIG.THEME.textMain,
  },
  profileHeaderSub: {
    color: CONFIG.THEME.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  docCountTag: {
    color: CONFIG.THEME.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  editProfileCardBtn: {
    backgroundColor: CONFIG.THEME.bgDark,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editProfileCardBtnText: {
    color: CONFIG.THEME.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionTileBtn: {
    flex: 1,
    backgroundColor: CONFIG.THEME.cardBg,
    borderRadius: 14,
    padding: 14,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionTileIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  actionTileTitle: {
    color: CONFIG.THEME.textMain,
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionTileSub: {
    color: CONFIG.THEME.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CONFIG.THEME.textMain,
    marginBottom: 12,
    marginTop: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: CONFIG.THEME.cardBg,
    borderRadius: 14,
    padding: 14,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CONFIG.THEME.textMain,
  },
  metricLabel: {
    color: CONFIG.THEME.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: CONFIG.THEME.cardBg,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  emptyText: {
    color: CONFIG.THEME.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  uploadPromptBtn: {
    backgroundColor: CONFIG.THEME.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadPromptBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 13,
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CONFIG.THEME.cardBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  paramName: {
    color: CONFIG.THEME.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  paramRef: {
    color: CONFIG.THEME.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  paramValue: {
    color: CONFIG.THEME.textMain,
    fontSize: 15,
    fontWeight: 'bold',
  },
  paramUnit: {
    color: CONFIG.THEME.textMuted,
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  badgeNormal: {
    backgroundColor: '#34d39922',
  },
  badgeHigh: {
    backgroundColor: '#f8717122',
  },
  badgeLow: {
    backgroundColor: '#fbbf2422',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: CONFIG.THEME.textMain,
  }
});
