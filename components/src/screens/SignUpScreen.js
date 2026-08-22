import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView,
  ActivityIndicator, Alert, StatusBar, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { sendSignUpOtp, signUpUser } from '../api/authApi';

const REGIONS = [
  'Centre', 'Littoral', 'West', 'North West', 'South West',
  'Adamawa', 'East', 'Far North', 'North', 'South',
];

export default function SignUpScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [location, setLocation] = useState('Centre');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showRegions, setShowRegions] = useState(false);
  const [channel, setChannel] = useState('sms');

  const handleSignUp = async () => {
    if (!fullName || !phone || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (channel === 'email' && !email.trim()) {
      Alert.alert('Email required', 'Enter your email address or choose SMS verification.');
      return;
    }

    setLoading(true);
    try {
      await signUpUser({ full_name: fullName, phone, email, password, role, location, channel });
      await sendSignUpOtp(phone, channel);
      navigation.navigate('VerifyOtp', {
        phone: phone.trim(),
        channel,
        target: channel === 'email' ? email.trim() : phone.trim(),
      });
    } catch (error) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryMid} />

      {/* Green header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 0) + 16 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>T</Text>
          </View>
          <Text style={styles.brandName}>Theraprice</Text>
        </View>
        <Text style={styles.headerSub}>Join Africa's agricultural price intelligence network</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Track crop prices, buy & sell produce</Text>

        {/* Role selector */}
        <View style={styles.roleRow}>
          {[
            { key: 'buyer', label: '🛒 Buyer', desc: 'Buy fresh produce' },
            { key: 'farmer', label: '🌾 Farmer', desc: 'Sell your harvest' },
          ].map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleCard, role === r.key && styles.roleCardActive]}
              onPress={() => setRole(r.key)}
            >
              <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>{r.label}</Text>
              <Text style={[styles.roleDesc, role === r.key && styles.roleDescActive]}>{r.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Jean-Pierre Mbe"
            placeholderTextColor={COLORS.inkSoft}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 670000000"
            placeholderTextColor={COLORS.inkSoft}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="john@example.com"
            placeholderTextColor={COLORS.inkSoft}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Confirm your account using *</Text>
          <View style={styles.channelRow}>
            {[
              { key: 'sms', label: 'SMS' },
              { key: 'email', label: 'Email' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.channelBtn, channel === option.key && styles.channelBtnActive]}
                onPress={() => setChannel(option.key)}
              >
                <Text style={[styles.channelText, channel === option.key && styles.channelTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Region *</Text>
          <TouchableOpacity
            style={[styles.input, styles.selectBtn]}
            onPress={() => setShowRegions(!showRegions)}
          >
            <Text style={{ color: COLORS.ink, fontSize: 15 }}>{location}</Text>
            <Text style={{ color: COLORS.inkSoft }}>{showRegions ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showRegions && (
            <View style={styles.dropdown}>
              {REGIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.dropdownItem, r === location && styles.dropdownItemActive]}
                  onPress={() => { setLocation(r); setShowRegions(false); }}
                >
                  <Text style={[styles.dropdownText, r === location && styles.dropdownTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Password *</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="At least 6 characters"
              placeholderTextColor={COLORS.inkSoft}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 14 }]}>Confirm Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            placeholderTextColor={COLORS.inkSoft}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPass}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.btnText}>Sign Up</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.adminLink} onPress={() => navigation.navigate('AdminLogin')}>
          <Text style={styles.adminLinkText}>🛡️ Administrator Portal</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.paperDim },
  header: {
    backgroundColor: COLORS.primaryMid,
    paddingTop: 20, paddingBottom: 28, paddingHorizontal: 24,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  logoMark: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  logoLetter: { fontSize: 20, fontWeight: '800', color: COLORS.primary, fontStyle: 'italic' },
  brandName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  content: { padding: 20, paddingTop: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.ink, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.inkSoft, marginBottom: 20 },

  // Role cards
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleCard: {
    flex: 1, padding: 14, borderRadius: RADIUS.md,
    borderWidth: 2, borderColor: COLORS.line,
    backgroundColor: COLORS.paper,
  },
  roleCardActive: { borderColor: COLORS.primary, backgroundColor: '#EEF5E6' },
  roleLabel: { fontSize: 16, fontWeight: '700', color: COLORS.inkSoft, marginBottom: 4 },
  roleLabelActive: { color: COLORS.primary },
  roleDesc: { fontSize: 12, color: COLORS.inkSoft },
  roleDescActive: { color: COLORS.primary },
  channelRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  channelBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.line, backgroundColor: COLORS.paper,
  },
  channelBtnActive: { borderColor: COLORS.primary, backgroundColor: '#EEF5E6' },
  channelText: { color: COLORS.inkSoft, fontWeight: '700' },
  channelTextActive: { color: COLORS.primary },

  card: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    ...SHADOW.small,
    marginBottom: 20,
  },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: COLORS.paperDim,
    borderWidth: 1, borderColor: COLORS.line,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.ink, marginBottom: 14,
  },
  selectBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdown: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 14,
    overflow: 'hidden',
    ...SHADOW.small,
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  dropdownItemActive: { backgroundColor: '#EEF5E6' },
  dropdownText: { fontSize: 14, color: COLORS.ink },
  dropdownTextActive: { color: COLORS.primary, fontWeight: '600' },

  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  eyeBtn: { padding: 10 },
  eyeText: { fontSize: 18 },

  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  footerText: { color: COLORS.inkSoft, fontSize: 14 },
  linkText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  adminLink: { alignSelf: 'center', borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.pill, paddingHorizontal: 18, paddingVertical: 10, marginBottom: 14 },
  adminLinkText: { color: COLORS.primary, fontSize: 13, fontWeight: '800' },
  terms: { fontSize: 11.5, color: COLORS.inkSoft, textAlign: 'center', paddingHorizontal: 20 },
});
