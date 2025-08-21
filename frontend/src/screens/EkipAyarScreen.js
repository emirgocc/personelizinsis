import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, RefreshControl, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getBackendUrl, API } from '../config/config';

export default function EkipAyarScreen() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState({});

  const fetchTeamInfo = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      if (user.role === 'admin') {
        const membersRes = await axios.get(getBackendUrl(API.TEAMS.MEMBERS), {
          headers: { Authorization: user.token },
        });
        
        const groupedMembers = {};
        membersRes.data.forEach(member => {
          const teamName = member.team_name || 'Takım Yok';
          if (!groupedMembers[teamName]) {
            groupedMembers[teamName] = [];
          }
          groupedMembers[teamName].push(member);
        });
        
        setTeamMembers(groupedMembers);
      } else {
        const membersRes = await axios.get(getBackendUrl(API.TEAMS.MEMBERS), {
          headers: { Authorization: user.token },
        });
        
        const teamName = 'Takım';
        setTeamMembers({ [teamName]: membersRes.data });
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

  const toggleTeamExpansion = (teamName) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamName]: !prev[teamName]
    }));
  };

  const renderTeamSection = (teamName, members) => {
    const isExpanded = expandedTeams[teamName];
    
    return (
      <View style={styles.teamContainer}>
        <TouchableOpacity 
          style={styles.expandableHeader}
          onPress={() => toggleTeamExpansion(teamName)}
          activeOpacity={0.7}
        >
          <View style={styles.teamHeaderContent}>
            <View style={styles.teamIconContainer}>
              <MaterialIcons name="people" size={20} color="#1976d2" />
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{teamName}</Text>
              <Text style={styles.teamMemberCount}>{members.length} üye</Text>
            </View>
          </View>
          <MaterialIcons 
            name={isExpanded ? 'expand-less' : 'expand-more'} 
            size={24} 
            color="#666"
            style={styles.expandIcon}
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandableContent}>
            <View style={styles.memberList}>
              {members.map((member, index) => (
                <View key={member.id} style={[
                  styles.memberItem,
                  index === members.length - 1 && { borderBottomWidth: 0 }
                ]}>
                  <View style={styles.memberAvatar}>
                    <MaterialIcons name="person" size={16} color="#bdbdbd" />
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>
                      {member.first_name || ''} {member.last_name || ''}
                    </Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                  <View style={styles.leaveInfo}>
                    <Text style={styles.leaveDays}>
                      {member.remaining_leave_days || 0} gün
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
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
        <View style={styles.topBg}>
          <View style={styles.headerSection}>
            <Text style={styles.headerSubtitle}>
              {user.role === 'admin' ? 'Tüm Personeller' : `${Object.values(teamMembers).flat().length} üye`}
            </Text>
          </View>
        </View>
        
        <View style={styles.whiteSection}>
          <View style={styles.leavesSection}>
            {Object.entries(teamMembers).map(([teamName, members]) => 
              renderTeamSection(teamName, members)
            )}
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
    overflow: 'hidden',
  },
  leavesSection: {
    paddingHorizontal: 0,
  },
  teamContainer: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    alignSelf: 'center',
    width: '88%',
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 25,
    backgroundColor: '#fff',
  },
  teamHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0f2f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  teamMemberCount: {
    fontSize: 14,
    color: '#888',
  },
  expandableContent: {
    paddingTop: 5,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  expandIcon: {
    marginRight: 15,
  },
  memberList: {
    // No specific styles for memberList, it's just a container for member items
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '400',
    color: '#333',
  },
  memberEmail: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  leaveInfo: {
    marginLeft: 10,
  },
  leaveDays: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
});
