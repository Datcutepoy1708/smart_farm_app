import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const AppLogo = () => (
  <View style={styles.logoContainer}>
    <Icon name="leaf" size={80} color="#FFFFFF" />
  </View>
);

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#1B4D1B', '#2D6A2D', '#4CAF50']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <AppLogo />
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            alignItems: 'center',
            marginTop: 24,
          }}
        >
          <Text style={styles.title}>Smart Farm</Text>
          <Text style={styles.subtitle}>Quản lý trang trại thông minh</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 50,
  },
});

export default SplashScreen;
