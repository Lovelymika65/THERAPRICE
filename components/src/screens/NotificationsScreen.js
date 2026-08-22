import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../api/apiConfig';

const TYPE_CONFIG = {
  new_product: { icon: '🌾', bg: COLORS.greenLight },
  market_price: { icon: '📊', bg: COLORS.tealBg },
  price_drop: { icon: '📉', bg: COLORS.tealBg },
  delivery_confirmation: { icon: '📦', bg: COLORS.upBg },
  order_received: { icon: '🛒', bg: COLORS.greenLight },
  payment_confirmation: { icon: '💰', bg: COLORS.upBg },
  verification_status: { icon: '🛡️', bg: COLORS.greenLight },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { token, user } = useAuth();
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!token || !user?.id) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/notifications/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (_) {
      // Retain the last successful result while offline.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.id]);

  useFocusEffect(useCallback(() => { fetchNotifications(); }, [fetchNotifications]));

  const markRead = (id) => setNotifications((previous) => previous.map((notification) => (
    notification.id === id ? { ...notification, read: true } : notification
  )));
  const markAllRead = () => setNotifications((previous) => previous.map((notification) => ({ ...notification, read: true })));

  const renderItem = ({ item }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.new_product;
    return (
      <TouchableOpacity style={[styles.card, !item.read && styles.cardUnread]} onPress={() => markRead(item.id)} activeOpacity={0.8}>
        <View style={[styles.iconWrap, { backgroundColor: config.bg }]}><Text style={styles.icon}>{config.icon}</Text></View>
        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const emptyMessage = user?.role === 'farmer'
    ? 'New products, customer purchases, and payment confirmations will appear here.'
    : 'New products, market price changes, and delivery confirmations will appear here.';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Notifications 🔔</Text>
          <Text style={styles.headerSub}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}><Text style={styles.markAllText}>Mark all read</Text></TouchableOpacity>
        )}
      </View>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} /> : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchNotifications(true)} colors={[COLORS.primary]} />}
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔕</Text>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paperDim },
  header: { backgroundColor: COLORS.primaryMid, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 18, paddingHorizontal: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  markAllBtn: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill },
  markAllText: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  listContent: { padding: 14, gap: 10, flexGrow: 1 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: COLORS.line, ...SHADOW.small },
  cardUnread: { backgroundColor: '#F0F7E8', borderColor: COLORS.primaryMid },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  cardBody: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  notifTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.ink },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  notifMessage: { fontSize: 13, color: COLORS.inkSoft, lineHeight: 19, marginBottom: 6 },
  notifTime: { fontSize: 11, color: COLORS.inkSoft },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyEmoji: { fontSize: 54 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.ink },
  emptyText: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center', paddingHorizontal: 30 },
});
