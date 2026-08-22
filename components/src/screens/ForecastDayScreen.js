import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { fetchForecast, formatMoney, DISPLAY_NAMES } from '../api/cropcastApi';
import { COLORS } from '../constants/theme';

export default function ForecastDayScreen({ route, navigation }) {
  const { stem = 'maize' } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [stem]);

  const loadData = async () => {
    try {
      setError(null);
      const data = await fetchForecast(stem);
      setForecastData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch forecast');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS?.primary || '#2E7D32'} />
        <Text style={styles.loadingText}>Loading forecast…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Forecasts unavailable: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedDay = forecastData?.daily?.[0] || {};
  const confidence = Number(selectedDay?.confidence_score_percent || 0);
  const confidenceColor =
    confidence >= 70 ? '#43A047' : confidence >= 40 ? '#B98900' : '#D32F2F';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>{DISPLAY_NAMES[stem] || stem} Forecast</Text>
        <Text style={styles.date}>{selectedDay?.date || 'Today'}</Text>

        {/* Price Display */}
        <View style={styles.priceCard}>
          <Text style={styles.priceText}>
            {formatMoney(selectedDay?.predicted_price || 0)}
          </Text>
          <Text style={styles.subRange}>
            80% expected range: {formatMoney(selectedDay?.lower_80 || 0)} –{' '}
            {formatMoney(selectedDay?.upper_80 || 0)}
          </Text>
        </View>

        {/* Reliability Score Bar */}
        <View style={styles.confidenceSection}>
          <Text style={styles.confidenceLabel}>
            Reliability Score: {confidence}%
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${confidence}%`, backgroundColor: confidenceColor },
              ]}
            />
          </View>
        </View>

        {/* Model Metrics */}
        <View style={styles.metricsBox}>
          <Text style={styles.metricsTitle}>Model Performance</Text>
          <Text style={styles.metricsText}>
            Selected Model: {selectedDay?.selected_model || 'Standard'}
          </Text>
          <Text style={styles.metricsText}>
            Held-out MAPE:{' '}
            {forecastData?.model?.test_mape
              ? `${Number(forecastData.model.test_mape).toFixed(1)}%`
              : 'N/A'}
          </Text>
          <Text style={styles.metricsText}>
            Test WAPE:{' '}
            {forecastData?.model?.test_wape
              ? `${(Number(forecastData.model.test_wape) * 100).toFixed(2)}%`
              : 'N/A'}
          </Text>
        </View>

        {/* Navigation Button */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => navigation.navigate('ForecastMonth', { stem })}
          >
            <Text style={styles.tabText}>Monthly View</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS?.background || '#F8FAFC',
  },
  center: {
    flex: 1,
    justify: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#68736C',
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS?.primary || '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS?.textPrimary || '#1E293B',
  },
  date: {
    fontSize: 14,
    color: COLORS?.textSecondary || '#64748B',
    marginBottom: 16,
  },
  priceCard: {
    backgroundColor: COLORS?.surface || '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS?.primary || '#2E7D32',
  },
  subRange: {
    fontSize: 14,
    color: COLORS?.textSecondary || '#64748B',
    marginTop: 8,
  },
  confidenceSection: {
    marginVertical: 20,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  track: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  metricsBox: {
    backgroundColor: '#F0F4FF',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  metricsTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  metricsText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  tabBar: {
    marginTop: 20,
  },
  tabButton: {
    backgroundColor: COLORS?.primary || '#2E7D32',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});