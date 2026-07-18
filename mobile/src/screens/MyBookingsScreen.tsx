import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { useBookings } from '../hooks/useBookings';
import { useParties } from '../hooks/useParties';
import { BookingCard } from '../components/BookingCard';
import { PartyCard } from '../components/PartyCard';
import { sharedStyles } from '../lib/styles';
import Screen from '../components/Screen';
import { Booking, Party } from '../types';

export default function MyBookingsScreen() {
  const { token, currentUser, logout } = useAuthContext();
  const {
    myBookings,
    loading,
    bookingsError,
    handleLoadMyBookings,
    handleDeleteBooking,
  } = useBookings(token);

  const {
    parties,
    partiesLoading,
    partiesError,
    title,
    setTitle,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    maxPlayers,
    setMaxPlayers,
    bookingId,
    setBookingId,
    isPublic,
    setIsPublic,
    partySuccess,
    handleLoadParties,
    handleCreateParty,
    handleJoinParty,
    handleDeleteParty,
  } = useParties(token);

  useFocusEffect(
    React.useCallback(() => {
      void handleLoadMyBookings();
      void handleLoadParties();
    }, [handleLoadMyBookings, handleLoadParties]),
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.logoutButton} onPress={() => void logout()}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Le mie prenotazioni</Text>
        

        {loading ? <ActivityIndicator color="#2A7DE1" /> : null}
        {bookingsError ? <Text style={sharedStyles.errorText}>{bookingsError}</Text> : null}

        <FlatList
          data={myBookings}
          keyExtractor={(item: Booking) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nessuna prenotazione trovata</Text>}
          renderItem={({ item }: { item: Booking }) => (
            <BookingCard
              booking={item}
              currentUserId={currentUser?.id}
              canDelete={Boolean(currentUser && item.ownerId === currentUser.id)}
              onDelete={handleDeleteBooking}
            />
          )}
        />

        <Text style={styles.sectionTitle}>Crea Party</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Titolo party"
          style={sharedStyles.input}
        />
        <TextInput
          value={startTime}
          onChangeText={setStartTime}
          placeholder="Start ISO (es. 2026-06-24T18:00:00.000Z)"
          autoCapitalize="none"
          style={sharedStyles.input}
        />
        <TextInput
          value={endTime}
          onChangeText={setEndTime}
          placeholder="End ISO (es. 2026-06-24T19:00:00.000Z)"
          autoCapitalize="none"
          style={sharedStyles.input}
        />
        <TextInput
          value={maxPlayers}
          onChangeText={setMaxPlayers}
          placeholder="Numero massimo giocatori"
          keyboardType="numeric"
          style={sharedStyles.input}
        />
        <TextInput
          value={bookingId}
          onChangeText={setBookingId}
          placeholder="Booking ID (opzionale, deve essere tua)"
          autoCapitalize="none"
          style={sharedStyles.input}
        />

        <TouchableOpacity
          style={[styles.visibilityButton, isPublic ? styles.visibilityPublic : styles.visibilityPrivate]}
          onPress={() => setIsPublic((current) => !current)}
        >
          <Text style={styles.visibilityButtonText}>
            Visibilita party: {isPublic ? 'Pubblico' : 'Privato'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={sharedStyles.button} onPress={handleCreateParty} disabled={partiesLoading}>
          {partiesLoading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={sharedStyles.buttonText}>Crea party</Text>
          }
        </TouchableOpacity>

        {partiesError ? <Text style={sharedStyles.errorText}>{partiesError}</Text> : null}
        {partySuccess ? <Text style={sharedStyles.successText}>{partySuccess}</Text> : null}

        <Text style={styles.sectionTitle}>Party disponibili</Text>
        <FlatList
          data={parties}
          keyExtractor={(item: Party) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nessun party disponibile</Text>}
          renderItem={({ item }: { item: Party }) => (
            <PartyCard
              party={item}
              onJoin={handleJoinParty}
              canJoin={Boolean(!currentUser || item.ownerId !== currentUser.id)}
              canDelete={Boolean(currentUser && item.ownerId === currentUser.id)}
              onDelete={handleDeleteParty}
            />
          )}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
  logoutButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    backgroundColor: '#EAF4FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#2A7DE1',
    fontWeight: '700',
    fontSize: 13,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E5FAF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#5C6F82',
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#1E5FAF',
  },
  list: {
    paddingBottom: 10,
  },
  empty: {
    textAlign: 'center',
    color: '#7A8C9E',
    marginTop: 14,
  },
  visibilityButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  visibilityPublic: {
    backgroundColor: '#188038',
  },
  visibilityPrivate: {
    backgroundColor: '#6B7280',
  },
  visibilityButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
