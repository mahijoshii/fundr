import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.outline,
    shadowColor: colors.cardShadow,
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
