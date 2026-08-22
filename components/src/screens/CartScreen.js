import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, Alert, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { cartItems, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const { token, user } = useAuth();

  const deliveryFee = cartItems.length > 0 ? 1500 : 0;
  const platformFee = Math.round(cartTotal * 0.03);
  const total = cartTotal + deliveryFee;

  const handleCheckout = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to checkout.', [
        { text: 'Cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert('Cart is empty', 'Add items to your cart first.');
      return;
    }
    navigation.navigate('Payment', { total, cartItems, deliveryFee, platformFee });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardEmojiBg}>
        <Text style={styles.cardEmoji}>🌱</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.itemPrice}>{item.price_xaf?.toLocaleString()} FCFA/{item.unit}</Text>
        <Text style={styles.itemTotal}>{(Number(item.price_xaf || 0) * item.qty).toLocaleString()} FCFA total</Text>
        <Text style={styles.itemSeller}>by {item.seller || 'Farmer'}</Text>
      </View>
      <View style={styles.qtyControl}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, item.qty - 1)}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.qtyInput}
          value={String(item.qty)}
          onChangeText={(value) => updateQty(item.id, Number(value.replace(/\D/g, '')) || 1)}
          keyboardType="number-pad"
          selectTextOnFocus
          accessibilityLabel={`Quantity for ${item.title}`}
        />
        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, item.qty + 1)}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
        <Text style={styles.removeBtnText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Your Cart 🛒</Text>
        <Text style={styles.headerSub}>{cartItems.length} item(s)</Text>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubText}>Browse the marketplace and add fresh produce</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Marketplace')}>
            <Text style={styles.browseBtnText}>Browse Marketplace →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 10, gap: 10 }}
            ListFooterComponent={
              <View style={styles.clearRow}>
                <TouchableOpacity onPress={() => Alert.alert('Clear Cart?', 'Remove all items?', [{ text: 'Cancel' }, { text: 'Clear', style: 'destructive', onPress: clearCart }])}>
                  <Text style={styles.clearText}>Clear cart</Text>
                </TouchableOpacity>
              </View>
            }
          />

          {/* Order summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{cartTotal.toLocaleString()} FCFA</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery fee</Text>
              <Text style={styles.summaryValue}>{deliveryFee.toLocaleString()} FCFA</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform fee (3%, deducted from seller)</Text>
              <Text style={styles.summaryValue}>{platformFee.toLocaleString()} FCFA</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{total.toLocaleString()} FCFA</Text>
            </View>

            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutBtnText}>Proceed to Payment →</Text>
            </TouchableOpacity>

            <View style={styles.methodsRow}>
              <Text style={styles.methodsLabel}>Pay with:</Text>
              <Text style={styles.methodBadge}>📱 MTN MoMo</Text>
              <Text style={styles.methodBadge}>📱 Orange Money</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paperDim },
  header: { backgroundColor: COLORS.primaryMid, paddingTop: 16, paddingBottom: 18, paddingHorizontal: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },
  emptySubText: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center', marginBottom: 24 },
  browseBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: RADIUS.pill },
  browseBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, padding: 12,
    borderWidth: 1, borderColor: COLORS.line, ...SHADOW.small,
  },
  cardEmojiBg: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.paperDim, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
  itemPrice: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
  itemTotal: { fontSize: 12, fontWeight: '800', color: COLORS.ink, marginTop: 2 },
  itemSeller: { fontSize: 11, color: COLORS.inkSoft, marginTop: 2 },

  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.paperDim, borderWidth: 1, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.ink },
  qtyNum: { fontSize: 15, fontWeight: '700', color: COLORS.ink, minWidth: 20, textAlign: 'center' },
  qtyInput: { fontSize: 14, fontWeight: '800', color: COLORS.ink, width: 44, height: 32, textAlign: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 0 },

  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 18 },

  clearRow: { alignItems: 'flex-end', paddingVertical: 8 },
  clearText: { fontSize: 13, color: COLORS.rust, fontWeight: '500' },

  summary: {
    backgroundColor: COLORS.paper,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    padding: 20,
    ...SHADOW.medium,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: COLORS.inkSoft },
  summaryValue: { fontSize: 14, color: COLORS.ink, fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 10, marginTop: 4, marginBottom: 16 },
  totalLabel: { fontSize: 17, fontWeight: '700', color: COLORS.ink },
  totalValue: { fontSize: 17, fontWeight: '700', color: COLORS.primary },

  checkoutBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15, borderRadius: RADIUS.pill, alignItems: 'center', marginBottom: 14,
  },
  checkoutBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  methodsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  methodsLabel: { fontSize: 12, color: COLORS.inkSoft },
  methodBadge: {
    fontSize: 12, fontWeight: '600', color: COLORS.ink,
    backgroundColor: COLORS.paperDim, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.line,
  },
});
