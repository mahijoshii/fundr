import { View, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';
import LogoMark from '../../components/LogoMark';

export default function SwipeScreen() {
  return (
    <View style={s.wrap}>
      {/* Placeholder — later we’ll add Tinder-style swipe cards */}
      <LogoMark size={84} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
