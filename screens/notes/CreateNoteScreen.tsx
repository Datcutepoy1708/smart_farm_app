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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
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

const TAG_OPTIONS: { key: NoteTag; label: string; icon: string; color: string }[] = [
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

  const [form, setForm] = useState<CreateNoteForm>({
    title:   '',
    content: '',
    tag:     'routine',
    barnId:  null,
  });

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
        title:   form.title.trim() || undefined,
        content: form.content.trim(),
        tag:     form.tag,
        barnId:  form.barnId ?? undefined,
      };
      const res = await noteApi.create(body);
      const result = res.data as { success: boolean };
      if (result.success) {
        RNAlert.alert('Thành công', 'Đã thêm ghi chú mới', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        throw new Error('API trả về lỗi');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Lỗi không xác định';
      RNAlert.alert('Lỗi', `Không thể tạo ghi chú: ${msg}`);
    } finally {
      setSaving(false);
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
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={form.content}
              onChangeText={(text) => setForm((prev) => ({ ...prev, content: text }))}
              placeholder="Nhập nội dung ghi chú"
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
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
  footer:             { flexDirection: 'row', padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#E0E0E0', gap: 12 },
  actionButton:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
  cancelButton:       { backgroundColor: COLORS.background, borderWidth: 1, borderColor: '#E0E0E0' },
  saveButton:         { backgroundColor: COLORS.primary },
  saveButtonDisabled: { opacity: 0.6 },
  cancelButtonText:   { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  saveButtonText:     { fontSize: 15, color: COLORS.white, fontWeight: '600', marginLeft: 8 },
});

export default CreateNoteScreen;
