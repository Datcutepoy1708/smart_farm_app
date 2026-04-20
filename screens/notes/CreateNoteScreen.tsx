import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert as RNAlert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { COLORS } from '../../constants/config';
import { barnApi, noteApi } from '../../services/api';

type NoteTag = 'urgent' | 'routine' | 'medical' | 'feeding';

interface Barn {
  id: number;
  name: string;
  status: string;
}

interface CreateNoteForm {
  title: string;
  content: string;
  tag: NoteTag;
  barnId: number | null;
}

const formatDateTime = (date: Date): string => {
  const dd  = date.getDate().toString().padStart(2, '0');
  const mm  = (date.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh  = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

type MaterialIconName = ComponentProps<typeof Icon>['name'];

const TAG_OPTIONS: { key: NoteTag; label: string; icon: MaterialIconName; color: string }[] = [
  { key: 'routine', label: 'Hàng ngày', icon: 'today',            color: '#4CAF50' },
  { key: 'medical', label: 'Y tế',      icon: 'medical-services', color: '#F44336' },
  { key: 'feeding', label: 'Cho ăn',    icon: 'restaurant',       color: '#2D6A2D' },
  { key: 'urgent',  label: 'Khẩn cấp', icon: 'warning',          color: '#FF9800' },
];

const CreateNoteScreen = () => {
  const navigation = useNavigation();
  const [saving, setSaving]   = useState(false);
  const [barns, setBarns]     = useState<Barn[]>([]);
  const [loadingBarns, setLoadingBarns] = useState(true);
  const [reminderAt, setReminderAt]     = useState<Date | null>(null);
  const [showPicker, setShowPicker]     = useState<'date' | 'time' | null>(null);
  const [tempDate, setTempDate]         = useState<Date>(new Date());
  const [isRecording, setIsRecording]   = useState(false);

  const [form, setForm] = useState<CreateNoteForm>({
    title:   '',
    content: '',
    tag:     'routine',
    barnId:  null,
  });

  // Xin quyền microphone
  useEffect(() => {
    ExpoSpeechRecognitionModule.requestPermissionsAsync();
  }, []);

  // Lắng nghe kết quả nhận dạng giọng nói
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    if (text) {
      setForm((prev) => ({ ...prev, content: (prev.content + ' ' + text).trimStart() }));
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsRecording(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsRecording(false);
    RNAlert.alert('Lỗi', 'Không nhận được giọng nói: ' + event.message);
  });

  const toggleVoiceInput = () => {
    if (isRecording) {
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      ExpoSpeechRecognitionModule.start({
        lang: 'vi-VN',
        interimResults: true,
        continuous: false,
      });
    }
  };

  // Load danh sách barn từ API
  useEffect(() => {
    const fetchBarns = async () => {
      try {
        const res = await barnApi.getAll();
        const list: Barn[] = res.data?.data ?? res.data ?? [];
        setBarns(list);
        // Tự động chọn barn đầu tiên nếu có
        if (list.length > 0) {
          setForm((prev) => ({ ...prev, barnId: list[0].id }));
        }
      } catch {
        // Nếu không load được barns thì bỏ qua, vẫn có thể tạo note
        console.warn('Không thể tải danh sách chuồng');
      } finally {
        setLoadingBarns(false);
      }
    };
    fetchBarns();
  }, []);

  const handleSave = async () => {
    if (!form.content.trim()) {
      RNAlert.alert('Lỗi', 'Vui lòng nhập nội dung ghi chú');
      return;
    }
    try {
      setSaving(true);
      const body = {
        title:      form.title.trim() || undefined,
        content:    form.content.trim(),
        tag:        form.tag,
        barnId:     form.barnId ?? undefined,
        reminderAt: reminderAt ? reminderAt.toISOString() : null,
      };
      const res = await noteApi.create(body);
      const result = res.data as { success: boolean; data?: { id: number } };
      if (result.success) {
        // ── Lên lịch Local Notification nếu người dùng chọn nhắc nhở ──
        if (reminderAt) {
          const now = new Date();
          const secondsUntilReminder = Math.floor((reminderAt.getTime() - now.getTime()) / 1000);

          if (secondsUntilReminder > 0) {
            // Xin quyền notification nếu chưa có
            const { status } = await Notifications.requestPermissionsAsync();

            if (status === 'granted') {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `🔔 Nhắc nhở: ${form.title.trim() || 'Ghi chú'}`,
                  body: form.content.trim().slice(0, 100),
                  sound: true,
                  data: {
                    type: 'reminder',
                    noteId: result.data?.id ?? null,
                  },
                },
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                  seconds: secondsUntilReminder,
                  repeats: false,
                },
              });
              console.log(`✅ Đã lên lịch thông báo sau ${secondsUntilReminder}s`);
            } else {
              RNAlert.alert(
                'Thiếu quyền thông báo',
                'Vui lòng cấp quyền thông báo trong Cài đặt để nhận nhắc nhở.',
              );
            }
          } else {
            // Thời gian đặt đã qua → bắn ngay lập tức
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `🔔 Nhắc nhở: ${form.title.trim() || 'Ghi chú'}`,
                body: form.content.trim().slice(0, 100),
                sound: true,
                data: { type: 'reminder', noteId: result.data?.id ?? null },
              },
              trigger: null, // trigger: null = bắn ngay
            });
          }
        }

        RNAlert.alert(
          'Thành công',
          reminderAt
            ? `Đã thêm ghi chú!\nBạn sẽ nhận thông báo lúc ${formatDateTime(reminderAt)}.`
            : 'Đã thêm ghi chú mới',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        throw new Error('API trả về lỗi');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      RNAlert.alert('Lỗi', `Không thể tạo ghi chú: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker(null);
      return;
    }
    const picked = selected ?? tempDate;
    if (showPicker === 'date') {
      setTempDate(picked);
      if (Platform.OS === 'android') setShowPicker('time');
      else setShowPicker('time');
    } else {
      const merged = new Date(
        tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate(),
        picked.getHours(), picked.getMinutes(),
      );
      setReminderAt(merged);
      setShowPicker(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm ghi chú mới</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>

          {/* Tiêu đề */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tiêu đề</Text>
            <TextInput
              style={styles.textInput}
              value={form.title}
              onChangeText={(text) => setForm((prev) => ({ ...prev, title: text }))}
              placeholder="Nhập tiêu đề ghi chú (tuỳ chọn)"
              placeholderTextColor={COLORS.gray}
            />
          </View>

          {/* Nội dung */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Nội dung <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.contentRow}>
              <TextInput
                style={[styles.textInput, styles.textArea, styles.contentInput]}
                value={form.content}
                onChangeText={(text) => setForm((prev) => ({ ...prev, content: text }))}
                placeholder="Nhập nội dung ghi chú"
                placeholderTextColor={COLORS.gray}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.micButton, isRecording && styles.micButtonActive]}
                onPress={toggleVoiceInput}
              >
                <Icon
                  name={isRecording ? 'mic' : 'mic-none'}
                  size={24}
                  color={isRecording ? '#FFFFFF' : '#2D6A2D'}
                />
              </TouchableOpacity>
            </View>
            {isRecording && (
              <Text style={styles.recordingText}>
                🔴 Đang nghe... nói và dừng lại khi xong
              </Text>
            )}
          </View>

          {/* Loại ghi chú */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Loại ghi chú</Text>
            <View style={styles.tagGrid}>
              {TAG_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.tagOption,
                    form.tag === opt.key && styles.tagOptionActive,
                    { borderLeftColor: opt.color },
                    form.tag === opt.key && { backgroundColor: opt.color, borderColor: opt.color },
                  ]}
                  onPress={() => setForm((prev) => ({ ...prev, tag: opt.key }))}
                >
                  <Icon name={opt.icon} size={18} color={form.tag === opt.key ? COLORS.white : COLORS.gray} />
                  <Text style={[styles.tagOptionText, form.tag === opt.key && styles.tagOptionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Chọn chuồng — dynamic từ API */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Chuồng (tuỳ chọn)</Text>
            {loadingBarns ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 8 }} />
            ) : barns.length === 0 ? (
              <Text style={styles.noBarnText}>Không có chuồng nào</Text>
            ) : (
              <View style={styles.barnGrid}>
                {/* Option "Không chọn" */}
                <TouchableOpacity
                  style={[styles.barnOption, form.barnId === null && styles.barnOptionActive]}
                  onPress={() => setForm((prev) => ({ ...prev, barnId: null }))}
                >
                  <Text style={[styles.barnOptionText, form.barnId === null && styles.barnOptionTextActive]}>
                    Không chọn
                  </Text>
                </TouchableOpacity>
                {barns.map((barn) => (
                  <TouchableOpacity
                    key={barn.id}
                    style={[styles.barnOption, form.barnId === barn.id && styles.barnOptionActive]}
                    onPress={() => setForm((prev) => ({ ...prev, barnId: barn.id }))}
                  >
                    <Text style={[styles.barnOptionText, form.barnId === barn.id && styles.barnOptionTextActive]}>
                      {barn.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Ngày thực hiện */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày thực hiện <Text style={styles.optional}>(tuỳ chọn)</Text></Text>
            <View style={styles.reminderRow}>
              <TouchableOpacity
                style={styles.reminderButton}
                onPress={() => {
                  setTempDate(reminderAt ?? new Date());
                  setShowPicker('date');
                }}
              >
                <Icon name="event" size={18} color={COLORS.primary} />
                <Text style={styles.reminderButtonText}>
                  {reminderAt ? formatDateTime(reminderAt) : 'Chọn ngày giờ...'}
                </Text>
              </TouchableOpacity>
              {reminderAt != null && (
                <TouchableOpacity
                  style={styles.reminderClear}
                  onPress={() => setReminderAt(null)}
                >
                  <Icon name="close" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* DateTimePicker modal */}
          {showPicker != null && (
            <DateTimePicker
              value={tempDate}
              mode={showPicker}
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={new Date()}
              onChange={onPickerChange}
            />
          )}

        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Icon name="save" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Lưu ghi chú</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: COLORS.background },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.primary },
  backButton:         { padding: 8 },
  headerTitle:        { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  placeholder:        { width: 40 },
  scrollView:         { flex: 1 },
  form:               { padding: 16 },
  inputGroup:         { marginBottom: 24 },
  inputLabel:         { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  required:           { color: COLORS.danger },
  textInput:          { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.white },
  textArea:           { height: 130, textAlignVertical: 'top' },
  contentRow:         { flexDirection: 'row', alignItems: 'flex-start' },
  contentInput:       { flex: 1, marginRight: 8 },
  micButton:          { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2D6A2D', marginTop: 0 },
  micButtonActive:    { backgroundColor: '#F44336', borderColor: '#F44336' },
  recordingText:      { color: '#F44336', fontSize: 12, marginTop: 6, fontWeight: '500' },
  tagGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tagOption:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.white, borderWidth: 1, borderLeftWidth: 4, borderColor: '#E0E0E0', minWidth: '45%' },
  tagOptionActive:    {},
  tagOptionText:      { fontSize: 13, color: COLORS.gray, marginLeft: 6, fontWeight: '500' },
  tagOptionTextActive:{ color: COLORS.white },
  barnGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  barnOption:         { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#E0E0E0' },
  barnOptionActive:   { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  barnOptionText:     { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  barnOptionTextActive:{ color: COLORS.white },
  noBarnText:         { fontSize: 13, color: COLORS.gray, fontStyle: 'italic', marginTop: 4 },
  optional:           { fontWeight: '400', color: COLORS.gray, fontSize: 13 },
  reminderRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reminderButton:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white },
  reminderButtonText: { fontSize: 14, color: COLORS.text, flex: 1 },
  reminderClear:      { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.danger, backgroundColor: '#FFF5F5' },
  footer:             { flexDirection: 'row', padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#E0E0E0', gap: 12 },
  actionButton:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
  cancelButton:       { backgroundColor: COLORS.background, borderWidth: 1, borderColor: '#E0E0E0' },
  saveButton:         { backgroundColor: COLORS.primary },
  saveButtonDisabled: { opacity: 0.6 },
  cancelButtonText:   { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  saveButtonText:     { fontSize: 15, color: COLORS.white, fontWeight: '600', marginLeft: 8 },
});

export default CreateNoteScreen;
