import React, { useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginAdmin } from '../api/authApi';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginScreen({ navigation }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const submit = async () => {
    if (!password) {
      Alert.alert('Admin sign in', 'Enter the administrator password.');
      return;
    }
    setLoading(true);
    try {
      const result = await loginAdmin(password);
      if (result.role !== 'admin' && result.user?.role !== 'admin') {
        throw new Error('This account does not have administrator access.');
      }
      const admin = result.user || {
        id: result.id, name: result.name, phone: result.phone,
        email: result.email, role: result.role, location: result.location,
      };
      await login(admin, result.access_token || result.token);
      navigation.replace('AdminPortal');
    } catch (error) {
      Alert.alert('Admin sign in failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryMid} />
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Portal</Text>
      </SafeAreaView>
      <View style={styles.content}>
        <Text style={styles.icon}>🛡️</Text>
        <Text style={styles.title}>Administrator sign in</Text>
        <Text style={styles.subtitle}>Review farmer identity and land documents before approving marketplace access.</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor={COLORS.inkSoft} />
          <TouchableOpacity style={[styles.button, loading && styles.disabled]} disabled={loading} onPress={submit}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Open Admin Portal</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paperDim },
  header: { backgroundColor: COLORS.primaryMid, flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 20, paddingVertical: 17 },
  back: { color: '#FFFFFF', fontWeight: '800' },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  content: { flex: 1, padding: 22, justifyContent: 'center' },
  icon: { fontSize: 50, textAlign: 'center' },
  title: { color: COLORS.ink, fontSize: 25, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  subtitle: { color: COLORS.inkSoft, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7, marginBottom: 22 },
  card: { backgroundColor: COLORS.paper, padding: 20, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.line, ...SHADOW.medium },
  label: { color: COLORS.ink, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: { color: COLORS.ink, backgroundColor: COLORS.paperDim, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.sm, paddingHorizontal: 13, paddingVertical: 12, marginBottom: 15 },
  button: { backgroundColor: COLORS.primary, borderRadius: RADIUS.pill, paddingVertical: 15, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.6 },
});
