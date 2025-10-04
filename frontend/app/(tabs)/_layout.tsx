import { useState } from 'react';
import { Tabs } from 'expo-router';
import {
  Modal, Pressable, Text, TextInput, View, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // bundled with Expo
import { colors, spacing, radius, fonts } from '../../constants/theme';
import LogoMark from '../../components/LogoMark';

/** Chatbot popup (modal) */
function ChatbotModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [a, setA] = useState('');

  const ask = () => {
    if (!q.trim()) return;
    // TODO: wire to backend /ask later
    setA("Hi! I’m Fundr AI — I’ll help you find grants based on your profile. (Gemini coming soon)");
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={[fonts.h2, { marginBottom: spacing.sm }]}>Fundr Chatbot</Text>
        <Text style={[fonts.hint, { marginBottom: spacing.md }]}>
          Ask something like “What subsidies am I eligible for?”
        </Text>

        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Type your question..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          style={styles.input}
        />
        <View style={{ height: spacing.sm }} />
        <Pressable style={styles.askBtn} onPress={ask}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Ask</Text>
        </Pressable>

        {!!a && (
          <View style={styles.answerBox}>
            <Text style={fonts.p}>{a}</Text>
          </View>
        )}

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={{ color: colors.text }}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

export default function TabsLayout() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <Tabs
        initialRouteName="swipe"
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} onChat={() => setChatOpen(true)} />}
      >
        {/* Only declare screens that actually exist as files */}
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="matches" options={{ title: 'Matches' }} />
        <Tabs.Screen name="swipe" options={{ title: 'Swipe' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>

      <ChatbotModal visible={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}

/** Custom bottom bar: Search | Matches | (Logo) | Chat | Profile */
function CustomTabBar({ state, navigation, onChat }: any) {
  const current = state.routes[state.index]?.name;

  // Order: search, matches, swipe (logo), chat (modal), profile
  const items = [
    { key: 'search', label: 'Search', icon: (active: boolean) => (
        <Ionicons name="search-outline" size={22} color={active ? colors.text : 'rgba(255,255,255,0.7)'} />
      )
    },
    { key: 'matches', label: 'Matches', icon: (active: boolean) => (
        <Ionicons name="heart-outline" size={22} color={active ? colors.text : 'rgba(255,255,255,0.7)'} />
      )
    },
    { key: 'swipe', label: 'Swipe', isLogo: true }, // center logo
    { key: 'chat', label: 'Chatbot', isChat: true, icon: (active: boolean) => (
        <Ionicons name="chatbubble-ellipses-outline" size={22} color={active ? colors.text : 'rgba(255,255,255,0.7)'} />
      )
    },
    { key: 'profile', label: 'Profile', icon: (active: boolean) => (
        <Ionicons name="person-outline" size={22} color={active ? colors.text : 'rgba(255,255,255,0.7)'} />
      )
    },
  ];

  const go = (routeName: string) => {
    const route = state.routes.find((r: any) => r.name === routeName);
    if (route) navigation.navigate(route);
  };

  return (
    <View style={styles.bar}>
      {items.map((it) => {
        const isActive = !it.isChat && !it.isLogo && current === it.key;
        const onPress = () => (it.isChat ? onChat() : go(it.key));

        return (
          <Pressable
            key={it.key}
            onPress={onPress}
            style={({ pressed }) => [
              styles.tab,
              pressed && { opacity: 0.85 },
              isActive && styles.tabActive,
            ]}
          >
            {it.isLogo ? (
              <View style={styles.logoWrap}>
                {/* Slightly larger center logo */}
                <LogoMark size={44} />
              </View>
            ) : (
              <>
                {it.icon?.(isActive)}
                <Text style={[styles.label, isActive && styles.labelActive]}>{it.label}</Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Styles */
const styles = StyleSheet.create({
  // Bar
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    backgroundColor: '#1A0D33',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
    marginHorizontal: 4,
    borderRadius: radius.lg,
  },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.06)' },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  labelActive: { color: colors.text, fontWeight: '600' },

  // Center logo container
  logoWrap: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 6,
    borderRadius: 999,
  },

  // Chatbot modal
  backdrop: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, // avoid 'inset' shorthand
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg * 3,
    backgroundColor: '#2A1C49',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  input: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  askBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  answerBox: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: spacing.md,
  },
  closeBtn: { marginTop: spacing.md, alignSelf: 'center', padding: 8 },
});
