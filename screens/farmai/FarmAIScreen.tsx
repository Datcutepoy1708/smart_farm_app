import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import { farmAiApi } from '../../services/api';

// ─── Colors ──────────────────────────────────────────────────────────────────
const PRIMARY = '#2D6A2D';
const SECONDARY = '#4CAF50';
const BG = '#F5F5F5';
const WHITE = '#FFFFFF';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ApiChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ChatReply {
  reply: string;
  contextUsed: Record<string, unknown>;
}

const BARN_ID = 1;

const QUICK_ACTIONS = [
  '🌡️ Nhiệt độ có ổn không?',
  '🍽️ Tính khẩu phần hôm nay',
  '🐔 Kiểm tra sức khỏe đàn gà',
  '⚠️ Giải thích cảnh báo',
  '💊 Phòng bệnh mùa này',
];

const GREETING: ChatMessage = {
  id: 0,
  role: 'assistant',
  content:
    'Xin chào! Tôi là FarmAI 🌱\nTôi có thể giúp bạn quản lý đàn gà thịt hiệu quả hơn.\nHôm nay tôi có thể giúp gì cho bạn?',
  createdAt: new Date().toISOString(),
};

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeBounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
          Animated.delay(600 - delay),
        ])
      );

    const a1 = makeBounce(dot1, 0);
    const a2 = makeBounce(dot2, 150);
    const a3 = makeBounce(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarEmoji}>🌱</Text>
      </View>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.typingDot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
};

// ─── Single Message Bubble ────────────────────────────────────────────────────
const MessageBubble: React.FC<{ item: ChatMessage }> = ({ item }) => {
  const isUser = item.role === 'user';
  const time = new Date(item.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{item.content}</Text>
        </View>
        <Text style={styles.timestampRight}>{time}</Text>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarEmoji}>🌱</Text>
      </View>
      <View style={styles.assistantColumn}>
        <View style={styles.assistantBubble}>
          <Text style={styles.assistantText}>{item.content}</Text>
        </View>
        <Text style={styles.timestampLeft}>{time}</Text>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const FarmAIScreen: React.FC = () => {
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  // ── Voice setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const result = e.value?.[0];
      if (result) setInputText(result);
      setIsRecording(false);
    };
    Voice.onSpeechError = (_e: SpeechErrorEvent) => setIsRecording(false);
    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => null);
    };
  }, []);

  const handleMic = async () => {
    if (isRecording) {
      await Voice.stop();
      setIsRecording(false);
    } else {
      try {
        setIsRecording(true);
        await Voice.start('vi-VN');
      } catch {
        setIsRecording(false);
      }
    }
  };

  // ── Fetch history ────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await farmAiApi.getChatHistory(BARN_ID, 20);
        const data = (res.data as ApiResponse<ApiChatMessage[]>).data;
        if (data.length === 0) {
          setMessages([GREETING]);
        } else {
          setMessages(data);
        }
      } catch {
        setMessages([GREETING]);
      } finally {
        setIsFetchingHistory(false);
      }
    };
    loadHistory();
  }, []);

  // ── Auto scroll ──────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await farmAiApi.sendMessage({ barnId: BARN_ID, message: trimmed });
      const { reply } = (res.data as ApiResponse<ChatReply>).data;
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Xin lỗi, tôi gặp lỗi kết nối. Vui lòng thử lại sau.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // ── Quick action ─────────────────────────────────────────────────────────────
  const handleQuickAction = (action: string) => sendMessage(action);

  // ── Header component (quick action chips) ───────────────────────────────────
  const ListHeader = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipsRow}
      contentContainerStyle={styles.chipsContent}
    >
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity
          key={action}
          style={styles.chip}
          onPress={() => handleQuickAction(action)}
          disabled={isLoading}
        >
          <Text style={styles.chipText}>{action}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  if (isFetchingHistory) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </SafeAreaView>
    );
  }

  // Header height offset for KeyboardAvoidingView
  const statusBarHeight = StatusBar.currentHeight ?? 0;
  const headerOffset = insets.top + statusBarHeight + 52; // 52 = approx header height

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleEmoji}>🌱</Text>
          <Text style={styles.headerTitleText}>FarmAI</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerOffset : 0}
      >
        {/* Chat List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          renderItem={({ item }) => <MessageBubble item={item} />}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={isLoading ? <TypingDots /> : null}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={scrollToBottom}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Hỏi FarmAI..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.iconBtn, isRecording && styles.iconBtnRecording]}
            onPress={handleMic}
            disabled={isLoading}
          >
            <Ionicons name="mic" size={22} color={isRecording ? '#E53935' : '#666'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="arrow-forward" size={20} color={WHITE} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },
  loadingText: { marginTop: 12, color: '#555', fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  headerTitleEmoji: { fontSize: 20, marginRight: 6 },
  headerTitleText: { fontSize: 18, fontWeight: '700', color: WHITE },

  // List
  listContent: { paddingVertical: 12, paddingHorizontal: 10 },

  // Quick chips
  chipsRow: { marginBottom: 8 },
  chipsContent: { paddingHorizontal: 2, gap: 8, flexDirection: 'row' },
  chip: {
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  chipText: { fontSize: 13, color: PRIMARY, fontWeight: '500' },

  // User bubble
  userRow: { alignItems: 'flex-end', marginBottom: 10, marginLeft: 60 },
  userBubble: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  userText: { color: WHITE, fontSize: 15, lineHeight: 21 },
  timestampRight: { fontSize: 11, color: '#999', marginTop: 4 },

  // Assistant bubble
  assistantRow: { flexDirection: 'row', marginBottom: 10, marginRight: 60, alignItems: 'flex-end' },
  assistantColumn: { flex: 1 },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  avatarEmoji: { fontSize: 16 },
  assistantBubble: {
    backgroundColor: WHITE,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  assistantText: { color: '#222', fontSize: 15, lineHeight: 21 },
  timestampLeft: { fontSize: 11, color: '#999', marginTop: 4, marginLeft: 2 },

  // Typing
  typingContainer: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, marginRight: 60 },
  typingBubble: {
    backgroundColor: WHITE,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: SECONDARY },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: WHITE,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 15,
    color: '#222',
    maxHeight: 110,
    backgroundColor: '#FAFAFA',
    marginRight: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    backgroundColor: '#F0F0F0',
  },
  iconBtnRecording: { backgroundColor: '#FFEBEE' },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#BDBDBD' },
});

export default FarmAIScreen;
