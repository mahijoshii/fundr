import { Stack, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createContext, useContext, useState, useMemo } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, fonts, radius } from '../constants/theme';

// --- Chat context so any tab can open the chat modal ---
type ChatCtx = { openChat: () => void; closeChat: () => void };
const ChatContext = createContext<ChatCtx | null>(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}

function ChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(
    () => ({ openChat: () => setOpen(true), closeChat: () => setOpen(false) }),
    []
  );
  return (
    <ChatContext.Provider value={value}>
      {children}
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={[fonts.h2, { marginBottom: spacing.sm }]}>Fundr Chatbot (WIP)</Text>
          <Text style={fonts.p}>Ask anything like “What help can I get for rent?”</Text>
          <View style={{ height: spacing.md }} />
          <Pressable style={styles.btn} onPress={() => setOpen(false)}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </ChatContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <ChatProvider>
      <StatusBar style="light" />
      {/* Stack hosts auth screens + the (tabs) group */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ChatProvider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  sheet: {
    position: 'absolute',
    left: spacing.lg, right: spacing.lg, top: '20%',
    backgroundColor: '#2A1C49',
    borderRadius: radius?.xl ?? 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: spacing.lg,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius?.xl ?? 22,
    alignSelf: 'flex-end',
  },
});
