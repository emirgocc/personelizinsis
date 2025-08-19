import React from 'react';
import { View, Text } from 'react-native';

export default function InfoPanel({ startDate, endDate, visibleMonth, monthCache, limit, getDateRange }) {
  if (!startDate) {
    return (
      <View style={{
        backgroundColor: '#f7fafd', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18, minWidth: 320, width: '92%', borderWidth: 1.2, borderColor: '#e0e0e0', marginBottom: 8, alignItems: 'flex-start', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 }}>
        <Text style={{ fontSize: 16, color: '#111', fontWeight: '500', textAlign: 'left', marginBottom: 6 }}>Seçili Tarih: -</Text>
        <Text style={{ fontSize: 15, color: '#111', fontWeight: '400', textAlign: 'left', marginTop: 2, letterSpacing: 0.1 }}>-</Text>
      </View>
    );
  }
  let days = [startDate];
  if (endDate) days = getDateRange(startDate, endDate);
  const monthStr = visibleMonth;
  const monthDays = monthCache[monthStr] || {};
  const doluGunler = days.filter(d => (monthDays[d] || 0) >= limit);
  const formatDate = d => {
    const [y, m, g] = d.split('-');
    return `${g}/${m}/${y}`;
  };
  return (
    <View style={{
      backgroundColor: '#f7fafd', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18, minWidth: 320, width: '92%', borderWidth: 1.2, borderColor: '#e0e0e0', marginBottom: 8, alignItems: 'flex-start', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 }}>
      <Text style={{ fontSize: 16, color: '#111', fontWeight: '500', textAlign: 'left', marginBottom: 6 }}>
        {days.length === 1 ? `Seçili Tarih: ${formatDate(days[0])}` : `Seçili Tarihler: ${formatDate(days[0])} - ${formatDate(days[days.length - 1])}`}
      </Text>
      {doluGunler.length > 0 ? (
        <Text style={{ fontSize: 15, color: '#e53935', fontWeight: 'bold', textAlign: 'left', marginTop: 2, letterSpacing: 0.1 }}>
          {`Uygun olmayan günler: ${doluGunler.map(formatDate).join(', ')}`}
        </Text>
      ) : (
        <Text style={{ fontSize: 15, color: '#111', fontWeight: '400', textAlign: 'left', marginTop: 2, letterSpacing: 0.1 }}>
          Müsait
        </Text>
      )}
    </View>
  );
}
