import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
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

export default function MyBookingsScreen() {
  const { token, logout } = useAuthContext();
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
  } = useParties(token);

  useFocusEffect(
    React.useCallback(() => {
      void handleLoadMyBookings();
      void handleLoadParties();
    }, [handleLoadMyBookings, handleLoadParties]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.logoutButton} onPress={() => void logout()}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Le mie prenotazioni</Text>
        <Text style={styles.subtitle}>Aggiornamento automatico attivo (realtime)</Text>

        {loading ? <ActivityIndicator color="#0A84FF" /> : null}
        {bookingsError ? <Text style={sharedStyles.errorText}>{bookingsError}</Text> : null}

        <FlatList
          data={myBookings}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nessuna prenotazione trovata</Text>}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              canDelete
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
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Nessun party disponibile</Text>}
          renderItem={({ item }) => <PartyCard party={item} onJoin={handleJoinParty} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    padding: 16,
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
    color: '#0A84FF',
    fontWeight: '700',
    fontSize: 13,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B1F33',
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
    color: '#0B1F33',
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
