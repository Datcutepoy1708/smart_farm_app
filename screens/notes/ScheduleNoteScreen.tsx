import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/config';
import { noteApi } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type NoteTag = 'urgent' | 'routine' | 'medical' | 'feeding';

interface Note {
  id: number;
  title: string | null;
  content: string;
  barnId: number | null;
  tag: NoteTag;
  reminderAt: string;     // Not null — screen chỉ hiển thị note CÓ reminderAt
  isReminded: boolean;
  isArchived: boolean;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TAG_COLOR: Record<NoteTag, string> = {
  urgent:  '#FF5722',
  medical: '#F44336',
  feeding: '#2D6A2D',
  routine: '#4CAF50',
};

const TAG_LABEL: Record<NoteTag, string> = {
  urgent:  'Khẩn cấp',
  medical: 'Y tế',
  feeding: 'Cho ăn',
  routine: 'Hàng ngày',
};

const TAG_ICON: Record<NoteTag, keyof typeof Ionicons.glyphMap> = {
  urgent:  'warning',
  medical: 'medkit',
  feeding: 'restaurant',
  routine: 'today',
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const dd   = d.getDate().toString().padStart(2, '0');
  const mm   = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh   = d.getHours().toString().padStart(2, '0');
  const min  = d.getMinutes().toString().padStart(2, '0');
  return `${dd}/${mm}/${yyyy}  ${hh}:${min}`;
};

const isSameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year: number, month: number) =>
  new Date(year, month, 1).getDay(); // 0 = Sun

// ─── ScheduleNoteScreen ───────────────────────────────────────────────────────
const MONTH_NAMES = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12',
];
const DOW = ['CN','T2','T3','T4','T5','T6','T7'];

export default function ScheduleNoteScreen() {
  const navigation = useNavigation();
  const today = new Date();

  const [notes, setNotes]            = useState<Note[]>([]);
  const [loading, setLoading]        = useState(true);
  const [refreshing, setRefreshing]  = useState(false);
  const [calMonth, setCalMonth]      = useState(today.getMonth());
  const [calYear, setCalYear]        = useState(today.getFullYear());
  const [selectedDay, setSelectedDay]= useState<Date | null>(null);

  // ── Fetch notes có reminderAt ──────────────────────────────────────────────
  const fetchNotes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await noteApi.getAll();
      const all: Note[] = (res.data?.data ?? res.data ?? []);
      // Chỉ giữ note chưa archive và có reminderAt
      setNotes(
        all
          .filter((n) => !n.isArchived && n.reminderAt != null)
          .sort((a, b) => new Date(a.reminderAt).getTime() - new Date(b.reminderAt).getTime())
      );
    } catch {
      /* silent fail */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchNotes(); }, [fetchNotes]));

  // ── Tính toán lịch ────────────────────────────────────────────────────────
  const daysInMonth  = getDaysInMonth(calYear, calMonth);
  const firstDow     = getFirstDayOfMonth(calYear, calMonth);  // 0=Sun

  // Những ngày có note trong tháng
  const noteDays = new Set<number>(
    notes
      .filter((n) => {
        const d = new Date(n.reminderAt);
        return d.getMonth() === calMonth && d.getFullYear() === calYear;
      })
      .map((n) => new Date(n.reminderAt).getDate())
  );

  // Notes của ngày đang chọn (hoặc tất cả nếu chưa chọn)
  const visibleNotes = selectedDay
    ? notes.filter((n) => isSameDay(new Date(n.reminderAt), selectedDay))
    : notes.filter((n) => {
        const d = new Date(n.reminderAt);
        return d.getMonth() === calMonth && d.getFullYear() === calYear;
      });

  // ── Navigation tháng ───────────────────────────────────────────────────────
  const goPrev = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const goNext = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
    setSelectedDay(null);
  };

  // ── Render calendar cells ──────────────────────────────────────────────────
  const renderCalendar = () => {
    const cells: React.ReactElement[] = [];

    // Ô trống đầu tháng
    for (let i = 0; i < firstDow; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.calCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate    = new Date(calYear, calMonth, day);
      const isToday     = isSameDay(cellDate, today);
      const isSelected  = selectedDay ? isSameDay(cellDate, selectedDay) : false;
      const hasNote     = noteDays.has(day);

      cells.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.calCell,
            isToday    && styles.calCellToday,
            isSelected && styles.calCellSelected,
          ]}
          onPress={() => setSelectedDay(isSelected ? null : cellDate)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.calCellText,
            isToday    && styles.calCellTextToday,
            isSelected && styles.calCellTextSelected,
          ]}>
            {day}
          </Text>
          {hasNote && (
            <View style={[styles.calDot, isSelected && styles.calDotSelected]} />
          )}
        </TouchableOpacity>
      );
    }
    return cells;
  };

  // ── Render note card ───────────────────────────────────────────────────────
  const renderNote = ({ item }: { item: Note }) => {
    const isPast   = new Date(item.reminderAt) < today;
    const tagColor = TAG_COLOR[item.tag] ?? COLORS.primary;
    return (
      <TouchableOpacity
        style={styles.noteCard}
        activeOpacity={0.85}
        onPress={() => (navigation as any).navigate('UpdateNote', { note: item })}
      >
        <View style={[styles.noteAccent, { backgroundColor: tagColor }]} />
        <View style={styles.noteBody}>
          <View style={styles.noteRow}>
            <View style={[styles.tagChip, { backgroundColor: tagColor + '22' }]}>
              <Ionicons name={TAG_ICON[item.tag]} size={12} color={tagColor} />
              <Text style={[styles.tagChipText, { color: tagColor }]}>
                {TAG_LABEL[item.tag]}
              </Text>
            </View>
            {item.barnId != null && (
              <Text style={styles.barnLabel}>🏠 Chuồng #{item.barnId}</Text>
            )}
          </View>

          <Text style={styles.noteTitle} numberOfLines={1}>
            {item.title || '(Không có tiêu đề)'}
          </Text>
          <Text style={styles.noteContent} numberOfLines={2}>{item.content}</Text>

          <View style={styles.reminderRow}>
            <Text style={[styles.reminderIcon, isPast ? styles.past : styles.future]}>
              {isPast ? '✅' : '🕐'}
            </Text>
            <Text style={[styles.reminderText, isPast ? styles.past : styles.future]}>
              {formatDate(item.reminderAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch Ghi Chú</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => (navigation as any).navigate('CreateNote')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={visibleNotes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNote}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotes(true)}
              colors={[COLORS.primary]}
            />
          }
          ListHeaderComponent={
            <View>
              {/* ── Calendar ── */}
              <View style={styles.calCard}>
                {/* Month Navigation */}
                <View style={styles.calNav}>
                  <TouchableOpacity onPress={goPrev} style={styles.calNavBtn}>
                    <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={styles.calNavTitle}>
                    {MONTH_NAMES[calMonth]} {calYear}
                  </Text>
                  <TouchableOpacity onPress={goNext} style={styles.calNavBtn}>
                    <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                {/* Day-of-week headers */}
                <View style={styles.calDowRow}>
                  {DOW.map((d) => (
                    <Text key={d} style={styles.calDow}>{d}</Text>
                  ))}
                </View>

                {/* Calendar grid */}
                <View style={styles.calGrid}>
                  {renderCalendar()}
                </View>

                {selectedDay && (
                  <TouchableOpacity
                    onPress={() => setSelectedDay(null)}
                    style={styles.clearBtn}
                  >
                    <Text style={styles.clearBtnText}>✕ Bỏ chọn ngày</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ── Section title ── */}
              <Text style={styles.listTitle}>
                {selectedDay
                  ? `Ghi chú ngày ${selectedDay.getDate()}/${selectedDay.getMonth() + 1}`
                  : `Tháng ${calMonth + 1}/${calYear} (${visibleNotes.length} ghi chú)`}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>Không có ghi chú nào có lịch thực hiện</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => (navigation as any).navigate('CreateNote')}
              >
                <Text style={styles.emptyBtnText}>+ Tạo ghi chú mới</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.primary },
  headerTitle:  { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  addBtn:       { padding: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Calendar
  calCard:      { margin: 16, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  calNav:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calNavBtn:    { padding: 6 },
  calNavTitle:  { fontSize: 16, fontWeight: '700', color: COLORS.text },
  calDowRow:    { flexDirection: 'row', marginBottom: 4 },
  calDow:       { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: COLORS.gray, paddingVertical: 4 },
  calGrid:      { flexDirection: 'row', flexWrap: 'wrap' },
  calCell:      { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  calCellToday: { backgroundColor: '#E8F5E9' },
  calCellSelected: { backgroundColor: COLORS.primary, borderRadius: 8 },
  calCellText:  { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  calCellTextToday:    { color: COLORS.primary, fontWeight: '700' },
  calCellTextSelected: { color: COLORS.white, fontWeight: '700' },
  calDot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 2 },
  calDotSelected: { backgroundColor: COLORS.white },
  clearBtn:     { alignSelf: 'center', marginTop: 10, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F5F5F5' },
  clearBtnText: { fontSize: 13, color: COLORS.gray },

  // List title
  listTitle:    { marginHorizontal: 16, marginBottom: 8, fontSize: 14, fontWeight: '600', color: COLORS.gray },
  listContent:  { paddingBottom: 80 },

  // Note card
  noteCard:     { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, marginHorizontal: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  noteAccent:   { width: 4 },
  noteBody:     { flex: 1, padding: 12 },
  noteRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  tagChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  tagChipText:  { fontSize: 11, fontWeight: '600' },
  barnLabel:    { fontSize: 11, color: COLORS.gray },
  noteTitle:    { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  noteContent:  { fontSize: 13, color: COLORS.gray, lineHeight: 18, marginBottom: 8 },
  reminderRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reminderIcon: { fontSize: 13 },
  reminderText: { fontSize: 12, fontWeight: '500' },
  future:       { color: '#FF9800' },
  past:         { color: '#4CAF50' },

  // Empty
  empty:        { alignItems: 'center', paddingVertical: 40 },
  emptyText:    { fontSize: 15, color: COLORS.gray, marginTop: 12, textAlign: 'center', marginBottom: 20 },
  emptyBtn:     { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
});
