import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import AuthCard from '../components/AuthCard';
import { colors, fonts, spacing } from '../constants/theme';
import { login } from '../lib/auth';

export default function LoginScreen() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = async () => {
    try {
      await login(userId.trim(), password);
      router.replace('/home'); // go to main home page
    } catch (e: any) {
      Alert.alert('Login failed', e.message ?? 'Invalid credentials');
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={[fonts.h1, { marginBottom: spacing.sm }]}>Fundr</Text>
      <Text style={fonts.hint}>Secure login with Auth0 (placeholder for now)</Text>

      <AuthCard>
        <TextField placeholder="User ID" value={userId} onChangeText={setUserId} autoCapitalize="none" />
        <View style={{ height: spacing.sm }} />
        <TextField placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <View style={{ height: spacing.lg }} />
        <PrimaryButton title="Log In" onPress={onLogin} />
        <View style={{ height: spacing.sm }} />
        <PrimaryButton title="Create an account" outline onPress={() => router.push('/signup')} />
        <View style={{ height: spacing.sm }} />
        <Text style={fonts.hint}>Try: user “mahi”, pass “123”</Text>
      </AuthCard>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
