import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DISPLAY_NAMES, fetchCrops, fetchForecast, formatMoney } from '../api/cropcastApi';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

const PERIODS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const monthLabel = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('en', { month: 'short', year: 'numeric' });
const dayLabel = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
const rowPrice = (row) => Number(row?.predicted_price ?? row?.avg_predicted_price ?? 0);
const rowLow = (row) => Number(row?.lower_80 ?? row?.avg_lower_80 ?? 0);
const rowHigh = (row) => Number(row?.upper_80 ?? row?.avg_upper_80 ?? 0);

export default function ForecastScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [crops, setCrops] = useState([]);
  const [crop, setCrop] = useState('maize');
  const [period, setPeriod] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCrops().then((available) => {
      setCrops(available || []);
      if (available?.length && !available.some((item) => item.crop === crop)) setCrop(available[0].crop);
    }).catch(() => {});
  }, []);

  const load = async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const forecast = await fetchForecast(crop);
      setData(forecast);
      setSelectedMonth(forecast.monthly?.[0]?.date?.slice(0, 7) || null);
      setSelectedRowIndex(0);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [crop]);

  const rows = useMemo(() => {
    if (!data) return [];
    const source = data[period] || [];
    if (period === 'daily' && selectedMonth) return source.filter((row) => row.date?.startsWith(selectedMonth));
    if (period === 'weekly' && selectedMonth) return source.filter((row) => (row.week_start || row.date)?.startsWith(selectedMonth));
    return source;
  }, [data, period, selectedMonth]);

  const selectedRow = rows[Math.min(selectedRowIndex, Math.max(0, rows.length - 1))] || data?.monthly?.[0] || {};
  const confidence = Number(selectedRow.confidence_score_percent || 0);
  const chartWidth = Math.max(280, width - 64);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Price Predictions</Text>
        <Text style={styles.headerSub}>The same monthly model, forecasts, ranges, and reasons used on the web</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[COLORS.primary]} />}>
        <Text style={styles.label}>Select crop</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {(crops.length ? crops : Object.keys(DISPLAY_NAMES).map((name) => ({ crop: name }))).map((item) => (
            <TouchableOpacity key={item.crop} style={[styles.chip, crop === item.crop && styles.chipActive]} onPress={() => setCrop(item.crop)}>
              <Text style={[styles.chipText, crop === item.crop && styles.chipTextActive]}>{DISPLAY_NAMES[item.crop] || item.crop}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? <Loading /> : error ? <ErrorState message={error} retry={() => load()} /> : (
          <>
            <View style={styles.periodRow}>
              {PERIODS.map((item) => (
                <TouchableOpacity key={item.key} style={[styles.period, period === item.key && styles.periodActive]} onPress={() => { setPeriod(item.key); setSelectedRowIndex(0); }}>
                  <Text style={[styles.periodText, period === item.key && styles.periodTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {(period === 'daily' || period === 'weekly') && (
              <View style={styles.selectorCard}>
                <Text style={styles.label}>Choose forecast month</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  {(data?.monthly || []).map((month) => {
                    const key = month.date.slice(0, 7);
                    return <TouchableOpacity key={key} style={[styles.monthChip, selectedMonth === key && styles.monthChipActive]} onPress={() => { setSelectedMonth(key); setSelectedRowIndex(0); }}><Text style={[styles.monthText, selectedMonth === key && styles.monthTextActive]}>{monthLabel(month.date)}</Text></TouchableOpacity>;
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.heroCard}>
              <Text style={styles.heroCrop}>{DISPLAY_NAMES[crop] || crop}</Text>
              <Text style={styles.heroDate}>{selectedRow.date ? dayLabel(selectedRow.date) : selectedRow.year || 'Forecast'}</Text>
              <Text style={styles.heroPrice}>{formatMoney(rowPrice(selectedRow))}</Text>
              <Text style={styles.range}>80% expected range: {formatMoney(rowLow(selectedRow))} – {formatMoney(rowHigh(selectedRow))}</Text>
              <View style={styles.confidenceRow}><Text style={styles.confidenceLabel}>Reliability</Text><Text style={styles.confidenceValue}>{confidence.toFixed(0)}%</Text></View>
              <View style={styles.confidenceTrack}><View style={[styles.confidenceFill, { width: `${Math.min(100, confidence)}%` }]} /></View>
            </View>

            <View style={styles.reasonCard}>
              <Text style={styles.reasonTitle}>Why this prediction?</Text>
              <Text style={styles.reasonText}>{selectedRow.reason || data?.monthly?.[0]?.reason || 'This yearly value summarizes the available monthly model forecasts.'}</Text>
              {(selectedRow.source_frequency || data?.viewNotes?.daily) && <Text style={styles.provenance}>Source: {String(selectedRow.source_frequency || 'monthly_model').replaceAll('_', ' ')}. Daily and weekly values are views derived from the latest monthly model.</Text>}
            </View>

            {(period === 'daily' || period === 'weekly') && (
              <View style={styles.listCard}>
                <Text style={styles.sectionTitle}>{period === 'daily' ? 'Daily predictions' : 'Weekly predictions'}</Text>
                {rows.slice(0, period === 'daily' ? 31 : 8).map((row, index) => (
                  <TouchableOpacity key={row.date || row.week_start || index} style={[styles.forecastRow, selectedRowIndex === index && styles.forecastRowActive]} onPress={() => setSelectedRowIndex(index)}>
                    <Text style={styles.rowDate}>{period === 'daily' ? dayLabel(row.date) : `Week of ${dayLabel(row.week_start || row.date)}`}</Text>
                    <Text style={styles.rowPrice}>{formatMoney(rowPrice(row))}</Text>
                  </TouchableOpacity>
                ))}
                {!rows.length && <Text style={styles.emptyText}>No daily rows are available for this month.</Text>}
              </View>
            )}

            <View style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Monthly price bars</Text>
              <BarChart rows={data?.monthly || []} label={(row) => monthLabel(row.date).split(' ')[0]} value={rowPrice} />
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Yearly average bars</Text>
              <BarChart rows={data?.yearly || []} label={(row) => String(row.year)} value={rowPrice} />
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Observed and predicted price graph</Text>
              <Text style={styles.chartHint}>Blue: observed monthly prices · Orange: model forecast</Text>
              <LineChart history={data?.history || []} forecast={data?.monthly || []} width={chartWidth} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Loading() { return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.centerText}>Loading the model forecast…</Text></View>; }
function ErrorState({ message, retry }) { return <View style={styles.center}><Text style={styles.errorText}>{message}</Text><TouchableOpacity style={styles.retry} onPress={retry}><Text style={styles.retryText}>Try again</Text></TouchableOpacity></View>; }

function BarChart({ rows, label, value }) {
  if (!rows.length) return <Text style={styles.emptyText}>No values available.</Text>;
  const values = rows.map(value);
  const max = Math.max(...values, 1);
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bars}>{rows.map((row, index) => <View key={row.date || row.year || index} style={styles.barSlot}><Text style={styles.barValue}>{Math.round(values[index]).toLocaleString()}</Text><View style={[styles.bar, { height: Math.max(12, (values[index] / max) * 130) }]} /><Text style={styles.barLabel}>{label(row)}</Text></View>)}</ScrollView>;
}

function LineChart({ history, forecast, width }) {
  const observed = history.slice(-6).map((row) => ({ label: monthLabel(row.date).split(' ')[0], value: Number(row.price), predicted: false }));
  const predicted = forecast.map((row) => ({ label: monthLabel(row.date).split(' ')[0], value: rowPrice(row), predicted: true }));
  const points = [...observed, ...predicted];
  if (points.length < 2) return <Text style={styles.emptyText}>Not enough values to draw the graph.</Text>;
  const graphHeight = 180;
  const values = points.map((point) => point.value);
  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;
  const step = width / Math.max(1, points.length - 1);
  const coordinates = points.map((point, index) => ({ ...point, x: index * step, y: graphHeight - ((point.value - min) / Math.max(1, max - min)) * (graphHeight - 28) - 14 }));
  return <View style={[styles.graph, { width, height: graphHeight + 28 }]}>{coordinates.slice(0, -1).map((point, index) => {
    const next = coordinates[index + 1]; const length = Math.hypot(next.x - point.x, next.y - point.y); const angle = Math.atan2(next.y - point.y, next.x - point.x);
    return <View key={`line-${index}`} style={[styles.line, { left: point.x, top: point.y, width: length, backgroundColor: next.predicted ? '#FB8C00' : '#1976D2', transform: [{ rotateZ: `${angle}rad` }] }]} />;
  })}{coordinates.map((point, index) => <View key={`point-${index}`} style={[styles.dot, { left: point.x - 4, top: point.y - 4, backgroundColor: point.predicted ? '#FB8C00' : '#1976D2' }]}><Text style={[styles.graphLabel, { width: Math.max(34, step), left: -Math.max(17, step / 2), top: graphHeight - point.y + 7 }]}>{point.label}</Text></View>)}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paperDim }, header: { backgroundColor: COLORS.primaryMid, paddingHorizontal: 20, paddingBottom: 18 }, headerTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '800' }, headerSub: { color: 'rgba(255,255,255,0.82)', fontSize: 12, lineHeight: 17, marginTop: 3 }, content: { padding: 16, paddingBottom: 48 },
  label: { color: COLORS.ink, fontSize: 13, fontWeight: '800', marginBottom: 8 }, chips: { gap: 8, paddingRight: 10 }, chip: { backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.pill, paddingHorizontal: 14, paddingVertical: 9 }, chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary }, chipText: { color: COLORS.inkSoft, fontWeight: '700', fontSize: 12 }, chipTextActive: { color: '#FFFFFF' },
  periodRow: { flexDirection: 'row', gap: 7, marginTop: 16, marginBottom: 13 }, period: { flex: 1, alignItems: 'center', backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.sm, paddingVertical: 11 }, periodActive: { backgroundColor: COLORS.primary }, periodText: { color: COLORS.inkSoft, fontSize: 11, fontWeight: '800' }, periodTextActive: { color: '#FFFFFF' },
  selectorCard: { backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, padding: 13, borderWidth: 1, borderColor: COLORS.line, marginBottom: 13 }, monthChip: { backgroundColor: COLORS.paperDim, borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 8 }, monthChipActive: { backgroundColor: COLORS.teal }, monthText: { color: COLORS.inkSoft, fontSize: 11, fontWeight: '700' }, monthTextActive: { color: '#FFFFFF' },
  heroCard: { backgroundColor: COLORS.paper, borderRadius: RADIUS.xl, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.line, ...SHADOW.medium }, heroCrop: { color: COLORS.ink, fontSize: 18, fontWeight: '800' }, heroDate: { color: COLORS.inkSoft, fontSize: 12, marginTop: 3 }, heroPrice: { color: COLORS.primary, fontSize: 31, fontWeight: '800', marginTop: 13 }, range: { color: COLORS.inkSoft, fontSize: 12, textAlign: 'center', marginTop: 5 }, confidenceRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 17 }, confidenceLabel: { color: COLORS.inkSoft, fontSize: 12 }, confidenceValue: { color: COLORS.primary, fontSize: 12, fontWeight: '800' }, confidenceTrack: { width: '100%', height: 8, backgroundColor: COLORS.line, borderRadius: 4, overflow: 'hidden', marginTop: 6 }, confidenceFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  reasonCard: { backgroundColor: '#E8F1FB', borderLeftWidth: 4, borderLeftColor: COLORS.teal, borderRadius: RADIUS.lg, padding: 15, marginTop: 13 }, reasonTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '800' }, reasonText: { color: COLORS.ink, fontSize: 13, lineHeight: 20, marginTop: 7 }, provenance: { color: COLORS.inkSoft, fontSize: 11, lineHeight: 17, marginTop: 9 },
  listCard: { backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.line, padding: 14, marginTop: 13 }, sectionTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '800', marginBottom: 11 }, forecastRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 9, borderBottomWidth: 1, borderBottomColor: COLORS.line }, forecastRowActive: { backgroundColor: COLORS.greenLight, borderRadius: RADIUS.sm }, rowDate: { color: COLORS.inkSoft, fontSize: 12 }, rowPrice: { color: COLORS.primary, fontSize: 13, fontWeight: '800' },
  chartCard: { backgroundColor: COLORS.paper, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.line, padding: 14, marginTop: 13, overflow: 'hidden', ...SHADOW.small }, chartHint: { color: COLORS.inkSoft, fontSize: 10, marginTop: -7, marginBottom: 12 }, bars: { height: 180, alignItems: 'flex-end', gap: 13, paddingHorizontal: 5 }, barSlot: { width: 58, height: 175, alignItems: 'center', justifyContent: 'flex-end' }, bar: { width: 34, backgroundColor: COLORS.primaryMid, borderRadius: 6 }, barValue: { color: COLORS.ink, fontSize: 9, fontWeight: '700', marginBottom: 4 }, barLabel: { color: COLORS.inkSoft, fontSize: 10, marginTop: 5 },
  graph: { alignSelf: 'center', position: 'relative', marginTop: 4 }, line: { position: 'absolute', height: 3, transformOrigin: 'left center', borderRadius: 2 }, dot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 }, graphLabel: { position: 'absolute', color: COLORS.inkSoft, fontSize: 9, textAlign: 'center' },
  center: { paddingVertical: 70, alignItems: 'center' }, centerText: { color: COLORS.inkSoft, marginTop: 12 }, errorText: { color: COLORS.rust, textAlign: 'center', lineHeight: 20 }, retry: { backgroundColor: COLORS.primary, borderRadius: RADIUS.pill, paddingHorizontal: 20, paddingVertical: 10, marginTop: 14 }, retryText: { color: '#FFFFFF', fontWeight: '800' }, emptyText: { color: COLORS.inkSoft, fontSize: 12, paddingVertical: 16, textAlign: 'center' },
});
