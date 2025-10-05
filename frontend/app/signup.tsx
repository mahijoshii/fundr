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
import { signup, getAccountStats } from '../lib/auth';

const MATCHES_KEY = "@fundr/matches";

export default function SignupScreen() {
  const [email, setEmail] = useState('');
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

  const onSignup = async () => {
    try {
      await signup({ email: email.trim(), userId: userId.trim(), password });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Clear any old matches before new account starts fresh
      await AsyncStorage.removeItem(MATCHES_KEY);

      // Navigate to profile setup
      router.replace('/profile');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Signup failed', e.message ?? 'Invalid input');
    }
  };

  return (
    <LinearGradient
      colors={[colors.bg, '#190B30', '#1D0F38']}
      start={{ x: 0.1, y: 0.1 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.screen}
    >
      {/* Brand header */}
      <View style={styles.header}>
        <LogoMark size={56} />
        <Text style={styles.brand}>Fundr</Text>
        <Text style={styles.tag}>Find the money that finds you.</Text>
      </View>

      <AuthCard>
        <Text style={styles.cardTitle}>Create your account</Text>
        
        {/* Account limit indicator */}
        <View style={styles.limitBanner}>
          <Text style={styles.limitText}>
            {accountStats.remainingSlots > 0 
              ? `${accountStats.remainingSlots} of ${accountStats.maxUsers} slots available`
              : 'Account limit reached'}
          </Text>
        </View>

        <View style={{ height: spacing.sm }} />
        <TextField
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
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
        <PrimaryButton 
          title="Continue" 
          onPress={onSignup}
          disabled={accountStats.remainingSlots === 0}
        />
        <View style={{ height: spacing.sm }} />
        <PrimaryButton 
          title="Back to Login" 
          outline 
          onPress={() => router.push('/login')} 
        />
        <View style={{ height: spacing.sm }} />
        <Text style={styles.hint}>
          {accountStats.remainingSlots > 0 
            ? 'Create a unique User ID and password'
            : 'No more accounts can be created at this time'}
        </Text>
      </AuthCard>

      <Text style={styles.footer}>
        {accountStats.totalUsers}/{accountStats.maxUsers} demo accounts created
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
  limitBanner: {
    backgroundColor: 'rgba(160, 32, 240, 0.15)',
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(160, 32, 240, 0.3)',
  },
  limitText: {
    ...fonts.hint,
    color: '#B9AEE1',
    textAlign: 'center',
    fontWeight: '600',
  },
  hint: { ...fonts.hint, textAlign: 'center' },
  footer: {
    ...fonts.hint,
    textAlign: 'center',
    marginTop: 'auto',
    opacity: 0.8,
  },
});