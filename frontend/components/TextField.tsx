import { TextInput, StyleSheet, TextInputProps, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

export default function TextField(props: TextInputProps) {
  return (
    <View style={styles.wrap}>
      <TextInput
        placeholderTextColor="rgba(255,255,255,0.55)"
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  input: {
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
});
