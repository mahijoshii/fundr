import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

export default function PrimaryButton({
  title, 
  onPress, 
  style, 
  outline = false,
  disabled = false,
}: { 
  title: string; 
  onPress: () => void; 
  style?: ViewStyle; 
  outline?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        outline ? styles.outline : styles.filled,
        pressed && !disabled && { opacity: 0.85 },
        disabled && styles.disabled,
        style,
      ]}>
      <Text style={[
        styles.text, 
        outline && { color: colors.primary },
        disabled && styles.disabledText
      ]}>
        {title}
      </Text>
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
  filled: { 
    backgroundColor: colors.primary, 
    borderColor: colors.primary 
  },
  outline: { 
    backgroundColor: 'transparent', 
    borderColor: colors.primary 
  },
  text: { 
    color: colors.text, 
    fontWeight: '700', 
    fontSize: 16 
  },
  disabled: {
    backgroundColor: 'rgba(160, 32, 240, 0.3)',
    borderColor: 'rgba(255,255,255,0.1)',
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.6,
  },
});