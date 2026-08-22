import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

export default function FarmerProfileScreen({ route, navigation }) {
  const { sellerName = 'Verified Farmer', sellerId } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryMid} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{sellerName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{sellerName}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified Producer</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ 4.9 (48 reviews)</Text>
            </View>
          </View>
          <Text style={styles.bio}>
            Specialized in organic and high-grade seasonal produce with direct farm-to-table freshness.
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>120+</Text>
            <Text style={styles.statLabel}>Orders Fulfilled</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>98%</Text>
            <Text style={styles.statLabel}>On-time Delivery</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Escrow Protected</Text>
          </View>
        </View>

        {/* Harvest Verification Notice */}
        <View style={styles.verifyCard}>
          <Text style={styles.verifyIcon}>🌱</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.verifyTitle}>Produce Authenticity</Text>
            <Text style={styles.verifyDesc}>
              This farmer's listings undergo Theraprice quality and regional spot checks before dispatch.
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.browseListingsBtn}
          onPress={() => navigation.navigate('Marketplace')}
        >
          <Text style={styles.browseListingsText}>Browse Farmer's Active Listings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paperDim },
  header: {
    backgroundColor: COLORS.primaryMid,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  backBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  content: { padding: 16, paddingBottom: 40 },

  profileCard: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
    ...SHADOW.medium,
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },

  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  verifiedBadge: {
    backgroundColor: COLORS.upBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  verifiedText: { color: COLORS.up, fontSize: 12, fontWeight: '700' },
  ratingBadge: {
    backgroundColor: COLORS.stableBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  ratingText: { color: COLORS.stable, fontSize: 12, fontWeight: '700' },

  bio: {
    fontSize: 14,
    color: COLORS.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
    ...SHADOW.small,
  },
  statNumber: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.inkSoft, marginTop: 4, textAlign: 'center' },

  verifyCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EEF5E6',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 20,
    alignItems: 'center',
  },
  verifyIcon: { fontSize: 24 },
  verifyTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  verifyDesc: { fontSize: 12, color: COLORS.inkSoft, lineHeight: 18 },

  browseListingsBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  browseListingsText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});