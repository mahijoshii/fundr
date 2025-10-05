import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  DeviceEventEmitter,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics"; // ✅ add this
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { colors, fonts, spacing, radius } from "../../constants/theme";

const { width, height } = Dimensions.get("window");
const MATCHES_KEY = "@fundr/matches";

type Card = {
  id: string;
  title: string;
  description: string;
  region: string;
  deadline: string;
};

export default function MatchesScreen() {
  const [matches, setMatches] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card | null>(null);

  const loadMatches = async () => {
    try {
      const raw = await AsyncStorage.getItem(MATCHES_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      setMatches(arr);
    } catch (e) {
      console.warn("Failed to load matches", e);
    }
  };

  // Refresh whenever the tab/screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadMatches();
    }, [])
  );

  // Live update when a right-swipe happens
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("FUND_R_MATCH_SAVED", (card: Card) => {
      setMatches((prev) => (prev.some((m) => m.id === card.id) ? prev : [card, ...prev]));
    });
    return () => sub.remove();
  }, []);

  const open = (item: Card) => setSelected(item);
  const close = () => setSelected(null);

  /** Remove a match from storage + UI */
  const removeMatch = async (id: string) => {
    try {
      const updated = matches.filter((m) => m.id !== id);
      setMatches(updated);
      await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(updated));
      DeviceEventEmitter.emit("FUND_R_MATCH_REMOVED", id);
      close();

      // ✅ haptic feedback (now properly imported)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      Alert.alert("Error", "Failed to remove match.");
    }
  };

  const renderItem = ({ item, index }: { item: Card; index: number }) => (
    <Pressable
      onPress={() => open(item)}
      style={[styles.miniCard, index === 0 && { marginTop: spacing.xl }]} // extra top margin for first
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.region} numberOfLines={1}>{item.region}</Text>
        <Text style={styles.deadline} numberOfLines={1}>Deadline: {item.deadline}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#B9AEE1" />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {matches.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={40} color="#B9AEE1" />
          <Text style={[fonts.h2, { textAlign: "center", marginTop: 6 }]}>
            No matches yet
          </Text>
          <Text style={[fonts.p, { textAlign: "center", opacity: 0.8 }]}>
            Swipe right on subsidies to save them here.
          </Text>
        </View>
      ) : (
        <FlatList
  data={matches}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
  contentContainerStyle={{
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 1.2, // ⬅️ add more top space here
    paddingBottom: spacing.xl,
    gap: spacing.md,
  }}
/>

      )}

      {/* Full card modal */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.modalBackdrop} onPress={close}>
          <Pressable style={styles.fullCard} onPress={() => {}}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[fonts.h2, { color: "#fff" }]}>{selected?.title}</Text>
              <Pressable onPress={close}><Ionicons name="close" size={26} color="#fff" /></Pressable>
            </View>

            <Text style={[fonts.p, { opacity: 0.85, marginTop: 4 }]}>{selected?.region}</Text>
            <View style={styles.rule} />

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Text style={[fonts.p, { color: "#fff", lineHeight: 20 }]}>{selected?.description}</Text>
              <View style={{ height: spacing.lg }} />
              <Text style={[fonts.p, { color: "#B9AEE1", fontWeight: "600" }]}>
                Deadline: {selected?.deadline}
              </Text>
            </ScrollView>

            {/*  Remove button */}
            <Pressable onPress={() => selected && removeMatch(selected.id)} style={styles.removeBtn}>
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              <Text style={styles.removeText}>Remove from Matches</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* Styles */
const MINI_HEIGHT = height * 0.68 * 0.33;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: spacing.lg,
  },
  miniCard: {
    width: width * 0.9,
    minHeight: MINI_HEIGHT,
    maxHeight: MINI_HEIGHT,
    alignSelf: "center",
    backgroundColor: "#2A1C49",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  title: { ...fonts.h2, fontSize: 18, color: "#fff" },
  region: { ...fonts.p, color: "#EAE3FF", opacity: 0.85, marginTop: 2 },
  deadline: { ...fonts.p, color: "#B9AEE1", marginTop: 6 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  fullCard: {
    width: width * 0.9,
    height: height * 0.7,
    backgroundColor: "#2A1C49",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: spacing.lg,
  },
  rule: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,107,107,0.15)",
  },
  removeText: {
    color: "#FF6B6B",
    fontWeight: "600",
    fontSize: 15,
  },
});
