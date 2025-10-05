import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Dimensions, Animated, Pressable,
  DeviceEventEmitter, ActivityIndicator
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, fonts, spacing, radius } from "../../constants/theme";

const { width, height } = Dimensions.get("window");
const MATCHES_KEY = "@fundr/matches";
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// --- Play sound helper ---
async function playSound(type: "swipe" | "ding") {
  try {
    const file =
      type === "ding"
        ? require("../../assets/sounds/ding.wav")
        : require("../../assets/sounds/swipe.wav");
    const { sound } = await Audio.Sound.createAsync(file);
    await sound.playAsync();
    setTimeout(() => sound.unloadAsync(), 1500);
  } catch (err) {
    console.warn("Sound playback failed", err);
  }
}

// --- Save right swipe ---
async function saveRightSwipe(card: any) {
  try {
    const raw = await AsyncStorage.getItem(MATCHES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const exists = arr.some((x: any) => x.id === card.id);
    const next = exists ? arr : [card, ...arr];
    await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(next));
    DeviceEventEmitter.emit("FUND_R_MATCH_SAVED", card);
  } catch (e) {
    console.warn("Failed to save match", e);
  }
}

export default function SwipeScreen() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const router = useRouter();

  const leftGlow = useState(new Animated.Value(0))[0];
  const rightGlow = useState(new Animated.Value(0))[0];

  // --- Enable audio mode ---
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true, // 🔊 ensures sound plays in silent mode
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (err) {
        console.warn("Failed to set audio mode", err);
      }
    })();
  }, []);

  // --- Fetch personalized matches ---
  const fetchPersonalizedMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profileRaw = await AsyncStorage.getItem("userProfile");
      if (!profileRaw) {
        setError("Please complete your profile first");
        setLoading(false);
        router.push("/profile");
        return;
      }

      const profile = JSON.parse(profileRaw);
      const userId = profile.user_id;
      if (!userId) {
        setError("User ID not found in profile");
        setLoading(false);
        return;
      }

      console.log(`Fetching personalized matches for user: ${userId}`);
      const url = `${API_URL}/match/${userId}`;
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch matches (${response.status}): ${text}`);
      }

      const data = await response.json();
      const matches = data.matches || [];
      if (matches.length > 0) {
        const formatted = matches.map((match: any, idx: number) => ({
          id: match.program_name || `grant-${idx}`,
          title: match.program_name || "Untitled Grant",
          description: match.description || "No description available",
          region: match.source || "Ontario",
          deadline: match.deadline || "Rolling deadline",
          funding: match.funding_high
            ? `$${match.funding_low} - $${match.funding_high}`
            : match.funding_low
            ? `From $${match.funding_low}`
            : "Contact for details",
          url: match.url || "",
          score: match.score || 0,
        }));
        setCards(formatted);
      } else setError("No personalized matches found.");
    } catch (err: any) {
      console.error("Failed to fetch personalized matches:", err);
      setError(err.message || "Failed to load matches.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchPersonalizedMatches(); }, [fetchPersonalizedMatches]);

  // --- Card glow animation ---
  const triggerGlow = (side: "left" | "right") => {
    const anim = side === "left" ? leftGlow : rightGlow;
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(anim, { toValue: 0, duration: 650, useNativeDriver: false }),
    ]).start();
  };

  // --- Swipe handler ---
  const handleSwiped = async (i: number, dir: "left" | "right") => {
    triggerGlow(dir);
    if (dir === "right") {
      await playSound("ding");
      const card = cards[i];
      if (card) await saveRightSwipe(card);
    } else {
      await playSound("swipe");
    }
    setTimeout(() => setIndex(i + 1), 300);
  };

  // --- UI States ---
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[fonts.p, { marginTop: 16, color: colors.text }]}>
          Finding your personalized matches...
        </Text>
      </View>
    );
  }

  if (error || finished || cards.length === 0) {
    return (
      <View style={styles.centerContainer}>
        {error ? (
          <>
            <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
            <Text style={[fonts.h2, { marginTop: 16, textAlign: "center" }]}>{error}</Text>
          </>
        ) : (
          <>
            <Ionicons name="sparkles" size={36} color="#B9AEE1" />
            <Text style={[fonts.h1, { textAlign: "center", marginTop: 8 }]}>All caught up!</Text>
            <Text style={[fonts.p, { textAlign: "center", opacity: 0.8 }]}>
              You’ve viewed all your matches.
            </Text>
          </>
        )}
        <Pressable style={styles.retryBtn} onPress={fetchPersonalizedMatches}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>Reload Matches</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Swiper
        cards={cards}
        renderCard={(card: any) => <SubsidyCard data={card} />}
        backgroundColor={colors.bg}
        stackSize={2}
        cardVerticalMargin={40}
        onSwipedLeft={(i) => handleSwiped(i, "left")}
        onSwipedRight={(i) => handleSwiped(i, "right")}
        onSwipedAll={() => setFinished(true)}
        cardIndex={index}
        animateOverlayLabelsOpacity
        verticalSwipe={false}
      />

      {/* Optional debug test button */}
      {/* <Pressable onPress={() => playSound("ding")} style={{ marginTop: 40 }}>
        <Text style={{ color: "#fff" }}>Test Sound</Text>
      </Pressable> */}
    </View>
  );
}

/** Card */
function SubsidyCard({ data }: any) {
  if (!data) return null;
  return (
    <View style={styles.card}>
      <ScrollView style={{ flex: 1 }}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.region}>{data.region}</Text>
        {data.score > 0 && (
          <View style={styles.scoreBadge}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.scoreText}>{Math.round(data.score * 100)}% Match</Text>
          </View>
        )}
        <View style={styles.line} />
        <Text style={styles.desc}>{data.description}</Text>
        <Text style={styles.funding}>Funding: {data.funding}</Text>
        <Text style={styles.deadline}>Deadline: {data.deadline}</Text>
      </ScrollView>
    </View>
  );
}

/** Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  centerContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  card: {
    backgroundColor: "#2A1C49",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: spacing.lg,
    width: width * 0.88,
    height: height * 0.68,
  },
  title: { ...fonts.h2, color: "#fff", marginBottom: 4 },
  region: { ...fonts.p, opacity: 0.8, marginBottom: spacing.sm },
  scoreBadge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4,
    marginBottom: spacing.sm,
  },
  scoreText: { color: "#FFD700", fontSize: 12, fontWeight: "600" },
  desc: { ...fonts.p, color: "#fff", lineHeight: 20, marginBottom: spacing.sm },
  funding: { ...fonts.p, color: "#2ECC71", fontWeight: "600" },
  deadline: { ...fonts.p, color: "#B9AEE1", fontWeight: "600" },
  line: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginBottom: spacing.sm },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
  },
});
