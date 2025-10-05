import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../constants/theme';

export default function HomeScreen() {
  return (
    <View style={s.wrap}>
      <Text style={fonts.h1}>Welcome Home</Text>
      <Text style={fonts.p}>Your swipe UI and matches will live here.</Text>
      <Text style={[fonts.hint, { marginTop: 8 }]}>Primary actions use Vibrant Violet, badges use Bright Lavender.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
});
