import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Pressable,
  DeviceEventEmitter,
  ActivityIndicator,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, fonts, spacing, radius } from "../../constants/theme";

const { width, height } = Dimensions.get("window");
const MATCHES_KEY = "@fundr/matches";
const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

  const fetchPersonalizedMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user profile to extract user_id
      const profileRaw = await AsyncStorage.getItem('userProfile');
      if (!profileRaw) {
        setError("Please complete your profile first");
        setLoading(false);
        router.push('/profile');
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

      // Call the matching endpoint
      const url = `${API_URL}/match/${userId}`;
      console.log(`Calling: ${url}`);
      
      const response = await fetch(url);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch matches (${response.status}): ${text}`);
      }

      const data = await response.json();
      const matches = data.matches || [];

      console.log(`Received ${matches.length} personalized matches`);

      if (matches.length > 0) {
        // Format matches for swipe UI
        const formatted = matches.map((match: any, idx: number) => {
          // Format funding display
          let fundingDisplay = "Contact for details";
          if (match.funding_low && match.funding_high) {
            fundingDisplay = `$${match.funding_low} - $${match.funding_high}`;
          } else if (match.funding_low) {
            fundingDisplay = `From $${match.funding_low}`;
          } else if (match.funding_high) {
            fundingDisplay = `Up to $${match.funding_high}`;
          }

          return {
            id: match.program_name || `grant-${idx}`,
            title: match.program_name || "Untitled Grant",
            description: match.description || "No description available",
            region: match.source || "Ontario",
            deadline: match.deadline || "Rolling deadline",
            funding: fundingDisplay,
            url: match.url || "",
            score: match.score || 0,
          };
        });

        setCards(formatted);
      } else {
        setError("No personalized matches found. Try updating your profile!");
      }
    } catch (err: any) {
      console.error("Failed to fetch personalized matches:", err);
      setError(err.message || "Failed to load personalized matches. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch personalized matches on mount
  useEffect(() => {
    fetchPersonalizedMatches();
  }, [fetchPersonalizedMatches]);

  const handleSwiping = (x: number) => {
    const threshold = 120;
    const progress = Math.min(Math.abs(x) / threshold, 1);
    if (x > 0) {
      rightGlow.setValue(progress);
      leftGlow.setValue(0);
    } else if (x < 0) {
      leftGlow.setValue(progress);
      rightGlow.setValue(0);
    } else {
      leftGlow.setValue(0);
      rightGlow.setValue(0);
    }
  };

  const triggerFinalGlow = (side: "left" | "right") => {
    const anim = side === "left" ? leftGlow : rightGlow;
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(anim, { toValue: 0, duration: 650, useNativeDriver: false }),
    ]).start();
  };

  const handleSwiped = async (i: number, dir: "left" | "right") => {
    triggerFinalGlow(dir);
    if (dir === "right") {
      const card = cards[i];
      if (card) await saveRightSwipe(card);
    }
    setTimeout(() => setIndex(i + 1), 300);
  };

  const handleSwipedAll = () => setFinished(true);

  // Loading state
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

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
        <Text style={[fonts.h2, { marginTop: 16, textAlign: "center", paddingHorizontal: 24 }]}>
          {error}
        </Text>
        <Pressable style={styles.retryBtn} onPress={fetchPersonalizedMatches}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // End of deck
  if (finished || cards.length === 0) {
    return (
      <View style={[styles.container, { padding: spacing.lg }]}>
        <View style={styles.endCard}>
          <Ionicons name="sparkles" size={36} color="#B9AEE1" />
          <Text style={[fonts.h1, { textAlign: "center", marginTop: 8 }]}>
            You&apos;ve seen all your matches
          </Text>
          <Text style={[fonts.p, { textAlign: "center", opacity: 0.85 }]}>
            Check your saved matches, search for more grants, or come back later for new opportunities.
          </Text>

          <View style={styles.endActions}>
            <Pressable
              style={[styles.cta, styles.ghost]}
              onPress={() => router.push("/(tabs)/matches")}
            >
              <Text style={styles.ctaText}>View Matches</Text>
            </Pressable>
            <Pressable
              style={[styles.cta, styles.ghost]}
              onPress={() => router.push("/(tabs)/search")}
            >
              <Text style={styles.ctaText}>Search Grants</Text>
            </Pressable>
          </View>

          <Pressable style={styles.retryBtn} onPress={fetchPersonalizedMatches}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Refresh Matches</Text>
          </Pressable>
        </View>
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
        onSwiping={(x) => handleSwiping(x)}
        onSwipedLeft={(i) => handleSwiped(i, "left")}
        onSwipedRight={(i) => handleSwiped(i, "right")}
        onSwipedAll={handleSwipedAll}
        cardIndex={index}
        animateOverlayLabelsOpacity
        verticalSwipe={false}
      />

      {/* Bottom glowing icons */}
      <View style={styles.actions}>
        <Animated.View
          style={[
            styles.iconWrap,
            {
              shadowColor: "#FF6B6B",
              shadowOpacity: leftGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              shadowRadius: leftGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 24],
              }),
              borderColor: leftGlow.interpolate({
                inputRange: [0, 1],
                outputRange: ["rgba(255,255,255,0.1)", "#FF6B6B"],
              }),
              backgroundColor: leftGlow.interpolate({
                inputRange: [0, 1],
                outputRange: ["rgba(255,255,255,0.05)", "rgba(255,107,107,0.3)"],
              }),
            },
          ]}
        >
          <Ionicons name="close" size={44} color="#FF6B6B" />
        </Animated.View>

        <Animated.View
          style={[
            styles.iconWrap,
            {
              shadowColor: "#2ECC71",
              shadowOpacity: rightGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              shadowRadius: rightGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 24],
              }),
              borderColor: rightGlow.interpolate({
                inputRange: [0, 1],
                outputRange: ["rgba(255,255,255,0.1)", "#2ECC71"],
              }),
              backgroundColor: rightGlow.interpolate({
                inputRange: [0, 1],
                outputRange: ["rgba(255,255,255,0.05)", "rgba(46,204,113,0.3)"],
              }),
            },
          ]}
        >
          <Ionicons name="heart" size={42} color="#2ECC71" />
        </Animated.View>
      </View>
    </View>
  );
}

/* Card Component */
function SubsidyCard({ data }: any) {
  if (!data) return null;
  return (
    <View style={styles.card}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.md }}
      >
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
        <View style={{ height: spacing.lg }} />
        <Text style={styles.funding}>Funding: {data.funding}</Text>
        <Text style={styles.deadline}>Deadline: {data.deadline}</Text>
      </ScrollView>
    </View>
  );
}

/* Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: "#2A1C49",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: spacing.lg,
    width: width * 0.88,
    height: height * 0.68,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  title: { ...fonts.h2, color: "#fff", marginBottom: 4 },
  region: { ...fonts.p, opacity: 0.8, marginBottom: spacing.sm },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: spacing.sm,
  },
  scoreText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
  },
  desc: { ...fonts.p, color: "#fff", lineHeight: 20 },
  line: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: spacing.sm,
  },
  funding: { ...fonts.p, color: "#2ECC71", fontWeight: "600", marginBottom: 4 },
  deadline: { ...fonts.p, color: "#B9AEE1", fontWeight: "600" },
  actions: {
    position: "absolute",
    bottom: 15,
    width: "85%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  endCard: {
    width: width * 0.88,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
  },
  endActions: {
    width: "100%",
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
  },
  cta: {
    flex: 1,
    backgroundColor: "#6E59CF",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  ctaText: { color: "#fff", fontSize: 16 },
  ghost: { backgroundColor: "rgba(255,255,255,0.06)" },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
  },
});