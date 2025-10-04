import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { colors, fonts, radius, spacing } from '../constants/theme';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import AuthCard from '../components/AuthCard';
import LogoMark from '../components/LogoMark';
import { login } from '../lib/auth';

export default function LoginScreen() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = async () => {
    try {
      await login(userId.trim(), password);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.replace('/home');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Login failed', e.message ?? 'Invalid credentials');
    }
  };

  return (
    <LinearGradient
      colors={[colors.bg, '#190B30', '#1D0F38']}
      start={{ x: 0.1, y: 0.1 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.screen}
    >
      <View style={styles.header}>
        <LogoMark size={56} />
        <Text style={styles.brand}>Fundr</Text>
        <Text style={styles.tag}>Find the money that finds you.</Text>
      </View>

      <AuthCard>
        <Text style={styles.cardTitle}>Welcome back</Text>
        <View style={{ height: spacing.sm }} />
        <TextField
          placeholder="User ID"
          autoCapitalize="none"
          value={userId}
          onChangeText={setUserId}
        />
        <View style={{ height: spacing.sm }} />
        <TextField
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={{ height: spacing.lg }} />
        <PrimaryButton title="Log In" onPress={onLogin} />
        <View style={{ height: spacing.sm }} />
        <PrimaryButton title="Create an account" outline onPress={() => router.push('/signup')} />
        <View style={{ height: spacing.sm }} />
        <Text style={styles.hint}>Demo creds: mahi / 123</Text>
      </AuthCard>

      <Text style={styles.footer}>Secure login with Auth0 (coming next)</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  header: {
    alignItems: 'center',
    gap: 8,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  brand: {
    ...fonts.h1,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 12,
  },
  tag: { ...fonts.hint, opacity: 0.9 },
  cardTitle: {
    ...fonts.h2,
    marginBottom: spacing.xs,
    color: colors.text,
  },
  hint: { ...fonts.hint, textAlign: 'center' },
  footer: {
    ...fonts.hint,
    textAlign: 'center',
    marginTop: 'auto',
    opacity: 0.8,
  },
});
