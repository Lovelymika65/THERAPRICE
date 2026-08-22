import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout, isLoggedIn } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Theraprice?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  if (!isLoggedIn || !user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.guestContent}>
          <Text style={styles.guestEmoji}>👤</Text>
          <Text style={styles.guestTitle}>You are not signed in</Text>
          <Text style={styles.guestSub}>
            Sign in or create an account to manage orders, produce listings, and price alerts.
          </Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.btnText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header Band */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Account & Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.full_name || user?.name || user?.phone || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.full_name || user?.name || 'Theraprice Member'}</Text>
            <Text style={styles.userPhone}>{user?.phone || user?.email || 'Active User'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {(user?.role || 'Buyer').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Farmer Dashboard Shortcut (If Farmer) */}
        {user?.role === 'farmer' && (
          <View style={styles.farmerSection}>
            <Text style={styles.sectionHeader}>Farmer Management</Text>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('FarmerListings')}
            >
              <Text style={styles.actionIcon}>🌾</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>My Produce Listings</Text>
                <Text style={styles.actionSub}>View & manage your posted harvest</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Settings */}
        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.cardSection}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingSub}>Receive order updates and status alerts</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.line, true: COLORS.primaryMid }}
              thumbColor={COLORS.paper}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Crop Price Alert Notifications</Text>
              <Text style={styles.settingSub}>Alert me when tracked market prices shift</Text>
            </View>
            <Switch
              value={priceAlertsEnabled}
              onValueChange={setPriceAlertsEnabled}
              trackColor={{ false: COLORS.line, true: COLORS.primaryMid }}
              thumbColor={COLORS.paper}
            />
          </View>
        </View>

        {/* App Info & Escrow info */}
        <Text style={styles.sectionHeader}>Security & Trust</Text>
        <View style={styles.cardSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Theraprice Escrow Protection</Text>
              <Text style={styles.infoSub}>All Mobile Money payments are secured until delivery is confirmed.</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Theraprice App v2.5.5 (Mobile Edition)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paperDim },
  header: {
    backgroundColor: COLORS.primaryMid,
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },

  content: { padding: 16, paddingBottom: 40 },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    ...SHADOW.small,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: '#FFFFFF' },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '700', color: COLORS.ink },
  userPhone: { fontSize: 13, color: COLORS.inkSoft, marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginTop: 6,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },

  farmerSection: { marginBottom: 20 },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    ...SHADOW.small,
  },
  actionIcon: { fontSize: 24, marginRight: 12 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.ink },
  actionSub: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2 },
  chevron: { fontSize: 18, color: COLORS.inkSoft },

  cardSection: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    ...SHADOW.small,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTitle: { fontSize: 15, fontWeight: '600', color: COLORS.ink },
  settingSub: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2, paddingRight: 8 },
  divider: { height: 1, backgroundColor: COLORS.line, marginVertical: 14 },

  infoRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  infoIcon: { fontSize: 22 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
  infoSub: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2 },

  logoutBtn: {
    backgroundColor: COLORS.rustBg,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.rust,
    marginTop: 8,
    marginBottom: 20,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.rust },

  versionText: {
    fontSize: 12,
    color: COLORS.inkSoft,
    textAlign: 'center',
    marginBottom: 10,
  },

  guestContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  guestEmoji: { fontSize: 60, marginBottom: 16 },
  guestTitle: { fontSize: 20, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },
  guestSub: {
    fontSize: 14,
    color: COLORS.inkSoft,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
  },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
