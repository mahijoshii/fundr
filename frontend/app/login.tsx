import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { colors, fonts, radius, spacing } from '../constants/theme';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import AuthCard from '../components/AuthCard';
import LogoMark from '../components/LogoMark';
import { login, getAccountStats } from '../lib/auth';

const MATCHES_KEY = "@fundr/matches";

export default function LoginScreen() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [accountStats, setAccountStats] = useState({ totalUsers: 0, maxUsers: 5, remainingSlots: 5 });

  useEffect(() => {
    loadAccountStats();
  }, []);

  const loadAccountStats = async () => {
    const stats = await getAccountStats();
    setAccountStats(stats);
  };

  const onLogin = async () => {
    try {
      await login(userId.trim(), password);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Clear saved matches on new login
      await AsyncStorage.removeItem(MATCHES_KEY);

      // Navigate to swipe screen
      router.replace('/(tabs)/swipe');
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
        <PrimaryButton 
          title="Create an account" 
          outline 
          onPress={() => router.push('/signup')}
          disabled={accountStats.remainingSlots === 0}
        />
        <View style={{ height: spacing.sm }} />
        <Text style={styles.hint}>
          {accountStats.remainingSlots > 0 
            ? `${accountStats.remainingSlots} demo account slots available`
            : 'All demo slots taken - login with existing account'}
        </Text>
      </AuthCard>

      <Text style={styles.footer}>
        {accountStats.totalUsers}/{accountStats.maxUsers} demo accounts in use
      </Text>
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