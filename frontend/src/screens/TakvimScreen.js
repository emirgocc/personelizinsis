import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, Button, Alert, Dimensions, Pressable } from 'react-native';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://192.168.1.105:8000'; // Backend IP
const { height } = Dimensions.get('window');

export default function TakvimScreen() {
  const { user } = useAuth();
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
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
      try {
        const res = await axios.get(`${API_URL}/leaves/day?date=${dateStr}`, {
          headers: { Authorization: user.token },
        });
        const izinler = res.data;
        let color = '#4caf50'; // yeşil
        if (izinler.length >= limit) color = '#e53935'; // kırmızı
        else if (izinler.length === limit - 1) color = '#fbc02d'; // sarı
        marks[dateStr] = {
          marked: izinler.length > 0,
          dotColor: color,
          selectedColor: color,
          customStyles: {
            container: { backgroundColor: color },
            text: { color: '#fff' },
          },
        };
      } catch (e) {
        // ignore
      }
    }
    setMarkedDates(marks);
    setLoading(false);
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  // Gün seçilince modal aç ve izinlileri çek
  const handleDayPress = async (day) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
    try {
      const res = await axios.get(`${API_URL}/leaves/day?date=${day.dateString}`, {
        headers: { Authorization: user.token },
      });
      setIzinliler(res.data);
    } catch (e) {
      setIzinliler([]);
    }
  };

  // İzin talebi oluştur
  const handleIzinTalep = async () => {
    try {
      await axios.post(`${API_URL}/leaves/create`, {
        start_date: selectedDate,
        end_date: selectedDate,
      }, {
        headers: { Authorization: user.token },
      });
      Alert.alert('Başarılı', 'İzin talebiniz oluşturuldu.');
      setModalVisible(false);
      fetchCalendar();
    } catch (e) {
      Alert.alert('Hata', e?.response?.data?.error || 'İzin talebi başarısız');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType={'custom'}
        theme={{
          calendarBackground: '#f5f7fa',
          todayTextColor: '#1976d2',
          dayTextColor: '#222',
          textDisabledColor: '#bdbdbd',
          arrowColor: '#1976d2',
        }}
        style={{ margin: 8, borderRadius: 16, overflow: 'hidden', elevation: 2 }}
      />
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalBg} onPress={() => setModalVisible(false)}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>{selectedDate} izinliler</Text>
            {izinliler.length === 0 ? (
              <Text style={{ color: '#888', marginBottom: 16, fontSize: 16 }}>O gün izinli yok.</Text>
            ) : (
              <FlatList
                data={izinliler}
                keyExtractor={item => item.email}
                renderItem={({ item }) => (
                  <Text style={{ color: item.status === 'onaylı' ? '#4caf50' : '#fbc02d', fontSize: 16, marginBottom: 4 }}>{item.email} ({item.status})</Text>
                )}
                style={{ marginBottom: 16 }}
              />
            )}
            <TouchableOpacity style={styles.izinBtn} onPress={handleIzinTalep}>
              <Text style={styles.izinBtnText}>İzin Talep Et</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.kapatBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.kapatBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
