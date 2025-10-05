import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, 
  TextInput, Modal, ScrollView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, radius } from '../../constants/theme';

type Grant = {
  id: string;
  title: string;
  description: string;
  region: string;
  deadline: string;
  funding: string;
  url: string;
};

export default function SearchScreen() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [filtered, setFiltered] = useState<Grant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Grant | null>(null);

  useEffect(() => {
    fetchAllGrants();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const query = search.toLowerCase();
      setFiltered(
        grants.filter(g => 
          g.title.toLowerCase().includes(query) ||
          g.description.toLowerCase().includes(query)
        )
      );
    } else {
      setFiltered(grants);
    }
  }, [search, grants]);

  const fetchAllGrants = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/match/grants/all?limit=100`
      );
      const data = await response.json();
      setGrants(data.grants || []);
      setFiltered(data.grants || []);
    } catch (err) {
      console.error('Failed to fetch grants:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={fonts.h1}>Search Grants</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search by name or description..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable style={s.card} onPress={() => setSelected(item)}>
            <Text style={s.title} numberOfLines={2}>{item.title}</Text>
            <Text style={s.desc} numberOfLines={2}>{item.description}</Text>
            <Text style={s.funding}>{item.funding}</Text>
          </Pressable>
        )}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      />

      {/* Detail Modal */}
      {selected && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSelected(null)}>
          <Pressable style={s.backdrop} onPress={() => setSelected(null)}>
            <Pressable style={s.modal} onPress={() => {}}>
              <View style={s.modalHeader}>
                <Text style={[fonts.h2, { flex: 1 }]}>{selected.title}</Text>
                <Pressable onPress={() => setSelected(null)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>
              <ScrollView>
                <Text style={fonts.p}>{selected.description}</Text>
                <View style={{ height: spacing.md }} />
                <Text style={[fonts.p, { color: '#2ECC71' }]}>
                  Funding: {selected.funding}
                </Text>
                <Text style={[fonts.p, { color: '#B9AEE1' }]}>
                  Deadline: {selected.deadline}
                </Text>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: { padding: spacing.lg, paddingTop: spacing.xl * 2, gap: spacing.md },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
  },
  card: {
    backgroundColor: '#2A1C49',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: spacing.lg,
  },
  title: { ...fonts.h2, fontSize: 16, marginBottom: 4 },
  desc: { ...fonts.p, opacity: 0.8, marginBottom: 8 },
  funding: { ...fonts.p, color: '#2ECC71', fontWeight: '600' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: '#2A1C49',
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
});