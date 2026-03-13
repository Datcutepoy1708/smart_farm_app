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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, API_URL } from '../../constants/config';
import { useAuth } from '../../store/authStore';

type NoteTag = 'urgent' | 'routine' | 'medical' | 'feeding';

interface Note {
  id: number;
  userId: number;
  barnId: number | null;
  barnName: string | null;
  flockId: number | null;
  title: string | null;
  content: string;
  tag: NoteTag;
  reminderAt: string | null;
  isReminded: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

type UpdateNoteScreenRouteProp = RouteProp<{
  UpdateNote: { note: Note };
}, 'UpdateNote'>;

interface UpdateNoteForm {
  title: string;
  content: string;
  tag: NoteTag;
  barnId: number;
}

const UpdateNoteScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<UpdateNoteScreenRouteProp>();
  const { note } = route.params;
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);

  const [updatedNote, setUpdatedNote] = useState<UpdateNoteForm>({
    title: note.title ?? '',
    content: note.content,
    tag: note.tag,
    barnId: note.barnId ?? 1,
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

  const timeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleUpdateNote = async () => {
    if (!updatedNote.content.trim()) {
      RNAlert.alert('Lỗi', 'Vui lòng nhập nội dung ghi chú');
      return;
    }

    try {
      setSaving(true);

      const body = {
        title: updatedNote.title.trim() || undefined,
        content: updatedNote.content.trim(),
        tag: updatedNote.tag,
        barnId: updatedNote.barnId,
      };

      const response = await fetch(`${API_URL}/notes/${note.id}`, {
        method: 'PATCH',
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
        RNAlert.alert('Thành công', 'Đã cập nhật ghi chú', [
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
      RNAlert.alert('Lỗi', `Không thể cập nhật: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = () => {
    RNAlert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa ghi chú này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/notes/${note.id}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) throw new Error(`HTTP ${response.status}`);

              RNAlert.alert('Thành công', 'Đã xóa ghi chú', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Lỗi';
              RNAlert.alert('Lỗi', `Không thể xóa: ${msg}`);
            }
          },
        },
      ],
    );
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
        <Text style={styles.headerTitle}>Chỉnh sửa ghi chú</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteNote}
        >
          <Icon name="delete" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Ngày tạo:</Text>
            <Text style={styles.infoValue}>{timeAgo(note.createdAt)}</Text>
            {note.updatedAt && (
              <>
                <Text style={styles.infoLabel}>Cập nhật lần cuối:</Text>
                <Text style={styles.infoValue}>{timeAgo(note.updatedAt)}</Text>
              </>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tiêu đề</Text>
            <TextInput
              style={styles.textInput}
              value={updatedNote.title}
              onChangeText={(text) =>
                setUpdatedNote((prev) => ({ ...prev, title: text }))
              }
              placeholder="Nhập tiêu đề ghi chú"
              placeholderTextColor={COLORS.gray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nội dung</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={updatedNote.content}
              onChangeText={(text) =>
                setUpdatedNote((prev) => ({ ...prev, content: text }))
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
                    updatedNote.tag === category.key &&
                      styles.categoryOptionActive,
                    { borderLeftColor: getTagColor(category.key) },
                  ]}
                  onPress={() =>
                    setUpdatedNote((prev) => ({ ...prev, tag: category.key }))
                  }
                >
                  <Icon
                    name={category.icon}
                    size={20}
                    color={
                      updatedNote.tag === category.key
                        ? COLORS.white
                        : COLORS.gray
                    }
                  />
                  <Text
                    style={[
                      styles.categoryOptionText,
                      updatedNote.tag === category.key &&
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
                    updatedNote.barnId === barnId && styles.barnOptionActive,
                  ]}
                  onPress={() =>
                    setUpdatedNote((prev) => ({ ...prev, barnId }))
                  }
                >
                  <Text
                    style={[
                      styles.barnOptionText,
                      updatedNote.barnId === barnId &&
                        styles.barnOptionTextActive,
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
          onPress={handleUpdateNote}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Icon name="save" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Cập nhật</Text>
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
  deleteButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  infoSection: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
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

export default UpdateNoteScreen;
