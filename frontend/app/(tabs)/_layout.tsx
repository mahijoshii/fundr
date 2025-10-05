import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text, TextInput, View
} from 'react-native';
import LogoMark from '../../components/LogoMark';
import { colors, fonts, radius, spacing } from '../../constants/theme';

const VOICEFLOW_API_KEY = "VF.DM.68e20289a2204b6662975c6f.HJqi9ZGALvPcBam4";
const VOICEFLOW_PROJECT_ID = "68e1fd5330fcaa0664d589a7";

/** Voiceflow-powered Chatbot Modal */
function ChatbotModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm Fundr.ai, I – I'll help you find grants and subsidies. Ask me anything!" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId] = useState(`fundr-user-${Date.now()}`); // unique user ID per session

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { from: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch(
        `https://general-runtime.voiceflow.com/state/user/${userId}/interact`,
        {
          method: 'POST',
          headers: {
            Authorization: VOICEFLOW_API_KEY,
            'Content-Type': 'application/json',
            'versionID': 'production',
          },
          body: JSON.stringify({
            action: { type: 'text', payload: userMessage },
            config: { tts: false, stripSSML: true }
          }),
        }
      );

      const data = await response.json();

      // Extract text responses from Voiceflow
      const botResponses = data
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.payload.message);

      if (botResponses.length > 0) {
        setMessages((prev) => [
          ...prev,
          ...botResponses.map((msg: string) => ({ from: 'bot', text: msg })),
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { from: 'bot', text: "I didn't quite catch that. Can you rephrase?" },
        ]);
      }
    } catch (err) {
      console.error('Voiceflow error:', err);
      setMessages((prev) => [
        ...prev,
        { from: 'bot', text: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView 
        style={styles.sheet}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={[fonts.h2, { flex: 1 }]}>Fundr.ai</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView 
          style={styles.chatContainer}
          contentContainerStyle={{ paddingVertical: spacing.sm }}
        >
          {messages.map((msg, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                msg.from === 'user' ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text style={[styles.msgText, msg.from === 'user' && { color: '#fff' }]}>
                {msg.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your question..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={styles.input}
            onSubmitEditing={sendMessage}
          />
          <Pressable style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendText}>{loading ? '...' : 'Send'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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

  const items = [
    { key: 'search', label: 'Search', icon: (active: boolean) => (
        <Ionicons name="search-outline" size={22} color={active ? colors.text : 'rgba(255,255,255,0.7)'} />
      )
    },
    { key: 'matches', label: 'Matches', icon: (active: boolean) => (
        <Ionicons name="heart-outline" size={22} color={active ? colors.text : 'rgba(255,255,255,0.7)'} />
      )
    },
    { key: 'swipe', label: 'Swipe', isLogo: true },
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
  // Bottom bar
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
  logoWrap: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 6,
    borderRadius: 999,
  },

  // Chatbot modal
  backdrop: {
    position: 'absolute', 
    top: 0, 
    bottom: 0, 
    left: 0, 
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '15%',
    bottom: '15%',
    backgroundColor: '#2A1C49',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chatContainer: {
    flex: 1,
  },
  bubble: {
    marginVertical: 6,
    maxWidth: '80%',
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  userBubble: {
    backgroundColor: '#6E59CF',
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'flex-start',
  },
  msgText: {
    fontSize: 16,
    color: '#EDE9FF',
    lineHeight: 20,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 10,
  },
  sendBtn: {
    backgroundColor: '#6E59CF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.lg,
    marginLeft: 8,
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
});