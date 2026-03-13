import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../store/authStore';
import { COLORS } from '../constants/config';
import DrawerNavigator from './DrawerNavigator';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import CreateNoteScreen from '../screens/notes/CreateNoteScreen';
import UpdateNoteScreen from '../screens/notes/UpdateNoteScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          <>
            <Stack.Screen
              name="Main"
              component={DrawerNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateNote"
              component={CreateNoteScreen}
              options={{
                title: 'Thêm ghi chú',
                presentation: 'modal',
                headerShown:false,
                headerStyle: {
                  backgroundColor: COLORS.primary,
                },
                headerTintColor: COLORS.white,
              }}
            />
            <Stack.Screen
              name="UpdateNote"
              component={UpdateNoteScreen}
              options={{
                title: 'Chỉnh sửa ghi chú',
                presentation: 'modal',
                headerShown: false,
                headerStyle: {
                  backgroundColor: COLORS.primary,
                },
                headerTintColor: COLORS.white,
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
  },
});

export default AppNavigator;

