import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFields } from '../hooks/useFields';
import { useBookings } from '../hooks/useBookings';
import { FieldCard } from '../components/FieldCard';
import { BookingCard } from '../components/BookingCard';
import { sharedStyles } from '../lib/styles';

type Props = { token: string };

export default function HomeScreen({ token }: Props) {
  const { fields, loading: fieldsLoading, fieldsError, handleLoadFields } = useFields(token);
  const {
    myBookings,
    selectedFieldId,
    setSelectedFieldId,
    bookingStart,
    setBookingStart,
    bookingEnd,
    setBookingEnd,
    loading: bookingsLoading,
    bookingError,
    bookingSuccess,
    bookingsError,
    handleLoadMyBookings,
    handleCreateBooking,
  } = useBookings(token);

  const loading = fieldsLoading || bookingsLoading;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Campi disponibili</Text>
      <TouchableOpacity style={sharedStyles.button} onPress={handleLoadFields} disabled={loading}>
        {fieldsLoading
          ? <ActivityIndicator color="#FFFFFF" />
          : <Text style={sharedStyles.buttonText}>Carica campi</Text>
        }
      </TouchableOpacity>
      {fieldsError ? <Text style={sharedStyles.errorText}>{fieldsError}</Text> : null}

      <FlatList
        data={fields}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Nessun campo trovato</Text>}
        renderItem={({ item }) => (
          <FieldCard
            field={item}
            isSelected={selectedFieldId === item.id}
            onPress={setSelectedFieldId}
          />
        )}
      />

      <Text style={[styles.cardTitle, styles.sectionSpacing]}>Crea prenotazione</Text>
      <Text style={styles.helperText}>Campo selezionato: {selectedFieldId || 'nessuno'}</Text>

      <TextInput
        value={bookingStart}
        onChangeText={setBookingStart}
        placeholder="Start ISO (es. 2026-06-22T18:00:00.000Z)"
        autoCapitalize="none"
        style={sharedStyles.input}
      />
      <TextInput
        value={bookingEnd}
        onChangeText={setBookingEnd}
        placeholder="End ISO (es. 2026-06-22T19:00:00.000Z)"
        autoCapitalize="none"
        style={sharedStyles.input}
      />

      <TouchableOpacity style={sharedStyles.button} onPress={handleCreateBooking} disabled={loading}>
        <Text style={sharedStyles.buttonText}>Prenota campo</Text>
      </TouchableOpacity>
      {bookingError ? <Text style={sharedStyles.errorText}>{bookingError}</Text> : null}
      {bookingSuccess ? <Text style={sharedStyles.successText}>{bookingSuccess}</Text> : null}

      <TouchableOpacity style={sharedStyles.buttonSecondary} onPress={handleLoadMyBookings} disabled={loading}>
        {bookingsLoading
          ? <ActivityIndicator color="#FFFFFF" />
          : <Text style={sharedStyles.buttonText}>Carica le mie prenotazioni</Text>
        }
      </TouchableOpacity>
      {bookingsError ? <Text style={sharedStyles.errorText}>{bookingsError}</Text> : null}

      <FlatList
        data={myBookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Nessuna prenotazione trovata</Text>}
        renderItem={({ item }) => <BookingCard booking={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0B1F33',
    marginBottom: 10,
  },
  list: {
    paddingBottom: 20,
  },
  empty: {
    textAlign: 'center',
    color: '#7A8C9E',
    marginTop: 14,
  },
  sectionSpacing: {
    marginTop: 12,
  },
  helperText: {
    color: '#5C6F82',
    marginBottom: 8,
    fontSize: 13,
  },
});
