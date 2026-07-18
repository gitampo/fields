import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import FieldsScreen from '../screens/FieldsScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingScreen from '../screens/BookingScreen';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import OpenBookingsScreen from '../screens/OpenBookingsScreen';
import MyProfileScreen from '../screens/MyProfile';
import NotificationsScreen from '../screens/Notifications';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import { theme } from '../theme/theme';
import { useAuthContext } from '../context/AuthContext';
import { isAdminUser } from '../lib/admin';

export type FieldsStackParamList = {
  FieldsList: undefined;
  Booking: { fieldId: string; fieldName: string; fieldSport: string };
  BookingDetails: { bookingId: string };
  OpenBookings: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<FieldsStackParamList>();

function FieldsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FieldsList" component={FieldsScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
      <Stack.Screen name="OpenBookings" component={OpenBookingsScreen} />
    </Stack.Navigator>
  );
}



export default function MainTabs() {
  const { currentUser } = useAuthContext();
  const isAdmin = isAdminUser(currentUser);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        lazy: false,
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#ffffffb0',
        tabBarStyle: {
          backgroundColor: theme.colors.primary,
          borderTopColor: theme.colors.secondary,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Home'
              ? 'home-outline'
              : route.name === 'Prenotazioni'
                ? 'calendar-outline'
                : route.name === 'Admin'
                  ? 'settings-outline'
                : route.name === 'Notifiche'
                  ? 'notifications-outline'
                  : 'person-outline';
          return <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Prenotazioni" component={FieldsStack} />
      {isAdmin ? <Tab.Screen name="Admin" component={AdminPanelScreen} /> : null}
      <Tab.Screen name="Notifiche" component={NotificationsScreen} />
      <Tab.Screen name="Profilo" component={MyProfileScreen} />
    </Tab.Navigator>
  );
}
