import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';

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

// Placeholder ekranlar
function TakvimScreen() {
  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <Text>Takvim Ekranı</Text>
    </View>
  );
}
function IzinlerimScreen() {
  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <Text>İzinlerim Ekranı</Text>
    </View>
  );
}
function ProfilScreen() {
  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <Text>Profil Ekranı</Text>
    </View>
  );
}
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
    <Tab.Navigator initialRouteName="Takvim">
      <Tab.Screen name="Takvim" component={TakvimScreen} />
      <Tab.Screen name="İzinlerim" component={IzinlerimScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}
function AmirTabs() {
  return (
    <Tab.Navigator initialRouteName="BekleyenOnaylar">
      <Tab.Screen name="Bekleyen Onaylar" component={BekleyenOnaylarScreen} />
      <Tab.Screen name="Ekip Ayarları" component={EkipAyarScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
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
