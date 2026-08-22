import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView,
  ActivityIndicator, Alert, StatusBar, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { loginUser } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!phoneOrEmail || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const result = await loginUser(phoneOrEmail, password);
      // result may have { access_token, user } or just { access_token }
      const token = result.access_token || result.token || 'session';
      const userData = result.user || {
        id: result.id,
        name: result.name,
        phone: result.phone || phoneOrEmail,
        role: result.role || 'buyer',
        location: result.location,
        verification_status: result.verification_status,
      };
      await login(userData, token);
      navigation.replace(userData.role === 'admin' ? 'AdminPortal' : 'Main');
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryMid} />

      {/* Green header band with dynamic safe area padding */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 0) + 16 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>T</Text>
          </View>
          <Text style={styles.brandName}>Theraprice</Text>
        </View>
        <Text style={styles.headerSub}>Know tomorrow's crop prices, today</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome back! 👋</Text>
        <Text style={styles.subtitle}>Sign in to access crop prices & marketplace</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Phone Number or Email</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 670000000 or user@example.com"
            placeholderTextColor={COLORS.inkSoft}
            value={phoneOrEmail}
            onChangeText={setPhoneOrEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.inkSoft}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotLink}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.btnText}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.divLine} />
          <Text style={styles.divText}>or</Text>
          <View style={styles.divLine} />
        </View>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          {[
            { num: '10+', label: 'Crops tracked' },
            { num: 'Live', label: 'Price data' },
            { num: 'AI', label: 'Powered forecasts' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.linkText}>Create Account →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.paperDim },
  header: {
    backgroundColor: COLORS.primaryMid,
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 24,
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

  content: { padding: 20, paddingTop: 28 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.ink, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.inkSoft, marginBottom: 24 },

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
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  eyeBtn: { padding: 10 },
  eyeText: { fontSize: 18 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 18 },
  forgotText: { fontSize: 13, color: COLORS.teal, fontWeight: '500' },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.line },
  divText: { fontSize: 13, color: COLORS.inkSoft },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: COLORS.primary, fontFamily: 'serif' },
  statLabel: { fontSize: 11, color: COLORS.inkSoft, marginTop: 2 },

  footer: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 20 },
  footerText: { color: COLORS.inkSoft, fontSize: 14 },
  linkText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});
