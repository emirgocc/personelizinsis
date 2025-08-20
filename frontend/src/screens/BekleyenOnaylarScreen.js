import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getBackendUrl, API } from '../config/config';

export default function BekleyenOnaylarScreen() {
  const { user } = useAuth();
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingLeaves = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await axios.get(getBackendUrl(API.LEAVES.PENDING), {
        headers: { Authorization: user.token },
      });
      setPendingLeaves(res.data.map(leave => ({ ...leave, isExpanded: false })));
    } catch (e) {
      Alert.alert('Hata', 'Bekleyen izinler alınamadı.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPendingLeaves();
  }, [user.token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingLeaves(false);
  };

  const handleApprove = async (leaveId, action) => {
    try {
      await axios.post(getBackendUrl(API.LEAVES.APPROVE), {
        leave_id: leaveId,
        action: action,
      }, {
        headers: { Authorization: user.token },
      });
      
      Alert.alert('Başarılı', `İzin ${action === 'onayla' ? 'onaylandı' : 'reddedildi'}.`);
      fetchPendingLeaves(false);
    } catch (e) {
      Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
    }
  };

  const formatDate = (dateStr) => {
    const [y, m, g] = dateStr.split('-');
    return `${g}/${m}/${y}`;
  };

    const renderLeaveItem = ({ item, index }) => {
    const isRange = item.start_date !== item.end_date;
    const isExpanded = item.isExpanded;
    
    return (
      <View>
        <TouchableOpacity 
          style={styles.leaveItem}
          onPress={() => {
            setPendingLeaves(prev => prev.map((leave, i) => 
              i === index ? { ...leave, isExpanded: !leave.isExpanded } : leave
            ));
          }}
        >
          <View style={styles.leaveHeader}>
            <View style={styles.userInfo}>
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={24} color="#bdbdbd" />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {item.first_name || ''} {item.last_name || ''}
                </Text>
                <Text style={styles.dateText}>
                  {isRange 
                    ? `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`
                    : formatDate(item.start_date)
                  }
                </Text>
              </View>
            </View>
            <View style={styles.expandIcon}>
              <MaterialIcons 
                name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color="#888" 
              />
            </View>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.rejectBtn]} 
                onPress={() => handleApprove(item.id, 'reddet')}
              >
                <MaterialIcons name="close" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Reddet</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionBtn, styles.approveBtn]} 
                onPress={() => handleApprove(item.id, 'onayla')}
              >
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Onayla</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {index < pendingLeaves.length - 1 && <View style={styles.separator} />}
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

  if (!pendingLeaves.length) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={styles.topBg}>
            <View style={styles.headerSection}>
              <Text style={styles.headerSubtitle}>Onay bekleyen izin talebi yok</Text>
            </View>
          </View>
          
          <View style={styles.whiteSection}>
            <View style={styles.emptySection}>
              <MaterialIcons name="check-circle" size={64} color="#4caf50" />
              <Text style={styles.emptyText}>Tüm izin talepleri işlendi</Text>
              <Text style={styles.emptySubtext}>Yeni izin talepleri geldiğinde burada görünecek</Text>
            </View>
          </View>
        </ScrollView>
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
            <Text style={styles.headerSubtitle}>{pendingLeaves.length} izin talebi onay bekliyor</Text>
          </View>
        </View>
        
        {/* Profil ekranındaki gibi beyaz panel tasarımı */}
        <View style={styles.whiteSection}>
          <View style={styles.leavesSection}>
            <FlatList
              data={pendingLeaves}
              keyExtractor={item => item.id?.toString()}
              renderItem={renderLeaveItem}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSection: {
    paddingTop: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
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
    minHeight: 300,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  leavesSection: {
    paddingHorizontal: 0,
  },
  leaveItem: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    backgroundColor: '#fff',
  },
  leaveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#888',
  },
  expandIcon: {
    paddingLeft: 16,
  },
  expandedContent: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
    gap: 6,
  },
  rejectBtn: {
    backgroundColor: '#f44336',
  },
  approveBtn: {
    backgroundColor: '#4caf50',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
