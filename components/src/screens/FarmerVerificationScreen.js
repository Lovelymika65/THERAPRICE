import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Switch,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { submitFarmerVerification } from '../api/farmerApi';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

function imageDataUrl(asset) {
  return `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
}

export default function FarmerVerificationScreen({ navigation }) {
  const { token, user, updateUser } = useAuth();
  const [nationalId, setNationalId] = useState('');
  const [files, setFiles] = useState({ idFront: null, selfie: null, documents: [] });
  const [contract, setContract] = useState(false);
  const [locator, setLocator] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickIdentityImage = async (key) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.6, base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      setFiles((current) => ({ ...current, [key]: imageDataUrl(result.assets[0]) }));
    }
  };

  const takeSelfie = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission required', 'Allow camera access to take the required live selfie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: 'front', quality: 0.6, base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      setFiles((current) => ({ ...current, selfie: imageDataUrl(result.assets[0]) }));
    }
  };

  const pickFarmDocuments = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'], multiple: true, copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    try {
      const documents = await Promise.all(result.assets.map(async (asset) => {
        const base64 = asset.base64 || await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:${asset.mimeType || 'application/octet-stream'};base64,${base64}`;
      }));
      setFiles((current) => ({ ...current, documents }));
    } catch (_) {
      Alert.alert('Unable to attach document', 'Choose an image or PDF stored on this device.');
    }
  };

  const submit = async () => {
    if (!nationalId.trim() || !files.idFront || !files.selfie || !files.documents.length || !contract) {
      Alert.alert('Complete verification', 'Enter your ID number, attach an ID image, add a profile photo, upload your land certificate, and accept the contract.');
      return;
    }
    setSaving(true);
    try {
      await submitFarmerVerification(token, {
        national_id_number: nationalId.trim(),
        id_front_data_url: files.idFront,
        id_back_data_url: null,
        selfie_data_url: files.selfie,
        farm_proof_documents: files.documents,
        contract_signed: contract,
        device_locator_enabled: locator,
      });
      await updateUser({ verification_status: 'pending' });
      Alert.alert('Submitted to admin', 'Your account is pending admin approval. Products can be posted after your documents are approved.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Submission failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (user?.verification_status === 'verified') {
    return <StatusPage navigation={navigation} title="Verified farmer" message="Your documents were approved. Buyers can see your verified-farmer status." />;
  }
  if (user?.verification_status === 'pending') {
    return <StatusPage navigation={navigation} title="Admin review pending" message="Your ID, profile photo, and land certificate were submitted. Product posting is locked until an administrator approves your account." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryMid} />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Farmer Verification</Text>
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Every farmer must be approved before products can appear in the buyer marketplace.</Text>
        <Text style={styles.label}>National ID, passport, or resident-card number</Text>
        <TextInput style={styles.input} value={nationalId} onChangeText={setNationalId} placeholder="Enter document number" placeholderTextColor={COLORS.inkSoft} />
        <UploadCard title="Government ID" value={files.idFront} onPress={() => pickIdentityImage('idFront')} />
        <UploadCard title="Profile photo" value={files.selfie} onPress={takeSelfie} action="Open front camera" />
        <TouchableOpacity style={styles.documentCard} onPress={pickFarmDocuments}>
          <Text style={styles.uploadTitle}>Land certificate</Text>
          <Text style={styles.uploadHint}>{files.documents.length ? `${files.documents.length} document(s) attached` : 'Upload the land certificate as an image or PDF'}</Text>
        </TouchableOpacity>
        <ConsentRow label="I accept the Theraprice farmer digital contract and understand fraudulent activity can lead to account suspension." value={contract} onValueChange={setContract} />
        <ConsentRow label="Allow consent-based device location to help investigate confirmed fraud (optional)." value={locator} onValueChange={setLocator} />
        <TouchableOpacity style={[styles.submit, saving && styles.disabled]} onPress={submit} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Submit to Admin</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function UploadCard({ title, value, onPress, action = 'Choose photo' }) {
  return (
    <TouchableOpacity style={styles.uploadCard} onPress={onPress}>
      {value ? <Image source={{ uri: value }} style={styles.preview} /> : <View style={styles.previewEmpty}><Text style={styles.previewIcon}>＋</Text></View>}
      <View style={styles.flex}><Text style={styles.uploadTitle}>{title}</Text><Text style={styles.uploadHint}>{value ? 'Attached — tap to replace' : action}</Text></View>
    </TouchableOpacity>
  );
}

function ConsentRow({ label, value, onValueChange }) {
  return <View style={styles.consent}><Text style={styles.consentText}>{label}</Text><Switch value={value} onValueChange={onValueChange} trackColor={{ true: COLORS.primary }} /></View>;
}

function StatusPage({ navigation, title, message }) {
  return <View style={styles.container}><SafeAreaView style={styles.headerSafe}><View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity><Text style={styles.headerTitle}>Farmer Verification</Text></View></SafeAreaView><View style={styles.statusCard}><Text style={styles.statusIcon}>🛡️</Text><Text style={styles.statusTitle}>{title}</Text><Text style={styles.statusMessage}>{message}</Text></View></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paperDim }, headerSafe: { backgroundColor: COLORS.primaryMid },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 18, paddingVertical: 17 },
  back: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }, headerTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 44 }, intro: { color: COLORS.inkSoft, backgroundColor: '#EEF5E6', borderRadius: RADIUS.md, padding: 14, lineHeight: 19, marginBottom: 16 },
  label: { color: COLORS.ink, fontSize: 12, fontWeight: '700', marginBottom: 6 }, input: { backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.sm, padding: 12, color: COLORS.ink, marginBottom: 12 },
  uploadCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.md, padding: 10, marginBottom: 10, ...SHADOW.small },
  documentCard: { backgroundColor: COLORS.paper, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.primary, borderRadius: RADIUS.md, padding: 17, marginBottom: 14 },
  preview: { width: 64, height: 64, borderRadius: RADIUS.sm }, previewEmpty: { width: 64, height: 64, borderRadius: RADIUS.sm, backgroundColor: '#EEF5E6', alignItems: 'center', justifyContent: 'center' }, previewIcon: { color: COLORS.primary, fontSize: 28 },
  flex: { flex: 1 }, uploadTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '800' }, uploadHint: { color: COLORS.inkSoft, fontSize: 12, marginTop: 4 },
  consent: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.paper, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.line, padding: 13, marginBottom: 10 }, consentText: { flex: 1, color: COLORS.inkSoft, fontSize: 12, lineHeight: 18 },
  submit: { backgroundColor: COLORS.primary, borderRadius: RADIUS.pill, paddingVertical: 15, alignItems: 'center', marginTop: 10 }, submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }, disabled: { opacity: 0.6 },
  statusCard: { margin: 22, padding: 28, backgroundColor: COLORS.paper, borderRadius: RADIUS.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.line, ...SHADOW.medium }, statusIcon: { fontSize: 48 }, statusTitle: { color: COLORS.ink, fontSize: 22, fontWeight: '800', marginTop: 14 }, statusMessage: { color: COLORS.inkSoft, textAlign: 'center', lineHeight: 21, marginTop: 8 },
});
