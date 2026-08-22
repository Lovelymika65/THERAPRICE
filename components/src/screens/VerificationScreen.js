import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';
import { sendSignUpOtp, verifySignUpOtp } from '../api/authApi';

function maskTarget(target, channel) {
  const value = String(target || '');
  if (channel === 'email') {
    const [name, domain] = value.split('@');
    if (!domain) return value;
    return `${name.slice(0, 2)}${'*'.repeat(Math.max(2, name.length - 2))}@${domain}`;
  }
  return value.length > 4 ? `${'*'.repeat(value.length - 4)}${value.slice(-4)}` : value;
}

export default function VerificationScreen({ route, navigation }) {
  const { phone = '', channel = 'email', target = '' } = route.params || {};
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(otpCode)) {
      Alert.alert('Invalid code', 'Enter the complete six-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      await verifySignUpOtp(phone, otpCode);
      Alert.alert('Account verified', 'Your account is ready. Please sign in.', [
        { text: 'Sign In', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) },
      ]);
    } catch (error) {
      Alert.alert('Verification failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await sendSignUpOtp(phone, channel);
      setOtpCode('');
      Alert.alert('Code resent', `A new code was sent by ${channel === 'email' ? 'email' : 'SMS'}.`);
    } catch (error) {
      Alert.alert('Unable to resend', error.message);
    } finally {
      setResending(false);
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
          <Text style={styles.headerTitle}>Verify account</Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.iconCircle}><Text style={styles.icon}>✉</Text></View>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            We sent a six-digit code to {maskTarget(target, channel)}.
          </Text>

          <TextInput
            style={styles.codeInput}
            value={otpCode}
            onChangeText={(value) => setOtpCode(value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            placeholderTextColor={COLORS.inkSoft}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.disabled]}
            onPress={handleVerify}
            disabled={loading || resending}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.verifyText}>Verify Account</Text>}
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <Text style={styles.resendPrompt}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={loading || resending}>
              <Text style={styles.resendLink}>{resending ? 'Sending…' : 'Resend code'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paperDim },
  headerSafeArea: { backgroundColor: COLORS.primaryMid },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18,
    paddingTop: 12, paddingBottom: 17, backgroundColor: COLORS.primaryMid,
  },
  backButton: { paddingVertical: 8, paddingRight: 16 },
  backText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  headerTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  body: { flex: 1, justifyContent: 'center', padding: 22 },
  card: {
    backgroundColor: COLORS.paper, borderRadius: RADIUS.xl, padding: 24,
    borderWidth: 1, borderColor: COLORS.line, alignItems: 'center', ...SHADOW.medium,
  },
  iconCircle: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: '#EEF5E6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  icon: { color: COLORS.primary, fontSize: 32, fontWeight: '800' },
  title: { color: COLORS.ink, fontSize: 23, fontWeight: '800', textAlign: 'center' },
  subtitle: {
    color: COLORS.inkSoft, fontSize: 14, lineHeight: 21, textAlign: 'center',
    marginTop: 8, marginBottom: 22,
  },
  codeInput: {
    width: '100%', backgroundColor: COLORS.paperDim, borderWidth: 2,
    borderColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14,
    paddingHorizontal: 12, color: COLORS.ink, fontSize: 27, fontWeight: '800',
    letterSpacing: 12, textAlign: 'center', marginBottom: 18,
  },
  verifyButton: {
    width: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.pill,
    paddingVertical: 15, alignItems: 'center',
  },
  disabled: { opacity: 0.6 },
  verifyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  resendPrompt: { color: COLORS.inkSoft, fontSize: 14 },
  resendLink: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
});
