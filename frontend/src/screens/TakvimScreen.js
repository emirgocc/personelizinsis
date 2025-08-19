import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Dimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { AntDesign } from '@expo/vector-icons';

const API_URL = 'http://192.168.1.105:8000'; // Backend IP
const { height, width } = Dimensions.get('window');

function isPast(dateStr) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const d = new Date(dateStr);
  d.setHours(0,0,0,0);
  return d < today;
}

export default function TakvimScreen() {
  const { user } = useAuth();
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [izinliler, setIzinliler] = useState([]);
  const [limit, setLimit] = useState(2);
  const [loading, setLoading] = useState(false);

  // Takvimdeki izinli günleri ve renkleri çek
  const fetchCalendar = async () => {
    setLoading(true);
    let marks = {};
    const today = new Date();
    for (let i = -30; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      let isDisabled = isPast(dateStr);
      try {
        const res = await axios.get(`${API_URL}/leaves/day?date=${dateStr}`, {
          headers: { Authorization: user.token },
        });
        const izinler = res.data;
        let bg = '#fff';
        let textColor = '#222';
        if (isDisabled) {
          bg = '#f5f5f5';
          textColor = '#bdbdbd';
        } else if (izinler.length >= limit) {
          bg = 'rgba(239,154,154,0.3)'; // kırmızı
        } else if (izinler.length === limit - 1) {
          bg = 'rgba(255,245,157,0.5)'; // sarı
        } else {
          bg = 'rgba(165,214,167,0.3)'; // yeşil
        }
        marks[dateStr] = {
          disabled: isDisabled,
          customStyles: {
            container: { backgroundColor: bg, borderRadius: 8, margin: 1, padding: 0, borderWidth: 0 },
            text: { color: textColor, fontWeight: 'bold' },
          },
        };
      } catch (e) {
        marks[dateStr] = {
          disabled: isDisabled,
          customStyles: {
            container: { backgroundColor: isDisabled ? '#f5f5f5' : '#fff', borderRadius: 8 },
            text: { color: isDisabled ? '#bdbdbd' : '#222' },
          },
        };
      }
    }
    // Seçili gün işaretlemesi
    if (selectedDate && marks[selectedDate]) {
      marks[selectedDate].customStyles = {
        ...marks[selectedDate].customStyles,
        container: {
          ...(marks[selectedDate].customStyles.container || {}),
          backgroundColor: '#1976d2',
          borderRadius: 8,
          borderWidth: 2,
          borderColor: '#1565c0',
        },
        text: {
          ...(marks[selectedDate].customStyles.text || {}),
          color: '#fff',
          fontWeight: 'bold',
        },
      };
    }
    setMarkedDates(marks);
    setLoading(false);
  };

  // Seçili günün izinlilerini çek
  const fetchIzinliler = async (dateStr) => {
    try {
      const res = await axios.get(`${API_URL}/leaves/day?date=${dateStr}`, {
        headers: { Authorization: user.token },
      });
      setIzinliler(res.data);
    } catch (e) {
      setIzinliler([]);
    }
  };

  useEffect(() => {
    fetchCalendar();
    if (selectedDate) fetchIzinliler(selectedDate);
    // eslint-disable-next-line
  }, [selectedDate]);

  // Tek tıkla tek gün seçimi
  const handleDayPress = (day) => {
    if (isPast(day.dateString)) return;
    setSelectedDate(day.dateString);
  };

  // İzin talebi
  const handleIzinTalep = async () => {
    try {
      await axios.post(`${API_URL}/leaves/create`, {
        start_date: selectedDate,
        end_date: selectedDate,
      }, {
        headers: { Authorization: user.token },
      });
      Alert.alert('Başarılı', 'İzin talebiniz oluşturuldu.');
      setSelectedDate(null);
      fetchCalendar();
    } catch (e) {
      Alert.alert('Hata', e?.response?.data?.error || 'İzin talebi başarısız');
    }
  };

  // Üst bar (Ay seçici, arama, vs.)
  const renderHeader = (date) => {
    const month = date.toString('MMMM yyyy').split(' ')[0];
    const year = date.toString('MMMM yyyy').split(' ')[1];
    return (
      <View style={styles.headerBar}>
        <Text style={styles.headerMonth}>{month} {year}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AntDesign name="search1" size={22} color="#a1887f" style={{ marginRight: 16 }} />
          <AntDesign name="calendar" size={22} color="#a1887f" />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType={'custom'}
        theme={{
          calendarBackground: '#fff',
          todayTextColor: '#1976d2',
          dayTextColor: '#222',
          textDisabledColor: '#bdbdbd',
          arrowColor: '#1976d2',
          monthTextColor: '#222',
        }}
        style={styles.calendar}
        renderHeader={renderHeader}
        dayComponent={({ date, state, marking }) => {
          const isDisabled = marking?.disabled;
          return (
            <TouchableOpacity
              disabled={isDisabled}
              onPress={() => handleDayPress({ dateString: date.dateString })}
              style={[styles.dayBox, marking?.customStyles?.container, isDisabled && { opacity: 0.5 }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayText, marking?.customStyles?.text]}>{date.day}</Text>
            </TouchableOpacity>
          );
        }}
      />
      {/* Seçili günün izinlileri info paneli */}
      {selectedDate && (
        <View style={styles.infoPanel}>
          <Text style={styles.infoTitle}>{selectedDate} izinliler</Text>
          {izinliler.length === 0 ? (
            <Text style={{ color: '#888', marginBottom: 8, fontSize: 15 }}>O gün izinli yok.</Text>
          ) : (
            <FlatList
              data={izinliler}
              keyExtractor={item => item.email}
              renderItem={({ item }) => (
                <Text style={{ color: item.status === 'onaylı' ? '#4caf50' : '#fbc02d', fontSize: 15, marginBottom: 2 }}>{item.email} ({item.status})</Text>
              )}
              style={{ marginBottom: 8 }}
            />
          )}
          <TouchableOpacity style={styles.izinBtn} onPress={handleIzinTalep}>
            <Text style={styles.izinBtnText}>İzin Talep Et</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.kapatBtn} onPress={() => setSelectedDate(null)}>
            <Text style={styles.kapatBtnText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const boxSize = Math.floor(width / 7) - 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0,
  },
  calendar: {
    margin: 0,
    borderRadius: 0,
    overflow: 'hidden',
    elevation: 0,
    marginHorizontal: 0,
    marginTop: 0,
    padding: 0,
  },
  dayBox: {
    width: boxSize,
    height: boxSize,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
    padding: 0,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  dayText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#222',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerMonth: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  infoPanel: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    margin: 12,
    padding: 18,
    alignItems: 'center',
    elevation: 2,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  izinBtn: {
    backgroundColor: '#1976d2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginBottom: 6,
    width: '100%',
    alignItems: 'center',
  },
  izinBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  kapatBtn: {
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  kapatBtnText: {
    color: '#222',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
