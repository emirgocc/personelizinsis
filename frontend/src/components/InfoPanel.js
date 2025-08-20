import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InfoPanel({ startDate, endDate, visibleMonth, monthCache, limit, getDateRange }) {
  if (!startDate) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Seçili Tarih</Text>
        <Text style={styles.subtitle}>Henüz tarih seçilmedi</Text>
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
    <View style={styles.container}>
      <Text style={styles.title}>
        {days.length === 1 ? `Seçili Tarih` : `Seçili Tarihler`}
      </Text>
      <Text style={styles.dateText}>
        {days.length === 1 ? formatDate(days[0]) : `${formatDate(days[0])} - ${formatDate(days[days.length - 1])}`}
      </Text>
      
      <View style={styles.statusContainer}>
        {doluGunler.length > 0 ? (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.statusDotError]} />
            <Text style={styles.statusTextError}>
              {`${doluGunler.length} gün uygun değil`}
            </Text>
          </View>
        ) : (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.statusDotSuccess]} />
            <Text style={styles.statusTextSuccess}>
              Müsait
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    fontWeight: '400',
    textAlign: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#888',
    marginBottom: 10,
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotSuccess: {
    backgroundColor: '#4caf50',
  },
  statusDotError: {
    backgroundColor: '#e53935',
  },
  statusTextSuccess: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: '600',
  },
  statusTextError: {
    fontSize: 16,
    color: '#e53935',
    fontWeight: '600',
  },
});
