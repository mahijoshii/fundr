import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../constants/theme';

export default function SearchScreen() {
  return (
    <View style={s.wrap}>
      <Text style={fonts.h1}>Search Grants</Text>
      <Text style={fonts.p}>Type to search all subsidies and grants. (Coming soon)</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
});
