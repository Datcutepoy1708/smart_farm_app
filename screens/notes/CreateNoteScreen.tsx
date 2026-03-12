import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/config';

interface CreateNoteScreenProps {}

const CreateNoteScreen: React.FC<CreateNoteScreenProps> = () => {
  const navigation = useNavigation();
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'daily' as 'daily' | 'medical' | 'feeding' | 'maintenance' | 'other',
    barnId: 1,
  });

  const categories = [
    { key: 'daily', label: 'Hàng ngày', icon: 'today' },
    { key: 'medical', label: 'Y tế', icon: 'medical-services' },
    { key: 'feeding', label: 'Cho ăn', icon: 'restaurant' },
    { key: 'maintenance', label: 'Bảo trì', icon: 'build' },
    { key: 'other', label: 'Khác', icon: 'more-horiz' },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'daily':
        return COLORS.primary;
      case 'medical':
        return COLORS.danger;
      case 'feeding':
        return COLORS.secondary;
      case 'maintenance':
        return COLORS.warning;
      default:
        return COLORS.gray;
    }
  };

  const handleCreateNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      RNAlert.alert('Lỗi', 'Vui lòng nhập tiêu đề và nội dung ghi chú');
      return;
    }

    // TODO: Call API to create note
    console.log('Creating note:', newNote);
    
    RNAlert.alert('Thành công', 'Đã thêm ghi chú mới', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
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
              onChangeText={(text) => setNewNote(prev => ({ ...prev, title: text }))}
              placeholder="Nhập tiêu đề ghi chú"
              placeholderTextColor={COLORS.gray}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nội dung</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newNote.content}
              onChangeText={(text) => setNewNote(prev => ({ ...prev, content: text }))}
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
                    newNote.category === category.key && styles.categoryOptionActive,
                    { borderLeftColor: getCategoryColor(category.key) }
                  ]}
                  onPress={() => setNewNote(prev => ({ ...prev, category: category.key as any }))}
                >
                  <Icon 
                    name={category.icon} 
                    size={20} 
                    color={newNote.category === category.key ? COLORS.white : COLORS.gray} 
                  />
                  <Text style={[
                    styles.categoryOptionText,
                    newNote.category === category.key && styles.categoryOptionTextActive,
                  ]}>
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
                  onPress={() => setNewNote(prev => ({ ...prev, barnId }))}
                >
                  <Text style={[
                    styles.barnOptionText,
                    newNote.barnId === barnId && styles.barnOptionTextActive,
                  ]}>
                    Chuồng {barnId}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hình ảnh (Tùy chọn)</Text>
            <TouchableOpacity style={styles.imageUploadButton}>
              <Icon name="camera-alt" size={24} color={COLORS.gray} />
              <Text style={styles.imageUploadText}>Thêm hình ảnh</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={handleCreateNote}
        >
          <Icon name="save" size={20} color={COLORS.white} />
          <Text style={styles.saveButtonText}>Lưu ghi chú</Text>
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
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  imageUploadText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 8,
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
