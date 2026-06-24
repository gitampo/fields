import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import FieldsScreen from '../screens/FieldsScreen';
import BookingScreen from '../screens/BookingScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';

export type FieldsStackParamList = {
  FieldsList: undefined;
  Booking: { fieldId: string; fieldName: string };
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<FieldsStackParamList>();

function FieldsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FieldsList" component={FieldsScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
    </Stack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0A84FF',
        tabBarInactiveTintColor: '#7A8C9E',
        tabBarStyle: { backgroundColor: '#FFFFFF' },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Campi' ? 'key-outline' : 'calendar-outline';
          return <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Campi" component={FieldsStack} />
      <Tab.Screen name="Prenotazioni" component={MyBookingsScreen} />
    </Tab.Navigator>
  );
}
