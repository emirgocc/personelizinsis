import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, Alert, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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
    axios
      .get('http://192.168.1.105:8000/me', {
        headers: { Authorization: user.token },
      })
      .then((res) => setProfile(res.data))
      .catch(() => Alert.alert('Hata', 'Profil bilgisi alınamadı'))
      .finally(() => setLoading(false));
  }, [user?.token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text>Profil bulunamadı</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f7fa' }} contentContainerStyle={{ flexGrow: 1 }}>
      {/* Üst arka plan */}
      <View style={styles.topBg} />
      {/* Profil fotoğrafı */}
      <View style={styles.avatarWrap}>
        {profile.photo ? (
          <Image source={{ uri: profile.photo }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="person" size={54} color="#bdbdbd" />
          </View>
        )}
      </View>
      {/* Bilgiler ve log out için beyaz zemin */}
      <View style={styles.whiteSection}>
        <View style={styles.infoSection}>
          <Text style={styles.name}>{profile.first_name || ''} {profile.last_name || ''}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.infoValue}>{profile.phone || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mail</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.infoValue}>{profile.email}</Text>
          </View>
        </View>
        {/* Log out seçeneği net çizgilerle */}
        <View style={styles.logoutBorder} />
        <TouchableOpacity style={styles.menuItem} onPress={logout}>
          <MaterialIcons name="logout" size={22} color="#d32f2f" style={{ marginRight: 16 }} />
          <Text style={[styles.menuText, { color: '#d32f2f' }]}>Log out</Text>
        </TouchableOpacity>
        <View style={styles.logoutBorder} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topBg: {
    height: 90,
    backgroundColor: '#f5f7fa', // Uygulamanın genel arka plan rengi
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#e0e0e0',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 0,
    paddingTop: 16,
    flex: 1,
    minHeight: 350,
  },
  infoSection: {
    marginTop: 8,
    marginBottom: 18,
    paddingHorizontal: 32,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 14,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    color: '#888',
    fontSize: 15,
    minWidth: 60,
    textAlign: 'left',
  },
  infoValue: {
    color: '#222',
    fontSize: 15,
    textAlign: 'right',
    minWidth: 80,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
  },
  menuText: {
    fontSize: 16,
    color: '#222',
  },
  logoutBorder: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
});
