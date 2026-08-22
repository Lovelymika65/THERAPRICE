import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_BASE } from '../api/apiConfig';
import CartAddedToast from '../components/CartAddedToast';


const CATEGORIES = [
  'All',
  'Grains',
  'Vegetables',
  'Tubers',
  'Fruits',
  'Oils',
];

const MOCK_PRODUCTS = [
  {
    id: '1',
    title: 'Fresh Maize',
    crop_type: 'Grains',
    price_xaf: 450,
    unit: 'kg',
    quantity_available: 500,
    region: 'West',
    seller: 'Emmanuel Farm',
    seller_id: 'f1',
    image_url: null,
    prediction_direction: 'up',
    prediction_confidence: 72,
  },
  {
    id: '2',
    title: 'Organic Tomatoes',
    crop_type: 'Vegetables',
    price_xaf: 800,
    unit: 'kg',
    quantity_available: 200,
    region: 'Centre',
    seller: 'Green Valley',
    seller_id: 'f2',
    image_url: null,
    prediction_direction: 'stable',
    prediction_confidence: 55,
  },
  {
    id: '3',
    title: 'Cassava Roots',
    crop_type: 'Tubers',
    price_xaf: 350,
    unit: 'kg',
    quantity_available: 1000,
    region: 'South',
    seller: 'Mbarga Harvest',
    seller_id: 'f3',
    image_url: null,
    prediction_direction: 'down',
    prediction_confidence: 64,
  },
  {
    id: '4',
    title: 'Fresh Plantains',
    crop_type: 'Fruits',
    price_xaf: 600,
    unit: 'bunch',
    quantity_available: 150,
    region: 'Littoral',
    seller: 'Bamileke Farms',
    seller_id: 'f4',
    image_url: null,
    prediction_direction: 'up',
    prediction_confidence: 80,
  },
  {
    id: '5',
    title: 'Palm Oil',
    crop_type: 'Oils',
    price_xaf: 1200,
    unit: 'litre',
    quantity_available: 300,
    region: 'South West',
    seller: 'Fako Produce',
    seller_id: 'f5',
    image_url: null,
    prediction_direction: 'stable',
    prediction_confidence: 60,
  },
  {
    id: '6',
    title: 'Cocoyam',
    crop_type: 'Tubers',
    price_xaf: 400,
    unit: 'kg',
    quantity_available: 400,
    region: 'North West',
    seller: 'Mezam Agro',
    seller_id: 'f6',
    image_url: null,
    prediction_direction: 'up',
    prediction_confidence: 68,
  },
];

const CROP_EMOJI = {
  Grains: '🌽',
  Vegetables: '🍅',
  Tubers: '🥔',
  Fruits: '🍌',
  Oils: '🫙',
  All: '🛒',
};

function TrendChip({ direction, confidence }) {
  const config = {
    up: {
      bg: COLORS.upBg,
      color: COLORS.up,
      text: '▲ Rising',
    },
    down: {
      bg: COLORS.downBg,
      color: COLORS.down,
      text: '▼ Falling',
    },
    stable: {
      bg: COLORS.stableBg,
      color: COLORS.stable,
      text: '● Stable',
    },
  };

  const c = config[direction] || config.stable;

  return (
    <View
      style={[
        styles.trendChip,
        {
          backgroundColor: c.bg,
        },
      ]}
    >
      <Text
        style={[
          styles.trendText,
          {
            color: c.color,
          },
        ]}
      >
        {c.text}
      </Text>
    </View>
  );
}

export default function MarketplaceScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cartNoticeVisible, setCartNoticeVisible] = useState(false);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const cartNoticeTimer = useRef(null);

  const { user } = useAuth();
  const { addToCart, cartCount } = useCart();

  // ---------------------------------------------------------
  // FETCH PRODUCTS
  // ---------------------------------------------------------

  const fetchListings = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(`${API_BASE}/products`);

      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data)) {
          setProducts(data.map((item) => ({
            ...item,
            seller_id: item.seller_id || item.farmer_id,
            seller: item.seller || 'Farmer',
          })));
        }
      }
    } catch (_) {
      // Keep mock data if backend is offline
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    return () => clearTimeout(cartNoticeTimer.current);
  }, []);

  useFocusEffect(useCallback(() => {
    fetchListings();
  }, []));

  const showCartNotice = () => {
    clearTimeout(cartNoticeTimer.current);
    setCartNoticeVisible(true);
    cartNoticeTimer.current = setTimeout(() => setCartNoticeVisible(false), 2000);
  };

  const selectedQuantity = (item) => selectedQuantities[item.id] || 1;
  const changeSelectedQuantity = (item, change) => {
    const available = Math.max(1, Number(item.quantity_available) || 1);
    setSelectedQuantities((current) => ({
      ...current,
      [item.id]: Math.min(available, Math.max(1, (current[item.id] || 1) + change)),
    }));
  };

  // ---------------------------------------------------------
  // FILTER PRODUCTS
  // ---------------------------------------------------------

  const filtered = products.filter((p) => {
    const isOwnListing = user?.role === 'farmer'
      && String(p.farmer_id || p.seller_id) === String(user.id);
    const matchCat =
      category === 'All' || p.crop_type === category;

    const matchSearch =
      !search ||
      p.title
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      p.region
        ?.toLowerCase()
        .includes(search.toLowerCase());

    return !isOwnListing && matchCat && matchSearch;
  });

  // ---------------------------------------------------------
  // PRODUCT CARD
  // ---------------------------------------------------------

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.title}`}
    >

      {/* Product Image */}
      <View style={styles.cardImageWrap}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.cardImage}
          />
        ) : (
          <View style={styles.cardImageFallback}>
            <Text style={styles.cardEmoji}>
              {CROP_EMOJI[item.crop_type] || '🌱'}
            </Text>
          </View>
        )}

        {/* Region */}
        <View style={styles.regionBadge}>
          <Text style={styles.regionText}>
            {item.region}
          </Text>
        </View>
      </View>

      {/* Product Information */}
      <View style={styles.cardBody}>

        <Text
          style={styles.productTitle}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>
            {(Number(item.price_xaf || 0) * selectedQuantity(item)).toLocaleString()} FCFA
          </Text>

          <Text style={styles.productUnit}>
            {selectedQuantity(item) === 1 ? `/${item.unit}` : ` for ${selectedQuantity(item)} ${item.unit}`}
          </Text>
        </View>

        {/* Price Trend */}
        <TrendChip
          direction={item.prediction_direction}
          confidence={item.prediction_confidence}
        />

        {/* Seller */}
        <TouchableOpacity
          style={styles.sellerLink}
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate('FarmerProfile', {
              sellerName: item.seller,
              sellerId: item.seller_id,
            })
          }
        >
          <Text style={styles.sellerText}>
            👨‍🌾 {item.seller || 'Unknown Seller'}
          </Text>
        </TouchableOpacity>

        {/* Add To Cart */}
        <View style={styles.cardActions}>
          <View style={styles.cardQuantity}>
            <TouchableOpacity style={styles.cardQtyBtn} onPress={() => changeSelectedQuantity(item, -1)}><Text style={styles.cardQtyText}>−</Text></TouchableOpacity>
            <TextInput
              style={styles.cardQtyInput}
              value={String(selectedQuantity(item))}
              onChangeText={(value) => {
                const available = Math.max(1, Number(item.quantity_available) || 1);
                const requested = Number(value.replace(/\D/g, ''));
                setSelectedQuantities((current) => ({ ...current, [item.id]: Math.min(available, Math.max(1, requested || 1)) }));
              }}
              keyboardType="number-pad"
              selectTextOnFocus
              accessibilityLabel={`Quantity for ${item.title}`}
            />
            <TouchableOpacity style={styles.cardQtyBtn} onPress={() => changeSelectedQuantity(item, 1)}><Text style={styles.cardQtyText}>+</Text></TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.buyBtn}
            activeOpacity={0.8}
            onPress={async () => {
              await addToCart(item, selectedQuantity(item));
              showCartNotice();
            }}
          >
            <Text style={styles.buyBtnText}>
              Add to Cart
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </TouchableOpacity>
  );

  // ---------------------------------------------------------
  // MAIN UI
  // ---------------------------------------------------------

  return (
    <View style={styles.container}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* =====================================================
          HEADER
      ====================================================== */}

      <View style={[styles.header, { paddingTop: insets.top }]}>

        {/* Header Top */}
        <View style={styles.headerTop}>

          <View>
            <Text style={styles.headerTitle}>
              Theraprice
            </Text>

            <Text style={styles.headerSub}>
              Agricultural Marketplace
            </Text>
          </View>

          {/* Cart */}
          <TouchableOpacity
            style={styles.cartBtn}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('Cart')
            }
          >
            <Text style={styles.cartIcon}>
              🛒
            </Text>

            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

        </View>

        {/* Search */}
        <View style={styles.searchBox}>

          <Text style={styles.searchIcon}>
            🔍
          </Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search crops, regions..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={search}
            onChangeText={setSearch}
          />

          {/* Clear Search */}
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              style={styles.clearSearch}
            >
              <Text style={styles.clearSearchText}>
                ✕
              </Text>
            </TouchableOpacity>
          )}

        </View>

      </View>

      {/* =====================================================
          CATEGORY NAVIGATION
      ====================================================== */}

      <View style={styles.categoryContainer}>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          bounces={false}
        >

          {CATEGORIES.map((cat) => {

            const isActive = category === cat;

            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                style={[
                  styles.categoryButton,
                  isActive &&
                  styles.categoryButtonActive,
                ]}
                onPress={() =>
                  setCategory(cat)
                }
              >

                <Text
                  style={[
                    styles.categoryIcon,
                    isActive &&
                    styles.categoryIconActive,
                  ]}
                >
                  {CROP_EMOJI[cat]}
                </Text>

                <Text
                  style={[
                    styles.categoryText,
                    isActive &&
                    styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>

              </TouchableOpacity>
            );
          })}

        </ScrollView>

      </View>

      {/* =====================================================
          PRODUCTS
      ====================================================== */}

      {loading ? (

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text style={styles.loadingText}>
            Loading products...
          </Text>
        </View>

      ) : (

        <FlatList
          data={filtered}
          keyExtractor={(item) =>
            String(item.id)
          }
          renderItem={renderProduct}
          contentContainerStyle={
            styles.listContent
          }
          numColumns={2}
          columnWrapperStyle={
            styles.columnWrapper
          }

          showsVerticalScrollIndicator={false}

          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                fetchListings(true)
              }
              colors={[COLORS.primary]}
            />
          }

          ListHeaderComponent={
            <View style={styles.resultsHeader}>

              <View>
                <Text style={styles.resultsTitle}>
                  {category === 'All'
                    ? 'All Products'
                    : category}
                </Text>

                <Text style={styles.resultsCount}>
                  {filtered.length}{' '}
                  {filtered.length === 1
                    ? 'product'
                    : 'products'}{' '}
                  available
                </Text>
              </View>

            </View>
          }

          ListEmptyComponent={
            <View style={styles.emptyState}>

              <Text style={styles.emptyEmoji}>
                🌾
              </Text>

              <Text style={styles.emptyText}>
                No products found
              </Text>

              <Text style={styles.emptySubText}>
                Try a different search or category
              </Text>

              <TouchableOpacity
                style={styles.resetButton}
                activeOpacity={0.8}
                onPress={() => {
                  setSearch('');
                  setCategory('All');
                }}
              >
                <Text style={styles.resetButtonText}>
                  View All Products
                </Text>
              </TouchableOpacity>

            </View>
          }
        />

      )}

      <CartAddedToast visible={cartNoticeVisible} />
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  // ----------------------------------------------------------
  // MAIN CONTAINER
  // ----------------------------------------------------------

  container: {
    flex: 1,
    backgroundColor: COLORS.paperDim,
  },

  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  header: {
    backgroundColor: COLORS.primaryMid,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    paddingTop: 14,
    marginBottom: 14,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 2,
  },

  // ----------------------------------------------------------
  // CART
  // ----------------------------------------------------------

  cartBtn: {
    position: 'relative',

    width: 46,
    height: 46,

    borderRadius: 15,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(255,255,255,0.14)',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.18)',
  },

  cartIcon: {
    fontSize: 23,
  },

  cartBadge: {
    position: 'absolute',

    top: -4,
    right: -4,

    minWidth: 20,
    height: 20,

    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 5,

    backgroundColor: COLORS.rust,

    borderWidth: 2,
    borderColor: COLORS.primaryMid,
  },

  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  searchBox: {
    height: 48,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      'rgba(255,255,255,0.16)',

    borderRadius: 15,

    paddingHorizontal: 14,

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.12)',
  },

  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,

    height: '100%',

    fontSize: 14,

    color: '#FFFFFF',

    paddingVertical: 0,
  },

  clearSearch: {
    width: 28,
    height: 28,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(255,255,255,0.15)',
  },

  clearSearchText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ----------------------------------------------------------
  // CATEGORY BAR
  // ----------------------------------------------------------

  categoryContainer: {
    backgroundColor: COLORS.paper,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,

    elevation: 4,

    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    zIndex: 10,
  },

  chipsRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,

    gap: 10,

    alignItems: 'center',
  },

  // ----------------------------------------------------------
  // CATEGORY BUTTON
  // ----------------------------------------------------------

  categoryButton: {
    minWidth: 94,
    height: 52,

    paddingHorizontal: 15,

    borderRadius: 16,

    backgroundColor: COLORS.paperDim,

    borderWidth: 1,
    borderColor: COLORS.line,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,
  },

  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,

    elevation: 4,

    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  categoryIcon: {
    fontSize: 19,
  },

  categoryIconActive: {
    fontSize: 20,
  },

  categoryText: {
    fontSize: 14,

    fontWeight: '600',

    color: COLORS.ink,
  },

  categoryTextActive: {
    color: '#FFFFFF',

    fontWeight: '800',
  },

  // ----------------------------------------------------------
  // RESULTS HEADER
  // ----------------------------------------------------------

  resultsHeader: {
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 14,

    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  resultsTitle: {
    fontSize: 19,

    fontWeight: '800',

    color: COLORS.ink,
  },

  resultsCount: {
    fontSize: 12,

    color: COLORS.inkSoft,

    marginTop: 3,
  },

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  loadingContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,

    fontSize: 13,

    color: COLORS.inkSoft,
  },

  // ----------------------------------------------------------
  // PRODUCT LIST
  // ----------------------------------------------------------

  listContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 30,

    flexGrow: 1,
  },

  columnWrapper: {
    gap: 10,

    marginBottom: 10,
  },

  // ----------------------------------------------------------
  // PRODUCT CARD
  // ----------------------------------------------------------

  card: {
    flex: 1,

    backgroundColor: COLORS.paper,

    borderRadius: RADIUS.lg,

    overflow: 'hidden',

    borderWidth: 1,

    borderColor: COLORS.line,

    ...SHADOW.small,
  },

  cardImageWrap: {
    position: 'relative',
  },

  cardImage: {
    width: '100%',
    height: 120,
  },

  cardImageFallback: {
    width: '100%',
    height: 120,

    backgroundColor: COLORS.paperDim,

    alignItems: 'center',
    justifyContent: 'center',
  },

  cardEmoji: {
    fontSize: 42,
  },

  regionBadge: {
    position: 'absolute',

    bottom: 7,
    left: 7,

    backgroundColor:
      'rgba(0,0,0,0.58)',

    paddingHorizontal: 8,
    paddingVertical: 4,

    borderRadius: 7,
  },

  regionText: {
    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '700',
  },

  // ----------------------------------------------------------
  // PRODUCT BODY
  // ----------------------------------------------------------

  cardBody: {
    padding: 10,
  },

  productTitle: {
    fontSize: 14,

    fontWeight: '700',

    color: COLORS.ink,

    marginBottom: 5,
  },

  priceRow: {
    flexDirection: 'row',

    alignItems: 'baseline',

    gap: 2,

    marginBottom: 7,
  },

  productPrice: {
    fontSize: 16,

    fontWeight: '800',

    color: COLORS.primary,
  },

  productUnit: {
    fontSize: 11,

    color: COLORS.inkSoft,
  },

  // ----------------------------------------------------------
  // TREND
  // ----------------------------------------------------------

  trendChip: {
    paddingHorizontal: 8,

    paddingVertical: 4,

    borderRadius: 7,

    alignSelf: 'flex-start',

    marginBottom: 7,
  },

  trendText: {
    fontSize: 10,

    fontWeight: '800',
  },

  // ----------------------------------------------------------
  // SELLER
  // ----------------------------------------------------------

  sellerLink: {
    marginBottom: 9,
  },

  sellerText: {
    fontSize: 11.5,

    color: COLORS.teal,

    fontWeight: '600',
  },

  // ----------------------------------------------------------
  // BUY BUTTON
  // ----------------------------------------------------------

  cardActions: {
    width: '100%',
  },

  cardQuantity: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    marginBottom: 8,
  },

  cardQtyBtn: {
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.paperDim, borderWidth: 1, borderColor: COLORS.line,
  },

  cardQtyText: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },

  cardQtyValue: { color: COLORS.ink, fontSize: 15, fontWeight: '800', minWidth: 22, textAlign: 'center' },

  cardQtyInput: { color: COLORS.ink, fontSize: 14, fontWeight: '800', width: 46, height: 32, textAlign: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 0 },

  buyBtn: {
    backgroundColor: COLORS.accent,

    paddingVertical: 9,

    borderRadius: RADIUS.pill,

    alignItems: 'center',

    justifyContent: 'center',
  },

  buyBtnText: {
    color: COLORS.ink,

    fontWeight: '800',

    fontSize: 13,
  },

  // ----------------------------------------------------------
  // EMPTY STATE
  // ----------------------------------------------------------

  emptyState: {
    alignItems: 'center',

    paddingTop: 70,

    paddingHorizontal: 25,
  },

  emptyEmoji: {
    fontSize: 56,

    marginBottom: 12,
  },

  emptyText: {
    fontSize: 19,

    fontWeight: '800',

    color: COLORS.ink,

    marginBottom: 6,
  },

  emptySubText: {
    fontSize: 14,

    color: COLORS.inkSoft,

    textAlign: 'center',

    marginBottom: 18,
  },

  resetButton: {
    backgroundColor: COLORS.primary,

    paddingHorizontal: 20,

    paddingVertical: 11,

    borderRadius: RADIUS.pill,
  },

  resetButtonText: {
    color: '#FFFFFF',

    fontSize: 13,

    fontWeight: '700',
  },
});
