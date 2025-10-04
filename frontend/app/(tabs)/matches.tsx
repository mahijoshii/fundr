import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../constants/theme';

export default function MatchesScreen() {
  return (
    <View style={s.wrap}>
      <Text style={fonts.h1}>Your Matches</Text>
      <Text style={fonts.p}>Saved subsidies will appear here.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
});
