import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_BASE } from '../api/apiConfig';

const PAYMENT_METHODS = [
  { key: 'mtn_momo', label: 'MTN Mobile Money', icon: '📱', color: '#FFC107', prefix: '67' },
  { key: 'orange_money', label: 'Orange Money', icon: '🟠', color: '#FF6B00', prefix: '69' },
];

const PAYMENT_STEPS = {
  form: 'form',
  processing: 'processing',
  pending: 'pending',
  success: 'success',
  failed: 'failed',
};

export default function PaymentScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { total = 0, cartItems = [], deliveryFee = 0, platformFee = 0 } = route.params || {};
  const { token, user } = useAuth();
  const { clearCart } = useCart();

  const [method, setMethod] = useState('mtn_momo');
  const [phone, setPhone] = useState(
    String(user?.phone || '').replace(/\D/g, '').replace(/^237/, '').slice(-9),
  );
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [step, setStep] = useState(PAYMENT_STEPS.form);
  const [txRef, setTxRef] = useState('');
  const [error, setError] = useState('');
  const [paidAmount, setPaidAmount] = useState(total);

  const selectedMethod = PAYMENT_METHODS.find((m) => m.key === method);

  const confirmPayment = async (depositId) => {
    setStep(PAYMENT_STEPS.processing);
    setError('');
    for (let attempt = 0; attempt < 40; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const statusResponse = await fetch(`${API_BASE}/payments/${depositId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const statusData = await statusResponse.json().catch(() => ({}));
      if (!statusResponse.ok) throw new Error(statusData.detail || 'Unable to confirm payment status.');
      if (statusData.status === 'COMPLETED') {
        await clearCart();
        setStep(PAYMENT_STEPS.success);
        return;
      }
      if (statusData.status === 'FAILED') {
        throw new Error(statusData.failure_reason || 'The Mobile Money payment failed.');
      }
    }
    setStep(PAYMENT_STEPS.pending);
  };

  const handlePay = async () => {
    if (!phone || phone.length < 9) {
      Alert.alert('Invalid Phone', 'Enter a valid 9-digit phone number (without country code).');
      return;
    }
    if (!deliveryAddress.trim()) {
      Alert.alert('Address Required', 'Please enter your delivery address.');
      return;
    }

    setStep(PAYMENT_STEPS.processing);
    setError('');

    try {
      const normalizedPhone = phone.replace(/\D/g, '').replace(/^237/, '');
      const body = {
        payment_method: method,
        payment_phone: `237${normalizedPhone}`,
        delivery_address: deliveryAddress,
        region: user?.location || 'Centre',
        items: cartItems.map((i) => ({
          listing_id: i.id,
          quantity: i.qty,
        })),
        delivery_fee_xaf: deliveryFee,
      };

      const response = await fetch(`${API_BASE}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || 'Payment initiation failed.');
      }

      const depositId = data.deposit_id;
      setTxRef(depositId);
      setPaidAmount(data.amount_xaf || total);

      await confirmPayment(depositId);
    } catch (err) {
      setError(err.message);
      setStep(PAYMENT_STEPS.failed);
    }
  };

  if (step === PAYMENT_STEPS.pending) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <View style={styles.processingCard}>
          <Text style={styles.processingTitle}>Payment Still Pending</Text>
          <Text style={styles.processingText}>
            Do not pay again. Approve the prompt on your phone, then check this transaction again.
          </Text>
          <Text style={styles.txRef}>{txRef}</Text>
          <TouchableOpacity style={styles.homeBtn} onPress={() => confirmPayment(txRef).catch((err) => {
            setError(err.message);
            setStep(PAYMENT_STEPS.failed);
          })}>
            <Text style={styles.homeBtnText}>Check Payment Status</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === PAYMENT_STEPS.processing) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <View style={styles.processingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.processingTitle}>Processing Payment…</Text>
          <Text style={styles.processingText}>
            Please check your {selectedMethod?.label} phone (+237 {phone}) for a payment prompt.
          </Text>
          <View style={styles.processingSteps}>
            {['Initiating transaction', 'Awaiting confirmation', 'Finalising order'].map((s, i) => (
              <View key={s} style={styles.processingStep}>
                <View style={styles.stepDot} />
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === PAYMENT_STEPS.success) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}><Text style={{ fontSize: 40 }}>✅</Text></View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSub}>Your order has been placed and is being processed.</Text>
          <View style={styles.txRefBox}>
            <Text style={styles.txRefLabel}>Transaction Reference</Text>
            <Text style={styles.txRef}>{txRef}</Text>
          </View>
          <Text style={styles.successTotal}>Amount Paid: {paidAmount.toLocaleString()} FCFA</Text>

          <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Main')}>
            <Text style={styles.homeBtnText}>Back to Marketplace</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.ordersLink}>
            <Text style={styles.ordersLinkText}>View My Orders →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === PAYMENT_STEPS.failed) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <View style={styles.failedCard}>
          <Text style={{ fontSize: 40 }}>❌</Text>
          <Text style={styles.failedTitle}>Payment Failed</Text>
          <Text style={styles.failedText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setStep(PAYMENT_STEPS.form)}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // form step
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryMid} />
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Theraprice Checkout</Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 32 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {/* Order summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.summaryRow}>
              <Text style={styles.summaryItem} numberOfLines={1}>{item.title} × {item.qty}</Text>
              <Text style={styles.summaryItemPrice}>{(item.price_xaf * item.qty).toLocaleString()} FCFA</Text>
            </View>
          ))}
          {cartItems.length > 3 && <Text style={styles.moreItems}>+{cartItems.length - 3} more items</Text>}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>{deliveryFee.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform fee</Text>
            <Text style={styles.summaryValue}>{platformFee.toLocaleString()} FCFA</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{total.toLocaleString()} FCFA</Text>
          </View>
        </View>

        {/* Payment method */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.methodsCard}>
          {PAYMENT_METHODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.methodCard, method === m.key && styles.methodCardActive]}
              onPress={() => setMethod(m.key)}
            >
              <Text style={styles.methodIcon}>{m.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodLabel, method === m.key && { color: COLORS.primary }]}>{m.label}</Text>
                <Text style={styles.methodPrefix}>Numbers starting with {m.prefix}x</Text>
              </View>
              <View style={[styles.radioOuter, method === m.key && { borderColor: COLORS.primary }]}>
                {method === m.key && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Phone input */}
        <Text style={styles.sectionTitle}>Mobile Money Number</Text>
        <View style={styles.card}>
          <View style={styles.phoneRow}>
            <View style={styles.countryCode}><Text style={styles.countryCodeText}>🇨🇲 +237</Text></View>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="670000000"
              placeholderTextColor={COLORS.inkSoft}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={9}
            />
          </View>
          <Text style={styles.phoneHint}>Enter your 9-digit number without the country code</Text>
        </View>

        {/* Delivery address */}
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <View style={styles.card}>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top', marginBottom: 0 }]}
            placeholder="e.g. Quartier Bastos, Yaoundé, near the roundabout"
            placeholderTextColor={COLORS.inkSoft}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            multiline
          />
        </View>

        {/* Escrow notice */}
        <View style={styles.escrowBanner}>
          <Text style={styles.escrowIcon}>🔒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.escrowTitle}>Escrow Protection</Text>
            <Text style={styles.escrowText}>Your payment is held securely and only released to the farmer after you confirm delivery.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
          <Text style={styles.payBtnText}>Pay {total.toLocaleString()} FCFA via {selectedMethod?.label}</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paperDim },
  flex: { flex: 1 },
  centerScreen: { flex: 1, backgroundColor: COLORS.paperDim, alignItems: 'center', justifyContent: 'center', padding: 24 },

  headerSafeArea: { backgroundColor: COLORS.primaryMid },
  header: { minHeight: 58, backgroundColor: COLORS.primaryMid, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, gap: 10 },
  backBtn: { minHeight: 44, minWidth: 72, paddingHorizontal: 6, alignItems: 'flex-start', justifyContent: 'center' },
  backText: { fontSize: 15, color: '#FFF', fontWeight: '700' },
  headerTitle: { flex: 1, fontSize: 19, fontWeight: '800', color: '#FFFFFF' },

  content: { padding: 16, gap: 12, paddingBottom: 40 },

  summaryCard: { backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderColor: COLORS.line, ...SHADOW.small },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 10, marginTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryItem: { fontSize: 13, color: COLORS.ink, flex: 1 },
  summaryItemPrice: { fontSize: 13, fontWeight: '600', color: COLORS.ink },
  moreItems: { fontSize: 12, color: COLORS.inkSoft, marginBottom: 6 },
  divider: { height: 1, backgroundColor: COLORS.line, marginVertical: 8 },
  summaryLabel: { fontSize: 13, color: COLORS.inkSoft },
  summaryValue: { fontSize: 13, color: COLORS.ink },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.ink },
  totalValue: { fontSize: 16, fontWeight: '700', color: COLORS.primary },

  methodsCard: { backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.line, overflow: 'hidden', ...SHADOW.small },
  methodCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  methodCardActive: { backgroundColor: '#EEF5E6' },
  methodIcon: { fontSize: 24 },
  methodLabel: { fontSize: 15, fontWeight: '600', color: COLORS.ink },
  methodPrefix: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },

  card: { backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: COLORS.line, ...SHADOW.small },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countryCode: { backgroundColor: COLORS.paperDim, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 12 },
  countryCodeText: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
  input: {
    backgroundColor: COLORS.paperDim,
    borderWidth: 1, borderColor: COLORS.line,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.ink,
  },
  phoneHint: { fontSize: 12, color: COLORS.inkSoft, marginTop: 8 },

  escrowBanner: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: '#E3F0FB', borderRadius: RADIUS.lg, padding: 14,
    borderLeftWidth: 4, borderLeftColor: COLORS.teal,
  },
  escrowIcon: { fontSize: 22 },
  escrowTitle: { fontSize: 14, fontWeight: '700', color: COLORS.ink, marginBottom: 4 },
  escrowText: { fontSize: 12, color: COLORS.inkSoft, lineHeight: 18 },

  payBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: RADIUS.pill, alignItems: 'center' },
  payBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Processing
  processingCard: { backgroundColor: COLORS.paper, borderRadius: RADIUS.xl, padding: 32, alignItems: 'center', ...SHADOW.medium, width: '100%', gap: 14 },
  processingTitle: { fontSize: 20, fontWeight: '700', color: COLORS.ink },
  processingText: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center' },
  processingSteps: { alignSelf: 'stretch', gap: 10 },
  processingStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  stepText: { fontSize: 13, color: COLORS.inkSoft },

  // Success
  successCard: { backgroundColor: COLORS.paper, borderRadius: RADIUS.xl, padding: 32, alignItems: 'center', ...SHADOW.medium, width: '100%', gap: 10 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.upBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle: { fontSize: 24, fontWeight: '700', color: COLORS.ink },
  successSub: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center' },
  txRefBox: { backgroundColor: COLORS.paperDim, borderRadius: RADIUS.md, padding: 14, alignItems: 'center', alignSelf: 'stretch' },
  txRefLabel: { fontSize: 12, color: COLORS.inkSoft, marginBottom: 4 },
  txRef: { fontSize: 14, fontWeight: '700', color: COLORS.ink, fontFamily: 'monospace' },
  successTotal: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  homeBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: RADIUS.pill, width: '100%', alignItems: 'center' },
  homeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  ordersLink: { paddingVertical: 8 },
  ordersLinkText: { color: COLORS.teal, fontWeight: '600', fontSize: 14 },

  // Failed
  failedCard: { backgroundColor: COLORS.paper, borderRadius: RADIUS.xl, padding: 32, alignItems: 'center', ...SHADOW.medium, width: '100%', gap: 14 },
  failedTitle: { fontSize: 22, fontWeight: '700', color: COLORS.rust },
  failedText: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: RADIUS.pill },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
