import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, fonts } from '../../constants/theme';
import { router } from 'expo-router';

export default function ProfileTab() {
  return (
    <View style={s.wrap}>
      <Text style={fonts.h1}>Profile</Text>
      <Text style={fonts.p}>View or edit your info.</Text>
      <Pressable onPress={() => router.push('/profile')}>
        <Text style={[fonts.p, { textDecorationLine: 'underline' }]}>Open Profile Setup</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
});
