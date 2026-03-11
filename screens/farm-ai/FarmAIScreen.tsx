import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FarmAIScreen() {
  return (
    <View style={styles.container}>
      <Text>Farm AI Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
