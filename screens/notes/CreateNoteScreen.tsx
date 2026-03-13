import React, { useState } from 'react';
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
import { COLORS, API_URL } from '../../constants/config';
import { useAuth } from '../../store/authStore';

type NoteTag = 'urgent' | 'routine' | 'medical' | 'feeding';

interface CreateNoteForm {
  title: string;
  content: string;
  tag: NoteTag;
  barnId: number;
}

const CreateNoteScreen = () => {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState<CreateNoteForm>({
    title: '',
    content: '',
    tag: 'routine',
    barnId: 1,
  });

  const categories: { key: NoteTag; label: string; icon: string }[] = [
    { key: 'routine', label: 'Hàng ngày', icon: 'today' },
    { key: 'medical', label: 'Y tế', icon: 'medical-services' },
    { key: 'feeding', label: 'Cho ăn', icon: 'restaurant' },
    { key: 'urgent', label: 'Khẩn cấp', icon: 'warning' },
  ];

  const getTagColor = (tag: string): string => {
    switch (tag) {
      case 'urgent':
        return '#FF9800';
      case 'routine':
        return '#4CAF50';
      case 'medical':
        return '#F44336';
      case 'feeding':
        return '#2D6A2D';
      default:
        return COLORS.gray;
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.content.trim()) {
      RNAlert.alert('Lỗi', 'Vui lòng nhập nội dung ghi chú');
      return;
    }

    try {
      setSaving(true);

      const body = {
        title: newNote.title.trim() || undefined,
        content: newNote.content.trim(),
        tag: newNote.tag,
        barnId: newNote.barnId,
      };

      const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData: { message?: string } = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result: { success: boolean } = await response.json();

      if (result.success) {
        RNAlert.alert('Thành công', 'Đã thêm ghi chú mới', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        throw new Error('API trả về lỗi');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      RNAlert.alert('Lỗi', `Không thể tạo ghi chú: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm ghi chú mới</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tiêu đề</Text>
            <TextInput
              style={styles.textInput}
              value={newNote.title}
              onChangeText={(text) =>
                setNewNote((prev) => ({ ...prev, title: text }))
              }
              placeholder="Nhập tiêu đề ghi chú"
              placeholderTextColor={COLORS.gray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nội dung</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newNote.content}
              onChangeText={(text) =>
                setNewNote((prev) => ({ ...prev, content: text }))
              }
              placeholder="Nhập nội dung ghi chú"
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={6}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Loại ghi chú</Text>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryOption,
                    newNote.tag === category.key && styles.categoryOptionActive,
                    { borderLeftColor: getTagColor(category.key) },
                  ]}
                  onPress={() =>
                    setNewNote((prev) => ({ ...prev, tag: category.key }))
                  }
                >
                  <Icon
                    name={category.icon}
                    size={20}
                    color={
                      newNote.tag === category.key ? COLORS.white : COLORS.gray
                    }
                  />
                  <Text
                    style={[
                      styles.categoryOptionText,
                      newNote.tag === category.key &&
                        styles.categoryOptionTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Chuồng</Text>
            <View style={styles.barnGrid}>
              {[1, 2, 3, 4, 5].map((barnId) => (
                <TouchableOpacity
                  key={barnId}
                  style={[
                    styles.barnOption,
                    newNote.barnId === barnId && styles.barnOptionActive,
                  ]}
                  onPress={() =>
                    setNewNote((prev) => ({ ...prev, barnId }))
                  }
                >
                  <Text
                    style={[
                      styles.barnOptionText,
                      newNote.barnId === barnId && styles.barnOptionTextActive,
                    ]}
                  >
                    Chuồng {barnId}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

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
          onPress={handleCreateNote}
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderLeftWidth: 4,
    borderColor: '#E0E0E0',
    minWidth: '45%',
  },
  categoryOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 8,
    fontWeight: '500',
  },
  categoryOptionTextActive: {
    color: COLORS.white,
  },
  barnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  barnOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  barnOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  barnOptionText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  barnOptionTextActive: {
    color: COLORS.white,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CreateNoteScreen;
