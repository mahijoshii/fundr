import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { askGemini } from "../../lib/api";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatTab(): JSX.Element {
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setInput("");
    const next = [...messages, { role: "user", content: q } as Msg];
    setMessages(next);
    setLoading(true);

    try {
      const reply = await askGemini(q);
      setMessages([...next, { role: "assistant", content: reply || "…" }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to reach server";
      setMessages([...next, { role: "assistant", content: `Error: ${msg}` }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: true })
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        <Text style={styles.header}>Ask Fundr</Text>

        {messages.map((m, i) => (
          <View
            key={`${i}-${m.role}`}
            style={[
              styles.bubble,
              m.role === "user" ? styles.user : styles.assistant,
            ]}
          >
            <Text style={styles.bubbleText}>{m.content}</Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.assistant]}>
            <ActivityIndicator />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask about grants, eligibility, rent help…"
          placeholderTextColor="#B9AEE1"
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <TouchableOpacity style={styles.send} onPress={send} activeOpacity={0.9}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/** Colors from your palette */
const INDIGO = "#1D0F38";   // bg
const PURPLE = "#A020F0";   // primary
const CARD = "#2A1B4F";     // card bg
const BORDER = "#3A2A6A";   // borders
const WHITE = "#FFFFFF";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: INDIGO },
  scroll: { padding: 16, paddingBottom: 24 },
  header: {
    color: WHITE,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  bubble: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    maxWidth: "85%",
    borderWidth: 1,
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  assistant: {
    alignSelf: "flex-start",
    backgroundColor: CARD,
    borderColor: BORDER,
  },
  bubbleText: { color: WHITE, lineHeight: 20 },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: INDIGO,
  },
  input: {
    flex: 1,
    backgroundColor: CARD,
    color: WHITE,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 46,
    borderWidth: 1,
    borderColor: BORDER,
  },
  send: {
    backgroundColor: PURPLE,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
  },
  sendText: { color: WHITE, fontWeight: "700" },
});
