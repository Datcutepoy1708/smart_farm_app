import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/config';

const FarmAIScreen = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const mockChatHistory = [
    {
      id: 1,
      type: 'user',
      message: 'Tình hình sức khỏe đàn gà chuồng 01 thế nào?',
      time: '10:30',
    },
    {
      id: 2,
      type: 'ai',
      message: 'Dựa trên dữ liệu cảm biến, đàn gà chuồng 01 đang có tình trạng sức khỏe tốt:\n\n• Nhiệt độ trung bình: 28.5°C (phù hợp)\n• Độ ẩm: 65% (tốt)\n• Tăng trưởng bình thường: 45g/ngày\n• Tỷ lệ ăn uống: 1.8:1 (lý tưởng)\n\nKhông có dấu hiệu bất thường cần quan tâm.',
      time: '10:31',
    },
    {
      id: 3,
      type: 'user',
      message: 'Khi nào nên thu hoạch?',
      time: '10:35',
    },
    {
      id: 4,
      type: 'ai',
      message: 'Dựa trên phân tích dữ liệu:\n\n• Tuổi hiện tại: 38 ngày\n• Cân nặng trung bình: 2.1kg\n• Tỷ lệ đồng đều: 92%\n\nKhuyến nghị: Thu hoạch vào 40-42 ngày để đạt hiệu quả kinh tế tốt nhất. Đàn gà đã đạt cân nặng mục tiêu và chất lượng thịt tốt.',
      time: '10:36',
    },
  ];

  const mockAnalyses = [
    {
      id: 1,
      title: 'Phân tích tăng trưởng',
      description: 'Đàn gà chuồng 02 tăng trưởng tốt hơn 15% so với tuần trước',
      time: '2 giờ trước',
      type: 'growth',
      icon: 'trending-up',
      color: COLORS.secondary,
    },
    {
      id: 2,
      title: 'Dự báo bệnh tật',
      description: 'Nguy cơ cao về bệnh đường hô hấp do thời tiết thay đổi',
      time: '4 giờ trước',
      type: 'health',
      icon: 'healing',
      color: COLORS.warning,
    },
    {
      id: 3,
      title: 'Tối ưu thức ăn',
      description: 'Có thể giảm 10% chi phí thức ăn mà vẫn đảm bảo tăng trưởng',
      time: '1 ngày trước',
      type: 'feed',
      icon: 'restaurant',
      color: COLORS.primary,
    },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'growth':
        return 'trending-up';
      case 'health':
        return 'healing';
      case 'feed':
        return 'restaurant';
      default:
        return 'analytics';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Farm AI Assistant</Text>
        <TouchableOpacity style={styles.historyButton}>
          <Icon name="history" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* AI Analyses Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phân tích thông minh</Text>
          {mockAnalyses.map((analysis) => (
            <TouchableOpacity key={analysis.id} style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <View style={[styles.analysisIcon, { backgroundColor: analysis.color }]}>
                  <Icon name={analysis.icon} size={20} color={COLORS.white} />
                </View>
                <View style={styles.analysisInfo}>
                  <Text style={styles.analysisTitle}>{analysis.title}</Text>
                  <Text style={styles.analysisTime}>{analysis.time}</Text>
                </View>
                <Icon name="chevron-right" size={20} color={COLORS.gray} />
              </View>
              <Text style={styles.analysisDescription}>{analysis.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chat Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hỏi & Đáp</Text>
          <View style={styles.chatContainer}>
            {mockChatHistory.map((chat) => (
              <View
                key={chat.id}
                style={[
                  styles.chatMessage,
                  chat.type === 'user' ? styles.userMessage : styles.aiMessage,
                ]}
              >
                <View style={styles.messageHeader}>
                  <View style={styles.avatar}>
                    <Icon
                      name={chat.type === 'user' ? 'person' : 'smart-toy'}
                      size={16}
                      color={COLORS.white}
                    />
                  </View>
                  <Text style={styles.messageTime}>{chat.time}</Text>
                </View>
                <Text style={styles.messageText}>{chat.message}</Text>
              </View>
            ))}
            
            {isTyping && (
              <View style={[styles.chatMessage, styles.aiMessage]}>
                <View style={styles.messageHeader}>
                  <View style={styles.avatar}>
                    <Icon name="smart-toy" size={16} color={COLORS.white} />
                  </View>
                </View>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Hỏi Farm AI về trang trại của bạn..."
          placeholderTextColor={COLORS.gray}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!message.trim()}
        >
          <Icon name="send" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
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
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  historyButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  analysisInfo: {
    flex: 1,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  analysisTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  analysisDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  chatContainer: {
    marginBottom: 20,
  },
  chatMessage: {
    maxWidth: '85%',
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    elevation: 3,
  },
  typingIndicator: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    elevation: 3,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gray,
    marginHorizontal: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
    color: COLORS.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
});

export default FarmAIScreen;
