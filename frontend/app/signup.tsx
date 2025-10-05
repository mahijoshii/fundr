import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
const MATCHES_KEY = "@fundr/matches";

import { colors, fonts, radius, spacing } from '../constants/theme';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import AuthCard from '../components/AuthCard';
import LogoMark from '../components/LogoMark';
import { signup } from '../lib/auth';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

const onSignup = async () => {
  try {
    await signup({ email: email.trim(), userId: userId.trim(), password });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // ✅ Clear any old matches before new account starts fresh
    await AsyncStorage.removeItem(MATCHES_KEY);

    // then navigate to profile setup
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
        <PrimaryButton title="Continue" onPress={onSignup} />
        <View style={{ height: spacing.sm }} />
        <Text style={styles.hint}>Demo: mahi / mahi22joshi@gmail.com / 123</Text>
      </AuthCard>

      <Text style={styles.footer}>Auth0 signup coming next</Text>
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