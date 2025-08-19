import React, { useEffect, useState } from 'react';
import { View, Text, Image, Button, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function ProfilScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) return;
    setLoading(true);
    axios.get('http://192.168.1.105:8000/me', {
      headers: { Authorization: user.token }
    })
      .then(res => setProfile(res.data))
      .catch(() => Alert.alert('Hata', 'Profil bilgisi alınamadı'))
      .finally(() => setLoading(false));
  }, [user?.token]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1976d2" /></View>;
  }
  if (!profile) {
    return <View style={styles.center}><Text>Profil bulunamadı</Text></View>;
  }
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.row}>
          {profile.photo ? (
            <Image source={{ uri: profile.photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={54} color="#bdbdbd" />
            </View>
          )}
          <View style={styles.infoCol}>
            <Text style={styles.name}>{profile.first_name || ''} {profile.last_name || ''}</Text>
            <Text style={styles.email}>{profile.email}</Text>
          </View>
        </View>
      </View>
      <View style={{ flex:1 }} />
      <View style={styles.logoutBtnWrap}>
        <Button title="Çıkış Yap" color="#d32f2f" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginTop: 40,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e0e0e0',
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    marginLeft: 22,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#222',
    marginTop: 2,
  },
  logoutBtnWrap: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
});
