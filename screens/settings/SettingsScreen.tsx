import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert as RNAlert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/config';
import { authApi } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserInfo {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
}

interface AlertThresholds {
  maxTemp: number;
  minTemp: number;
  maxHumidity: number;
  notificationsEnabled: boolean;
}

interface SettingsItem {
  icon: string;
  title: string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  value?: string | boolean;
  danger?: boolean;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

// ─── Component ────────────────────────────────────────────────────────────────
const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  // State
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [language, setLanguage] = useState('vi');
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    maxTemp: 35,
    minTemp: 15,
    maxHumidity: 85,
    notificationsEnabled: true,
  });

  // Profile edit modal
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // ─── Load settings on mount ───────────────────────────────────────────────
  useEffect(() => {
    const loadSettings = async () => {
      const maxTemp = await AsyncStorage.getItem('maxTemp');
      const minTemp = await AsyncStorage.getItem('minTemp');
      const maxHumidity = await AsyncStorage.getItem('maxHumidity');
      const notifications = await AsyncStorage.getItem('notifications');
      const lang = await AsyncStorage.getItem('language');

      setThresholds({
        maxTemp: maxTemp ? Number(maxTemp) : 35,
        minTemp: minTemp ? Number(minTemp) : 15,
        maxHumidity: maxHumidity ? Number(maxHumidity) : 85,
        notificationsEnabled: notifications !== 'false',
      });
      setLanguage(lang || 'vi');
    };

    loadSettings();
    fetchUserInfo();
  }, []);

  // ─── Fetch user info ──────────────────────────────────────────────────────
  const fetchUserInfo = async () => {
    try {
      const res = await authApi.getProfile();
      const data = (res.data as { data?: UserInfo } | UserInfo);
      const info: UserInfo = 'data' in data && data.data ? data.data : data as UserInfo;
      setUserInfo(info);
    } catch {
      // Fallback to zustand store
      if (user) {
        setUserInfo({
          id: 0,
          fullName: user.fullName || 'Người dùng',
          email: user.email || '',
          phone: null,
        });
      }
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleLanguage = () => {
    RNAlert.alert('Chọn ngôn ngữ', 'Vui lòng chọn ngôn ngữ hiển thị', [
      {
        text: 'Tiếng Việt',
        onPress: async () => {
          setLanguage('vi');
          await AsyncStorage.setItem('language', 'vi');
        },
      },
      {
        text: 'English',
        onPress: async () => {
          setLanguage('en');
          await AsyncStorage.setItem('language', 'en');
        },
      },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const handleNotificationToggle = async (value: boolean) => {
    setThresholds((prev) => ({ ...prev, notificationsEnabled: value }));
    await AsyncStorage.setItem('notifications', value.toString());
  };

  const handleThresholdChange = (
    key: 'maxTemp' | 'minTemp' | 'maxHumidity',
    title: string,
    unit: string,
    defaultVal: number
  ) => {
    if (Platform.OS === 'ios') {
      RNAlert.prompt(
        title,
        `Nhập giá trị mới (${unit}):`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Lưu',
            onPress: async (val?: string) => {
              const num = Number(val);
              if (!isNaN(num) && num > 0) {
                setThresholds((prev) => ({ ...prev, [key]: num }));
                await AsyncStorage.setItem(key, num.toString());
              }
            },
          },
        ],
        'plain-text',
        thresholds[key].toString()
      );
    } else {
      // Android doesn't support Alert.prompt — use simple alert
      const currentVal = thresholds[key];
      const options = key === 'maxHumidity'
        ? [70, 75, 80, 85, 90, 95]
        : key === 'maxTemp'
          ? [30, 32, 35, 37, 40]
          : [10, 12, 15, 18, 20];

      const buttons: { text: string; onPress?: () => void }[] = options.map((val) => ({
        text: `${val}${unit}${val === currentVal ? ' ✓' : ''}`,
        onPress: () => {
          setThresholds((prev) => ({ ...prev, [key]: val }));
          AsyncStorage.setItem(key, val.toString());
        },
      }));
      buttons.push({ text: 'Hủy' });

      RNAlert.alert(title, `Giá trị hiện tại: ${currentVal}${unit}`, buttons);
    }
  };

  const handleAppInfo = () => {
    RNAlert.alert(
      'Thông tin ứng dụng',
      'Smart Farm v1.0.0\nHệ thống quản lý chuồng trại thông minh\n© 2026 Smart Farm Team'
    );
  };

  const openProfileModal = () => {
    setEditFullName(userInfo?.fullName || user?.fullName || '');
    setEditPhone(userInfo?.phone || '');
    setProfileModalVisible(true);
  };

  const handleSaveProfile = () => {
    setUserInfo((prev) =>
      prev
        ? { ...prev, fullName: editFullName, phone: editPhone || null }
        : null
    );
    setProfileModalVisible(false);
  };

  const handleLogout = () => {
    RNAlert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            logout();
          },
        },
      ]
    );
  };

  // ─── Avatar initial ───────────────────────────────────────────────────────
  const displayName = userInfo?.fullName || user?.fullName || 'U';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  // ─── Sections ─────────────────────────────────────────────────────────────
  const settingsSections: SettingsSection[] = [
    {
      title: 'Cài đặt chung',
      items: [
        {
          icon: 'language',
          title: 'Ngôn ngữ',
          value: language === 'vi' ? 'Tiếng Việt' : 'English',
          onPress: handleLanguage,
        },
        {
          icon: 'notifications',
          title: 'Thông báo đẩy',
          value: thresholds.notificationsEnabled,
          onToggle: handleNotificationToggle,
        },
      ],
    },
    {
      title: 'Cài đặt cảnh báo',
      items: [
        {
          icon: 'thermostat',
          title: 'Nhiệt độ tối đa',
          value: `${thresholds.maxTemp}°C`,
          onPress: () => handleThresholdChange('maxTemp', 'Nhiệt độ tối đa', '°C', 35),
        },
        {
          icon: 'ac-unit',
          title: 'Nhiệt độ tối thiểu',
          value: `${thresholds.minTemp}°C`,
          onPress: () => handleThresholdChange('minTemp', 'Nhiệt độ tối thiểu', '°C', 15),
        },
        {
          icon: 'water-drop',
          title: 'Độ ẩm tối đa',
          value: `${thresholds.maxHumidity}%`,
          onPress: () => handleThresholdChange('maxHumidity', 'Độ ẩm tối đa', '%', 85),
        },
      ],
    },
    {
      title: 'Hệ thống',
      items: [
        {
          icon: 'info',
          title: 'Thông tin ứng dụng',
          onPress: handleAppInfo,
        },
      ],
    },
    {
      title: 'Tài khoản',
      items: [
        {
          icon: 'person',
          title: 'Thông tin cá nhân',
          onPress: openProfileModal,
        },
        {
          icon: 'logout',
          title: 'Đăng xuất',
          onPress: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <TouchableOpacity style={styles.userInfoCard} onPress={openProfileModal}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userInfo?.fullName || user?.fullName || 'Người dùng'}</Text>
            <Text style={styles.userEmail}>{userInfo?.email || user?.email || 'user@example.com'}</Text>
          </View>
          <Icon name="chevron-right" size={20} color={COLORS.gray} />
        </TouchableOpacity>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && styles.settingItemBorder,
                  ]}
                  onPress={item.onPress}
                  disabled={!item.onPress && !item.onToggle}
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIcon}>
                      <Icon
                        name={item.icon}
                        size={20}
                        color={item.danger ? COLORS.danger : COLORS.primary}
                      />
                    </View>
                    <Text style={[
                      styles.settingTitle,
                      item.danger && styles.settingTitleDanger,
                    ]}>
                      {item.title}
                    </Text>
                  </View>
                  <View style={styles.settingRight}>
                    {item.onToggle && typeof item.value === 'boolean' ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: COLORS.gray, true: COLORS.primary }}
                        thumbColor={COLORS.white}
                      />
                    ) : typeof item.value === 'string' ? (
                      <Text style={styles.settingValue}>{item.value}</Text>
                    ) : (
                      <Icon name="chevron-right" size={20} color={COLORS.gray} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Smart Farm v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2026 Smart Farm Team</Text>
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>

            <Text style={styles.inputLabel}>Họ tên</Text>
            <TextInput
              style={styles.modalInput}
              value={editFullName}
              onChangeText={setEditFullName}
              placeholder="Nhập họ tên"
              placeholderTextColor={COLORS.gray}
            />

            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Nhập số điện thoại"
              placeholderTextColor={COLORS.gray}
              keyboardType="phone-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setProfileModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.modalBtnSaveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.gray,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: COLORS.text,
  },
  settingTitleDanger: {
    color: COLORS.danger,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 8,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalBtnSave: {
    backgroundColor: COLORS.primary,
  },
  modalBtnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalBtnSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default SettingsScreen;
