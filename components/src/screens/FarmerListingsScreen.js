import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { createMyListing, fetchCurrentUser, fetchMyListings, submitFarmerVerification } from '../api/farmerApi';

const CATEGORIES = ['Vegetables', 'Tubers', 'Fruits', 'Spices', 'Grains'];
const UNITS = ['kg', 'bag', 'basket', 'bunch', 'crate'];

const EMPTY_FORM = {
  title: '', category: 'Vegetables', unit: 'kg', price: '', quantity: '', description: '', image: null,
};

export default function FarmerListingsScreen({ navigation }) {
  const { token, user, updateUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [verification, setVerification] = useState({ idNumber: '', id: null, profile: null, landCertificate: null, contract: false });

  const loadListings = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [data, currentUser] = await Promise.all([fetchMyListings(token), fetchCurrentUser(token)]);
      setListings(Array.isArray(data) ? data : []);
      await updateUser(currentUser);
    } catch (error) {
      Alert.alert('Unable to load listings', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    loadListings();
  }, [loadListings]));

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const pickProductPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.65,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      const asset = result.assets[0];
      updateForm('image', `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`);
    }
  };

  const pickVerificationImage = async (key) => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, base64: true });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.base64) {
      setVerification((current) => ({ ...current, [key]: `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` }));
    }
  };

  const pickLandCertificate = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    try {
      const asset = result.assets[0];
      const encoded = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      setVerification((current) => ({ ...current, landCertificate: `data:${asset.mimeType || 'application/pdf'};base64,${encoded}` }));
    } catch (_) {
      Alert.alert('Unable to attach certificate', 'Choose an image or PDF stored on this device.');
    }
  };

  const submitVerificationInline = async () => {
    if (!verification.idNumber.trim() || !verification.id || !verification.profile || !verification.landCertificate || !verification.contract) {
      Alert.alert('Complete farmer verification', 'Add your ID number, ID image, profile picture, land certificate, and accept the declaration.');
      return;
    }
    setSaving(true);
    try {
      await submitFarmerVerification(token, {
        national_id_number: verification.idNumber.trim(), id_front_data_url: verification.id,
        id_back_data_url: null, selfie_data_url: verification.profile,
        farm_proof_documents: [verification.landCertificate], contract_signed: true,
        device_locator_enabled: false,
      });
      await updateUser({ verification_status: 'pending', verification_documents_submitted: true });
      setShowForm(false);
      Alert.alert('Sent to administrator', 'Your account is pending review. You can return here to post produce after approval.');
    } catch (error) {
      Alert.alert('Unable to submit documents', error.message);
    } finally {
      setSaving(false);
    }
  };

  const submitListing = async () => {
    if (user?.verification_status !== 'verified') {
      Alert.alert(
        'Farmer approval required',
        'Upload your ID, profile photo, and land certificate. Your account must be approved before products appear in the buyer marketplace.',
        [{ text: 'Upload documents', onPress: () => navigation.navigate('FarmerVerification') }],
      );
      return;
    }
    const price = Number(form.price);
    const quantity = Number(form.quantity);
    if (!form.image || !form.title.trim() || !form.description.trim() || !Number.isInteger(price) || price <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
      Alert.alert('Check listing', 'Add a product photo, name, description, positive whole-number price and quantity.');
      return;
    }
    setSaving(true);
    try {
      await createMyListing(token, {
        title: form.title.trim(),
        category: form.category,
        unit: form.unit,
        price_xaf: price,
        quantity_available: quantity,
        description: form.description.trim(),
        image_url: form.image,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadListings();
      Alert.alert('Product is live', 'Your produce is now visible in the buyer marketplace.');
    } catch (error) {
      Alert.alert('Unable to save listing', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryMid} />
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Produce Listings</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadListings(true)} />}
      >
        {user?.verification_status !== 'verified' && (
          <View style={styles.verificationGate}>
            <Text style={styles.gateTitle}>
              {user?.verification_documents_submitted ? 'Account approval pending' : 'Farmer verification required'}
            </Text>
            <Text style={styles.gateText}>
              {user?.verification_documents_submitted
                ? 'An administrator is reviewing your ID, profile photo, and land certificate. Products can be posted after approval.'
                : 'Your account is pending. Upload your ID, profile photo, and land certificate when you try to post produce.'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.addButton, user?.verification_status !== 'verified' && styles.pendingButton]}
          disabled={user?.verification_status !== 'verified' && user?.verification_documents_submitted}
          onPress={() => setShowForm((value) => !value)}
        >
          <Text style={styles.addButtonText}>
            {user?.verification_documents_submitted && user?.verification_status !== 'verified'
              ? 'Awaiting Admin Approval'
              : showForm ? 'Close Listing Form' : '+ Add Produce Listing'}
          </Text>
        </TouchableOpacity>

        {showForm && user?.verification_status !== 'verified' && !user?.verification_documents_submitted && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Verify before posting produce</Text>
            <Text style={styles.formHelp}>These details are reviewed once by an administrator. After approval, you can post products normally.</Text>
            <Field label="Government ID number" value={verification.idNumber} onChangeText={(value) => setVerification((current) => ({ ...current, idNumber: value }))} placeholder="ID, passport, or resident-card number" />
            <VerificationUpload title="Government ID image" value={verification.id} onPress={() => pickVerificationImage('id')} />
            <VerificationUpload title="Profile picture" value={verification.profile} onPress={() => pickVerificationImage('profile')} />
            <VerificationUpload title="Land certificate" value={verification.landCertificate} onPress={pickLandCertificate} />
            <TouchableOpacity style={styles.declaration} onPress={() => setVerification((current) => ({ ...current, contract: !current.contract }))}>
              <Text style={styles.check}>{verification.contract ? '☑' : '☐'}</Text><Text style={styles.declarationText}>I confirm these documents are genuine and belong to me.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitButton, saving && styles.disabled]} onPress={submitVerificationInline} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Send Documents to Admin</Text>}
            </TouchableOpacity>
          </View>
        )}

        {showForm && user?.verification_status === 'verified' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New produce listing</Text>
            <TouchableOpacity style={styles.photoPicker} onPress={pickProductPhoto}>
              {form.image
                ? <Image source={{ uri: form.image }} style={styles.photoPreview} />
                : <Text style={styles.photoPickerText}>+ Add product photo (required)</Text>}
            </TouchableOpacity>
            <Field label="Product name" value={form.title} onChangeText={(value) => updateForm('title', value)} placeholder="e.g. Fresh plantains" />

            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((category) => (
                <Chip key={category} label={category} selected={form.category === category} onPress={() => updateForm('category', category)} />
              ))}
            </View>

            <Text style={styles.label}>Selling unit</Text>
            <View style={styles.chipRow}>
              {UNITS.map((unit) => (
                <Chip key={unit} label={unit} selected={form.unit === unit} onPress={() => updateForm('unit', unit)} />
              ))}
            </View>

            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <Field label="Price (FCFA)" value={form.price} onChangeText={(value) => updateForm('price', value.replace(/\D/g, ''))} placeholder="500" keyboardType="number-pad" />
              </View>
              <View style={styles.column}>
                <Field label={`Quantity (${form.unit})`} value={form.quantity} onChangeText={(value) => updateForm('quantity', value.replace(/\D/g, ''))} placeholder="100" keyboardType="number-pad" />
              </View>
            </View>

            <Field label="Description" value={form.description} onChangeText={(value) => updateForm('description', value)} placeholder="Describe quality, harvest date and condition" multiline />
            <TouchableOpacity style={[styles.submitButton, saving && styles.disabled]} onPress={submitListing} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Publish Product</Text>}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Your listings ({listings.length})</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : listings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>No produce listed yet</Text>
            <Text style={styles.emptyText}>Use “Add Produce Listing” to submit your first harvest.</Text>
          </View>
        ) : listings.map((item) => (
          <View key={item.id} style={styles.listingCard}>
            <View style={styles.listingTop}>
              <View style={styles.flex}>
                <Text style={styles.listingTitle}>{item.title}</Text>
                <Text style={styles.listingMeta}>{item.quantity_available} {item.unit} available</Text>
              </View>
              <StatusPill status={item.verification_status} />
            </View>
            <Text style={styles.listingPrice}>{Number(item.price_xaf || 0).toLocaleString()} FCFA/{item.unit}</Text>
            {!!item.rejection_reason && <Text style={styles.rejection}>Reason: {item.rejection_reason}</Text>}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Field({ label, multiline = false, ...props }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={[styles.input, multiline && styles.multiline]}
        placeholderTextColor={COLORS.inkSoft}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function VerificationUpload({ title, value, onPress }) {
  return (
    <TouchableOpacity style={styles.verificationUpload} onPress={onPress}>
      <Text style={styles.uploadIcon}>{value ? '✓' : '+'}</Text>
      <View style={styles.flex}><Text style={styles.uploadTitle}>{title}</Text><Text style={styles.uploadHint}>{value ? 'Attached — tap to replace' : 'Tap to upload'}</Text></View>
    </TouchableOpacity>
  );
}

function StatusPill({ status }) {
  const value = status || 'live';
  const isLive = value === 'verified' || value === 'live';
  return (
    <View style={[styles.statusPill, isLive ? styles.livePill : value === 'rejected' ? styles.rejectedPill : styles.pendingPill]}>
      <Text style={[styles.statusText, isLive ? styles.liveText : value === 'rejected' ? styles.rejectedText : styles.pendingText]}>
        {isLive ? 'Live' : value === 'rejected' ? 'Rejected' : 'Pending'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paperDim },
  headerSafeArea: { backgroundColor: COLORS.primaryMid },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 17 },
  backButton: { paddingVertical: 8, paddingRight: 14 },
  backText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  headerTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', flexShrink: 1 },
  content: { padding: 16, paddingBottom: 42 },
  verificationGate: { backgroundColor: '#FFF4D6', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#E4C56A', padding: 14, marginBottom: 12 },
  gateTitle: { color: '#735400', fontSize: 15, fontWeight: '800' },
  gateText: { color: COLORS.inkSoft, fontSize: 12, lineHeight: 18, marginTop: 5 },
  addButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.pill, paddingVertical: 14, alignItems: 'center' },
  pendingButton: { backgroundColor: COLORS.stable },
  addButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  formCard: { backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderColor: COLORS.line, marginTop: 14, ...SHADOW.small },
  formTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '800', marginBottom: 14 },
  formHelp: { color: COLORS.inkSoft, fontSize: 12, lineHeight: 18, marginBottom: 13 },
  verificationUpload: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: COLORS.paperDim, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.primary, borderRadius: RADIUS.md, padding: 13, marginBottom: 10 },
  uploadIcon: { color: COLORS.primary, fontSize: 24, fontWeight: '800' }, uploadTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '800' }, uploadHint: { color: COLORS.inkSoft, fontSize: 11, marginTop: 2 },
  declaration: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 10 }, check: { color: COLORS.primary, fontSize: 23 }, declarationText: { flex: 1, color: COLORS.inkSoft, fontSize: 12, lineHeight: 17 },
  photoPicker: { minHeight: 130, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.primary, borderRadius: RADIUS.md, backgroundColor: '#EEF5E6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 14 },
  photoPreview: { width: '100%', height: 180 },
  photoPickerText: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
  label: { color: COLORS.ink, fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: COLORS.paperDim, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 11, color: COLORS.ink, fontSize: 14, marginBottom: 12 },
  multiline: { minHeight: 82 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paperDim, borderRadius: RADIUS.pill, paddingHorizontal: 11, paddingVertical: 7 },
  chipSelected: { backgroundColor: '#EEF5E6', borderColor: COLORS.primary },
  chipText: { color: COLORS.inkSoft, fontSize: 12, fontWeight: '600' },
  chipTextSelected: { color: COLORS.primary, fontWeight: '800' },
  twoColumns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  submitButton: { backgroundColor: COLORS.primaryMid, borderRadius: RADIUS.pill, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.6 },
  sectionTitle: { color: COLORS.inkSoft, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 22, marginBottom: 10 },
  loader: { marginTop: 30 },
  emptyCard: { backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: COLORS.line },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '800', marginTop: 10 },
  emptyText: { color: COLORS.inkSoft, fontSize: 13, textAlign: 'center', marginTop: 5 },
  listingCard: { backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, padding: 15, borderWidth: 1, borderColor: COLORS.line, marginBottom: 10, ...SHADOW.small },
  listingTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  flex: { flex: 1 },
  listingTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '800' },
  listingMeta: { color: COLORS.inkSoft, fontSize: 12, marginTop: 3 },
  listingPrice: { color: COLORS.primary, fontSize: 15, fontWeight: '800', marginTop: 12 },
  rejection: { color: COLORS.rust, fontSize: 12, marginTop: 7 },
  statusPill: { borderRadius: RADIUS.pill, paddingHorizontal: 9, paddingVertical: 5 },
  livePill: { backgroundColor: COLORS.upBg },
  pendingPill: { backgroundColor: '#FFF4D6' },
  rejectedPill: { backgroundColor: COLORS.rustBg },
  statusText: { fontSize: 10, fontWeight: '800' },
  liveText: { color: COLORS.up },
  pendingText: { color: '#8A6200' },
  rejectedText: { color: COLORS.rust },
});
