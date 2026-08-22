import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteAdminAccount, decideFarmerVerification, fetchAdminAccounts, fetchFarmerVerificationQueue, setAccountSuspended } from '../api/farmerApi';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardScreen({ navigation }) {
  const { token, logout } = useAuth();
  const [farmers, setFarmers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [reasons, setReasons] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingId, setWorkingId] = useState(null);

  const loadQueue = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const [queue, allAccounts] = await Promise.all([
        fetchFarmerVerificationQueue(token), fetchAdminAccounts(token),
      ]);
      setFarmers(Array.isArray(queue) ? queue : []);
      setAccounts(Array.isArray(allAccounts) ? allAccounts : []);
    } catch (error) {
      Alert.alert('Unable to load review queue', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadQueue(); }, [loadQueue]));

  const decide = async (farmer, approved) => {
    const reason = reasons[farmer.id]?.trim();
    if (!approved && !reason) {
      Alert.alert('Rejection reason required', 'Enter a reason so the farmer knows what to correct.');
      return;
    }
    setWorkingId(farmer.id);
    try {
      await decideFarmerVerification(token, farmer.id, approved, reason || null);
      setFarmers((current) => current.filter((item) => item.id !== farmer.id));
      Alert.alert(approved ? 'Farmer approved' : 'Verification rejected', approved
        ? `${farmer.name} can now publish products to buyers.`
        : `${farmer.name} was notified to correct and resubmit the documents.`);
    } catch (error) {
      Alert.alert('Unable to save decision', error.message);
    } finally {
      setWorkingId(null);
    }
  };

  const signOut = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'SignUp' }] });
  };

  const toggleSuspension = async (account) => {
    setWorkingId(account.id);
    try {
      await setAccountSuspended(token, account.id, !account.suspended, reasons[account.id]?.trim() || null);
      await loadQueue(true);
    } catch (error) {
      Alert.alert('Unable to update account', error.message);
    } finally {
      setWorkingId(null);
    }
  };

  const confirmDelete = (account) => Alert.alert(
    'Delete account permanently?',
    `${account.name}'s account and marketplace content will be removed. This cannot be undone.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setWorkingId(account.id);
        try {
          await deleteAdminAccount(token, account.id);
          setAccounts((current) => current.filter((item) => item.id !== account.id));
          setFarmers((current) => current.filter((item) => item.id !== account.id));
        } catch (error) {
          Alert.alert('Unable to delete account', error.message);
        } finally {
          setWorkingId(null);
        }
      } },
    ],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryMid} />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <View><Text style={styles.headerTitle}>Admin Portal</Text><Text style={styles.headerSub}>{farmers.length} pending farmer{farmers.length === 1 ? '' : 's'}</Text></View>
          <TouchableOpacity onPress={signOut} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
      {loading ? <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} /> : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadQueue(true)} />}>
          <Text style={styles.sectionTitle}>Farmer verification queue</Text>
          <Text style={styles.sectionText}>Check each ID, profile photo, and land certificate before approving the account.</Text>
          {!farmers.length ? (
            <View style={styles.empty}><Text style={styles.emptyIcon}>✅</Text><Text style={styles.emptyTitle}>No pending reviews</Text></View>
          ) : farmers.map((farmer) => (
            <View key={farmer.id} style={styles.card}>
              <Text style={styles.name}>{farmer.name}</Text>
              <Text style={styles.meta}>{farmer.phone} · {farmer.location}</Text>
              <Text style={styles.idNumber}>ID number: {farmer.national_id_number}</Text>
              <View style={styles.documents}>
                <DocumentPreview title="Government ID" uri={farmer.id_front_data_url} />
                <DocumentPreview title="Profile photo" uri={farmer.selfie_data_url} />
                <DocumentPreview title="Land certificate" uri={farmer.farm_proof_documents?.[0]} />
              </View>
              <TextInput
                style={styles.reason}
                value={reasons[farmer.id] || ''}
                onChangeText={(value) => setReasons((current) => ({ ...current, [farmer.id]: value }))}
                placeholder="Reason if rejecting"
                placeholderTextColor={COLORS.inkSoft}
              />
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.action, styles.reject]} disabled={workingId === farmer.id} onPress={() => decide(farmer, false)}><Text style={styles.rejectText}>Reject</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.action, styles.approve]} disabled={workingId === farmer.id} onPress={() => decide(farmer, true)}>
                  {workingId === farmer.id ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.approveText}>Approve farmer</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <Text style={[styles.sectionTitle, styles.accountsTitle]}>Account management</Text>
          <Text style={styles.sectionText}>Suspend access temporarily, reactivate an account, or delete it permanently.</Text>
          {accounts.map((account) => (
            <View key={account.id} style={styles.accountCard}>
              <View style={styles.accountTop}>
                <View style={styles.flex}><Text style={styles.name}>{account.name}</Text><Text style={styles.meta}>{account.role} · {account.phone || account.email}</Text></View>
                <Text style={[styles.status, account.suspended && styles.suspendedStatus]}>{account.suspended ? 'Suspended' : account.verification_status}</Text>
              </View>
              {!account.suspended && <TextInput style={styles.reason} value={reasons[account.id] || ''} onChangeText={(value) => setReasons((current) => ({ ...current, [account.id]: value }))} placeholder="Optional suspension reason" placeholderTextColor={COLORS.inkSoft} />}
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.action, account.suspended ? styles.approve : styles.suspend]} disabled={workingId === account.id} onPress={() => toggleSuspension(account)}>
                  <Text style={account.suspended ? styles.approveText : styles.suspendText}>{account.suspended ? 'Reactivate' : 'Suspend'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.action, styles.delete]} disabled={workingId === account.id} onPress={() => confirmDelete(account)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function DocumentPreview({ title, uri }) {
  const isImage = typeof uri === 'string' && uri.startsWith('data:image/');
  return <View style={styles.document}><Text style={styles.documentTitle}>{title}</Text>{isImage ? <Image source={{ uri }} style={styles.documentImage} /> : <View style={styles.pdf}><Text style={styles.pdfText}>{uri ? 'PDF attached' : 'Missing'}</Text></View>}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paperDim }, headerSafe: { backgroundColor: COLORS.primaryMid },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' }, headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  signOut: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 8 }, signOutText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  loader: { marginTop: 70 }, content: { padding: 16, paddingBottom: 40 }, sectionTitle: { color: COLORS.ink, fontSize: 20, fontWeight: '800' }, sectionText: { color: COLORS.inkSoft, fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 15 },
  empty: { backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: COLORS.line }, emptyIcon: { fontSize: 42 }, emptyTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '800', marginTop: 9 },
  card: { backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.line, padding: 15, marginBottom: 14, ...SHADOW.small },
  accountsTitle: { marginTop: 18 }, accountCard: { backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.line, padding: 14, marginBottom: 10 },
  accountTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, flex: { flex: 1 }, status: { color: COLORS.primary, backgroundColor: COLORS.greenLight, borderRadius: RADIUS.pill, paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: '800', textTransform: 'capitalize' }, suspendedStatus: { color: COLORS.rust, backgroundColor: COLORS.rustBg },
  name: { color: COLORS.ink, fontSize: 18, fontWeight: '800' }, meta: { color: COLORS.inkSoft, fontSize: 12, marginTop: 3 }, idNumber: { color: COLORS.ink, fontSize: 13, fontWeight: '700', marginTop: 10 },
  documents: { flexDirection: 'row', gap: 8, marginTop: 12 }, document: { flex: 1 }, documentTitle: { color: COLORS.inkSoft, fontSize: 10, fontWeight: '700', marginBottom: 5 }, documentImage: { width: '100%', aspectRatio: 1, borderRadius: RADIUS.sm, backgroundColor: COLORS.paperDim },
  pdf: { width: '100%', aspectRatio: 1, borderRadius: RADIUS.sm, backgroundColor: COLORS.paperDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line }, pdfText: { color: COLORS.inkSoft, fontSize: 10, textAlign: 'center' },
  reason: { backgroundColor: COLORS.paperDim, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.sm, color: COLORS.ink, paddingHorizontal: 12, paddingVertical: 10, marginTop: 13 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 11 }, action: { flex: 1, alignItems: 'center', borderRadius: RADIUS.pill, paddingVertical: 12 }, reject: { backgroundColor: COLORS.rustBg }, approve: { backgroundColor: COLORS.primary }, suspend: { backgroundColor: '#FFF4D6' }, delete: { backgroundColor: COLORS.rustBg }, rejectText: { color: COLORS.rust, fontWeight: '800' }, approveText: { color: '#FFFFFF', fontWeight: '800' }, suspendText: { color: '#735400', fontWeight: '800' }, deleteText: { color: COLORS.rust, fontWeight: '800' },
});
