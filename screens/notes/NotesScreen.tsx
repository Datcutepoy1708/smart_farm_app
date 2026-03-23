import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert as RNAlert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/config';
import { noteApi } from '../../services/api';

type NoteTag = 'urgent' | 'routine' | 'medical' | 'feeding';

interface Note {
  id: number;
  title: string | null;
  content: string;
  barnId: number | null;
  flockId: number | null;
  tag: NoteTag;
  reminderAt: string | null;
  isReminded: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

const TAG_CONFIG: Record<NoteTag | 'all', { label: string; icon: string; color: string }> = {
  all:     { label: 'Tất cả',   icon: 'apps',             color: COLORS.gray },
  routine: { label: 'Hàng ngày', icon: 'today',            color: COLORS.primary },
  medical: { label: 'Y tế',      icon: 'medical-services', color: COLORS.danger },
  feeding: { label: 'Cho ăn',    icon: 'restaurant',       color: COLORS.secondary ?? '#4CAF50' },
  urgent:  { label: 'Khẩn cấp', icon: 'warning',          color: COLORS.warning ?? '#FF9800' },
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const NotesScreen = () => {
  const navigation = useNavigation();
  const [notes, setNotes]       = useState<Note[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showDropdown, setShowDropdown] = useState<string | number | null>(null);

  const fetchNotes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await noteApi.getAll();
      const data: Note[] = res.data?.data ?? res.data ?? [];
      setNotes(data.filter((n) => !n.isArchived));
    } catch (err) {
      RNAlert.alert('Lỗi', 'Không thể tải ghi chú');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Tự động reload khi màn hình được focus lại (ví dụ sau khi tạo note mới)
  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [fetchNotes])
  );

  const handleDelete = (id: number) => {
    RNAlert.alert('Xóa ghi chú', 'Bạn có chắc muốn xóa ghi chú này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await noteApi.remove(id);
            setNotes((prev) => prev.filter((n) => n.id !== id));
          } catch {
            RNAlert.alert('Lỗi', 'Không thể xóa ghi chú');
          }
        },
      },
    ]);
  };

  const tags = Object.entries(TAG_CONFIG).map(([key, val]) => ({ key, ...val }));
  const filteredNotes = selectedTag === 'all'
    ? notes
    : notes.filter((n) => n.tag === selectedTag);

  const renderNoteItem = ({ item }: { item: Note }) => {
    const tagCfg = TAG_CONFIG[item.tag] ?? TAG_CONFIG.routine;
    return (
      <View style={styles.noteCard}>
        <View style={styles.noteHeader}>
          <View style={styles.noteInfo}>
            <View style={[styles.categoryIcon, { backgroundColor: tagCfg.color }]}>
              <Icon name={tagCfg.icon} size={16} color={COLORS.white} />
            </View>
            <View style={styles.noteMeta}>
              <Text style={styles.noteTitle} numberOfLines={1}>
                {item.title || '(Không có tiêu đề)'}
              </Text>
              <Text style={styles.tagLabel}>{tagCfg.label}</Text>
              <Text style={styles.noteTime}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setShowDropdown(showDropdown === item.id ? null : item.id)}
          >
            <Icon name="more-vert" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <Text style={styles.noteContent} numberOfLines={3}>{item.content}</Text>

        {item.barnId != null && (
          <View style={styles.barnTag}>
            <Icon name="home" size={12} color={COLORS.primary} />
            <Text style={styles.barnText}>Chuồng #{item.barnId}</Text>
          </View>
        )}

        {showDropdown === item.id && (
          <View style={styles.noteDropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowDropdown(null);
                (navigation as any).navigate('UpdateNote', { note: item });
              }}
            >
              <Icon name="edit" size={16} color={COLORS.primary} />
              <Text style={styles.dropdownItemText}>Chỉnh sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dropdownItem, styles.deleteItem]}
              onPress={() => {
                setShowDropdown(null);
                handleDelete(item.id);
              }}
            >
              <Icon name="delete" size={16} color={COLORS.danger} />
              <Text style={[styles.dropdownItemText, styles.deleteItemText]}>Xóa</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderTagChip = ({ item }: { item: typeof tags[0] }) => (
    <TouchableOpacity
      style={[styles.categoryChip, selectedTag === item.key && styles.categoryChipActive]}
      onPress={() => setSelectedTag(item.key)}
    >
      <Icon name={item.icon} size={16} color={selectedTag === item.key ? COLORS.white : COLORS.gray} />
      <Text style={[styles.categoryText, selectedTag === item.key && styles.categoryTextActive]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ghi chú</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowDropdown(showDropdown === 'main' ? null : 'main')}
          >
            <Icon name="more-vert" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main dropdown */}
      {showDropdown === 'main' && (
        <View style={styles.mainDropdown}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
              setShowDropdown(null);
              (navigation as any).navigate('CreateNote');
            }}
          >
            <Icon name="add" size={16} color={COLORS.primary} />
            <Text style={styles.dropdownItemText}>Thêm ghi chú</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tag filter */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={tags}
          renderItem={renderTagChip}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Notes list */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải ghi chú...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.scrollView}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotes(true)}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="note" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>Chưa có ghi chú nào</Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => (navigation as any).navigate('CreateNote')}
              >
                <Text style={styles.emptyAddButtonText}>Thêm ghi chú đầu tiên</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => (navigation as any).navigate('CreateNote')}
      >
        <Icon name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.primary },
  headerTitle:  { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  headerActions:{ flexDirection: 'row' },
  headerButton: { padding: 8 },
  mainDropdown: {
    position: 'absolute', top: 60, right: 16, backgroundColor: COLORS.white,
    borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 5, zIndex: 1000,
  },
  categoryContainer: { backgroundColor: COLORS.white, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  categoryList:      { paddingHorizontal: 16 },
  categoryChip:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.background, marginRight: 8 },
  categoryChipActive:{ backgroundColor: COLORS.primary },
  categoryText:      { fontSize: 12, color: COLORS.gray, marginLeft: 4, fontWeight: '500' },
  categoryTextActive:{ color: COLORS.white },
  scrollView:        { flex: 1 },
  listContainer:     { padding: 16, paddingBottom: 80 },
  noteCard:          { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  noteHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  noteInfo:          { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  categoryIcon:      { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  noteMeta:          { flex: 1 },
  noteTitle:         { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  tagLabel:          { fontSize: 11, color: COLORS.primary, fontWeight: '500', marginBottom: 2 },
  noteTime:          { fontSize: 11, color: COLORS.gray },
  moreButton:        { padding: 4 },
  noteContent:       { fontSize: 14, color: COLORS.text, lineHeight: 20, marginBottom: 10 },
  barnTag:           { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  barnText:          { fontSize: 11, color: COLORS.primary, marginLeft: 4, fontWeight: '500' },
  noteDropdown:      { position: 'absolute', top: 40, right: 0, backgroundColor: COLORS.white, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, zIndex: 100 },
  dropdownItem:      { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  deleteItem:        { backgroundColor: '#FFF5F5' },
  dropdownItemText:  { fontSize: 14, color: COLORS.text, marginLeft: 12 },
  deleteItemText:    { color: COLORS.danger },
  emptyContainer:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText:         { fontSize: 16, color: COLORS.gray, marginTop: 16, marginBottom: 24 },
  emptyAddButton:    { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyAddButtonText:{ color: COLORS.white, fontSize: 14, fontWeight: '600' },
  centerContent:     { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  loadingText:       { marginTop: 12, color: COLORS.gray, fontSize: 14 },
  fab:               { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4 },
});

export default NotesScreen;
