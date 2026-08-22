import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { fetchMyListings, fetchMyOrders } from '../api/farmerApi';

export default function FarmerDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPortal = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [listingData, orderData] = await Promise.all([
        fetchMyListings(token),
        fetchMyOrders(token),
      ]);
      setListings(Array.isArray(listingData) ? listingData : []);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    loadPortal();
  }, [loadPortal]));

  const liveListings = listings.filter((item) => ['verified', 'live'].includes(item.verification_status)).length;
  const grossSales = orders.reduce((sum, order) => sum + Number(order.subtotal_xaf || 0), 0);
  const projectedProceeds = orders.reduce((sum, order) => (
    sum + Number(order.farmer_40_amount_xaf || 0) + Number(order.farmer_57_amount_xaf || 0)
  ), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryMid} />
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.eyebrow}>FARMER PORTAL</Text>
        <Text style={styles.title}>Welcome, {user?.name || 'Farmer'}</Text>
        <Text style={styles.subtitle}>Manage produce, incoming orders and earnings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPortal(true)} />}
      >
        <View style={styles.verificationBanner}>
          <Text style={styles.verificationIcon}>🛡️</Text>
          <View style={styles.flex}>
            <Text style={styles.verificationTitle}>Farmer verification</Text>
            <Text style={styles.verificationText}>
              {user?.verification_status === 'verified'
                ? 'Verified farmer — buyers can see your trusted-farmer badge.'
                : user?.verification_documents_submitted
                  ? 'Your documents are pending admin review. Product posting unlocks after approval.'
                  : 'Your account is pending. Upload your documents when you try to add produce.'}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} />
        ) : (
          <>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.statsGrid}>
              <StatCard value={listings.length} label="My listings" />
              <StatCard value={liveListings} label="Live" />
              <StatCard value={listings.length - liveListings} label="Not live" />
              <StatCard value={orders.length} label="Orders received" />
            </View>

            <Text style={styles.sectionTitle}>Farmer management</Text>
            <ActionCard
              icon="🌾"
              title="My Produce Listings"
              subtitle="Post produce directly to the buyer marketplace"
              onPress={() => navigation.navigate('FarmerListings')}
            />
            <ActionCard
              icon="🛡️"
              title="Farmer Verification"
              subtitle={user?.verification_status === 'verified' ? 'Your farmer identity is verified' : 'Upload identity and farming documents for admin review'}
              onPress={() => navigation.navigate('FarmerVerification')}
            />
            <ActionCard
              icon="🧾"
              title="Received Orders"
              subtitle={`${orders.length} order${orders.length === 1 ? '' : 's'} from buyers`}
            />
            <ActionCard
              icon="💰"
              title="Sales & Payouts"
              subtitle={`${projectedProceeds.toLocaleString()} FCFA projected proceeds from ${grossSales.toLocaleString()} FCFA gross sales`}
            />

            <Text style={styles.sectionTitle}>Shared tools</Text>
            <View style={styles.quickRow}>
              <QuickButton label="Marketplace" icon="🛒" onPress={() => navigation.navigate('Marketplace')} />
              <QuickButton label="Forecasts" icon="📊" onPress={() => navigation.navigate('Forecast')} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ value, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} disabled={!onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <View style={styles.flex}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      {!!onPress && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

function QuickButton({ label, icon, onPress }) {
  return (
    <TouchableOpacity style={styles.quickButton} onPress={onPress}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paperDim },
  header: { backgroundColor: COLORS.primaryMid, paddingHorizontal: 20, paddingBottom: 22 },
  eyebrow: { color: '#CDE7B5', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 5 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  content: { padding: 16, paddingBottom: 42 },
  verificationBanner: {
    flexDirection: 'row', gap: 12, backgroundColor: '#EEF5E6', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: '#C9DDB5', padding: 14, marginBottom: 16,
  },
  verificationIcon: { fontSize: 24 },
  verificationTitle: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
  verificationText: { color: COLORS.inkSoft, fontSize: 12, lineHeight: 18, marginTop: 3 },
  flex: { flex: 1 },
  loader: { marginVertical: 36 },
  error: { color: COLORS.rust, fontSize: 13, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48%', backgroundColor: COLORS.paper, borderRadius: RADIUS.lg,
    padding: 15, borderWidth: 1, borderColor: COLORS.line, ...SHADOW.small,
  },
  statValue: { color: COLORS.primary, fontSize: 23, fontWeight: '800' },
  statLabel: { color: COLORS.inkSoft, fontSize: 12, marginTop: 4 },
  sectionTitle: {
    color: COLORS.inkSoft, fontSize: 13, fontWeight: '800', textTransform: 'uppercase',
    letterSpacing: 0.6, marginTop: 22, marginBottom: 9,
  },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg, padding: 15, borderWidth: 1, borderColor: COLORS.line,
    marginBottom: 10, ...SHADOW.small,
  },
  actionIcon: { fontSize: 25, marginRight: 12 },
  actionTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '700' },
  actionSubtitle: { color: COLORS.inkSoft, fontSize: 12, marginTop: 3, lineHeight: 17 },
  chevron: { color: COLORS.primary, fontSize: 26, marginLeft: 8 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickButton: {
    flex: 1, backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.line,
  },
  quickIcon: { fontSize: 27 },
  quickLabel: { color: COLORS.ink, fontSize: 13, fontWeight: '700', marginTop: 7 },
});
