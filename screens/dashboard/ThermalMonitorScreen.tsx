import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/config';

const ThermalMonitorScreen = () => {
  const [ventilationEnabled, setVentilationEnabled] = useState(true);
  const [lightingEnabled, setLightingEnabled] = useState(false);

  const handleTakeAction = () => {
    Alert.alert('Take Action', 'Đang thực hiện hành động khắc phục...');
  };

  const handleDismiss = () => {
    Alert.alert('Dismiss', 'Cảnh báo đã bị bỏ qua');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { /* Handle back */ }}>
            <Icon name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Thermal Monitor</Text>
            <Text style={styles.headerSubtitle}>Live • Barn 04</Text>
          </View>
          <TouchableOpacity onPress={() => { /* Handle settings */ }}>
            <Icon name="settings" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Live View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={styles.activeTabText}>Camera Screen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Temperature Cards */}
        <View style={styles.tempCardsContainer}>
          <View style={styles.tempCard}>
            <Text style={styles.tempCardLabel}>AVERAGE TEMP</Text>
            <Text style={styles.averageTemp}>32°C</Text>
          </View>
          <View style={styles.tempCard}>
            <Text style={styles.tempCardLabel}>MAX TEMP</Text>
            <Text style={styles.maxTemp}>38°C</Text>
          </View>
          <View style={styles.stableIndicator}>
            <View style={styles.stableDot} />
            <Text style={styles.stableText}>STABLE</Text>
          </View>
        </View>

        {/* Camera Screen Section */}
        <View style={styles.cameraContainer}>
          {/* Camera Placeholder */}
          <View style={styles.cameraPlaceholder}>
            <Icon name="videocam" size={48} color={COLORS.gray} />
            <Text style={styles.cameraPlaceholderText}>CAM_04_THERMAL_HD</Text>
            <Text style={styles.coordinatesText}>COORD: 34.22, -118.45</Text>
            
            {/* Hotspot Indicator */}
            <View style={styles.hotspotIndicator}>
              <Icon name="warning" size={16} color={COLORS.white} />
              <Text style={styles.hotspotText}>HOTSPOT</Text>
            </View>
            
            {/* Temperature Scale */}
            <View style={styles.temperatureScale}>
              <Text style={styles.scaleTemp}>38°</Text>
              <View style={styles.scaleBar} />
              <Text style={styles.scaleTemp}>20°</Text>
            </View>
          </View>
        </View>

        {/* Alert Section */}
        <View style={styles.alertContainer}>
          <View style={styles.alertHeader}>
            <Icon name="warning" size={24} color={COLORS.danger} />
            <Text style={styles.alertTitle}>Abnormal Hot Spot Detected</Text>
          </View>
          <Text style={styles.alertDescription}>
            Temperature spike in Zone B sector 4. This may indicate overcrowding or equipment malfunction.
          </Text>
          <View style={styles.alertActions}>
            <TouchableOpacity style={styles.takeActionButton} onPress={handleTakeAction}>
              <Text style={styles.takeActionText}>Take Action</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Control Cards */}
        <View style={styles.controlCardsContainer}>
          {/* Ventilation Control */}
          <View style={styles.controlCard}>
            <View style={styles.controlHeader}>
              <Icon name="air" size={24} color={COLORS.primary} />
              <View style={styles.controlInfo}>
                <Text style={styles.controlTitle}>Ventilation</Text>
                <Text style={styles.controlMode}>Auto Mode</Text>
              </View>
              <Switch
                value={ventilationEnabled}
                onValueChange={setVentilationEnabled}
                trackColor={{ false: COLORS.gray, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>

          {/* Lighting Control */}
          <View style={styles.controlCard}>
            <View style={styles.controlHeader}>
              <Icon name="lightbulb" size={24} color={COLORS.secondary} />
              <View style={styles.controlInfo}>
                <Text style={styles.controlTitle}>Lighting</Text>
                <Text style={styles.controlMode}>Intensity: 40%</Text>
              </View>
              <Switch
                value={lightingEnabled}
                onValueChange={setLightingEnabled}
                trackColor={{ false: COLORS.gray, true: COLORS.secondary }}
                thumbColor={COLORS.white}
              />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  tempCardsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  tempCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  tempCardLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 8,
  },
  averageTemp: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  maxTemp: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  stableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  stableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    marginRight: 6,
  },
  stableText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  cameraContainer: {
    marginBottom: 20,
  },
  cameraPlaceholder: {
    backgroundColor: '#1a1a1a',
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraPlaceholderText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  coordinatesText: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 4,
  },
  hotspotIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hotspotText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  temperatureScale: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -50 }],
    alignItems: 'center',
  },
  scaleTemp: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
  },
  scaleBar: {
    width: 4,
    height: 80,
    backgroundColor: 'linear-gradient(to bottom, #ff4444, #ffaa00, #00ff00)',
    marginVertical: 4,
    borderRadius: 2,
  },
  alertContainer: {
    backgroundColor: '#fff5f5',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.danger,
    marginLeft: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
  },
  takeActionButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  takeActionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  dismissText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  controlCardsContainer: {
    gap: 12,
  },
  controlCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlInfo: {
    flex: 1,
    marginLeft: 12,
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  controlMode: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
});

export default ThermalMonitorScreen;
