import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

export default function CartAddedToast({ visible }) {
  if (!visible) return null;

  return (
    <View style={styles.toast} pointerEvents="none" accessibilityRole="alert">
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>✓</Text>
      </View>
      <Text style={styles.text}>Item has been added to cart</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    zIndex: 100,
    elevation: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.ink,
    ...SHADOW.medium,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.up,
  },
  icon: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  text: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
