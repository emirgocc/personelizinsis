import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://192.168.1.105:8000';

export default function IzinlerimScreen() {
  const { user } = useAuth();
  const [izinler, setIzinler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIzinler = async () => {
      try {
        const res = await axios.get(`${API_URL}/leaves/mine`, {
          headers: { Authorization: user.token },
        });
        setIzinler(res.data);
      } catch (e) {
        setError('İzinler alınamadı.');
      }
      setLoading(false);
    };
    fetchIzinler();
  }, [user.token]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1976d2" /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text>{error}</Text></View>;
  }
  if (!izinler.length) {
    return <View style={styles.center}><Text>Henüz izin talebiniz yok.</Text></View>;
  }

  return (
    <FlatList
      data={izinler}
      keyExtractor={item => item.id?.toString() + item.start_date}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.date}>{item.start_date} - {item.end_date}</Text>
          <Text style={styles.status}>{item.status}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  date: { fontSize: 16, fontWeight: 'bold', color: '#1976d2' },
  status: { fontSize: 15, marginTop: 4, color: '#222' },
});
