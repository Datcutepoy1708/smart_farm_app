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
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { feedApi, weightLogApi, farmAiApi } from '../../services/api';

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

  // Cám đang sử dụng
  const [activeFeed, setActiveFeed] = useState<any>(null);

  // Phân tích cám
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  // Bước xác nhận: 'confirm' | 'result'
  const [analysisStep, setAnalysisStep] = useState<'confirm' | 'result'>('confirm');
  // Form xác nhận thông tin bao bì
  const [confirmName, setConfirmName] = useState('');
  const [confirmProtein, setConfirmProtein] = useState('');
  const [confirmEnergy, setConfirmEnergy] = useState('');
  const [confirmCalcium, setConfirmCalcium] = useState('');
  const [confirmFiber, setConfirmFiber] = useState('');

  const barnId = 1;

  const fetchNutritionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [nutritionRes, weightLogsRes, activeFeedRes] = await Promise.all([
        feedApi.calculate(barnId),
        weightLogApi.getHistory(barnId, 5),
        feedApi.getActiveProduct(barnId),
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

      const activeProduct = activeFeedRes.data?.data || null;
      setActiveFeed(activeProduct);
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
  const handleScanFeed = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để quét.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      setIsAnalyzing(true);
      const uri = result.assets[0].uri;

      // Nén ảnh để giảm dung lượng base64
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipResult.base64) {
        throw new Error('Không thể chuyển đổi ảnh');
      }

      const response = await farmAiApi.analyzeFeed(barnId, `data:image/jpeg;base64,${manipResult.base64}`);
      console.log('[AI] Response status:', response.status);
      console.log('[AI] Response data:', JSON.stringify(response.data).substring(0, 500));
      
      const resultData = response.data.success && response.data.data ? response.data.data : response.data;
      if (resultData) {
        setAnalysisResult(resultData);
        // Pre-fill form xác nhận với dữ liệu AI quét được
        const analysis = resultData.analysis || resultData;
        setConfirmName(analysis.name_suggestion || '');
        setConfirmProtein(analysis.protein_pct?.toString() || '');
        setConfirmEnergy(analysis.energy_kcal?.toString() || '');
        setConfirmCalcium(analysis.calcium_pct?.toString() || '');
        setConfirmFiber(analysis.fiber_pct?.toString() || '');
        setAnalysisStep('confirm');
        setAnalysisModalVisible(true);
      }
    } catch (error: any) {
      console.error('[AI] Error code:', error?.code);
      console.error('[AI] Error message:', error?.message);
      console.error('[AI] Response status:', error?.response?.status);
      console.error('[AI] Response data:', JSON.stringify(error?.response?.data));
      Alert.alert('Lỗi', 'Không thể phân tích ảnh lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyFeedProduct = async (productId: number) => {
    try {
      setLoading(true);
      setAnalysisModalVisible(false);
      await feedApi.applyProduct(barnId, productId);
      await fetchNutritionData();
      Alert.alert('✅ Thành công', 'Đã áp dụng loại cám mới và cập nhật lượng ăn trong ngày!');
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể áp dụng loại cám này.');
    } finally {
      setLoading(false);
    }
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

  /** Tính toán mức độ phù hợp của cám với đàn gà */
  const calcFeedSuitability = (analysis: any): { score: number; level: 'good' | 'ok' | 'bad'; reasons: string[] } => {
    if (!data || !analysis) return { score: 0, level: 'bad', reasons: [] };
    const reasons: string[] = [];
    let score = 100;

    const stage = data.stage;
    const standardStage = STAGES.find(s => s.id === stage);
    if (!standardStage) return { score: 0, level: 'bad', reasons: [] };

    // Kiểm tra Protein
    const proteinDiff = parseFloat(confirmProtein || analysis.protein_pct) - standardStage.protein;
    if (proteinDiff < -2) {
      score -= 30;
      reasons.push(`❌ Đạm thấp hơn tiêu chuẩn ${standardStage.protein}% (hiện: ${confirmProtein || analysis.protein_pct}%)`);
    } else if (proteinDiff > 4) {
      score -= 10;
      reasons.push(`⚠️ Đạm cao hơn tiêu chuẩn (${standardStage.protein}%), dễ gây lãng phí`);
    } else {
      reasons.push(`✅ Đạm phù hợp tiêu chuẩn giai đoạn ${stage} (${standardStage.protein}%)`);
    }

    // Kiểm tra Năng lượng
    const energyVal = parseFloat(confirmEnergy || analysis.energy_kcal);
    const energyDiff = energyVal - standardStage.energy;
    if (energyDiff < -150) {
      score -= 25;
      reasons.push(`❌ Năng lượng thấp hơn tiêu chuẩn ${standardStage.energy} Kcal (hiện: ${energyVal} Kcal)`);
    } else if (energyDiff > 200) {
      score -= 5;
      reasons.push(`⚠️ Năng lượng hơi cao so với tiêu chuẩn ${standardStage.energy} Kcal`);
    } else {
      reasons.push(`✅ Năng lượng phù hợp giai đoạn ${stage} (${standardStage.energy} Kcal)`);
    }

    // Kiểm tra Xơ thô
    const fiberVal = parseFloat(confirmFiber || analysis.fiber_pct || '0');
    if (fiberVal > 6) {
      score -= 15;
      reasons.push(`⚠️ Xơ thô (${fiberVal}%) cao, có thể làm giảm tiêu hóa của gà`);
    } else if (fiberVal > 0) {
      reasons.push(`✅ Xơ thô trong ngưỡng cho phép (${fiberVal}%)`);
    }

    const level: 'good' | 'ok' | 'bad' = score >= 80 ? 'good' : score >= 55 ? 'ok' : 'bad';
    return { score: Math.max(0, score), level, reasons };
  };

  const renderFeedAnalysisModal = () => {
    if (!analysisResult) return null;
    const { analysis, id: productId } = analysisResult;

    // --- BƯỚC 1: XÁC NHẬN THÔNG TIN BAO BÌ ---
    if (analysisStep === 'confirm') {
      return (
        <Modal visible={analysisModalVisible} animationType="slide" transparent>
          <View style={styles.aiModalOverlay}>
            <View style={styles.aiBottomSheet}>
              {/* Handle bar */}
              <View style={styles.sheetHandle} />

              {/* Step indicator */}
              <View style={styles.stepIndicatorRow}>
                <View style={[styles.stepDot, styles.stepDotActive]} />
                <View style={styles.stepLine} />
                <View style={styles.stepDot} />
              </View>

              {/* Header */}
              <View style={styles.sheetHeader}>
                <View style={styles.sheetIconWrap}>
                  <Ionicons name="scan-outline" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.sheetStepLabel}>Bước 1 / 2</Text>
                  <Text style={styles.sheetTitle}>Xác nhận bao bì</Text>
                </View>
                <TouchableOpacity onPress={() => setAnalysisModalVisible(false)} style={styles.sheetCloseBtn}>
                  <Ionicons name="close" size={20} color="#999" />
                </TouchableOpacity>
              </View>

              <Text style={styles.sheetSubtitle}>
                AI đã đọc được thông tin dưới đây. Đối chiếu với bao bì thật và chỉnh sửa nếu cần.
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Tên sản phẩm */}
                <View style={styles.aiInputGroup}>
                  <View style={styles.aiInputIcon}>
                    <Ionicons name="pricetag-outline" size={14} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aiInputLabel}>Tên sản phẩm</Text>
                    <TextInput
                      style={styles.aiInput}
                      value={confirmName}
                      onChangeText={setConfirmName}
                      placeholder="Tên loại cám..."
                      placeholderTextColor="#bbb"
                    />
                  </View>
                </View>

                {/* Grid 2 cột */}
                <View style={styles.aiGridRow}>
                  <View style={[styles.aiInputGroup, { flex: 1, marginRight: 6 }]}>
                    <View style={styles.aiInputIcon}>
                      <Ionicons name="flask-outline" size={14} color="#4CAF50" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.aiInputLabel}>Đạm (%)</Text>
                      <TextInput
                        style={styles.aiInput}
                        value={confirmProtein}
                        onChangeText={setConfirmProtein}
                        keyboardType="decimal-pad"
                        placeholder="20"
                        placeholderTextColor="#bbb"
                      />
                    </View>
                  </View>
                  <View style={[styles.aiInputGroup, { flex: 1, marginLeft: 6 }]}>
                    <View style={[styles.aiInputIcon, { backgroundColor: '#FFF3E0' }]}>
                      <Ionicons name="flash-outline" size={14} color="#FF9800" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.aiInputLabel}>Năng lượng (Kcal)</Text>
                      <TextInput
                        style={styles.aiInput}
                        value={confirmEnergy}
                        onChangeText={setConfirmEnergy}
                        keyboardType="decimal-pad"
                        placeholder="3100"
                        placeholderTextColor="#bbb"
                      />
                    </View>
                  </View>
                </View>
                <View style={styles.aiGridRow}>
                  <View style={[styles.aiInputGroup, { flex: 1, marginRight: 6 }]}>
                    <View style={[styles.aiInputIcon, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="water-outline" size={14} color="#2196F3" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.aiInputLabel}>Canxi (%)</Text>
                      <TextInput
                        style={styles.aiInput}
                        value={confirmCalcium}
                        onChangeText={setConfirmCalcium}
                        keyboardType="decimal-pad"
                        placeholder="1.2"
                        placeholderTextColor="#bbb"
                      />
                    </View>
                  </View>
                  <View style={[styles.aiInputGroup, { flex: 1, marginLeft: 6 }]}>
                    <View style={[styles.aiInputIcon, { backgroundColor: '#F3E5F5' }]}>
                      <Ionicons name="leaf-outline" size={14} color="#9C27B0" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.aiInputLabel}>Xơ thô (%)</Text>
                      <TextInput
                        style={styles.aiInput}
                        value={confirmFiber}
                        onChangeText={setConfirmFiber}
                        keyboardType="decimal-pad"
                        placeholder="4"
                        placeholderTextColor="#bbb"
                      />
                    </View>
                  </View>
                </View>

                {/* Hint */}
                <View style={styles.aiHintRow}>
                  <Ionicons name="bulb-outline" size={15} color="#FF9800" />
                  <Text style={styles.aiHintText}>
                    Thông tin trên có thể sai nếu ảnh mờ — hãy kiểm tra và sửa trực tiếp.
                  </Text>
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={styles.aiActionRow}>
                <TouchableOpacity style={styles.aiCancelBtn} onPress={() => setAnalysisModalVisible(false)}>
                  <Text style={styles.aiCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.aiPrimaryBtn} onPress={() => setAnalysisStep('result')}>
                  <Text style={styles.aiPrimaryText}>Xem khuyến nghị</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      );
    }

    // --- BƯỚC 2: KẾT QUẢ + KHUYẾN NGHỊ PHÙ HỢP ---
    const suitability = calcFeedSuitability(analysis);
    const suitabilityColor = suitability.level === 'good' ? '#2E7D32' : suitability.level === 'ok' ? '#E65100' : '#C62828';
    const suitabilityColorLight = suitability.level === 'good' ? '#4CAF50' : suitability.level === 'ok' ? '#FF9800' : '#F44336';
    const suitabilityBg = suitability.level === 'good' ? '#E8F5E9' : suitability.level === 'ok' ? '#FFF3E0' : '#FFEBEE';
    const suitabilityEmoji = suitability.level === 'good' ? '✅' : suitability.level === 'ok' ? '⚠️' : '❌';
    const suitabilityLabel = suitability.level === 'good' ? 'Phù hợp' : suitability.level === 'ok' ? 'Tạm được' : 'Không phù hợp';

    const nutrientPills = [
      { label: 'Đạm', value: `${confirmProtein || analysis.protein_pct}%`, color: '#4CAF50', bg: '#E8F5E9', icon: 'flask-outline' as const },
      { label: 'Năng lượng', value: `${confirmEnergy || analysis.energy_kcal}`, unit: 'Kcal', color: '#FF9800', bg: '#FFF3E0', icon: 'flash-outline' as const },
      { label: 'Canxi', value: `${confirmCalcium || analysis.calcium_pct}%`, color: '#2196F3', bg: '#E3F2FD', icon: 'water-outline' as const },
      { label: 'Xơ thô', value: `${confirmFiber || analysis.fiber_pct}%`, color: '#9C27B0', bg: '#F3E5F5', icon: 'leaf-outline' as const },
    ];

    return (
      <Modal visible={analysisModalVisible} animationType="slide" transparent>
        <View style={styles.aiModalOverlay}>
          <View style={styles.aiBottomSheet}>
            {/* Handle bar */}
            <View style={styles.sheetHandle} />

            {/* Step indicator */}
            <View style={styles.stepIndicatorRow}>
              <View style={[styles.stepDot, styles.stepDotDone]} />
              <View style={[styles.stepLine, { backgroundColor: COLORS.secondary }]} />
              <View style={[styles.stepDot, styles.stepDotActive]} />
            </View>

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetIconWrap, { backgroundColor: COLORS.orange }]}>
                <Ionicons name="sparkles" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.sheetStepLabel}>Bước 2 / 2</Text>
                <Text style={styles.sheetTitle}>{confirmName || analysis.name_suggestion}</Text>
              </View>
              <TouchableOpacity onPress={() => setAnalysisModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Nutrient pills */}
              <View style={styles.pillRow}>
                {nutrientPills.map((p, i) => (
                  <View key={i} style={[styles.nutrientPill, { backgroundColor: p.bg }]}>
                    <Ionicons name={p.icon} size={14} color={p.color} />
                    <Text style={[styles.pillValue, { color: p.color }]}>{p.value}{p.unit ? '' : ''}</Text>
                    {p.unit && <Text style={[styles.pillUnit, { color: p.color }]}>{p.unit}</Text>}
                    <Text style={styles.pillLabel}>{p.label}</Text>
                  </View>
                ))}
              </View>

              {/* Suitability card */}
              <View style={[styles.suitCard, { borderLeftColor: suitabilityColorLight }]}>
                <View style={styles.suitCardHeader}>
                  <View>
                    <Text style={styles.suitCardTitle}>Khuyến nghị cho đàn gà</Text>
                    <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>
                      Giai đoạn <Text style={{ fontWeight: '700', color: '#333' }}>{data?.stage?.toUpperCase()}</Text> • {data?.ageDays} ngày tuổi
                    </Text>
                  </View>
                  <View style={[styles.suitBadge, { backgroundColor: suitabilityColorLight }]}>
                    <Text style={styles.suitBadgeText}>{suitabilityEmoji} {suitabilityLabel}</Text>
                  </View>
                </View>

                {/* Score bar */}
                <View style={styles.scoreRow}>
                  <View style={styles.scoreBarBg}>
                    <View style={[styles.scoreBarFill, { width: `${suitability.score}%`, backgroundColor: suitabilityColorLight }]} />
                  </View>
                  <Text style={[styles.scoreNum, { color: suitabilityColorLight }]}>{suitability.score}</Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>

                {/* Reasons */}
                <View style={{ marginTop: 8 }}>
                  {suitability.reasons.map((reason, idx) => (
                    <View key={idx} style={styles.reasonRow}>
                      <Text style={styles.reasonText}>{reason}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* AI dose card */}
              <View style={styles.doseCard}>
                <View style={styles.doseLeft}>
                  <Ionicons name="nutrition-outline" size={32} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.doseLabel}>AI đề xuất · Lượng ăn mỗi ngày</Text>
                  <Text style={styles.doseValue}>{analysis.recommendedGramPerChicken}g <Text style={styles.doseUnit}>/ con</Text></Text>
                  <Text style={styles.doseExplain} numberOfLines={3}>{analysis.explanation}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.aiActionRow}>
              <TouchableOpacity style={styles.aiCancelBtn} onPress={() => setAnalysisStep('confirm')}>
                <Ionicons name="arrow-back" size={15} color="#666" />
                <Text style={[styles.aiCancelText, { marginLeft: 4 }]}>Sửa lại</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.aiPrimaryBtn, { backgroundColor: COLORS.orange }]} onPress={() => handleApplyFeedProduct(productId)}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={[styles.aiPrimaryText, { marginLeft: 6 }]}>Áp dụng cám này</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };


  if (loading || isAnalyzing) {
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
          <Text style={styles.loadingText}>
            {isAnalyzing ? 'Đang phân tích bao bì bằng AI...' : 'Đang tính toán khẩu phần...'}
          </Text>
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
      {renderFeedAnalysisModal()}

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

        {/* Nút Quét AI Mới */}
        <TouchableOpacity style={styles.scanAiBtn} onPress={handleScanFeed}>
          <View style={styles.scanAiBtnContent}>
            <Ionicons name="scan-outline" size={24} color={COLORS.white} />
            <Text style={styles.scanAiBtnText}>Quét bao bì thức ăn (AI)</Text>
          </View>
          <Ionicons name="sparkles" size={20} color="#FFF176" />
        </TouchableOpacity>

        {/* Card Đang sử dụng nếu có activeFeed */}
        {activeFeed && (
          <View style={[styles.card, { borderColor: COLORS.orange, borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
              <Ionicons name="leaf" size={18} color={COLORS.orange} />
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.orange }}>
                Đang sử dụng
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              {activeFeed.imageUrl && (
                <Image
                  source={{ uri: activeFeed.imageUrl }}
                  style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12, backgroundColor: '#eee' }}
                  resizeMode="cover"
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 }}>
                  {activeFeed.name}
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
                  Đạm: {activeFeed.proteinPct}% • Năng lượng: {activeFeed.energyKcalPerKg} Kcal
                </Text>
                {activeFeed.fiberPct > 0 && (
                   <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
                     Xơ thô: {activeFeed.fiberPct}%
                   </Text>
                )}
              </View>
            </View>
          </View>
        )}

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
          <Text style={styles.cardTitle}>
            {activeFeed ? `Thành phần Cám Hiện Tại` : `Tiêu chuẩn (${data.stage.toUpperCase()})`}
          </Text>

          {activeFeed ? (
            <>
              {renderProgressBar('Protein', `${activeFeed.proteinPct}%`, (activeFeed.proteinPct / 30) * 100)}
              {renderProgressBar('Năng lượng', `${activeFeed.energyKcalPerKg} kcal/kg`, (activeFeed.energyKcalPerKg / 3500) * 100)}
              {activeFeed.calciumPct > 0 && renderProgressBar('Canxi', `${activeFeed.calciumPct}%`, (activeFeed.calciumPct / 5) * 100)}
              {activeFeed.fiberPct > 0 && renderProgressBar('Xơ thô', `${activeFeed.fiberPct}%`, (activeFeed.fiberPct / 10) * 100)}
            </>
          ) : (
            <>
              {renderProgressBar('Protein', `${data.standard.proteinPct}%`, (data.standard.proteinPct / 30) * 100)}
              {renderProgressBar('Năng lượng', `${data.standard.energyKcalPerKg} kcal/kg`, (data.standard.energyKcalPerKg / 3500) * 100)}
              {renderProgressBar('Tỷ lệ thức ăn', `${data.standard.feedRatio.toFixed(2)} g/g`, (data.standard.feedRatio / 0.4) * 100)}
              {renderProgressBar('Tỷ lệ nước', `${data.standard.waterRatio.toFixed(1)} L/con`, (data.standard.waterRatio / 3) * 100)}
            </>
          )}
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

  // ── AI Modal – Bottom Sheet ─────────────────────────────
  aiModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  aiBottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 56,
    paddingTop: 12,
    maxHeight: '92%',
  },
  sheetHandle: {
    width: 40, height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },

  // Step indicator dots
  stepIndicatorRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
  },
  stepDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#DDD',
  },
  stepDotActive: { backgroundColor: COLORS.primary, width: 24, borderRadius: 5 },
  stepDotDone: { backgroundColor: COLORS.secondary },
  stepLine: {
    width: 32, height: 2,
    backgroundColor: '#DDD',
    marginHorizontal: 4,
  },

  // Sheet header
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 8,
  },
  sheetIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetStepLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.5 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginTop: 1 },
  sheetCloseBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetSubtitle: {
    fontSize: 12.5, color: '#888', lineHeight: 18,
    marginBottom: 16,
  },

  // Input groups
  aiInputGroup: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12, padding: 12,
    marginBottom: 10,
    borderWidth: 1, borderColor: '#EEEEEE',
  },
  aiInputIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, marginTop: 2,
  },
  aiInputLabel: { fontSize: 11, color: '#999', fontWeight: '600', marginBottom: 3 },
  aiInput: {
    fontSize: 15, fontWeight: '600', color: '#222',
    paddingVertical: 0,
  },
  aiGridRow: { flexDirection: 'row' },
  aiHintRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFFDE7',
    borderRadius: 10, padding: 10,
    marginTop: 2, marginBottom: 6,
    gap: 8,
  },
  aiHintText: { fontSize: 12, color: '#795548', flex: 1, lineHeight: 17 },

  // Nutrient pills (step 2)
  pillRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, marginBottom: 14,
  },
  nutrientPill: {
    flex: 1, minWidth: '44%',
    borderRadius: 14, padding: 12,
    alignItems: 'center',
  },
  pillValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  pillUnit: { fontSize: 10, fontWeight: '600', marginTop: -2 },
  pillLabel: { fontSize: 11, color: '#777', marginTop: 4, fontWeight: '500' },

  // Suitability card
  suitCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16, padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1, borderColor: '#EEEEEE',
  },
  suitCardHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 10,
  },
  suitCardTitle: { fontSize: 13, fontWeight: '700', color: '#222' },
  suitBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  suitBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  scoreRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 10,
  },
  scoreBarBg: {
    flex: 1, height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4, overflow: 'hidden',
  },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  scoreNum: { fontSize: 16, fontWeight: '800' },
  scoreMax: { fontSize: 11, color: '#999', fontWeight: '600' },
  reasonRow: { marginBottom: 5 },
  reasonText: { fontSize: 12.5, color: '#444', lineHeight: 18 },

  // Dose card
  doseCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#F0F7F0',
    borderRadius: 16, padding: 14,
    marginBottom: 16, gap: 12,
  },
  doseLeft: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#C8E6C9',
    alignItems: 'center', justifyContent: 'center',
  },
  doseLabel: { fontSize: 11, color: '#777', fontWeight: '600' },
  doseValue: { fontSize: 26, fontWeight: '800', color: COLORS.primary, marginTop: 2 },
  doseUnit: { fontSize: 14, fontWeight: '500', color: '#888' },
  doseExplain: { fontSize: 12, color: '#666', lineHeight: 17, marginTop: 4 },

  // Action row
  aiActionRow: {
    flexDirection: 'row', gap: 10,
    marginTop: 12,
  },
  aiCancelBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 18,
    borderRadius: 14, backgroundColor: '#F0F0F0',
  },
  aiCancelText: { fontSize: 14, fontWeight: '600', color: '#555' },
  aiPrimaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 14, backgroundColor: COLORS.primary,
  },
  aiPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // kept for weight modal compat
  stepBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: COLORS.secondary },
  stepBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  confirmGridRow: { flexDirection: 'row', marginBottom: 0 },
  confirmHintBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F0F7F0', borderRadius: 8, padding: 10, marginBottom: 16 },
  confirmedTable: { backgroundColor: '#F9F9F9', borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  confirmedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  confirmedLabel: { fontSize: 13, color: COLORS.textSecondary },
  confirmedValue: { fontSize: 13, fontWeight: 'bold', color: COLORS.text },
  suitabilityBox: { borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1.5 },
  suitabilityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  suitabilityTitle: { fontSize: 14, fontWeight: 'bold' },
  suitabilityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  suitabilityBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  scoreBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  scoreText: { fontSize: 13, fontWeight: 'bold', minWidth: 50, textAlign: 'right' },
  suitabilityReason: { fontSize: 12, color: '#444', marginBottom: 4, lineHeight: 18 },
  
  // Nút AI
  scanAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scanAiBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scanAiBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
