import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ActionButtons({ onClear, onPlus }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onClear} style={[styles.button, styles.clearButton]}>
        <MaterialIcons name="cancel" size={28} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onPlus} style={[styles.button, styles.plusButton]}>
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    alignItems: 'center',
    gap: 16,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  clearButton: {
    backgroundColor: '#e53935',
  },
  plusButton: {
    backgroundColor: '#1976d2',
  },
});
