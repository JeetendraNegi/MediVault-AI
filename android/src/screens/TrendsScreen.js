import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { ProfileContext } from '../context/ProfileContext';
import { analyticsAPI } from '../services/api';
import { CONFIG } from '../config';

const CATEGORIES = [
  { key: 'ALL', label: 'All Panels' },
  { key: 'CBC', label: 'Blood (CBC)' },
  { key: 'DIABETES', label: 'Diabetes' },
  { key: 'LFT', label: 'Liver (LFT)' },
  { key: 'KFT', label: 'Kidney (KFT)' },
  { key: 'LIPID', label: 'Lipid Profile' },
  { key: 'THYROID', label: 'Thyroid' },
  { key: 'VITAMINS', label: 'Vitamins' }
];

const parseReferenceRange = (refStr) => {
  if (!refStr) return { min: null, max: null };
  const str = String(refStr).trim();

  // Range like "70 - 99", "70-99", "0.4 - 4.2", "12 to 55", "20-40"
  const rangeMatch = str.match(/([\d.]+)\s*(?:[\-–—]|to)\s*([\d.]+)/i);
  if (rangeMatch) {
    const p1 = parseFloat(rangeMatch[1]);
    const p2 = parseFloat(rangeMatch[2]);
    if (!isNaN(p1) && !isNaN(p2)) {
      return { min: Math.min(p1, p2), max: Math.max(p1, p2) };
    }
  }

  // Upper bound like "< 200", "<= 199.9", "<150"
  const maxMatch = str.match(/(?:<=?|<)\s*([\d.]+)/);
  if (maxMatch) {
    const val = parseFloat(maxMatch[1]);
    if (!isNaN(val)) return { min: null, max: val };
  }

  // Lower bound like "> 39.5", ">= 40"
  const minMatch = str.match(/(?:>=?|>)\s*([\d.]+)/);
  if (minMatch) {
    const val = parseFloat(minMatch[1]);
    if (!isNaN(val)) return { min: val, max: null };
  }

  return { min: null, max: null };
};

const getStatusColor = (status, value, minRef, maxRef) => {
  if (status === 'Low' || (minRef !== null && value < minRef)) {
    return '#fbbf24'; // Yellow for Less than range
  }
  if (status === 'High' || (maxRef !== null && value > maxRef)) {
    return '#f87171'; // Red for More than range
  }
  return '#34d399'; // Green for In Range
};

export const TrendsScreen = () => {
  const { activeProfile } = useContext(ProfileContext);
  const [trends, setTrends] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchTrends = async () => {
    if (!activeProfile) return;
    setLoading(true);
    try {
      const data = await analyticsAPI.getTrends(activeProfile.id);
      setTrends(data);
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [activeProfile]);

  const filteredTrends = trends.filter(t => {
    if (selectedCategory === 'ALL') return true;
    const name = t.parameter_name.toLowerCase();
    if (selectedCategory === 'CBC') return name.includes('hemoglobin') || name.includes('rbc') || name.includes('wbc') || name.includes('platelet') || name.includes('hct') || name.includes('mcv') || name.includes('leucocyte') || name.includes('neutrophil') || name.includes('lymphocyte');
    if (selectedCategory === 'DIABETES') return name.includes('glucose') || name.includes('hba1c') || name.includes('insulin') || name.includes('homa');
    if (selectedCategory === 'LFT') return name.includes('bilirubin') || name.includes('sgot') || name.includes('sgpt') || name.includes('protein') || name.includes('albumin') || name.includes('alkaline') || name.includes('ggt');
    if (selectedCategory === 'KFT') return name.includes('creatinine') || name.includes('urea') || name.includes('uric') || name.includes('sodium') || name.includes('potassium') || name.includes('chloride');
    if (selectedCategory === 'LIPID') return name.includes('cholesterol') || name.includes('triglycerides') || name.includes('hdl') || name.includes('ldl');
    if (selectedCategory === 'THYROID') return name.includes('tsh') || name.includes('t3') || name.includes('t4');
    if (selectedCategory === 'VITAMINS') return name.includes('vitamin');
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Panel Category Pills */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryChip,
                selectedCategory === cat.key && styles.activeCategoryChip
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === cat.key && styles.activeCategoryChipText
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Parameters List */}
      {loading ? (
        <ActivityIndicator color={CONFIG.THEME.primary} style={{ marginTop: 40 }} />
      ) : filteredTrends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Parameters Found</Text>
          <Text style={styles.emptySub}>No parameters found for panel filter '{selectedCategory}'.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrends}
          keyExtractor={(item, index) => `${item.parameter_name}-${index}`}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const sortedHistory = [...(item.history || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
            const refRangeStr = sortedHistory[0]?.reference_range || item.reference_range || '';
            const { min: minRef, max: maxRef } = parseReferenceRange(refRangeStr);
            const statusColor = getStatusColor(item.latest_status, item.latest_value, minRef, maxRef);

            return (
              <View style={styles.trendCard}>
                {/* Parameter Header */}
                <View style={styles.trendHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paramName}>{item.parameter_name}</Text>
                    <Text style={styles.paramRef}>Bio Reference: {refRangeStr || 'Standard'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.paramVal, { color: statusColor }]}>
                      {item.latest_value} <Text style={styles.paramUnit}>{item.unit}</Text>
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${statusColor}22`,
                        borderColor: `${statusColor}55`,
                        borderWidth: 1
                      }
                    ]}>
                      <Text style={[styles.badgeText, { color: statusColor }]}>
                        {statusColor === '#fbbf24' ? '🟡 LOW' : statusColor === '#f87171' ? '🔴 HIGH' : '🟢 NORMAL'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Historical Date Trail (Older -> Newer) */}
                {sortedHistory.length > 0 && (
                  <View style={styles.historyRow}>
                    <Text style={styles.historyLabel}>Chronological History (Older → Newer):</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyChipsWrapper}>
                      {sortedHistory.map((h, hIdx) => {
                        const hColor = getStatusColor(h.status, h.value, minRef, maxRef);
                        return (
                          <View key={hIdx} style={[styles.historyChip, { borderColor: `${hColor}55` }]}>
                            <Text style={styles.historyDate}>{h.date}</Text>
                            <Text style={[styles.historyVal, { color: hColor }]}>
                              {h.value} {h.unit}
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Range Bar & Dotted Reference Identifiers */}
                <View style={{ marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 10, color: '#fbbf24', fontWeight: 'bold' }}>
                      {minRef !== null ? `┈ Min (${minRef})` : ''}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#f87171', fontWeight: 'bold' }}>
                      {maxRef !== null ? `┈ Max (${maxRef})` : ''}
                    </Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[
                      styles.barFill,
                      {
                        width: `${Math.min(100, Math.max(15, (item.latest_value / (maxRef ? maxRef * 1.25 : item.latest_value * 1.5)) * 100))}%`,
                        backgroundColor: statusColor
                      }
                    ]} />
                  </View>
                </View>

                {/* Footer Legend */}
                <View style={styles.legendFooter}>
                  <Text style={styles.legendText}>🟡 Low (&lt; Min)</Text>
                  <Text style={styles.legendText}>🟢 Normal (In Range)</Text>
                  <Text style={styles.legendText}>🔴 High (&gt; Max)</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.THEME.bgDark,
  },
  categoriesWrapper: {
    backgroundColor: CONFIG.THEME.cardBg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.THEME.cardBorder,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: CONFIG.THEME.bgDark,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  activeCategoryChip: {
    backgroundColor: CONFIG.THEME.primary,
    borderColor: CONFIG.THEME.primary,
  },
  categoryChipText: {
    color: CONFIG.THEME.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  activeCategoryChipText: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
  trendCard: {
    backgroundColor: CONFIG.THEME.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  trendHeader: {
    flexDirection: 'row',
    justify.content: 'space-between',
    marginBottom: 10,
  },
  paramName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: CONFIG.THEME.textMain,
  },
  paramRef: {
    fontSize: 12,
    color: CONFIG.THEME.textMuted,
    marginTop: 2,
  },
  paramVal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paramUnit: {
    fontSize: 11,
    color: CONFIG.THEME.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  historyRow: {
    marginTop: 6,
    marginBottom: 10,
  },
  historyLabel: {
    fontSize: 11,
    color: CONFIG.THEME.textMuted,
    marginBottom: 4,
  },
  historyChipsWrapper: {
    gap: 8,
  },
  historyChip: {
    backgroundColor: CONFIG.THEME.bgDark,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  historyDate: {
    fontSize: 9,
    color: CONFIG.THEME.textMuted,
  },
  historyVal: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 1,
  },
  barBg: {
    height: 8,
    backgroundColor: CONFIG.THEME.bgDark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  legendFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  legendText: {
    fontSize: 10,
    color: CONFIG.THEME.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justify.content: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CONFIG.THEME.textMain,
  },
  emptySub: {
    fontSize: 13,
    color: CONFIG.THEME.textMuted,
    marginTop: 4,
  }
});
