import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getBackendUrl, API } from '../config/config';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'E-posta ve şifre alanları boş bırakılamaz');
      return;
    }

    setLoading(true);
    try {
      console.log('Giriş denemesi:', { email, password });
      const res = await axios.post(getBackendUrl(API.LOGIN), { email, password });
      console.log('Giriş başarılı:', res.data);
      login({
        email: res.data.email,
        role: res.data.role,
        token: res.data.token,
      });
    } catch (err) {
      console.error('Giriş hatası:', err);
      let errorMessage = 'Giriş başarısız';
      
      if (err.response) {
        // Sunucudan hata yanıtı geldi
        errorMessage = err.response.data.error || 'Sunucu hatası';
        console.log('Sunucu hatası:', err.response.data);
      } else if (err.request) {
        // İstek yapıldı ama yanıt alınamadı
        errorMessage = 'Sunucuya bağlanılamadı. Backend çalışıyor mu?';
        console.log('Bağlantı hatası:', err.request);
      } else {
        // Diğer hatalar
        errorMessage = err.message || 'Bilinmeyen hata';
        console.log('Diğer hata:', err.message);
      }
      
      Alert.alert('Giriş Hatası', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kurumsal Giriş</Text>
      <TextInput
        style={styles.input}
        placeholder="E-posta"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title={loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'} onPress={handleLogin} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1976d2', marginBottom: 32 },
  input: { width: 280, height: 48, borderColor: '#1976d2', borderWidth: 1, borderRadius: 8, marginBottom: 16, paddingHorizontal: 12, backgroundColor: '#fff' },
});
