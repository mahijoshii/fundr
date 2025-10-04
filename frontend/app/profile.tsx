import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal, Pressable, FlatList, Alert
} from 'react-native';
import { router } from 'expo-router';

import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import AuthCard from '../components/AuthCard';
import LogoMark from '../components/LogoMark';
import { colors, fonts, spacing, radius } from '../constants/theme';

/** ---- Textbox-style dropdown ---- */
function InlineSelect({
  placeholder,
  value,
  onChange,
  options,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.selectInput} onPress={() => setOpen(true)}>
        <Text style={[styles.selectText, !value && { opacity: 0.6 }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Text style={styles.caret}>▾</Text>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{placeholder}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                }}
              >
                <Text style={styles.rowText}>{item}</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
          <Pressable style={styles.cancel} onPress={() => setOpen(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

/** ---- Options ---- */
const INCOME_OPTS = ['< $25,000', '$25,000 - $50,000', '$50,000 - $100,000', '$100,000+'];
const RACE_OPTS = ['Asian', 'Black', 'White', 'Latine', 'Middle Eastern', 'Indigenous', 'Other / Mixed'];
const GENDER_OPTS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const STUDENT_OPTS = ['Full-time', 'Part-time', 'None'];
const YES_NO = ['Yes', 'No'];

/** ---- Screen ---- */
export default function ProfileScreen() {
  const [age, setAge] = useState('');
  const [residency, setResidency] = useState('');

  const [income, setIncome] = useState('');
  const [race, setRace] = useState('');
  const [gender, setGender] = useState('');
  const [studentStatus, setStudentStatus] = useState('');
  const [immigrantStatus, setImmigrantStatus] = useState('');
  const [indigenousStatus, setIndigenousStatus] = useState('');
  const [veteranStatus, setVeteranStatus] = useState('');

  const onSave = async () => {
    // ✅ Validate all fields
    if (
      !age ||
      !residency ||
      !income ||
      !race ||
      !gender ||
      !studentStatus ||
      !immigrantStatus ||
      !indigenousStatus ||
      !veteranStatus
    ) {
      Alert.alert('Missing Information', 'Please fill out all required fields before continuing.');
      return;
    }

    const payload = {
      age,
      residency,
      income,
      race,
      gender,
      studentStatus,
      immigrantStatus,
      indigenousStatus,
      veteranStatus,
    };
    console.log('Profile payload ->', payload);

    router.replace('/home');
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }}>
      <View style={styles.wrap}>
        {/* Brand header */}
        <View style={styles.header}>
          <LogoMark size={56} />
          <Text style={styles.brand}>Fundr</Text>
        </View>

        <Text style={[fonts.h1, { marginBottom: spacing.sm }]}>Profile Details</Text>
        <Text style={fonts.hint}>All fields are required to personalize your subsidy matches.</Text>

        <AuthCard>
          {/* Basics */}
          <TextField placeholder="Age*" keyboardType="numeric" value={age} onChangeText={setAge} />
          <View style={{ height: spacing.sm }} />
          <TextField
            placeholder="Residency (e.g., Toronto, ON)*"
            value={residency}
            onChangeText={setResidency}
          />

          {/* Dropdowns */}
          <View style={{ height: spacing.sm }} />
          <InlineSelect placeholder="Income Range*" value={income} onChange={setIncome} options={INCOME_OPTS} />

          <View style={{ height: spacing.sm }} />
          <InlineSelect placeholder="Race*" value={race} onChange={setRace} options={RACE_OPTS} />

          <View style={{ height: spacing.sm }} />
          <InlineSelect placeholder="Gender*" value={gender} onChange={setGender} options={GENDER_OPTS} />

          <View style={{ height: spacing.sm }} />
          <InlineSelect placeholder="Student Status*" value={studentStatus} onChange={setStudentStatus} options={STUDENT_OPTS} />

          <View style={{ height: spacing.sm }} />
          <InlineSelect placeholder="Immigrant (Yes / No)*" value={immigrantStatus} onChange={setImmigrantStatus} options={YES_NO} />

          <View style={{ height: spacing.sm }} />
          <InlineSelect placeholder="Indigenous Identity (Yes / No)*" value={indigenousStatus} onChange={setIndigenousStatus} options={YES_NO} />

          <View style={{ height: spacing.sm }} />
          <InlineSelect placeholder="Veteran Status (Yes / No)*" value={veteranStatus} onChange={setVeteranStatus} options={YES_NO} />

          <View style={{ height: spacing.lg }} />
          <PrimaryButton title="Save & Continue" onPress={onSave} />
        </AuthCard>
      </View>
    </ScrollView>
  );
}

/** ---- Styles ---- */
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xl * 1.5, // extra margin above logo
    paddingBottom: spacing.sm,
  },
  brand: {
    ...fonts.h1,
    color: colors.text,
    letterSpacing: 0.5,
  },

  selectInput: {
    borderRadius: radius?.lg ?? 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectText: { color: colors.text, fontSize: 16, flex: 1 },
  caret: { color: colors.text, fontSize: 18, marginLeft: 8 },

  backdrop: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: spacing.lg, right: spacing.lg, top: '20%',
    maxHeight: '60%',
    backgroundColor: '#2A1C49',
    borderRadius: 22,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sheetTitle: { ...fonts.h2, marginBottom: spacing.sm },
  row: { paddingVertical: 12, paddingHorizontal: 6 },
  rowText: { ...fonts.p },
  sep: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  cancel: { marginTop: spacing.md, alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12 },
  cancelText: { ...fonts.p, opacity: 0.8 },
});
