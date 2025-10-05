import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal, Pressable, FlatList, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { saveUserProfile } from '../lib/api';

import TextField from '../components/TextField';
import PrimaryButton from '../components/PrimaryButton';
import AuthCard from '../components/AuthCard';
import LogoMark from '../components/LogoMark';
import { colors, fonts, spacing, radius } from '../constants/theme';

/* ---------------- Single-select (textbox-style) ---------------- */
function InlineSelect({
  placeholder, value, onChange, options,
}: { placeholder: string; value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable style={s.selectInput} onPress={() => setOpen(true)}>
        <Text style={[s.selectText, !value && { opacity: 0.6 }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Text style={s.caret}>▾</Text>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)} />
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>{placeholder}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}
                onPress={() => { onChange(item); setOpen(false); }}
              >
                <Text style={s.rowText}>{item}</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={s.sep} />}
          />
          <Pressable style={s.cancel} onPress={() => setOpen(false)}>
            <Text style={s.cancelText}>Done</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

/* ---------------- Multi-select (textbox-style) ---------------- */
function InlineMultiSelect({
  placeholder, values, onChange, options,
}: { placeholder: string; values: string[]; onChange: (v: string[]) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  const toggle = (opt: string) =>
    values.includes(opt) ? onChange(values.filter(v => v !== opt)) : onChange([...values, opt]);

  const preview = values.length ? values.join(', ') : '';

  return (
    <>
      <Pressable style={s.selectInput} onPress={() => setOpen(true)}>
        <Text style={[s.selectText, !values.length && { opacity: 0.6 }]} numberOfLines={1}>
          {preview || placeholder}
        </Text>
        <Text style={s.caret}>▾</Text>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)} />
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>{placeholder}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const selected = values.includes(item);
              return (
                <Pressable
                  style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}
                  onPress={() => toggle(item)}
                >
                  <Text style={s.rowText}>{item}</Text>
                  <Text style={[s.check, selected && s.checkOn]}>{selected ? '✓' : ''}</Text>
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => <View style={s.sep} />}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable style={s.clearBtn} onPress={() => onChange([])}>
              <Text style={s.cancelText}>Clear</Text>
            </Pressable>
            <Pressable style={s.cancel} onPress={() => setOpen(false)}>
              <Text style={s.cancelText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ---------------- Options ---------------- */
const INCOME_OPTS = ['< $25,000', '$25,000 - $50,000', '$50,000 - $100,000', '$100,000+'];
const RACE_OPTS = ['Asian', 'Black', 'White', 'Latine', 'Middle Eastern', 'Indigenous', 'Other / Mixed'];
const GENDER_OPTS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const STUDENT_OPTS = ['Full-time', 'Part-time', 'None'];
const YES_NO = ['Yes', 'No'];
const ORG_TYPE = ['None', 'Nonprofit', 'Small Business'];

// Nonprofit-specific
const FUNDING_PURPOSE = ['sustainability', 'community project'];
const ELIGIBILITY_TAGS = ['nonprofit', 'youth', 'sustainability'];

export default function ProfileSetupScreen() {
  // required personal
  const [name, setName] = useState('Mahi'); // placeholder until Auth0
  const [age, setAge] = useState('');
  const [residency, setResidency] = useState('');
  const [income, setIncome] = useState('');
  const [race, setRace] = useState('');
  const [gender, setGender] = useState('');
  const [studentStatus, setStudentStatus] = useState('');
  const [immigrantStatus, setImmigrantStatus] = useState('');
  const [indigenousStatus, setIndigenousStatus] = useState('');
  const [veteranStatus, setVeteranStatus] = useState('');

  // org
  const [orgType, setOrgType] = useState('None');
  const [fundingPurpose, setFundingPurpose] = useState<string[]>([]);
  const [eligibilityTags, setEligibilityTags] = useState<string[]>([]);

  const onSave = async () => {
    if (!name || !age || !residency || !income || !race || !gender ||
        !studentStatus || !immigrantStatus || !indigenousStatus || !veteranStatus) {
      Alert.alert('Missing info', 'Please fill all required fields.');
      return;
    }
    if (orgType === 'Nonprofit' && (!fundingPurpose.length || !eligibilityTags.length)) {
      Alert.alert('Nonprofit details', 'Select at least one funding purpose and eligibility tag.');
      return;
    }

    const payload = {
      user_id: name.toLowerCase().replace(/\s+/g, "_"), // temporary until Auth0 integration
      name,
      age: Number(age),
      residency,
      income,
      race,
      gender,
      studentStatus,
      immigrantStatus,
      indigenousStatus,
      veteranStatus,
      funding_goal_low: 5000,
      funding_goal_high: 20000,
      funding_purpose: fundingPurpose,
      eligibility_tags: eligibilityTags,
      project_summary: "User-created profile via Fundr app",
    };

    try {
      // 1️⃣ Save locally
      await AsyncStorage.setItem('userProfile', JSON.stringify(payload));

      // 2️⃣ Send to backend
      await saveUserProfile(payload);

      // 3️⃣ Navigate to swipe/matching screen
      router.replace('/(tabs)/swipe');
    } catch (error: any) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile to backend");
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }}>
      <View style={s.wrap}>
        <View style={s.header}>
          <LogoMark size={56} />
          <Text style={s.brand}>Fundr</Text>
        </View>

        <Text style={[fonts.h1, { marginBottom: spacing.sm }]}>Profile Details</Text>
        <Text style={fonts.hint}>All fields are required. Nonprofit options appear when selected.</Text>

        <AuthCard>
          <TextField placeholder="Name*" value={name} onChangeText={setName} />
          <View style={{ height: spacing.sm }} />
          <TextField placeholder="Age*" keyboardType="numeric" value={age} onChangeText={setAge} />
          <View style={{ height: spacing.sm }} />
          <TextField placeholder="Residency (e.g., Toronto, ON)*" value={residency} onChangeText={setResidency} />

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
        </AuthCard>

        <AuthCard>
          <Text style={fonts.h2}>Organization</Text>
          <View style={{ height: spacing.sm }} />
          <InlineSelect placeholder="Organization Type" value={orgType} onChange={setOrgType} options={ORG_TYPE} />

          {orgType === 'Nonprofit' && (
            <>
              <View style={{ height: spacing.md }} />
              <Text style={fonts.h2}>Nonprofit Details</Text>
              <View style={{ height: spacing.sm }} />
              <InlineMultiSelect
                placeholder="Funding Purpose (multi)"
                values={fundingPurpose}
                onChange={setFundingPurpose}
                options={FUNDING_PURPOSE}
              />
              <View style={{ height: spacing.sm }} />
              <InlineMultiSelect
                placeholder="Eligibility Tags (multi)"
                values={eligibilityTags}
                onChange={setEligibilityTags}
                options={ELIGIBILITY_TAGS}
              />
            </>
          )}
        </AuthCard>

        <PrimaryButton title="Save & Continue" onPress={onSave} />
        <View style={{ height: spacing.xl }} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.lg },
  header: { alignItems: 'center', gap: 8, marginTop: spacing.xl * 1.5, paddingBottom: spacing.sm },
  brand: { ...fonts.h1, color: colors.text, letterSpacing: 0.5 },

  /* dropdown textbox */
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

  /* modal sheet */
  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute', left: spacing.lg, right: spacing.lg, top: '20%', maxHeight: '60%',
    backgroundColor: '#2A1C49', borderRadius: 22, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  sheetTitle: { ...fonts.h2, marginBottom: spacing.sm },
  row: { paddingVertical: 12, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center' },
  rowText: { ...fonts.p, flex: 1 },
  sep: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  cancel: { marginTop: spacing.md, alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12 },
  cancelText: { ...fonts.p, opacity: 0.8 },
  clearBtn: { paddingVertical: 8, paddingHorizontal: 12 },

  /* multi-select check */
  check: { width: 22, textAlign: 'center', color: colors.text, opacity: 0.6 },
  checkOn: { opacity: 1 },
});
