import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert as RNAlert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, API_URL } from '../../constants/config';
import { useAuth } from '../../store/authStore';

// ==================== INTERFACES ====================

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

interface CreateNoteInput {
  title?: string;
  content: string;
  tag?: NoteTag;
  barnId?: number;
  reminderAt?: string;
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
  danger?: boolean;
}

interface CategoryItem {
  key: string;
  label: string;
  icon: string;
}

// ==================== HELPERS ====================

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

const getTagColor = (tag: NoteTag): string => {
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

const getTagIcon = (tag: NoteTag): string => {
  switch (tag) {
    case 'urgent':
      return 'warning';
    case 'routine':
      return 'today';
    case 'medical':
      return 'medical-services';
    case 'feeding':
      return 'restaurant';
    default:
      return 'note';
  }
};

// ==================== COMPONENT ====================

const NotesScreen = () => {
  const navigation = useNavigation();
  const { token } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDropdown, setShowDropdown] = useState<string | number | null>(null);

  const categories: CategoryItem[] = [
    { key: 'all', label: 'Tất cả', icon: 'apps' },
    { key: 'routine', label: 'Hàng ngày', icon: 'today' },
    { key: 'medical', label: 'Y tế', icon: 'medical-services' },
    { key: 'feeding', label: 'Cho ăn', icon: 'restaurant' },
    { key: 'urgent', label: 'Khẩn cấp', icon: 'warning' },
  ];

  // ==================== API CALLS ====================

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/notes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        RNAlert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: { success: boolean; data: Note[] } = await response.json();

      if (result.success) {
        setNotes(result.data);
      } else {
        throw new Error('API trả về lỗi');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(msg);
      console.error('Fetch notes error:', msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleDeleteNote = (id: number) => {
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
              const response = await fetch(`${API_URL}/notes/${id}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) throw new Error(`HTTP ${response.status}`);

              setNotes((prev) => prev.filter((note) => note.id !== id));
              setShowDropdown(null);
              RNAlert.alert('Thành công', 'Đã xóa');
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Lỗi';
              RNAlert.alert('Lỗi', `Không thể xóa: ${msg}`);
            }
          },
        },
      ],
    );
  };

  const handleDuplicateNote = async (note: Note) => {
    try {
      const body: CreateNoteInput = {
        title: note.title ? `${note.title} (Bản sao)` : undefined,
        content: note.content,
        tag: note.tag,
        barnId: note.barnId ?? undefined,
      };

      const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result: { success: boolean; data: Note } = await response.json();

      if (result.success) {
        setNotes((prev) => [result.data, ...prev]);
        setShowDropdown(null);
        RNAlert.alert('Thành công', 'Đã sao chép ghi chú');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi';
      RNAlert.alert('Lỗi', `Không thể sao chép: ${msg}`);
    }
  };

  const openEditModal = (note: Note) => {
    setShowDropdown(null);
    (navigation as ReturnType<typeof useNavigation> & { navigate: (screen: string, params: { note: Note }) => void }).navigate('UpdateNote', { note });
  };

  // ==================== FILTER ====================

  const filteredNotes = notes.filter(
    (note) => selectedCategory === 'all' || note.tag === selectedCategory,
  );

  // ==================== MENU ====================

  const menuItems: MenuItem[] = [
    {
      id: 'add',
      title: 'Thêm ghi chú',
      icon: 'add',
      onPress: () => {
        setShowDropdown(null);
        (navigation as ReturnType<typeof useNavigation> & { navigate: (screen: string) => void }).navigate('CreateNote');
      },
    },
    {
      id: 'refresh',
      title: 'Tải lại',
      icon: 'refresh',
      onPress: () => {
        setShowDropdown(null);
        fetchNotes();
      },
    },
  ];

  // ==================== RENDER ITEMS ====================

  const renderNoteItem = ({ item }: { item: Note }) => (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <View style={styles.noteInfo}>
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: getTagColor(item.tag) },
            ]}
          >
            <Icon name={getTagIcon(item.tag)} size={16} color={COLORS.white} />
          </View>
          <View style={styles.noteMeta}>
            <Text style={styles.noteTitle}>
              {item.title ?? 'Không tiêu đề'}
            </Text>
            <Text style={styles.noteTime}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() =>
            setShowDropdown(showDropdown === item.id ? null : item.id)
          }
        >
          <Icon name="more-vert" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      <Text style={styles.noteContent}>{item.content}</Text>

      {item.barnName && (
        <View style={styles.barnTag}>
          <Text style={styles.barnText}>🏠 {item.barnName}</Text>
        </View>
      )}

      {/* Dropdown menu for each note */}
      {showDropdown === item.id && (
        <View style={styles.noteDropdown}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => openEditModal(item)}
          >
            <Icon name="edit" size={16} color={COLORS.primary} />
            <Text style={styles.dropdownItemText}>Chỉnh sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => handleDuplicateNote(item)}
          >
            <Icon name="content-copy" size={16} color={COLORS.secondary} />
            <Text style={styles.dropdownItemText}>Sao chép</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dropdownItem, styles.deleteItem]}
            onPress={() => handleDeleteNote(item.id)}
          >
            <Icon name="delete" size={16} color={COLORS.danger} />
            <Text style={[styles.dropdownItemText, styles.deleteItemText]}>
              Xóa
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderCategoryChip = ({ item }: { item: CategoryItem }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.key && styles.categoryChipActive,
      ]}
      onPress={() => setSelectedCategory(item.key)}
    >
      <Icon
        name={item.icon}
        size={30}
        color={selectedCategory === item.key ? COLORS.white : COLORS.gray}
      />
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.key && styles.categoryTextActive,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ghi chú</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Icon name="more-vert" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải ghi chú...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==================== ERROR STATE ====================
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ghi chú</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Icon name="more-vert" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <Icon name="error-outline" size={48} color={COLORS.danger} />
          <Text style={styles.errorText}>Không tải được dữ liệu</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNotes}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ghi chú</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              setShowDropdown(showDropdown === 'main' ? null : 'main')
            }
          >
            <Icon name="more-vert" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main dropdown menu */}
      {showDropdown === 'main' && (
        <View style={styles.mainDropdown}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.dropdownItem, item.danger && styles.deleteItem]}
              onPress={item.onPress}
            >
              <Icon
                name={item.icon}
                size={16}
                color={item.danger ? COLORS.danger : COLORS.primary}
              />
              <Text
                style={[
                  styles.dropdownItemText,
                  item.danger && styles.deleteItemText,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Compact Category Filter */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryChip}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      <FlatList
        data={filteredNotes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.scrollView}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="note" size={48} color={COLORS.gray} />
            <Text style={styles.emptyText}>Chưa có ghi chú nào</Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() =>
                (navigation as ReturnType<typeof useNavigation> & { navigate: (screen: string) => void }).navigate('CreateNote')
              }
            >
              <Text style={styles.emptyAddButtonText}>
                Thêm ghi chú đầu tiên
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  errorDetail: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
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
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
  },
  mainDropdown: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  categoryContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    marginRight: 6,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 11,
    color: COLORS.gray,
    marginLeft: 3,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  noteCard: {
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
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  noteMeta: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  noteTime: {
    fontSize: 11,
    color: COLORS.gray,
  },
  moreButton: {
    padding: 4,
  },
  noteContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  barnTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  barnText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },
  noteDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  deleteItem: {
    backgroundColor: '#FFF5F5',
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12,
  },
  deleteItemText: {
    color: COLORS.danger,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NotesScreen;
