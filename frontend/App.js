import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Image, Button, ActivityIndicator, Alert } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import TakvimScreen from './src/screens/TakvimScreen';
import IzinlerimScreen from './src/screens/IzinlerimScreen';
import ProfilScreen from './src/screens/ProfilScreen';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import axios from 'axios';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Kurumsal tema renkleri
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1976d2',
    background: '#f5f7fa',
    card: '#fff',
    text: '#222',
    border: '#e0e0e0',
    notification: '#1976d2',
  },
};

// ProfilScreen fonksiyonu kaldırıldı
function BekleyenOnaylarScreen() {
  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <Text>Bekleyen Onaylar Ekranı</Text>
    </View>
  );
}
function EkipAyarScreen() {
  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <Text>Ekip Ayarları Ekranı</Text>
    </View>
  );
}

function PersonelTabs() {
  return (
    <Tab.Navigator 
      initialRouteName="Takvim"
      screenOptions={{
        tabBarStyle: { 
          elevation: 0, 
          shadowOpacity: 0,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        tabBarIconStyle: { marginBottom: 2 },
      }}
    >
      <Tab.Screen 
        name="Takvim" 
        component={TakvimScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="calendar-today" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="İzinlerim" 
        component={IzinlerimScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="event-available" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profil" 
        component={ProfilScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
function AmirTabs() {
  return (
    <Tab.Navigator 
      initialRouteName="BekleyenOnaylar"
      screenOptions={{
        tabBarStyle: { 
          elevation: 0, 
          shadowOpacity: 0,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        tabBarIconStyle: { marginBottom: 2 },
      }}
    >
      <Tab.Screen 
        name="Bekleyen Onaylar" 
        component={BekleyenOnaylarScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="pending-actions" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Ekip Ayarları" 
        component={EkipAyarScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profil" 
        component={ProfilScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user } = useAuth();
  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }
  if (user.role === 'admin') {
    return <AmirTabs />;
  }
  return <PersonelTabs />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={theme}>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
