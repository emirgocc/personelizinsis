import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
// DateTimePicker importunu kaldırıyoruz

const API_URL = 'http://192.168.1.105:8000';
const { height } = Dimensions.get('window');

export default function TakvimScreen() {
  const { user } = useAuth();
  const [markedDates, setMarkedDates] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [limit, setLimit] = useState(2); // Takım limiti
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthCache, setMonthCache] = useState({}); // { '2024-06': { '2024-06-01': 2, ... } }
  const [visibleMonth, setVisibleMonth] = useState(currentDate.toISOString().slice(0, 7));

  // Yardımcı: iki tarih arası tüm günleri dizi olarak döndür
  function getDateRange(start, end) {
    const arr = [];
    let dt = new Date(start);
    const endDt = new Date(end);
    while (dt <= endDt) {
      arr.push(dt.toISOString().slice(0, 10));
      dt.setDate(dt.getDate() + 1);
    }
    return arr;
  }

  // Ay değişince backend'den toplu izinli günleri çek
  const fetchMonth = async (monthStr) => {
    if (monthCache[monthStr]) return; // cache varsa tekrar çekme
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/leaves/month?month=${monthStr}`, {
        headers: { Authorization: user.token },
      });
      setMonthCache(prev => ({ ...prev, [monthStr]: res.data }));
    } catch (e) {}
    setLoading(false);
  };

  // Takvimdeki işaretlemeleri güncelle
  const updateMarks = () => {
    const monthStr = visibleMonth;
    const days = monthCache[monthStr] || {};
    let marks = {};
    const today = new Date();
    // Seçili günler
    let selectedDays = [];
    if (startDate && endDate) selectedDays = getDateRange(startDate, endDate);
    else if (startDate) selectedDays = [startDate];
    // O ayın tüm günleri için işaretleme
    Object.keys(days).forEach(dateStr => {
      const d = new Date(dateStr);
      const isPast = d < new Date(new Date().toDateString());
      const isSelected = selectedDays.includes(dateStr);
      // Renkler
      let bg = undefined;
      let border = 'transparent';
      let textColor = '#222';
      let fontWeight = 'normal';
      if (days[dateStr] >= limit) bg = 'rgba(229,57,53,0.2)'; // şeffaf kırmızı
      else if (days[dateStr] === limit - 1) bg = 'rgba(251,192,45,0.2)'; // şeffaf sarı
      if (isSelected) {
        border = '#1976d2';
        textColor = '#111';
        fontWeight = 'bold';
        if (days[dateStr] >= limit) bg = 'rgba(229,57,53,0.2)';
        else if (days[dateStr] === limit - 1) bg = 'rgba(251,192,45,0.2)';
      }
      marks[dateStr] = {
        disabled: isPast,
        disableTouchEvent: isPast,
        customStyles: {
          container: {
            backgroundColor: bg,
            borderRadius: 6,
            borderWidth: isSelected ? 2 : 0,
            borderColor: border,
          },
          text: isPast
            ? { color: '#bdbdbd', fontWeight: 'normal', textAlignVertical: 'center' }
            : { color: textColor, fontWeight: fontWeight, textAlignVertical: 'center' },
        },
      };
    });
    // Seçili günlerden backend'den gelmeyenleri de işaretle
    selectedDays.forEach(dateStr => {
      if (!marks[dateStr]) {
        const d = new Date(dateStr);
        const isPast = d < new Date(new Date().toDateString());
        marks[dateStr] = {
          disabled: isPast,
          disableTouchEvent: isPast,
          customStyles: {
            container: {
              borderRadius: 6,
              borderWidth: 2,
              borderColor: '#1976d2',
            },
            text: isPast
              ? { color: '#bdbdbd', fontWeight: 'normal', textAlignVertical: 'center' }
              : { color: '#111', fontWeight: 'bold', textAlignVertical: 'center' },
          },
        };
      }
    });
    setMarkedDates(marks);
  };

  // Info metni: seçili tarih(ler) ve uygun olmayan günler
  const getInfoText = () => {
    if (!startDate) return '';
    let days = [startDate];
    if (endDate) days = getDateRange(startDate, endDate);
    const monthStr = visibleMonth;
    const monthDays = monthCache[monthStr] || {};
    const doluGunler = days.filter(d => (monthDays[d] || 0) >= limit);
    let info = '';
    if (days.length === 1) {
      info = `Seçili Tarih: ${days[0]}`;
    } else {
      info = `Seçili Tarihler: ${days[0]} - ${days[days.length - 1]}`;
    }
    if (doluGunler.length > 0) {
      info += `\nUygun olmayan günler: ${doluGunler.join(', ')}`;
    } else {
      info += `\nMüsait`;
    }
    return info;
  };

  // Takvimde ay değişince tetiklenir
  const handleMonthChange = (monthObj) => {
    const monthStr = `${monthObj.year}-${String(monthObj.month).padStart(2, '0')}`;
    setVisibleMonth(monthStr);
    fetchMonth(monthStr);
  };

  useEffect(() => {
    fetchMonth(visibleMonth);
    // eslint-disable-next-line
  }, [visibleMonth, user.token]);

  useEffect(() => {
    updateMarks();
    // eslint-disable-next-line
  }, [monthCache, startDate, endDate, visibleMonth]);

  // Gün seçimi/aralık seçimi
  const handleDayPress = (day) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (day.dateString < startDate) {
        setEndDate(startDate);
        setStartDate(day.dateString);
      } else {
        setEndDate(day.dateString);
      }
    }
  };

  // + butonuna tıklanınca
  const handlePlus = () => {
    if (!startDate) {
      Alert.alert('Uyarı', 'Lütfen önce bir gün veya aralık seçin.');
      return;
    }
    Alert.alert('İzin Talebi', getInfoText());
  };

  // Çarpı butonuna tıklanınca
  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType={'custom'}
        current={currentDate.toISOString().slice(0, 10)}
        minDate={new Date().toISOString().slice(0, 10)}
        onMonthChange={handleMonthChange}
        theme={{
          calendarBackground: '#f5f7fa',
          todayTextColor: '#1976d2',
          dayTextColor: '#222',
          textDisabledColor: '#bdbdbd',
          arrowColor: '#1976d2',
        }}
        style={{ margin: 8, borderRadius: 16, overflow: 'hidden', elevation: 2 }}
      />
      {/* Info paneli: takvimle tam uyumlu, sola yaslı, modern kutu, shadow ile */}
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <View style={{
          backgroundColor: '#f7fafd',
          borderRadius: 14,
          paddingVertical: 16,
          paddingHorizontal: 18,
          minWidth: 320,
          width: '92%',
          borderWidth: 1.2,
          borderColor: '#e0e0e0',
          marginBottom: 8,
          alignItems: 'flex-start',
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        }}>
          {startDate ? (
            <>
              <Text style={{ fontSize: 16, color: '#111', fontWeight: '500', textAlign: 'left', marginBottom: 6 }}>
                {(() => {
                  let days = [startDate];
                  if (endDate) days = getDateRange(startDate, endDate);
                  const formatDate = d => {
                    const [y, m, g] = d.split('-');
                    return `${g}/${m}/${y}`;
                  };
                  if (days.length === 1) return `Seçili Tarih: ${formatDate(days[0])}`;
                  return `Seçili Tarihler: ${formatDate(days[0])} - ${formatDate(days[days.length - 1])}`;
                })()}
              </Text>
              {(() => {
                let days = [startDate];
                if (endDate) days = getDateRange(startDate, endDate);
                const monthStr = visibleMonth;
                const monthDays = monthCache[monthStr] || {};
                const doluGunler = days.filter(d => (monthDays[d] || 0) >= limit);
                const formatDate = d => {
                  const [y, m, g] = d.split('-');
                  return `${g}/${m}/${y}`;
                };
                if (doluGunler.length > 0) {
                  return (
                    <Text style={{ fontSize: 15, color: '#e53935', fontWeight: 'bold', textAlign: 'left', marginTop: 2, letterSpacing: 0.1 }}>
                      {`Uygun olmayan günler: ${doluGunler.map(formatDate).join(', ')}`}
                    </Text>
                  );
                } else {
                  return (
                    <Text style={{ fontSize: 15, color: '#111', fontWeight: '400', textAlign: 'left', marginTop: 2, letterSpacing: 0.1 }}>
                      Müsait
                    </Text>
                  );
                }
              })()}
            </>
          ) : (
            <>
              <Text style={{ fontSize: 16, color: '#111', fontWeight: '500', textAlign: 'left', marginBottom: 6 }}>Seçili Tarih: -</Text>
              <Text style={{ fontSize: 15, color: '#111', fontWeight: '400', textAlign: 'left', marginTop: 2, letterSpacing: 0.1 }}>-</Text>
            </>
          )}
        </View>
      </View>
      {/* Sağ alt köşede x yukarıda, + aşağıda, alt alta büyük ikonlar */}
      {startDate && (
        <View style={{ position: 'absolute', right: 24, bottom: 32, alignItems: 'center' }}>
          <TouchableOpacity onPress={handleClear} style={{ marginBottom: 16 }}>
            <MaterialIcons name="cancel" size={56} color="#e53935" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePlus}>
            <MaterialIcons name="add-circle" size={56} color="#1976d2" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    minHeight: height * 0.45,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  sheetHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 16,
  },
  izinBtn: {
    backgroundColor: '#1976d2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  izinBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  kapatBtn: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  kapatBtnText: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
