import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Modal, Pressable, FlatList, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, spacing, radius } from '../../constants/theme';
import LogoMark from '../../components/LogoMark';
import PrimaryButton from '../../components/PrimaryButton';
import TextField from '../../components/TextField';
import { saveUserProfile } from '../../lib/api';

/* ------------- Reusable selects (same as onboarding) ------------- */
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
              <Pressable style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}
                onPress={() => { onChange(item); setOpen(false); }}>
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
                <Pressable style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}
                  onPress={() => toggle(item)}>
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

/* ---------------- Options (match onboarding) ---------------- */
const INCOME_OPTS = ['< $25,000', '$25,000 - $50,000', '$50,000 - $100,000', '$100,000+'];
const RACE_OPTS = ['Asian', 'Black', 'White', 'Latine', 'Middle Eastern', 'Indigenous', 'Other / Mixed'];
const GENDER_OPTS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const STUDENT_OPTS = ['Full-time', 'Part-time', 'None'];
const YES_NO = ['Yes', 'No'];
const ORG_TYPE = ['None', 'Nonprofit', 'Small Business'];
const FUNDING_PURPOSE = ['sustainability', 'community project'];
const ELIGIBILITY_TAGS = ['nonprofit', 'youth', 'sustainability'];

export default function ProfileTab() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('userProfile');
      setProfile(raw ? JSON.parse(raw) : null);
      setLoading(false);
    })();
  }, []);

  const update = (patch: Record<string, any>) =>
    setProfile((prev: any) => ({ ...(prev ?? {}), ...patch }));

  const save = async () => {
    const p = profile || {};
    // Required checks
    const required = ['name','age','residency','income','race','gender','studentStatus','immigrantStatus','indigenousStatus','veteranStatus'];
    for (const k of required) {
      if (!p[k]) { Alert.alert('Missing field', `Please fill ${k}.`); return; }
    }
    if (p.orgType === 'Nonprofit') {
      if (!p.fundingPurpose?.length || !p.eligibilityTags?.length) {
        Alert.alert('Nonprofit details', 'Select funding purpose and eligibility tags.');
        return;
      }
    }

    setSaving(true);
    try {
      // 1. Save locally
      await AsyncStorage.setItem('userProfile', JSON.stringify(p));

      // 2. Send to backend to update Snowflake
      await saveUserProfile(p);

      // 3. Clear any cached matches so new matching will run
      await AsyncStorage.removeItem('@fundr/matches');

      setEditing(false);
      Alert.alert('Saved', 'Profile updated! Your matches will refresh on next swipe.');
    } catch (error: any) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile to backend");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }}>
      <View style={s.wrap}>
        <View style={s.header}>
          <LogoMark size={64} />
          <Text style={fonts.h1}>Hello, {profile?.name || 'there'}</Text>
          <Text style={fonts.hint}>Review or update your details.</Text>
        </View>

        <View style={s.card}>
          {!profile ? (
            <Text style={fonts.p}>No profile yet. Complete setup first.</Text>
          ) : editing ? (
            <>
              <TextField placeholder="Name*" value={profile.name} onChangeText={(v) => update({ name: v })} />
              <View style={{ height: spacing.sm }} />
              <TextField placeholder="Age*" keyboardType="numeric" value={String(profile.age)} onChangeText={(v) => update({ age: v })} />
              <View style={{ height: spacing.sm }} />
              <TextField placeholder="Residency*" value={profile.residency} onChangeText={(v) => update({ residency: v })} />

              <View style={{ height: spacing.sm }} />
              <InlineSelect placeholder="Income Range*" value={profile.income} onChange={(v) => update({ income: v })} options={INCOME_OPTS} />

              <View style={{ height: spacing.sm }} />
              <InlineSelect placeholder="Race*" value={profile.race} onChange={(v) => update({ race: v })} options={RACE_OPTS} />

              <View style={{ height: spacing.sm }} />
              <InlineSelect placeholder="Gender*" value={profile.gender} onChange={(v) => update({ gender: v })} options={GENDER_OPTS} />

              <View style={{ height: spacing.sm }} />
              <InlineSelect placeholder="Student Status*" value={profile.studentStatus} onChange={(v) => update({ studentStatus: v })} options={STUDENT_OPTS} />

              <View style={{ height: spacing.sm }} />
              <InlineSelect placeholder="Immigrant (Yes/No)*" value={profile.immigrantStatus} onChange={(v) => update({ immigrantStatus: v })} options={YES_NO} />

              <View style={{ height: spacing.sm }} />
              <InlineSelect placeholder="Indigenous Identity (Yes/No)*" value={profile.indigenousStatus} onChange={(v) => update({ indigenousStatus: v })} options={YES_NO} />

              <View style={{ height: spacing.sm }} />
              <InlineSelect placeholder="Veteran Status (Yes/No)*" value={profile.veteranStatus} onChange={(v) => update({ veteranStatus: v })} options={YES_NO} />

              <View style={{ height: spacing.md }} />
              <InlineSelect placeholder="Organization Type" value={profile.orgType ?? 'None'} onChange={(v) => update({ orgType: v })} options={ORG_TYPE} />

              {profile.orgType === 'Nonprofit' && (
                <>
                  <View style={{ height: spacing.sm }} />
                  <InlineMultiSelect
                    placeholder="Funding Purpose (multi)"
                    values={profile.fundingPurpose ?? []}
                    onChange={(v) => update({ fundingPurpose: v })}
                    options={FUNDING_PURPOSE}
                  />
                  <View style={{ height: spacing.sm }} />
                  <InlineMultiSelect
                    placeholder="Eligibility Tags (multi)"
                    values={profile.eligibilityTags ?? []}
                    onChange={(v) => update({ eligibilityTags: v })}
                    options={ELIGIBILITY_TAGS}
                  />
                </>
              )}

              <View style={{ height: spacing.lg }} />
              <PrimaryButton 
                title={saving ? "Saving..." : "Save Changes"} 
                onPress={save} 
                disabled={saving}
              />
              <View style={{ height: spacing.sm }} />
              <PrimaryButton title="Cancel" outline onPress={() => setEditing(false)} disabled={saving} />
            </>
          ) : (
            <>
              <Row label="Name" value={profile.name} />
              <Row label="Age" value={profile.age} />
              <Row label="Residency" value={profile.residency} />
              <Row label="Income" value={profile.income} />
              <Row label="Race" value={profile.race} />
              <Row label="Gender" value={profile.gender} />
              <Row label="Student Status" value={profile.studentStatus} />
              <Row label="Immigrant" value={profile.immigrantStatus} />
              <Row label="Indigenous Identity" value={profile.indigenousStatus} />
              <Row label="Veteran Status" value={profile.veteranStatus} />
              <Row label="Organization Type" value={profile.orgType ?? 'None'} />
              {profile.orgType === 'Nonprofit' && (
                <>
                  <Row label="Funding Purpose" value={(profile.fundingPurpose ?? []).join(', ') || '—'} />
                  <Row label="Eligibility Tags" value={(profile.eligibilityTags ?? []).join(', ') || '—'} />
                </>
              )}
              <View style={{ height: spacing.lg }} />
              <PrimaryButton title="Edit Profile" onPress={() => setEditing(true)} />
            </>
          )}
        </View>

        <View style={{ height: spacing.xl }} />
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value?: string | number }) {
  return (
    <View style={s.rowWrap}>
      <Text style={[fonts.hint, { opacity: 0.9 }]}>{label}</Text>
      <Text style={fonts.p}>{value || '—'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  wrap: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.lg },
  header: { alignItems: 'center', gap: 8, paddingTop: spacing.xl*2, paddingBottom: spacing.md },
  card: {
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  rowWrap: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  selectInput: {
    borderRadius: radius?.lg ?? 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  selectText: { color: colors.text, fontSize: 16, flex: 1 },
  caret: { color: colors.text, fontSize: 18, marginLeft: 8 },
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
  check: { width: 22, textAlign: 'center', color: colors.text, opacity: 0.6 },
  checkOn: { opacity: 1 },
});