import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { ProfileContext } from '../context/ProfileContext';
import { analyticsAPI } from '../services/api';
import { CONFIG } from '../config';

const SUGGESTIONS = [
  "What is my latest Glucose level?",
  "What is my hemoglobin level?",
  "Show my Liver report",
  "Show my Kidney panel",
  "How can I improve my health?"
];

export const AIAssistantScreen = ({ onClose }) => {
  const { activeProfile } = useContext(ProfileContext);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! I'm your MediVault AI Clinical Assistant. Ask me anything about ${activeProfile?.name || 'your'}'s lab reports, glucose levels, liver, kidney, or thyroid panels!`
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (userPrompt) => {
    const promptToAsk = userPrompt || query;
    if (!promptToAsk.trim()) return;

    const userMsg = { role: 'user', text: promptToAsk };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await analyticsAPI.askAIAssistant(activeProfile?.id, promptToAsk);
      setMessages(prev => [...prev, { role: 'assistant', text: res.answer, organ_panel: res.organ_panel }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Unable to contact MediVault AI Assistant. Please ensure backend server is active.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✨ MediVault AI Assistant</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.chipHeaderBox}>
        <Text style={styles.chipHeaderTitle}>💡 Suggested Questions:</Text>
      </View>
      <View style={styles.chipWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContent}>
          {SUGGESTIONS.map((sug, idx) => (
            <TouchableOpacity key={idx} style={styles.chip} onPress={() => handleAsk(sug)}>
              <Text style={styles.chipText}>{sug}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(_, idx) => idx.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.role === 'user' ? styles.userBubble : styles.assistantBubble
          ]}>
            <Text style={styles.bubbleRole}>{item.role === 'user' ? 'You' : '🤖 MediVault AI Assistant'}</Text>
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        )}
      />

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={CONFIG.THEME.primary} size="small" />
          <Text style={styles.loadingText}>Analyzing health parameters...</Text>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask AI about glucose, liver, kidney..."
          placeholderTextColor={CONFIG.THEME.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleAsk()}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => handleAsk()} disabled={loading || !query.trim()}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.THEME.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 45,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: CONFIG.THEME.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.THEME.cardBorder,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CONFIG.THEME.primary,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: CONFIG.THEME.textMuted,
    fontSize: 18,
  },
  chipHeaderBox: {
    backgroundColor: CONFIG.THEME.cardBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  chipHeaderTitle: {
    color: CONFIG.THEME.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipWrapper: {
    backgroundColor: CONFIG.THEME.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.THEME.cardBorder,
    paddingBottom: 10,
    paddingTop: 4,
  },
  chipContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    backgroundColor: '#38bdf815',
    borderColor: '#38bdf844',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  chipText: {
    color: CONFIG.THEME.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  messageBubble: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: CONFIG.THEME.primary,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: CONFIG.THEME.cardBg,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  bubbleRole: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: CONFIG.THEME.textMain,
    lineHeight: 20,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  loadingText: {
    color: CONFIG.THEME.textMuted,
    fontSize: 12,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: CONFIG.THEME.cardBg,
    borderTopWidth: 1,
    borderTopColor: CONFIG.THEME.cardBorder,
  },
  textInput: {
    flex: 1,
    backgroundColor: CONFIG.THEME.bgDark,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: CONFIG.THEME.textMain,
    fontSize: 14,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: CONFIG.THEME.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
