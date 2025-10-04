// components/LogoMark.tsx
import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';
import logo from '../assets/fundr-logo.png';   // <-- use static import

export default function LogoMark({ size = 64 }: { size?: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 1100, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }], ...styles.glow }}>
      <View style={styles.badge}>
        <Image source={logo} style={{ width: size, height: size, borderRadius: 16 }} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    padding: 8, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  glow: { shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
});
