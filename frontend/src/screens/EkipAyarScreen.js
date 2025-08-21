import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getBackendUrl, API } from '../config/config';

export default function EkipAyarScreen() {
  const { user } = useAuth();
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [maxLeaveCount, setMaxLeaveCount] = useState('');

  const fetchTeamInfo = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      if (user.role === 'admin') {
        // Admin için varsayılan takım bilgisi (1. ekip)
        setTeamInfo({ id: 1, max_leave_count: 2 });
        setMaxLeaveCount('2');
        
        // Tüm personelleri al
        const membersRes = await axios.get(getBackendUrl(API.TEAMS.MEMBERS), {
          headers: { Authorization: user.token },
        });
        setTeamMembers(membersRes.data);
      } else {
        // Normal kullanıcı sadece kendi takımını görebilir
        const teamRes = await axios.get(getBackendUrl(API.TEAMS.INFO), {
          headers: { Authorization: user.token },
        });
        setTeamInfo(teamRes.data);
        setMaxLeaveCount(teamRes.data.max_leave_count?.toString() || '');
        
        const membersRes = await axios.get(getBackendUrl(API.TEAMS.MEMBERS), {
          headers: { Authorization: user.token },
        });
        setTeamMembers(membersRes.data);
      }
    } catch (e) {
      Alert.alert('Hata', 'Takım bilgileri alınamadı.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTeamInfo();
  }, [user.token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeamInfo(false);
  };

  const handleSaveTeamSettings = async () => {
    try {
      await axios.post(getBackendUrl(API.TEAMS.UPDATE), {
        max_leave_count: parseInt(maxLeaveCount),
        team_id: teamInfo?.id,
      }, {
        headers: { Authorization: user.token },
      });
      
      Alert.alert('Başarılı', 'Takım ayarları güncellendi.');
      setEditing(false);
      fetchTeamInfo(false);
    } catch (e) {
      Alert.alert('Hata', 'Ayarlar güncellenemedi.');
    }
  };

  const renderMemberItem = ({ item, index }) => {
    const formatHireDate = (dateStr) => {
      if (!dateStr) return 'Belirtilmemiş';
      const [y, m, g] = dateStr.split('-');
      return `${g}/${m}/${y}`;
    };

    return (
      <View>
        <View style={styles.memberItem}>
          <View style={styles.memberInfo}>
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={24} color="#bdbdbd" />
            </View>
            <View style={styles.memberDetails}>
              <Text style={styles.memberName}>
                {item.first_name || ''} {item.last_name || ''}
              </Text>
              <Text style={styles.memberEmail}>{item.email}</Text>
              {user.role === 'admin' && (
                <Text style={styles.memberTeam}>
                  {item.team_name || 'Takım Yok'}
                </Text>
              )}
            </View>
            <View style={styles.memberRole}>
              <Text style={styles.roleText}>
                {item.role === 'admin' ? 'Amir' : 'Personel'}
              </Text>
              {user.role === 'admin' && (
                <Text style={styles.leaveDays}>
                  {item.annual_leave_days || 20} gün
                </Text>
              )}
            </View>
          </View>
        </View>
        {index < teamMembers.length - 1 && <View style={styles.separator} />}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Üst arka plan - profil ekranındaki gibi */}
        <View style={styles.topBg}>
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Ekip Ayarları</Text>
            <Text style={styles.headerSubtitle}>
              {user.role === 'admin' ? 'Tüm Personeller' : `${teamMembers.length} üye`}
            </Text>
          </View>
        </View>
        
        {/* Profil ekranındaki gibi beyaz panel tasarımı */}
        <View style={styles.whiteSection}>
          {/* Takım Ayarları */}
          {user.role !== 'admin' && (
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Takım Ayarları</Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Maksimum İzin Sayısı</Text>
                <View style={styles.settingInput}>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={maxLeaveCount}
                      onChangeText={setMaxLeaveCount}
                      keyboardType="numeric"
                      placeholder="Örn: 2"
                    />
                  ) : (
                    <Text style={styles.settingValue}>{teamInfo?.max_leave_count || 0}</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.settingActions}>
                {editing ? (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.cancelBtn]} 
                      onPress={() => {
                        setEditing(false);
                        setMaxLeaveCount(teamInfo?.max_leave_count?.toString() || '');
                      }}
                    >
                      <Text style={styles.cancelBtnText}>İptal</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.saveBtn]} 
                      onPress={handleSaveTeamSettings}
                    >
                      <Text style={styles.saveBtnText}>Kaydet</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.editBtn]} 
                    onPress={() => setEditing(true)}
                  >
                    <MaterialIcons name="edit" size={18} color="#1976d2" />
                    <Text style={styles.editBtnText}>Düzenle</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          
          {/* Takım Üyeleri */}
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>
              {user.role === 'admin' ? 'Tüm Personeller' : 'Takım Üyeleri'}
            </Text>
            
            <FlatList
              data={teamMembers}
              keyExtractor={item => item.id?.toString()}
              renderItem={renderMemberItem}
              scrollEnabled={false}
              contentContainerStyle={{ paddingTop: 8 }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  topBg: {
    backgroundColor: '#f5f7fa',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 16,
  },
  headerSection: {
    paddingTop: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    fontWeight: '400',
    textAlign: 'center',
  },
  whiteSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 0,
    paddingTop: 24,
    flex: 1,
    minHeight: 400,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  settingsSection: {
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  membersSection: {
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  settingInput: {
    flex: 1,
    alignItems: 'flex-end',
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    textAlign: 'right',
    minWidth: 60,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f5f7fa',
    borderRadius: 6,
  },
  settingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  editBtn: {
    backgroundColor: '#f5f7fa',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  editBtnText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: '#f5f7fa',
    borderWidth: 1,
    borderColor: '#888',
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#1976d2',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  memberItem: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    backgroundColor: '#fff',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#888',
  },
  memberRole: {
    alignItems: 'flex-end',
  },
  roleText: {
    fontSize: 12,
    color: '#1976d2',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  leaveDays: {
    fontSize: 11,
    color: '#4caf50',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: '500',
  },
  memberTeam: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  separator: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#e0e0e0',
    marginHorizontal: 16,
  },
});
