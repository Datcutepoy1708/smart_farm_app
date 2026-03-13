import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert as RNAlert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/config';

const FarmAIScreen = () => {
  const navigation = useNavigation();
  const [question, setQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([
    {
      id: 1,
      question: 'Đàn gà chuồng 01 có dấu hiệu bệnh không?',
      answer: 'Dựa trên hình ảnh và dữ liệu, đàn gà chuồng 01 đang có dấu hiệu khỏe mạnh. Tỷ lệ ăn uống bình thường, không có triệu chứng bệnh tật. Tiếp tục duy trì chế độ chăm sóc hiện tại.',
      timestamp: '2024-03-12 10:30',
      type: 'health'
    },
    {
      id: 2,
      question: 'Tối ưu lượng thức ăn cho gà 2 tuần tuổi',
      answer: 'Đối với gà 2 tuần tuổi, khuyến cáo: 60-70g/con/ngày, chia 4-5 bữa. Protein 18-20%, đảm bảo nước sạch miễn phí. Theo dõi cân nặng hàng tuần.',
      timestamp: '2024-03-11 14:15',
      type: 'feeding'
    }
  ]);

  const aiFeatures = [
    {
      id: 'health',
      title: 'Phân tích sức khỏe',
      icon: 'medical-services',
      description: 'Chụp ảnh và nhận diện bệnh tật',
      color: COLORS.danger
    },
    {
      id: 'feeding',
      title: 'Tối ưu thức ăn',
      icon: 'restaurant',
      description: 'Tính toán lượng thức ăn phù hợp',
      color: COLORS.secondary
    },
    {
      id: 'growth',
      title: 'Dự báo tăng trưởng',
      icon: 'trending-up',
      description: 'Phân tích và dự báo tăng trưởng',
      color: COLORS.primary
    },
    {
      id: 'environment',
      title: 'Môi trường chuồng',
      icon: 'thermostat',
      description: 'Tối ưu nhiệt độ, độ ẩm',
      color: COLORS.warning
    }
  ];

  const handleAnalyze = () => {
    if (!question.trim()) {
      RNAlert.alert('Lỗi', 'Vui lòng nhập câu hỏi');
      return;
    }

    setIsAnalyzing(true);

    // TODO: Call AI API
    setTimeout(() => {
      const mockResponse = {
        id: Date.now(),
        question: question,
        answer: 'Đang phân tích câu hỏi của bạn... Đây là câu trả lời mẫu từ AI. Trong thực tế, sẽ gọi API để phân tích và đưa ra câu trả lời chính xác.',
        timestamp: new Date().toLocaleString('vi-VN'),
        type: 'general'
      };

      setAnalysisHistory([mockResponse, ...analysisHistory]);
      setQuestion('');
      setIsAnalyzing(false);
      
      RNAlert.alert('Thành công', 'Đã phân tích xong!');
    }, 2000);
  };

  const renderAnalysisCard = (item: any) => (
    <View key={item.id} style={styles.analysisCard}>
      <View style={styles.analysisHeader}>
        <View style={styles.analysisMeta}>
          <Text style={styles.analysisQuestion}>{item.question}</Text>
          <Text style={styles.analysisTime}>{item.timestamp}</Text>
        </View>
        <View style={[styles.analysisType, { backgroundColor: getAnalysisTypeColor(item.type) }]}>
          <Text style={styles.analysisTypeText}>{getAnalysisTypeLabel(item.type)}</Text>
        </View>
      </View>
      <Text style={styles.analysisAnswer}>{item.answer}</Text>
    </View>
  );

  const getAnalysisTypeColor = (type: string) => {
    switch (type) {
      case 'health': return COLORS.danger;
      case 'feeding': return COLORS.secondary;
      case 'growth': return COLORS.primary;
      case 'environment': return COLORS.warning;
      default: return COLORS.gray;
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'health': return 'Sức khỏe';
      case 'feeding': return 'Thức ăn';
      case 'growth': return 'Tăng trưởng';
      case 'environment': return 'Môi trường';
      default: return 'Chung';
    }
  };

  const renderFeatureCard = (feature: any) => (
    <TouchableOpacity key={feature.id} style={styles.featureCard}>
      <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
        <Icon name={feature.icon} size={32} color={feature.color} />
      </View>
      <Text style={styles.featureTitle}>{feature.title}</Text>
      <Text style={styles.featureDescription}>{feature.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FarmAI</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="history" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* AI Features Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tính năng AI</Text>
          <View style={styles.featuresGrid}>
            {aiFeatures.map(renderFeatureCard)}
          </View>
        </View>

        {/* Question Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hỏi AI</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={question}
              onChangeText={setQuestion}
              placeholder="Nhập câu hỏi về trang trại của bạn..."
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
            >
              <Icon 
                name={isAnalyzing ? "hourglass-empty" : "psychology"} 
                size={20} 
                color={COLORS.white} 
              />
              <Text style={styles.analyzeButtonText}>
                {isAnalyzing ? 'Đang phân tích...' : 'Phân tích'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Analysis History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch sử phân tích</Text>
          {analysisHistory.map(renderAnalysisCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerButton: {
    padding: 8,
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 16,
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  analyzeButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  analyzeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  analysisCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  analysisMeta: {
    flex: 1,
    marginRight: 12,
  },
  analysisQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  analysisTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  analysisType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  analysisTypeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  analysisAnswer: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});

export default FarmAIScreen;
