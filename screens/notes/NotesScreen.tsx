import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert as RNAlert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/config';

interface Note {
  id: number;
  title: string;
  content: string;
  barnId?: number;
  barnName?: string;
  createdAt: string;
  updatedAt?: string;
  category: 'daily' | 'medical' | 'feeding' | 'maintenance' | 'other';
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
  danger?: boolean;
}

const NotesScreen = () => {
  const navigation = useNavigation();
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: 'Kiểm tra sức khỏe đàn gà',
      content: 'Đàn gà chuồng 01 có dấu hiệu khỏe mạnh, tăng trưởng tốt, không có dấu hiệu bệnh tật. Cần tiếp tục theo dõi và duy trì chế độ chăm sóc hiện tại.',
      barnId: 1,
      barnName: 'Chuồng 01',
      createdAt: '2024-03-12 08:30',
      category: 'daily',
    },
    {
      id: 2,
      title: 'Tiêm phòng bệnh Newcastle',
      content: 'Đã tiêm phòng bệnh Newcastle cho toàn bộ đàn gà chuồng 02. Liều lượng theo khuyến cáo, theo dõi phản ứng trong 24h.',
      barnId: 2,
      barnName: 'Chuồng 02',
      createdAt: '2024-03-11 14:00',
      category: 'medical',
    },
    {
      id: 3,
      title: 'Điều chỉnh lượng thức ăn',
      content: 'Tăng lượng thức ăn lên 10% cho chuồng 03 do gà đang trong giai đoạn tăng trưởng nhanh. Theo dõi cân nặng định kỳ.',
      barnId: 3,
      barnName: 'Chuồng 03',
      createdAt: '2024-03-10 16:30',
      category: 'feeding',
    },
    {
      id: 4,
      title: 'Bảo dưỡng hệ thống thông gió',
      content: 'Kiểm tra và vệ sinh hệ thống thông gió chuồng 01. Thay thế bộ lọc, bôi trơn các bộ phận chuyển động.',
      barnId: 1,
      barnName: 'Chuồng 01',
      createdAt: '2024-03-09 10:00',
      category: 'maintenance',
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDropdown, setShowDropdown] = useState<string | number | null>(null);

  const categories = [
    { key: 'all', label: 'Tất cả', icon: 'apps' },
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'daily':
        return 'today';
      case 'medical':
        return 'medical-services';
      case 'feeding':
        return 'restaurant';
      case 'maintenance':
        return 'build';
      default:
        return 'note';
    }
  };

  const filteredNotes = notes.filter(note => 
    selectedCategory === 'all' || note.category === selectedCategory
  );

  const handleDeleteNote = (id: number) => {
    RNAlert.alert(
      'Xóa ghi chú',
      'Bạn có chắc chắn muốn xóa ghi chú này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: () => {
            setNotes(notes.filter(note => note.id !== id));
            RNAlert.alert('Thành công', 'Đã xóa ghi chú');
          }
        },
      ]
    );
  };

  const handleDuplicateNote = (note: Note) => {
    const duplicatedNote: Note = {
      ...note,
      id: Date.now(),
      title: `${note.title} (Bản sao)`,
      createdAt: new Date().toLocaleString('vi-VN'),
    };
    setNotes([duplicatedNote, ...notes]);
    setShowDropdown(null);
    RNAlert.alert('Thành công', 'Đã sao chép ghi chú');
  };

  const openEditModal = (note: Note) => {
    setShowDropdown(null);
    (navigation as any).navigate('UpdateNote', { note });
  };

  const menuItems: MenuItem[] = [
    {
      id: 'add',
      title: 'Thêm ghi chú',
      icon: 'add',
      onPress: () => {
        setShowDropdown(null);
        (navigation as any).navigate('CreateNote');
      },
    },
    {
      id: 'clear',
      title: 'Xóa tất cả',
      icon: 'delete-sweep',
      danger: true,
      onPress: () => {
        setShowDropdown(null);
        RNAlert.alert(
          'Xóa tất cả',
          'Bạn có chắc chắn muốn xóa tất cả ghi chú?',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Xóa tất cả', 
              style: 'destructive',
              onPress: () => {
                setNotes([]);
                RNAlert.alert('Thành công', 'Đã xóa tất cả ghi chú');
              }
            },
          ]
        );
      },
    },
  ];

  const renderNoteItem = ({ item }: { item: Note }) => (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <View style={styles.noteInfo}>
          <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(item.category) }]}>
            <Icon name={getCategoryIcon(item.category)} size={16} color={COLORS.white} />
          </View>
          <View style={styles.noteMeta}>
            <Text style={styles.noteTitle}>{item.title}</Text>
            <Text style={styles.noteTime}>{item.createdAt}</Text>
            {item.updatedAt && (
              <Text style={styles.updatedTime}>Cập nhật: {item.updatedAt}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => setShowDropdown(showDropdown === item.id ? null : item.id)}
        >
          <Icon name="more-vert" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.noteContent}>{item.content}</Text>
      
      {item.barnName && (
        <View style={styles.barnTag}>
          <Icon name="home" size={12} color={COLORS.primary} />
          <Text style={styles.barnText}>{item.barnName}</Text>
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
            <Text style={[styles.dropdownItemText, styles.deleteItemText]}>Xóa</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderCategoryChip = ({ item }: { item: any }) => (
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
      <Text style={[
        styles.categoryText,
        selectedCategory === item.key && styles.categoryTextActive,
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
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

      {/* Main dropdown menu */}
      {showDropdown === 'main' && (
        <View style={styles.mainDropdown}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.dropdownItem, item.danger && styles.deleteItem]}
              onPress={item.onPress}
            >
              <Icon name={item.icon} size={16} color={item.danger ? COLORS.danger : COLORS.primary} />
              <Text style={[styles.dropdownItemText, item.danger && styles.deleteItemText]}>
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
              onPress={() => (navigation as any).navigate('CreateNote')}
            >
              <Text style={styles.emptyAddButtonText}>Thêm ghi chú đầu tiên</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
  updatedTime: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: 2,
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
    marginLeft: 4,
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
