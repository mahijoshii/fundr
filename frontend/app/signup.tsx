import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import AuthCard from '../components/AuthCard';
import { colors, fonts, spacing } from '../constants/theme';
import { signup } from '../lib/auth';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const onSignup = async () => {
    try {
      await signup({ email: email.trim(), userId: userId.trim(), password });
      router.replace('/profile');
    } catch (e: any) {
      Alert.alert('Signup failed', e.message ?? 'Invalid input');
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={[fonts.h1, { marginBottom: spacing.sm }]}>Create Account</Text>
      <Text style={fonts.hint}>Auth0 will live here later. Placeholder for demo.</Text>

      <AuthCard>
        <TextField placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <View style={{ height: spacing.sm }} />
        <TextField placeholder="User ID" autoCapitalize="none" value={userId} onChangeText={setUserId} />
        <View style={{ height: spacing.sm }} />
        <TextField placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <View style={{ height: spacing.lg }} />
        <PrimaryButton title="Continue" onPress={onSignup} />
        <View style={{ height: spacing.sm }} />
        <Text style={fonts.hint}>Use: mahi / mahi22joshi@gmail.com / 123</Text>
      </AuthCard>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, justifyContent: 'center', gap: spacing.lg },
});
