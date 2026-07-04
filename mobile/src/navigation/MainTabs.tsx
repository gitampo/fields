import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import FieldsScreen from '../screens/FieldsScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingScreen from '../screens/BookingScreen';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import MyProfileScreen from '../screens/MyProfile';
import { theme } from '../theme/theme';

export type FieldsStackParamList = {
  FieldsList: undefined;
  Booking: { fieldId: string; fieldName: string; fieldSport: string };
  BookingDetails: { bookingId: string };
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<FieldsStackParamList>();

function FieldsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FieldsList" component={FieldsScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
    </Stack.Navigator>
  );
}



export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        lazy: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#E6F0FF',
        tabBarStyle: {
          backgroundColor: theme.colors.primary,
          borderTopColor: theme.colors.secondary,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Home' ? 'home-outline' : route.name === 'Prenotazioni' ? 'calendar-outline' : 'person-outline';
          return <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Prenotazioni" component={FieldsStack} />
      <Tab.Screen name="Profilo" component={MyProfileScreen} />
    </Tab.Navigator>
  );
}
