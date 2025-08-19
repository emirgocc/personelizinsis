import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ActionButtons({ onClear, onPlus }) {
  return (
    <View style={{ position: 'absolute', right: 24, bottom: 32, alignItems: 'center' }}>
      <TouchableOpacity onPress={onClear} style={{ marginBottom: 16 }}>
        <MaterialIcons name="cancel" size={56} color="#e53935" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onPlus}>
        <MaterialIcons name="add-circle" size={56} color="#1976d2" />
      </TouchableOpacity>
    </View>
  );
}
