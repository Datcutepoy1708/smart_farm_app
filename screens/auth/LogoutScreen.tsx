import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../store/authStore';
import { COLORS } from '../../constants/config';

const LogoutScreen = () => {
  const { logout } = useAuth();

  React.useEffect(() => {
    logout();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đang đăng xuất...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 18,
    color: COLORS.text,
  },
});

export default LogoutScreen;
