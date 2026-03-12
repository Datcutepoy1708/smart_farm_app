import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/config';

const DeviceScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBarn, setSelectedBarn] = useState('all');

  const mockDevices = [
    {
      id: 1,
      name: 'DHT22 - Sensor Nhiệt độ',
      type: 'sensor',
      barnId: 1,
      barnName: 'Chuồng 01',
      status: 'online',
      lastSeen: 'Vừa xong',
      battery: 85,
      data: { temperature: 28.5, humidity: 65 },
    },
    {
      id: 2,
      name: 'Load Cell - Cân nặng',
      type: 'sensor',
      barnId: 1,
      barnName: 'Chuồng 01',
      status: 'online',
      lastSeen: '2 phút trước',
      battery: 92,
      data: { weight: 125.5, unit: 'kg' },
    },
    {
      id: 3,
      name: 'ESP32CAM - Camera',
      type: 'camera',
      barnId: 2,
      barnName: 'Chuồng 02',
      status: 'online',
      lastSeen: '5 phút trước',
      battery: 78,
      data: { resolution: '1080p', fps: 30 },
    },
    {
      id: 4,
      name: 'Water Level Sensor',
      type: 'sensor',
      barnId: 2,
      barnName: 'Chuồng 02',
      status: 'offline',
      lastSeen: '1 giờ trước',
      battery: 15,
      data: { level: 25, unit: '%' },
    },
    {
      id: 5,
      name: 'Feeding System',
      type: 'actuator',
      barnId: 3,
      barnName: 'Chuồng 03',
      status: 'online',
      lastSeen: 'Vừa xong',
      battery: 95,
      data: { status: 'active', lastFeed: '30 phút trước' },
    },
    {
      id: 6,
      name: 'Ventilation Fan',
      type: 'actuator',
      barnId: 3,
      barnName: 'Chuồng 03',
      status: 'online',
      lastSeen: '1 phút trước',
      battery: 88,
      data: { speed: 1200, rpm: true },
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'sensor':
        return 'sensors';
      case 'camera':
        return 'camera-alt';
      case 'actuator':
        return 'settings-remote';
      default:
        return 'device-unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return COLORS.secondary;
      case 'offline':
        return COLORS.danger;
      default:
        return COLORS.gray;
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 60) return COLORS.secondary;
    if (battery > 30) return COLORS.warning;
    return COLORS.danger;
  };

  const filteredDevices = mockDevices.filter(device => 
    selectedBarn === 'all' || device.barnId.toString() === selectedBarn
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thiết bị</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Barn Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', '1', '2', '3'].map((barn) => (
            <TouchableOpacity
              key={barn}
              style={[
                styles.barnFilter,
                selectedBarn === barn && styles.barnFilterActive,
              ]}
              onPress={() => setSelectedBarn(barn)}
            >
              <Text
                style={[
                  styles.barnFilterText,
                  selectedBarn === barn && styles.barnFilterTextActive,
                ]}
              >
                {barn === 'all' ? 'Tất cả chuồng' : `Chuồng ${barn}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredDevices.map((device) => (
          <View key={device.id} style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
              <View style={styles.deviceInfo}>
                <View style={styles.deviceIcon}>
                  <Icon 
                    name={getDeviceIcon(device.type)} 
                    size={24} 
                    color={COLORS.primary} 
                  />
                </View>
                <View style={styles.deviceDetails}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceLocation}>{device.barnName}</Text>
                </View>
              </View>
              <View style={styles.deviceStatus}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(device.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(device.status) }]}>
                  {device.status === 'online' ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>

            <View style={styles.deviceData}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Lần cuối:</Text>
                <Text style={styles.dataValue}>{device.lastSeen}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Pin:</Text>
                <View style={styles.batteryContainer}>
                  <Icon 
                    name="battery-full" 
                    size={16} 
                    color={getBatteryColor(device.battery)} 
                  />
                  <Text style={[styles.dataValue, { color: getBatteryColor(device.battery) }]}>
                    {device.battery}%
                  </Text>
                </View>
              </View>
            </View>

            {device.data && (
              <View style={styles.sensorData}>
                {Object.entries(device.data).map(([key, value]) => (
                  <View key={key} style={styles.dataItem}>
                    <Text style={styles.dataKey}>{key}:</Text>
                    <Text style={styles.dataValue}>{value}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.deviceActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="settings" size={20} color={COLORS.primary} />
                <Text style={styles.actionText}>Cài đặt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="refresh" size={20} color={COLORS.primary} />
                <Text style={styles.actionText}>Làm mới</Text>
              </TouchableOpacity>
              {device.type === 'actuator' && (
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="power-settings-new" size={20} color={COLORS.primary} />
                  <Text style={styles.actionText}>Điều khiển</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
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
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  barnFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
  },
  barnFilterActive: {
    backgroundColor: COLORS.primary,
  },
  barnFilterText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  barnFilterTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  deviceCard: {
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
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  deviceLocation: {
    fontSize: 14,
    color: COLORS.gray,
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deviceData: {
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dataLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorData: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  dataItem: {
    width: '50%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dataKey: {
    fontSize: 12,
    color: COLORS.gray,
    textTransform: 'capitalize',
  },
  deviceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default DeviceScreen;
