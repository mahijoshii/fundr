import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Pressable,
  DeviceEventEmitter,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, fonts, spacing, radius } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

// ----- 20 placeholder subsidies -----
const PLACEHOLDER_SUBSIDIES = Array.from({ length: 20 }, (_, i) => ({
  id: (i + 1).toString(),
  title: [
    "Student Housing Rebate",
    "Green Tech Innovators Grant",
    "Youth Entrepreneurship Support",
    "Low-Income Energy Rebate",
    "Women in STEM Bursary",
    "Digital Boost for Small Business",
    "Indigenous Youth Leadership Fund",
    "Graduate Research Travel Grant",
    "Community Impact Micro-Grant",
    "Newcomer Skills Uplift",
    "Accessibility Improvement Grant",
    "Startup Launch Fund",
    "Sustainability Challenge Award",
    "Arts & Culture Mini-Grant",
    "Tech Apprenticeship Incentive",
    "Environmental Restoration Grant",
    "Rural Broadband Subsidy",
    "Energy-Efficient Homes Rebate",
    "Health Innovation Fellowship",
    "Agriculture Modernization Grant",
  ][i % 20],
  description:
    "Example description for subsidy " +
    (i + 1) +
    ". Provides funding or rebates for eligible applicants in specific regions. Criteria include income, residency, and purpose alignment.",
  region: ["Ontario", "Canada-wide", "BC", "National", "ON / QC"][i % 5],
  deadline: [
    "Dec 31, 2025",
    "Mar 15, 2026",
    "Aug 1, 2026",
    "May 20, 2026",
    "Jan 31, 2026",
  ][i % 5],
}));

const MATCHES_KEY = "@fundr/matches";

async function saveRightSwipe(card: any) {
  try {
    const raw = await AsyncStorage.getItem(MATCHES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const exists = arr.some((x: any) => x.id === card.id);
    const next = exists ? arr : [card, ...arr];
    await AsyncStorage.setItem(MATCHES_KEY, JSON.stringify(next));
    // notify Matches tab immediately
    DeviceEventEmitter.emit("FUND_R_MATCH_SAVED", card);
  } catch (e) {
    console.warn("Failed to save match", e);
  }
}

export default function SwipeScreen() {
  const [cards] = useState(PLACEHOLDER_SUBSIDIES);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const router = useRouter();

  // glow animation values
  const leftGlow = useState(new Animated.Value(0))[0];
  const rightGlow = useState(new Animated.Value(0))[0];

  /** Update glow live while swiping */
  const handleSwiping = (x: number) => {
    const threshold = 120; // how far to drag before full brightness
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

  /** Short flash after swipe completes */
  const triggerFinalGlow = (side: "left" | "right") => {
    const anim = side === "left" ? leftGlow : rightGlow;
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(anim, { toValue: 0, duration: 650, useNativeDriver: false }),
    ]).start();
  };

  /** Slight delay before next card + save right swipes */
  const handleSwiped = async (i: number, dir: "left" | "right") => {
    triggerFinalGlow(dir);
    if (dir === "right") {
      const card = cards[i];
      if (card) await saveRightSwipe(card);
    }
    setTimeout(() => setIndex(i + 1), 300);
  };

  /** When deck is done */
  const handleSwipedAll = () => setFinished(true);

  // End-of-deck screen
  if (finished) {
    return (
      <View style={[styles.container, { padding: spacing.lg }]}>
        <View style={styles.endCard}>
          <Ionicons name="sparkles" size={36} color="#B9AEE1" />
          <Text style={[fonts.h1, { textAlign: "center", marginTop: 8 }]}>
            You’ve reached the end ✨
          </Text>
          <Text style={[fonts.p, { textAlign: "center", opacity: 0.85 }]}>
            Come back later for more matches,{"\n"}check your saved ones, or search directly.
          </Text>

          <View style={styles.endActions}>
            <Pressable
              style={[styles.cta, styles.ghost]}
              onPress={() => router.push("/matches")}
            >
              <Text style={styles.ctaText}>Check Matches</Text>
            </Pressable>
            <Pressable
              style={[styles.cta, styles.ghost]}
              onPress={() => router.push("/search")}
            >
              <Text style={styles.ctaText}>Go to Search</Text>
            </Pressable>
          </View>
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


      {/* bottom glowing icons */}
      <View style={styles.actions}>
        {/* left / no */}
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

        {/* right / yes */}
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

/* Card */
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
        <View style={styles.line} />
        <Text style={styles.desc}>{data.description}</Text>
        <View style={{ height: spacing.lg }} />
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

  // swipe card
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
  desc: { ...fonts.p, color: "#fff", lineHeight: 20 },
  line: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: spacing.sm,
  },
  deadline: { ...fonts.p, color: "#B9AEE1", fontWeight: "600" },

  // bottom icons
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

  // end-of-deck
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
});
