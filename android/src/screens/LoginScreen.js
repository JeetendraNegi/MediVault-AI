import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { CONFIG } from '../config';

export const LoginScreen = () => {
  const { login, register } = useContext(AuthContext);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('demo@medivault.ai');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      Alert.alert('Required Fields', 'Please enter your email address and password.');
      return;
    }

    setLoading(true);
    if (isRegister) {
      if (!fullName.trim()) {
        Alert.alert('Required Field', 'Please enter your full name.');
        setLoading(false);
        return;
      }
      const res = await register({
        email: cleanEmail,
        password: cleanPassword,
        full_name: fullName.trim()
      });
      setLoading(false);
      if (!res.success) {
        Alert.alert('Registration Error', res.error);
      }
    } else {
      const res = await login(cleanEmail, cleanPassword);
      setLoading(false);
      if (!res.success) {
        Alert.alert('Login Failed', res.error);
      }
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBox}>
          <Image source={require('../../assets/medivault_logo.png')} style={styles.brandLogo} />
          <Text style={styles.brandTitle}>MediVault <Text style={styles.brandAccent}>AI</Text></Text>
          <Text style={styles.brandSubtitle}>Personal Health Record & Smart Analytics Vault</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isRegister ? 'Create Account' : 'Welcome Back'}</Text>
          <Text style={styles.cardSub}>Sign in with your email address to access your digitized lab reports and AI health search.</Text>

          {isRegister && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Jeetendra Negi"
                placeholderTextColor={CONFIG.THEME.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />
            </>
          )}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="demo@medivault.ai"
            placeholderTextColor={CONFIG.THEME.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={CONFIG.THEME.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {!isRegister && (
            <TouchableOpacity 
              style={styles.demoBtn} 
              onPress={() => {
                setEmail('demo@medivault.ai');
                setPassword('password123');
              }}
            >
              <Text style={styles.demoBtnText}>⚡ Fill Demo Credentials (demo@medivault.ai)</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.submitBtnText}>{isRegister ? 'Register & Sign In' : 'Sign In to MediVault'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsRegister(!isRegister)}>
            <Text style={styles.toggleBtnText}>
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register here"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.THEME.bgDark,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: CONFIG.THEME.primary,
  },
  brandAccent: {
    color: CONFIG.THEME.accent,
  },
  brandSubtitle: {
    color: CONFIG.THEME.textMuted,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: CONFIG.THEME.cardBg,
    borderRadius: 20,
    padding: 24,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: CONFIG.THEME.textMain,
    marginBottom: 6,
  },
  cardSub: {
    color: CONFIG.THEME.textMuted,
    fontSize: 13,
    marginBottom: 20,
  },
  label: {
    color: CONFIG.THEME.textMain,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: CONFIG.THEME.bgDark,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: CONFIG.THEME.textMain,
    borderColor: CONFIG.THEME.cardBorder,
    borderWidth: 1,
    fontSize: 15,
  },
  demoBtn: {
    marginTop: 14,
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: CONFIG.THEME.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleBtnText: {
    color: CONFIG.THEME.primary,
    fontSize: 13,
    fontWeight: '600',
  }
});
