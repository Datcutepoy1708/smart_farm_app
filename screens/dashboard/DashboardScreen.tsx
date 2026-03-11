import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../store/authStore';
import { COLORS } from '../../constants/config';

const DashboardScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Chào mừng trở lại,</Text>
            <Text style={styles.userName}>{user?.fullName}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Icon name="logout" size={24} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="home" size={32} color={COLORS.primary} />
            <Text style={styles.statNumber}>4</Text>
            <Text style={styles.statLabel}>Chuồng trại</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="pets" size={32} color={COLORS.secondary} />
            <Text style={styles.statNumber}>2,450</Text>
            <Text style={styles.statLabel}>Gà thịt</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="devices" size={32} color={COLORS.warning} />
            <Text style={styles.statNumber}>16</Text>
            <Text style={styles.statLabel}>Thiết bị</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="warning" size={32} color={COLORS.danger} />
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Cảnh báo</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="add" size={24} color={COLORS.white} />
              <Text style={styles.actionText}>Thêm chuồng</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="camera-alt" size={24} color={COLORS.white} />
              <Text style={styles.actionText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="assessment" size={24} color={COLORS.white} />
              <Text style={styles.actionText}>Báo cáo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Icon name="warning" size={16} color={COLORS.danger} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Cảnh báo nhiệt độ</Text>
                <Text style={styles.activityDescription}>Chuồng 04 - Nhiệt độ cao bất thường</Text>
                <Text style={styles.activityTime}>5 phút trước</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Icon name="check-circle" size={16} color={COLORS.secondary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Cho ăn thành công</Text>
                <Text style={styles.activityDescription}>Chuồng 02 - 50kg thức ăn</Text>
                <Text style={styles.activityTime}>1 giờ trước</Text>
              </View>
            </View>
            <View style={[styles.activityItem, styles.activityItemLast]}>
              <View style={styles.activityIcon}>
                <Icon name="settings" size={16} color={COLORS.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Bảo trì thiết bị</Text>
                <Text style={styles.activityDescription}>Cảm biến nhiệt độ chuồng 01</Text>
                <Text style={styles.activityTime}>3 giờ trước</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollViewContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  activityContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activityItemLast: {
    marginBottom: 0,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 10,
    color: COLORS.gray,
  },
});

export default DashboardScreen;
