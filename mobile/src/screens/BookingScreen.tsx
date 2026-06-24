import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { useBookings } from '../hooks/useBookings';
import { sharedStyles } from '../lib/styles';
import { FieldsStackParamList } from '../navigation/MainTabs';

type BookingRouteProp = RouteProp<FieldsStackParamList, 'Booking'>;

export default function BookingScreen() {
  const { token } = useAuthContext();
  const navigation = useNavigation();
  const route = useRoute<BookingRouteProp>();
  const { fieldId, fieldName } = route.params;
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [startAt, setStartAt] = useState(() => {
    const next = new Date();
    next.setMinutes(0, 0, 0);
    next.setHours(next.getHours() + 1);
    return next;
  });
  const [endAt, setEndAt] = useState(() => {
    const next = new Date();
    next.setMinutes(0, 0, 0);
    next.setHours(next.getHours() + 2);
    return next;
  });

  const {
    setSelectedFieldId,
    setBookingStart,
    setBookingEnd,
    participantUserIdsInput,
    setParticipantUserIdsInput,
    loading,
    bookingError,
    bookingSuccess,
    handleCreateBooking,
  } = useBookings(token);

  useEffect(() => {
    setSelectedFieldId(fieldId);
  }, [fieldId]);

  useEffect(() => {
    setBookingStart(startAt.toISOString());
  }, [startAt]);

  useEffect(() => {
    setBookingEnd(endAt.toISOString());
  }, [endAt]);

  const startLabel = useMemo(
    () => startAt.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    [startAt],
  );
  const endLabel = useMemo(
    () => endAt.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    [endAt],
  );

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      setPickerTarget(null);
      return;
    }
    if (!selected || !pickerTarget) {
      return;
    }

    if (pickerTarget === 'start') {
      setStartAt(selected);
      if (selected >= endAt) {
        const nextEnd = new Date(selected);
        nextEnd.setHours(nextEnd.getHours() + 1);
        setEndAt(nextEnd);
      }
    } else {
      setEndAt(selected);
    }

    setPickerTarget(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Torna ai campi</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Prenota campo</Text>
        <Text style={styles.fieldName}>{fieldName}</Text>
      </View>

      <Text style={styles.label}>Inizio</Text>
      <TouchableOpacity style={styles.timeButton} onPress={() => setPickerTarget('start')}>
        <Text style={styles.timeButtonText}>{startLabel}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Fine</Text>
      <TouchableOpacity style={styles.timeButton} onPress={() => setPickerTarget('end')}>
        <Text style={styles.timeButtonText}>{endLabel}</Text>
      </TouchableOpacity>

      {pickerTarget ? (
        <DateTimePicker
          value={pickerTarget === 'start' ? startAt : endAt}
          mode="datetime"
          is24Hour
          onChange={handlePickerChange}
          minimumDate={pickerTarget === 'end' ? startAt : new Date()}
        />
      ) : null}

      <Text style={styles.label}>Invita utenti (ID separati da virgola)</Text>
      <TextInput
        value={participantUserIdsInput}
        onChangeText={setParticipantUserIdsInput}
        placeholder="es. cm123,cm456"
        autoCapitalize="none"
        style={sharedStyles.input}
      />

      <TouchableOpacity style={sharedStyles.button} onPress={handleCreateBooking} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#FFFFFF" />
          : <Text style={sharedStyles.buttonText}>Conferma prenotazione</Text>
        }
      </TouchableOpacity>

      {bookingError ? <Text style={sharedStyles.errorText}>{bookingError}</Text> : null}
      {bookingSuccess ? <Text style={sharedStyles.successText}>{bookingSuccess}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: '#0A84FF',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B1F33',
  },
  fieldName: {
    marginTop: 4,
    fontSize: 16,
    color: '#0A84FF',
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#54677A',
    marginBottom: 4,
  },
  timeButton: {
    borderWidth: 1,
    borderColor: '#D6DFE6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  timeButtonText: {
    color: '#0B1F33',
    fontWeight: '500',
  },
});
