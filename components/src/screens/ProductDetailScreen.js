import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { useCart } from '../context/CartContext';
import CartAddedToast from '../components/CartAddedToast';

const CROP_EMOJI = {
  Grains: '🌽',
  Vegetables: '🍅',
  Tubers: '🥔',
  Fruits: '🍌',
  Oils: '🫙',
};

const TREND = {
  up: { label: '▲ Price rising', color: COLORS.up, backgroundColor: COLORS.upBg },
  down: { label: '▼ Price falling', color: COLORS.down, backgroundColor: COLORS.downBg },
  stable: { label: '● Price stable', color: COLORS.stable, backgroundColor: COLORS.stableBg },
};

export default function ProductDetailScreen({ route, navigation }) {
  const { addToCart } = useCart();
  const product = route.params?.product;
  const [quantity, setQuantity] = useState(1);
  const [cartNoticeVisible, setCartNoticeVisible] = useState(false);
  const cartNoticeTimer = useRef(null);

  useEffect(() => () => clearTimeout(cartNoticeTimer.current), []);

  if (!product) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryMid} />
        <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
          <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product details</Text>
          </View>
        </SafeAreaView>
        <View style={styles.missingState}>
          <Text style={styles.missingTitle}>Product unavailable</Text>
          <Text style={styles.missingText}>Return to the marketplace and select another listing.</Text>
        </View>
      </View>
    );
  }

  const available = Number(product.quantity_available) || 0;
  const trend = TREND[product.prediction_direction] || TREND.stable;
  const total = (Number(product.price_xaf) || 0) * quantity;

  const handleAddToCart = async () => {
    await addToCart(product, quantity);
    clearTimeout(cartNoticeTimer.current);
    setCartNoticeVisible(true);
    cartNoticeTimer.current = setTimeout(() => setCartNoticeVisible(false), 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryMid} />
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product details</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imageFallback}>
              <Text style={styles.emoji}>{CROP_EMOJI[product.crop_type] || '🌱'}</Text>
            </View>
          )}
          <View style={styles.regionBadge}>
            <Text style={styles.regionText}>📍 {product.region || 'Cameroon'}</Text>
          </View>
        </View>

        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.category}>{product.crop_type || product.category || 'Fresh produce'}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{Number(product.price_xaf || 0).toLocaleString()} FCFA</Text>
          <Text style={styles.unit}>/{product.unit || 'unit'}</Text>
        </View>

        <View style={[styles.trendBadge, { backgroundColor: trend.backgroundColor }]}>
          <Text style={[styles.trendText, { color: trend.color }]}>{trend.label}</Text>
          {product.prediction_confidence != null && (
            <Text style={[styles.confidence, { color: trend.color }]}> · {product.prediction_confidence}% confidence</Text>
          )}
        </View>

        <View style={styles.detailsCard}>
          <DetailRow label="Available quantity" value={`${available.toLocaleString()} ${product.unit || 'units'}`} />
          <DetailRow label="Quality grade" value={product.quality_grade || 'Standard'} />
          <DetailRow label="Size" value={product.size || 'Standard'} />
          <DetailRow label="Fresh produce" value={product.is_fresh === false ? 'No' : 'Yes'} last />
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {product.description || `Fresh ${product.title?.toLowerCase()} available directly from a local producer.`}
        </Text>

        <TouchableOpacity
          style={styles.sellerCard}
          onPress={() => navigation.navigate('FarmerProfile', {
            sellerName: product.seller || 'Verified Farmer',
            sellerId: product.seller_id,
          })}
        >
          <View style={styles.sellerIcon}><Text style={styles.sellerEmoji}>👨‍🌾</Text></View>
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerLabel}>Sold by</Text>
            <Text style={styles.sellerName}>{product.seller || 'Verified Farmer'}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.purchaseCard}>
          <View>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity((value) => Math.max(1, value - 1))}>
                <Text style={styles.quantityBtnText}>−</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={String(quantity)}
                onChangeText={(value) => {
                  const requested = Number(value.replace(/\D/g, ''));
                  setQuantity(Math.min(Math.max(1, available), Math.max(1, requested || 1)));
                }}
                keyboardType="number-pad"
                selectTextOnFocus
                accessibilityLabel="Product quantity"
              />
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => setQuantity((value) => Math.min(available || value + 1, value + 1))}
              >
                <Text style={styles.quantityBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.totalWrap}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.total}>{total.toLocaleString()} FCFA</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddToCart} disabled={available <= 0}>
          <Text style={styles.addButtonText}>{available > 0 ? 'Add to Cart' : 'Out of Stock'}</Text>
        </TouchableOpacity>
      </ScrollView>
      <CartAddedToast visible={cartNoticeVisible} />
    </View>
  );
}

function DetailRow({ label, value, last = false }) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paperDim },
  headerSafeArea: { backgroundColor: COLORS.primaryMid },
  header: {
    backgroundColor: COLORS.primaryMid, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 14,
  },
  backBtn: { paddingVertical: 8, paddingRight: 4 },
  backText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  headerTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 42 },
  hero: { height: 230, borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: 18, position: 'relative', ...SHADOW.medium },
  image: { width: '100%', height: '100%' },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F2DC' },
  emoji: { fontSize: 92 },
  regionBadge: { position: 'absolute', left: 12, bottom: 12, backgroundColor: 'rgba(35,48,38,0.82)', borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 7 },
  regionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  title: { color: COLORS.ink, fontSize: 25, fontWeight: '800' },
  category: { color: COLORS.inkSoft, fontSize: 13, marginTop: 3 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 12 },
  price: { color: COLORS.primary, fontSize: 24, fontWeight: '800' },
  unit: { color: COLORS.inkSoft, fontSize: 14, marginLeft: 4 },
  trendBadge: { alignSelf: 'flex-start', flexDirection: 'row', borderRadius: RADIUS.pill, paddingHorizontal: 11, paddingVertical: 6, marginTop: 10 },
  trendText: { fontSize: 12, fontWeight: '800' },
  confidence: { fontSize: 12, fontWeight: '600' },
  detailsCard: { backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 15, marginTop: 18, ...SHADOW.small },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: { color: COLORS.inkSoft, fontSize: 13 },
  detailValue: { color: COLORS.ink, fontSize: 13, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  sectionTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '800', marginTop: 20, marginBottom: 7 },
  description: { color: COLORS.inkSoft, fontSize: 14, lineHeight: 21 },
  sellerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.line, padding: 14, marginTop: 18 },
  sellerIcon: { width: 45, height: 45, borderRadius: 23, backgroundColor: COLORS.greenLight, alignItems: 'center', justifyContent: 'center' },
  sellerEmoji: { fontSize: 22 },
  sellerInfo: { flex: 1, marginLeft: 12 },
  sellerLabel: { color: COLORS.inkSoft, fontSize: 11 },
  sellerName: { color: COLORS.ink, fontSize: 15, fontWeight: '700', marginTop: 2 },
  chevron: { color: COLORS.primary, fontSize: 28 },
  purchaseCard: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, padding: 15, marginTop: 18, borderWidth: 1, borderColor: COLORS.line },
  quantityLabel: { color: COLORS.inkSoft, fontSize: 12, marginBottom: 7 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  quantityBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.paperDim, borderWidth: 1, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  quantityBtnText: { color: COLORS.primary, fontSize: 20, fontWeight: '700' },
  quantityValue: { color: COLORS.ink, fontSize: 16, fontWeight: '800', minWidth: 20, textAlign: 'center' },
  quantityInput: { color: COLORS.ink, fontSize: 16, fontWeight: '800', width: 58, height: 38, textAlign: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 0 },
  totalWrap: { alignItems: 'flex-end' },
  totalLabel: { color: COLORS.inkSoft, fontSize: 12 },
  total: { color: COLORS.primary, fontSize: 17, fontWeight: '800', marginTop: 4 },
  addButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.pill, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  missingState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  missingTitle: { color: COLORS.ink, fontSize: 20, fontWeight: '800' },
  missingText: { color: COLORS.inkSoft, fontSize: 14, textAlign: 'center', marginTop: 8 },
});
