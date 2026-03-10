import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#9e9e9e',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'İlanlar',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarLabel: 'Harita',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🗺️</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
