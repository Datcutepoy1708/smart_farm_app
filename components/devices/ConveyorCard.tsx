import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from '../../constants/config';

import { BarnDevice } from '../../types';

interface ConveyorCardProps {
  device: BarnDevice;
  onToggle: (duration?: number) => void;
  onCancel?: () => void;
}

const ConveyorCard: React.FC<ConveyorCardProps> = ({ device, onToggle, onCancel }) => {
  const isON = device.currentStatus === 'ON';
  const [durationVal, setDurationVal] = useState('');
  const [progress, setProgress] = useState<{ target: number; current: number } | null>(null);

  useEffect(() => {
    if (!isON) {
      setProgress(null);
    }
  }, [isON]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isON && progress) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (!prev) return prev;
          if (prev.current < prev.target) {
            return { ...prev, current: Math.min(prev.current + 1, prev.target) };
          }
          return prev;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isON, progress?.target]);

  const handleStart = (specificDuration?: number) => {
    const inputVal = parseInt(durationVal || '0', 10);
    const target = specificDuration || inputVal;
    if (!target || target <= 0) {
      return false; 
    }
    setProgress({ target, current: 0 });
    onToggle(target);
    return true;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          🔄 {device.name} {isON ? '⚡ ĐANG CHẠY' : ''}
        </Text>
      </View>

      {!isON ? (
        <View style={styles.controls}>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => handleStart()}
            >
              <Text style={styles.startText}>▶️ Khởi động băng tải</Text>
            </TouchableOpacity>
            {onCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Thời gian:</Text>
            {[30, 60, 120].map(val => (
              <TouchableOpacity 
                key={val} 
                style={styles.presetBtn}
                onPress={() => handleStart(val)}
              >
                <Text style={styles.presetText}>{val}s</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>hoặc nhập:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={durationVal}
              onChangeText={setDurationVal}
              placeholder="30"
            />
            <Text style={styles.label}> giây</Text>
          </View>
        </View>
      ) : (
        <View style={styles.running}>
          {progress && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Đã chạy: {progress.current} / {progress.target} giây
              </Text>
              <View style={styles.progressBarBg}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${Math.min(100, (progress.current / progress.target) * 100)}%` }
                  ]} 
                />
              </View>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={() => onToggle()}
          >
            <Text style={styles.stopText}>⏹️ Dừng ngay</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FF9800', // Orange border to distinguish from feeder
  },
  header: { marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  controls: { gap: 12 },
  actionRow: { flexDirection: 'row', gap: 8 },
  startButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  startText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: COLORS.text, fontWeight: 'bold', fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 14, color: COLORS.gray },
  presetBtn: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  presetText: { color: COLORS.text, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 4,
    width: 60,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: 'center',
    color: COLORS.text,
  },
  running: { gap: 12 },
  progressContainer: { gap: 6 },
  progressText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  progressBarBg: {
    height: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF9800',
  },
  stopButton: {
    backgroundColor: COLORS.danger,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});

export default ConveyorCard;
