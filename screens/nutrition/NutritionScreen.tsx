import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { feedApi, weightLogApi } from '../../services/api';

interface NutritionData {
  stage: 'starter' | 'grower' | 'finisher';
  ageDays: number;
  chickenCount: number;
  avgWeightKg: number;
  recommendedFeedGram: number;
  recommendedWaterLiter: number;
  tempAdjustmentFactor: number;
  standard: {
    proteinPct: number;
    energyKcalPerKg: number;
    feedRatio: number;
    waterRatio: number;
  };
}

interface WeightLogItem {
  id: number;
  avgWeightKg: number;
  totalWeightKg: number;
  sampleCount: number;
  ageDays: number | null;
  recordedAt: string;
}

const COLORS = {
  primary: '#2D6A2D',
  secondary: '#4CAF50',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E0E0E0',
  error: '#F44336',
  orange: '#FF9800',
};

const STAGES = [
  { id: 'starter', label: 'Starter', protein: 22, energy: 2900, feedRatio: 0.28 },
  { id: 'grower', label: 'Grower', protein: 20, energy: 3100, feedRatio: 0.22 },
  { id: 'finisher', label: 'Finisher', protein: 18, energy: 3200, feedRatio: 0.18 },
] as const;

export default function NutritionScreen() {
  const navigation = useNavigation();
  const [data, setData] = useState<NutritionData | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal cân nặng mẫu
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [totalWeightInput, setTotalWeightInput] = useState('');
  const [sampleCountInput, setSampleCountInput] = useState('10');
  const [savingWeight, setSavingWeight] = useState(false);

  const barnId = 1;

  const fetchNutritionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [nutritionRes, weightLogsRes] = await Promise.all([
        feedApi.calculate(barnId),
        weightLogApi.getHistory(barnId, 5),
      ]);

      const rawData = nutritionRes.data?.data || nutritionRes.data;
      if (rawData) {
        const formattedData: NutritionData = {
          ...rawData,
          ageDays: Number(rawData.ageDays),
          chickenCount: Number(rawData.chickenCount),
          avgWeightKg: Number(rawData.avgWeightKg),
          recommendedFeedGram: Number(rawData.recommendedFeedGram),
          recommendedWaterLiter: Number(rawData.recommendedWaterLiter),
          tempAdjustmentFactor: Number(rawData.tempAdjustmentFactor),
          standard: {
            ...rawData.standard,
            proteinPct: Number(rawData.standard.proteinPct),
            energyKcalPerKg: Number(rawData.standard.energyKcalPerKg),
            feedRatio: Number(rawData.standard.feedRatio),
            waterRatio: Number(rawData.standard.waterRatio),
          },
        };
        setData(formattedData);
      } else {
        setError('Không có dữ liệu.');
      }

      const logsRaw = weightLogsRes.data?.data || weightLogsRes.data || [];
      setWeightLogs(Array.isArray(logsRaw) ? logsRaw : []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Nutrition:', err);
      setError('Không thể lấy chỉ số dinh dưỡng lúc này. Thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [barnId]);

  useEffect(() => {
    fetchNutritionData();
  }, [fetchNutritionData]);

  /** Lưu cân nặng mẫu → cập nhật avgWeightKg → re-calculate */
  const handleSaveWeight = async () => {
    const totalKg = parseFloat(totalWeightInput);
    const count = parseInt(sampleCountInput, 10);

    if (isNaN(totalKg) || totalKg <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập tổng cân nặng hợp lệ (kg)');
      return;
    }
    if (isNaN(count) || count <= 0) {
      Alert.alert('Lỗi', 'Số con mẫu phải lớn hơn 0');
      return;
    }

    const avgKg = totalKg / count;

    Alert.alert(
      'Xác nhận cân nặng',
      `Tổng: ${totalKg}kg / ${count} con\n→ Cân nặng TB: ${avgKg.toFixed(3)} kg/con\n\nLưu và cập nhật khẩu phần?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Lưu',
          onPress: async () => {
            try {
              setSavingWeight(true);
              await weightLogApi.record(barnId, {
                totalWeightKg: totalKg,
                sampleCount: count,
              });
              setWeightModalVisible(false);
              setTotalWeightInput('');
              setSampleCountInput('10');
              // Refresh nutrition data với cân nặng mới
              await fetchNutritionData();
              Alert.alert('✅ Thành công', 'Đã cập nhật cân nặng và tính lại khẩu phần!');
            } catch {
              Alert.alert('Lỗi', 'Không thể lưu cân nặng. Thử lại sau.');
            } finally {
              setSavingWeight(false);
            }
          },
        },
      ],
    );
  };

  const renderProgressBar = (label: string, valueStr: string, percentage: number) => {
    const clampedPct = Math.min(Math.max(percentage, 0), 100);
    return (
      <View style={styles.progressRow}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValueText}>{valueStr}</Text>
        </View>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${clampedPct}%` }]} />
        </View>
      </View>
    );
  };

  /** Modal nhập cân nặng mẫu */
  const renderWeightModal = () => (
    <Modal visible={weightModalVisible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>⚖️ Cân nặng mẫu</Text>
          <Text style={styles.modalSubtitle}>
            Cân một số con random rồi nhập vào đây để hệ thống tính lại khẩu phần chính xác hơn
          </Text>

          <Text style={styles.inputLabel}>Tổng cân nặng mẫu (kg)</Text>
          <TextInput
            style={styles.textInput}
            value={totalWeightInput}
            onChangeText={setTotalWeightInput}
            keyboardType="decimal-pad"
            placeholder="VD: 22.5 (kg)"
          />

          <Text style={styles.inputLabel}>Số con mang cân</Text>
          {/* Stepper cho số con mẫu */}
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setSampleCountInput(v => Math.max(1, (parseInt(v) || 1) - 1).toString())}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.stepperInput}
              value={sampleCountInput}
              onChangeText={v => setSampleCountInput(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
            <Text style={styles.stepperUnit}>con</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setSampleCountInput(v => Math.min(100, (parseInt(v) || 1) + 1).toString())}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Preview kết quả */}
          {totalWeightInput && sampleCountInput && parseFloat(totalWeightInput) > 0 && parseInt(sampleCountInput) > 0 && (
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Cân nặng trung bình sẽ là:</Text>
              <Text style={styles.previewValue}>
                {(parseFloat(totalWeightInput) / parseInt(sampleCountInput)).toFixed(3)} kg/con
              </Text>
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnCancel]}
              onPress={() => setWeightModalVisible(false)}
            >
              <Text style={styles.modalBtnCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnSave]}
              onPress={handleSaveWeight}
              disabled={savingWeight}
            >
              {savingWeight
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.modalBtnSaveText}>Lưu & Cập nhật</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dinh dưỡng</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tính toán khẩu phần...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dinh dưỡng</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerBox}>
          <Ionicons name="warning-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{error || 'Không có dữ liệu.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNutritionData}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Tính khẩu phần theo bữa (giả định 3 bữa/ngày)
  const MEALS_PER_DAY = 3;
  const feedPerMealGram = data.recommendedFeedGram / MEALS_PER_DAY;
  const feedPerMealKg = feedPerMealGram / 1000;

  return (
    <SafeAreaView style={styles.container}>
      {renderWeightModal()}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dinh dưỡng</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{data.stage.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Card 1: Thông tin đàn gà + nút cân nặng */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Thông tin đàn gà</Text>
            <TouchableOpacity style={styles.updateWeightBtn} onPress={() => setWeightModalVisible(true)}>
              <Ionicons name="scale-outline" size={16} color={COLORS.white} />
              <Text style={styles.updateWeightBtnText}>Cân mẫu</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={styles.statBox}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Tuổi</Text>
              <Text style={styles.statValue}>{data.ageDays} ngày</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="list-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Số lượng</Text>
              <Text style={styles.statValue}>{data.chickenCount} con</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="barbell-outline" size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Cân nặng TB</Text>
              <Text style={styles.statValue}>{data.avgWeightKg} kg</Text>
            </View>
          </View>

          {/* Lịch sử cân nặng */}
          {weightLogs.length > 0 && (
            <View style={styles.weightLogSection}>
              <Text style={styles.weightLogTitle}>📊 Lịch sử cân nặng gần đây</Text>
              {weightLogs.map((log, idx) => (
                <View key={log.id} style={[styles.weightLogRow, idx === 0 && styles.weightLogRowLatest]}>
                  <Text style={styles.weightLogDate}>
                    {new Date(log.recordedAt).toLocaleDateString('vi-VN')}
                  </Text>
                  <Text style={styles.weightLogAvg}>
                    {Number(log.avgWeightKg).toFixed(3)} kg/con
                  </Text>
                  <Text style={styles.weightLogSample}>
                    ({log.sampleCount} con mẫu)
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Card 2: Khẩu phần khuyến nghị theo định lượng */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Khẩu phần hôm nay (theo định lượng)</Text>

          <View style={styles.rationRow}>
            <View style={styles.rationItem}>
              <Ionicons name="leaf" size={24} color={COLORS.orange} />
              <Text style={styles.rationLabel}>Thức ăn / ngày</Text>
              <Text style={styles.rationValue}>{(data.recommendedFeedGram / 1000).toFixed(2)}</Text>
              <Text style={styles.rationUnit}>kg/ngày</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rationItem}>
              <Ionicons name="water" size={24} color="#2196F3" />
              <Text style={styles.rationLabel}>Nước uống</Text>
              <Text style={styles.rationValue}>{data.recommendedWaterLiter.toFixed(1)}</Text>
              <Text style={styles.rationUnit}>lít/ngày</Text>
            </View>
          </View>

          {/* Chia theo bữa */}
          <View style={styles.mealBreakdown}>
            <View style={styles.mealBreakdownHeader}>
              <Ionicons name="time-outline" size={16} color={COLORS.primary} />
              <Text style={styles.mealBreakdownTitle}>Chia {MEALS_PER_DAY} bữa/ngày</Text>
            </View>
            <View style={styles.mealBreakdownRow}>
              <View style={styles.mealItem}>
                <Text style={styles.mealItemGram}>{Math.round(feedPerMealGram).toLocaleString()}g</Text>
                <Text style={styles.mealItemLabel}>/ bữa</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={COLORS.textSecondary} />
              <View style={styles.mealItem}>
                <Text style={styles.mealItemGram}>{feedPerMealKg.toFixed(2)} kg</Text>
                <Text style={styles.mealItemLabel}>/ bữa</Text>
              </View>
            </View>
          </View>

          <View style={styles.tempFactorContainer}>
            <Ionicons name="thermometer-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.tempFactorText}>
              Chỉ số điều chỉnh nhiệt độ: ×{data.tempAdjustmentFactor.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Card 3: Thành phần dinh dưỡng */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tiêu chuẩn ({data.stage.toUpperCase()})</Text>

          {renderProgressBar('Protein', `${data.standard.proteinPct}%`, (data.standard.proteinPct / 30) * 100)}
          {renderProgressBar('Năng lượng', `${data.standard.energyKcalPerKg} kcal/kg`, (data.standard.energyKcalPerKg / 3500) * 100)}
          {renderProgressBar('Tỷ lệ thức ăn', `${data.standard.feedRatio.toFixed(2)} g/g`, (data.standard.feedRatio / 0.4) * 100)}
          {renderProgressBar('Tỷ lệ nước', `${data.standard.waterRatio.toFixed(1)} L/con`, (data.standard.waterRatio / 3) * 100)}
        </View>

        {/* Card 4: So sánh 3 giai đoạn */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>So sánh tiêu chuẩn sinh trưởng</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1.2 }]}>Chỉ số</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>Starter</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>Grower</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>Finisher</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellLabel, { flex: 1.2 }]}>Protein</Text>
              {STAGES.map(s => (
                <Text key={`pro-${s.id}`} style={[styles.tableCell, data.stage === s.id && styles.activeCellText]}>
                  {s.protein}%
                </Text>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellLabel, { flex: 1.2 }]}>Năng lượng</Text>
              {STAGES.map(s => (
                <Text key={`eng-${s.id}`} style={[styles.tableCell, data.stage === s.id && styles.activeCellText]}>
                  {s.energy}
                </Text>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellLabel, { flex: 1.2 }]}>Tỷ lệ ăn</Text>
              {STAGES.map(s => (
                <Text key={`feed-${s.id}`} style={[styles.tableCell, data.stage === s.id && styles.activeCellText]}>
                  {s.feedRatio}
                </Text>
              ))}
            </View>

            <View style={styles.highlightRowBase}>
              <View style={{ flex: 1.2 }} />
              {STAGES.map(s => (
                <View key={`hl-${s.id}`} style={[styles.tableHighlightCol, data.stage === s.id && styles.activeHighlightCol]} />
              ))}
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: { marginTop: 40 },
      android: { marginTop: 20 },
    }),
  },
  headerIcon: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  badgeContainer: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  updateWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  updateWeightBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },

  // Weight Log History
  weightLogSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  weightLogTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  weightLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#F9F9F9',
  },
  weightLogRowLatest: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
  },
  weightLogDate: { flex: 1, fontSize: 12, color: COLORS.textSecondary },
  weightLogAvg: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginRight: 6 },
  weightLogSample: { fontSize: 11, color: COLORS.textSecondary },

  // Ration Card
  rationRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginVertical: 10 },
  rationItem: { alignItems: 'center', flex: 1 },
  rationLabel: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  rationValue: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, marginTop: 4 },
  rationUnit: { fontSize: 14, color: COLORS.textSecondary },
  divider: { width: 1, height: 60, backgroundColor: COLORS.border },

  // Meal Breakdown
  mealBreakdown: {
    backgroundColor: '#F0F7F0',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  mealBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  mealBreakdownTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mealBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  mealItem: { alignItems: 'center' },
  mealItemGram: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  mealItemLabel: { fontSize: 12, color: COLORS.textSecondary },

  tempFactorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tempFactorText: { marginLeft: 6, fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },

  // Progress Bars
  progressRow: { marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 14, color: '#000', fontWeight: '500' },
  progressValueText: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  progressBackground: { height: 10, backgroundColor: COLORS.border, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 5 },

  // Table
  table: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableHeader: { backgroundColor: '#F0F7F0' },
  tableCell: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, textAlign: 'center', fontSize: 12, color: COLORS.text, zIndex: 1 },
  tableCellHeader: { fontWeight: 'bold', color: COLORS.primary },
  tableCellLabel: { textAlign: 'left', paddingLeft: 12, fontWeight: '500' },
  activeCellText: { fontWeight: 'bold', color: '#000' },
  highlightRowBase: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row', zIndex: 0 },
  tableHighlightCol: { flex: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'transparent' },
  activeHighlightCol: { backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: COLORS.secondary, borderWidth: 2 },

  // Load / Error States
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
  errorText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: 8 },
  retryText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },

  // Weight Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '88%', backgroundColor: COLORS.white, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#000', marginBottom: 8 },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 4 },
  textInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
    color: '#000', marginBottom: 16,
  },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    overflow: 'hidden', marginBottom: 16,
  },
  stepperBtn: { paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#EEEEEE' },
  stepperBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  stepperInput: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#000', paddingVertical: 8 },
  stepperUnit: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, paddingRight: 14 },
  previewBox: {
    backgroundColor: '#E8F5E9', borderRadius: 10, padding: 14,
    alignItems: 'center', marginBottom: 20,
  },
  previewLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  previewValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#F0F0F0' },
  modalBtnCancelText: { fontWeight: '600', fontSize: 15, color: '#555' },
  modalBtnSave: { backgroundColor: COLORS.primary },
  modalBtnSaveText: { fontWeight: '600', fontSize: 15, color: COLORS.white },
});
