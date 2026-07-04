import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import BackButton from '../components/backButton';
import Screen from '../components/Screen';
import { useAuthContext } from '../context/AuthContext';
import { useBookings } from '../hooks/useBookings';
import { sharedStyles } from '../lib/styles';
import { FieldsStackParamList } from '../navigation/MainTabs';
import { API_URL } from '../lib/api';

type BookingDetailsRouteProp = RouteProp<FieldsStackParamList, 'BookingDetails'>;
type BookingDetailsNavigationProp = StackNavigationProp<FieldsStackParamList, 'BookingDetails'>;

const formatDateTime = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function BookingDetailsScreen() {
  const { token, currentUser } = useAuthContext();
  const navigation = useNavigation<BookingDetailsNavigationProp>();
  const route = useRoute<BookingDetailsRouteProp>();
  const { bookingId } = route.params;

  const {
    myBookings,
    loading,
    bookingsError,
    handleLoadMyBookings,
    handleDeleteBooking,
    handleLeaveBooking,
    handleAddParticipants: addParticipantsToBooking,
  } = useBookings(token);
  const [newParticipantIds, setNewParticipantIds] = useState('');

  useFocusEffect(
    useCallback(() => {
      void handleLoadMyBookings();
    }, [handleLoadMyBookings]),
  );

  const booking = useMemo(
    () => myBookings.find((item) => item.id === bookingId),
    [myBookings, bookingId],
  );

  const isGuestParticipant = Boolean(
    booking &&
    currentUser &&
    booking.ownerId !== currentUser.id &&
    booking.participants?.some((participant) => participant.userId === currentUser.id),
  );
  const maxPlayers = booking?.field?.capacity ?? 0;
  const joinedCount = 1 + (booking?.participants?.length || 0);
  const canAddParticipants = Boolean(booking && currentUser && booking.ownerId === currentUser.id && maxPlayers > joinedCount);

  const handleGoHome = useCallback(() => {
    navigation.navigate('FieldsList');
    navigation.getParent()?.navigate('Home' as never);
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      const actionType = event.data.action.type;
      const isBackAction = actionType === 'GO_BACK' || actionType === 'POP' || actionType === 'POP_TO_TOP';

      if (!isBackAction) {
        return;
      }

      event.preventDefault();
      handleGoHome();
    });

    return unsubscribe;
  }, [handleGoHome, navigation]);

  const handleDelete = () => {
    if (!booking) {
      return;
    }

    Alert.alert('Elimina prenotazione', 'Confermi di voler eliminare questa prenotazione?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: () => {
          const runDelete = async () => {
            const deleted = await handleDeleteBooking(booking.id);
            if (deleted) {
              handleGoHome();
            }
          };

          void runDelete();
        },
      },
    ]);
  };

  const handleLeave = () => {
    if (!booking) {
      return;
    }

    Alert.alert('Abbandona prenotazione', 'Vuoi uscire da questa prenotazione?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Abbandona',
        style: 'destructive',
        onPress: () => {
          const runLeave = async () => {
            const left = await handleLeaveBooking(booking.id);
            if (left) {
              navigation.goBack();
            }
          };

          void runLeave();
        },
      },
    ]);
  };

  const handleAddParticipantsPress = () => {
    if (!booking) {
      return;
    }

    const runAdd = async () => {
      const success = await addParticipantsToBooking(booking.id, newParticipantIds);
      if (success) {
        setNewParticipantIds('');
      }
    };

    void runAdd();
  };

  const handleShareBooking = () => {
    if (!booking) {
      return;
    }

    const message = [
      `Unisciti alla mia prenotazione: ${booking.field?.name || booking.fieldId}`,
      `Orario: ${formatDateTime(booking.startTime)} - ${formatDateTime(booking.endTime)}`,
      `Link: ${API_URL}/bookings/${booking.id}`,
      `ID prenotazione: ${booking.id}`,
    ].join('\n');

    const runShare = async () => {
      await Share.share({ message });
    };

    void runShare();
  };

  return (
    <Screen>
      <BackButton title="Indietro" onPress={handleGoHome} />

      <Text style={styles.title}>Dettagli prenotazione</Text>

      {loading && !booking ? <ActivityIndicator color="#2A7DE1" style={styles.loader} /> : null}
      {bookingsError ? <Text style={sharedStyles.errorText}>{bookingsError}</Text> : null}

      {!booking ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Prenotazione non trovata.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.fieldName}>{booking.field?.name || booking.fieldId}</Text>
          <Text style={styles.meta}>Inizio: {formatDateTime(booking.startTime)}</Text>
          <Text style={styles.meta}>Fine: {formatDateTime(booking.endTime)}</Text>
          <Text style={styles.meta}>Stato: {booking.status}</Text>
          <Text style={styles.meta}>Owner: {booking.owner?.name || booking.ownerId}</Text>
          <Text style={styles.meta}>
            Partecipanti: {booking.participants?.map((p) => p.user?.name || p.userId).join(', ') || 'nessuno'}
          </Text>

          <TouchableOpacity style={styles.shareButton} onPress={handleShareBooking}>
            <Text style={styles.shareButtonText}>Condividi link prenotazione</Text>
          </TouchableOpacity>

          {canAddParticipants ? (
            <>
              <Text style={styles.sectionTitle}>Aggiungi partecipanti</Text>
              <TextInput
                value={newParticipantIds}
                onChangeText={setNewParticipantIds}
                placeholder="ID utenti separati da virgola"
                autoCapitalize="none"
                style={sharedStyles.input}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddParticipantsPress} disabled={loading}>
                <Text style={styles.addButtonText}>Aggiungi partecipanti</Text>
              </TouchableOpacity>
            </>
          ) : null}

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={loading}>
            <Text style={styles.deleteButtonText}>Elimina prenotazione</Text>
          </TouchableOpacity>

          {isGuestParticipant ? (
            <TouchableOpacity style={styles.leaveButton} onPress={handleLeave} disabled={loading}>
              <Text style={styles.leaveButtonText}>Abbandona prenotazione</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 14,
    marginBottom: 10,
    fontSize: 24,
    color: '#1E5FAF',
    fontWeight: '700',
  },
  loader: {
    marginTop: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E3EAF0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F8FBFF',
    marginTop: 10,
  },
  fieldName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E5FAF',
    marginBottom: 4,
  },
  meta: {
    color: '#5C6F82',
    fontSize: 13,
    marginTop: 3,
  },
  deleteButton: {
    marginTop: 14,
    backgroundColor: '#D93025',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  leaveButton: {
    marginTop: 10,
    backgroundColor: '#6B7280',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 6,
    color: '#1E5FAF',
    fontWeight: '700',
    fontSize: 14,
  },
  addButton: {
    marginTop: 8,
    backgroundColor: '#2A7DE1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  shareButton: {
    marginTop: 12,
    backgroundColor: '#188038',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyCard: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3EAF0',
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    color: '#5C6F82',
  },
});