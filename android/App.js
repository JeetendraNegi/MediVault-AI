import React, { useState, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Modal } from 'react-native';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { HeaderBar } from './src/components/HeaderBar';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { VaultScreen } from './src/screens/VaultScreen';
import { TrendsScreen } from './src/screens/TrendsScreen';
import { AIAssistantScreen } from './src/screens/AIAssistantScreen';
import { CONFIG } from './src/config';

const MainAppContent = () => {
  const { user } = useContext(AuthContext);
  const [currentTab, setCurrentTab] = useState('Home');
  const [aiModalVisible, setAiModalVisible] = useState(false);

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Top Header */}
      <HeaderBar onOpenAI={() => setAiModalVisible(true)} />

      {/* Main Tab Body */}
      <View style={styles.body}>
        {currentTab === 'Home' && <HomeScreen onOpenAI={() => setAiModalVisible(true)} navigation={{ navigate: (tab) => setCurrentTab(tab) }} />}
        {currentTab === 'Vault' && <VaultScreen />}
        {currentTab === 'Trends' && <TrendsScreen />}
        {currentTab === 'AI' && <AIAssistantScreen />}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab('Home')}>
          <Text style={[styles.navIcon, currentTab === 'Home' && styles.navIconActive]}>🏠</Text>
          <Text style={[styles.navLabel, currentTab === 'Home' && styles.navLabelActive]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab('Vault')}>
          <Text style={[styles.navIcon, currentTab === 'Vault' && styles.navIconActive]}>📁</Text>
          <Text style={[styles.navLabel, currentTab === 'Vault' && styles.navLabelActive]}>Vault</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab('Trends')}>
          <Text style={[styles.navIcon, currentTab === 'Trends' && styles.navIconActive]}>📈</Text>
          <Text style={[styles.navLabel, currentTab === 'Trends' && styles.navLabelActive]}>Trends</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setAiModalVisible(true)}>
          <Text style={[styles.navIcon, currentTab === 'AI' && styles.navIconActive]}>✨</Text>
          <Text style={[styles.navLabel, currentTab === 'AI' && styles.navLabelActive]}>Ask AI</Text>
        </TouchableOpacity>
      </View>

      {/* AI Assistant Modal */}
      <Modal visible={aiModalVisible} animationType="slide">
        <AIAssistantScreen onClose={() => setAiModalVisible(false)} />
      </Modal>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <MainAppContent />
      </ProfileProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.THEME.bgDark,
  },
  body: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: CONFIG.THEME.cardBg,
    borderTopWidth: 1,
    borderTopColor: CONFIG.THEME.cardBorder,
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 20,
    color: CONFIG.THEME.textMuted,
  },
  navIconActive: {
    color: CONFIG.THEME.primary,
  },
  navLabel: {
    fontSize: 11,
    color: CONFIG.THEME.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  navLabelActive: {
    color: CONFIG.THEME.primary,
    fontWeight: 'bold',
  }
});
