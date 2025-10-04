import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import AuthCard from '../components/AuthCard';
import { colors, fonts, spacing } from '../constants/theme';

export default function ProfileScreen() {
  const [age, setAge] = useState('');
  const [income, setIncome] = useState('');
  const [residency, setResidency] = useState(''); // e.g., "ON, Canada"
  const [studentStatus, setStudentStatus] = useState(''); // e.g., "Full-time"

  const onSave = async () => {
    // TODO: POST to backend to link to user (Auth0 ID later)
    // await api.post('/profile', { age, income, residency, studentStatus })
    router.replace('/home');
  };

  return (
    <View style={s.wrap}>
      <Text style={[fonts.h1, { marginBottom: spacing.sm }]}>Profile Details</Text>
      <Text style={fonts.hint}>These fields link to your account for eligibility checks.</Text>

      <AuthCard>
        <TextField placeholder="Age" keyboardType="numeric" value={age} onChangeText={setAge} />
        <View style={{ height: spacing.sm }} />
        <TextField placeholder="Annual Income ($)" keyboardType="numeric" value={income} onChangeText={setIncome} />
        <View style={{ height: spacing.sm }} />
        <TextField placeholder="Residency (e.g., Toronto, ON)" value={residency} onChangeText={setResidency} />
        <View style={{ height: spacing.sm }} />
        <TextField placeholder="Student Status (e.g., Full-time)" value={studentStatus} onChangeText={setStudentStatus} />
        <View style={{ height: spacing.lg }} />
        <PrimaryButton title="Save & Continue" onPress={onSave} />
      </AuthCard>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, justifyContent: 'center', gap: spacing.lg },
});
