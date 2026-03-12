import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../store/authStore';
import { COLORS } from '../../constants/config';

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

const SettingsScreen = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [language, setLanguage] = useState('vi');

  const handleLogout = () => {
    RNAlert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', onPress: logout },
      ]
    );
  };

  const settingsSections: SettingsSection[] = [
    {
      title: 'Cài đặt chung',
      items: [
        {
          icon: 'language',
          title: 'Ngôn ngữ',
          value: language === 'vi' ? 'Tiếng Việt' : 'English',
          onPress: () => setLanguage(language === 'vi' ? 'en' : 'vi'),
        },
        {
          icon: 'notifications',
          title: 'Thông báo đẩy',
          value: notifications,
          onToggle: setNotifications,
        },
        {
          icon: 'dark-mode',
          title: 'Chế độ tối',
          value: darkMode,
          onToggle: setDarkMode,
        },
      ],
    },
    {
      title: 'Dữ liệu & Đồng bộ',
      items: [
        {
          icon: 'sync',
          title: 'Đồng bộ tự động',
          value: autoSync,
          onToggle: setAutoSync,
        },
        {
          icon: 'cloud-download',
          title: 'Sao lưu dữ liệu',
          onPress: () => console.log('Backup data'),
        },
        {
          icon: 'restore',
          title: 'Khôi phục dữ liệu',
          onPress: () => console.log('Restore data'),
        },
      ],
    },
    {
      title: 'Hệ thống',
      items: [
        {
          icon: 'info',
          title: 'Thông tin ứng dụng',
          onPress: () => console.log('App info'),
        },
        {
          icon: 'help',
          title: 'Trợ giúp & Hỗ trợ',
          onPress: () => console.log('Help & Support'),
        },
        {
          icon: 'privacy-tip',
          title: 'Chính sách bảo mật',
          onPress: () => console.log('Privacy Policy'),
        },
        {
          icon: 'description',
          title: 'Điều khoản sử dụng',
          onPress: () => console.log('Terms of Service'),
        },
      ],
    },
    {
      title: 'Tài khoản',
      items: [
        {
          icon: 'person',
          title: 'Thông tin cá nhân',
          onPress: () => console.log('Profile'),
        },
        {
          icon: 'security',
          title: 'Bảo mật',
          onPress: () => console.log('Security'),
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cài đặt</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userInfoCard}>
          <View style={styles.userAvatar}>
            <Icon name="person" size={40} color={COLORS.white} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'Người dùng'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
          <Icon name="chevron-right" size={20} color={COLORS.gray} />
        </View>

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
                      item.danger && styles.settingTitleDanger
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
                    ) : item.value !== undefined ? (
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
          <Text style={styles.copyrightText}>© 2024 Smart Farm Team</Text>
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
});

export default SettingsScreen;
