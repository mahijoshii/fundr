import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

export default function PrimaryButton({
  title, onPress, style, outline = false,
}: { title: string; onPress: () => void; style?: ViewStyle; outline?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        outline ? styles.outline : styles.filled,
        pressed && { opacity: 0.85 },
        style,
      ]}>
      <Text style={[styles.text, outline && { color: colors.primary }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  filled: { backgroundColor: colors.primary, borderColor: colors.primary },
  outline: { backgroundColor: 'transparent', borderColor: colors.primary },
  text: { color: colors.text, fontWeight: '700', fontSize: 16 },
});
