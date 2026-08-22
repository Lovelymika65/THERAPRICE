import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');
const expoHost = (
  Constants.expoConfig?.hostUri
  || Constants.expoGoConfig?.debuggerHost
  || ''
).split(':')[0];

const developmentHost = expoHost
  || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
const developmentPort = process.env.EXPO_PUBLIC_API_PORT?.trim() || '8000';

// On a physical phone, Expo's hostUri contains the computer's LAN address.
// EXPO_PUBLIC_API_URL remains available for production or tunnel deployments.
export const API_BASE = configuredUrl || `http://${developmentHost}:${developmentPort}`;
