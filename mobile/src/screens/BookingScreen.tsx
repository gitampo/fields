import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { useBookings } from '../hooks/useBookings';
import { sharedStyles } from '../lib/styles';
import { FieldsStackParamList } from '../navigation/MainTabs';
import BackButton from '../components/backButton';
import Screen from '../components/Screen';
import { getBookingWeatherSummary } from '../lib/weather';

type BookingRouteProp = RouteProp<FieldsStackParamList, 'Booking'>;

export default function BookingScreen() {
  const { token } = useAuthContext();
  const navigation = useNavigation<any>();
  const route = useRoute<BookingRouteProp>();
  const { fieldId, fieldName, fieldSport } = route.params;
  const [pickerTarget, setPickerTarget] = useState<'date' | 'startTime' | null>(null);
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
  const [hasSearchedAvailability, setHasSearchedAvailability] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const next = new Date();
    next.setHours(0, 0, 0, 0);
    return next;
  });
  const [startTime, setStartTime] = useState(() => {
    const next = new Date();
    next.setMinutes(0, 0, 0);
    if (new Date() >= next) {
      next.setHours(next.getHours() + 1);
    }
    return next;
  });

  const sportContext = useMemo(
    () => `${fieldSport || ''} ${fieldName || ''}`.toLowerCase(),
    [fieldName, fieldSport],
  );
  const isPadel = useMemo(() => sportContext.includes('padel'), [sportContext]);
  const bookingDurationMinutes = isPadel ? 90 : 60;

  const normalizeStartTimeBySport = (source: Date, isPadelSport: boolean) => {
    const next = new Date(source);
    next.setSeconds(0, 0);

    if (isPadelSport) {
      const mins = next.getMinutes();
      if (mins <= 29) {
        next.setMinutes(0, 0, 0);
      } else {
        next.setMinutes(30, 0, 0);
      }
      return next;
    }

    next.setMinutes(0, 0, 0);
    return next;
  };

  useEffect(() => {
    setStartTime((prev) => normalizeStartTimeBySport(prev, isPadel));
  }, [isPadel]);


  const startAt = useMemo(() => {
    const next = new Date(selectedDate);
    next.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    return next;
  }, [selectedDate, startTime]);

  const endAt = useMemo(() => {
    const next = new Date(startAt);
    next.setMinutes(next.getMinutes() + bookingDurationMinutes);
    return next;
  }, [bookingDurationMinutes, startAt]);

  const {
    setSelectedFieldId,
    setBookingStart,
    setBookingEnd,
    participantUserIdsInput,
    setParticipantUserIdsInput,
    loading,
    bookingError,
    bookingSuccess,
    availabilityLoading,
    availabilityError,
    availableSlots,
    handleCreateBooking,
    handleFindAvailableSlots,
  } = useBookings(token);

  useEffect(() => {
    if (bookingSuccess) {
      setSuccessModalVisible(true);
    }
  }, [bookingSuccess]);

  useEffect(() => {
    setSelectedFieldId(fieldId);
  }, [fieldId]);

  useEffect(() => {
    setBookingStart(startAt.toISOString());
  }, [setBookingStart, startAt]);

  useEffect(() => {
    setBookingEnd(endAt.toISOString());
  }, [endAt, setBookingEnd]);

  const dateLabel = useMemo(() => (
    selectedDate.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  ), [selectedDate]);
  const startLabel = useMemo(() => (
    startAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  ), [startAt]);
  const endLabel = useMemo(
    () => endAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    [endAt],
  );

  const visibleBookingError = useMemo(() => {
    if (isPadel && bookingError) {
      const lowered = bookingError.toLowerCase();
      if (
        lowered.includes('ore piene')
        || lowered.includes('1 ora')
        || lowered.includes('60 min')
      ) {
        return 'Per il padel usa slot da 30 minuti (es. 09:00-10:30).';
      }
    }

    return bookingError;
  }, [bookingError, isPadel]);

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      setPickerTarget(null);
      return;
    }
    if (!selected || !pickerTarget) {
      return;
    }

    if (pickerTarget === 'date') {
      const nextDate = new Date(selected);
      nextDate.setHours(0, 0, 0, 0);
      setSelectedDate(nextDate);
    } else {
      const nextTime = normalizeStartTimeBySport(selected, isPadel);

      const now = new Date();
      const selectedDayStart = new Date(selectedDate);
      selectedDayStart.setHours(0, 0, 0, 0);
      const nowDayStart = new Date(now);
      nowDayStart.setHours(0, 0, 0, 0);

      if (selectedDayStart.getTime() === nowDayStart.getTime()) {
        const candidate = new Date(selectedDate);
        candidate.setHours(nextTime.getHours(), nextTime.getMinutes(), 0, 0);

        if (candidate <= now) {
          const adjusted = normalizeStartTimeBySport(now, isPadel);
          if (adjusted <= now) {
            adjusted.setMinutes(adjusted.getMinutes() + (isPadel ? 30 : 60));
          }
          setStartTime(adjusted);
          return;
        }
      }

      setStartTime(nextTime);
    }
  };

  const handleConfirmBooking = () => {
    Alert.alert(
      'Conferma prenotazione',
      'Vuoi confermare la tua prenotazione?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Si', style: 'default', onPress: () => { void handleCreateBooking(); } },
      ],
    );
  };

  const handleSelectAvailableSlot = (slot: string) => {
    const [hoursRaw, minutesRaw] = slot.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return;
    }

    const next = new Date(selectedDate);
    next.setHours(hours, minutes, 0, 0);
    setStartTime(next);
  };

  const handleCloseSuccessModal = () => {
    setSuccessModalVisible(false);
    navigation.navigate('FieldsList');
    navigation.getParent()?.navigate('Home');
  };

  const handlePressFindAvailableSlots = () => {
    setHasSearchedAvailability(true);
    void handleFindAvailableSlots(fieldId, selectedDate);
  };

  const handleCheckWeather = () => {
    const run = async () => {
      try {
        const summary = await getBookingWeatherSummary(startAt.toISOString(), endAt.toISOString());
        Alert.alert(
          `Meteo - ${summary.locationLabel}`,
          `Inizio\n${summary.startLine}\n\nFine\n${summary.endLine}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Errore meteo inatteso';
        Alert.alert('Meteo non disponibile', message);
      }
    };

    void run();
  };

  useEffect(() => {
    setHasSearchedAvailability(false);
  }, [fieldId, selectedDate]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton title="Indietro" />

        <View style={styles.header}>
          <Text style={styles.title}>Prenota campo</Text>
          <Text style={styles.fieldName}>{fieldName}</Text>
          
        </View>

        <TouchableOpacity
          style={[styles.findAvailabilityButton, availabilityLoading && styles.findAvailabilityButtonDisabled]}
          onPress={handlePressFindAvailableSlots}
          disabled={availabilityLoading}
        >
          {availabilityLoading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.findAvailabilityButtonText}>Trova orari disponibili</Text>
          }
        </TouchableOpacity>
                {availabilityError ? <Text style={sharedStyles.errorText}>{availabilityError}</Text> : null}

        {hasSearchedAvailability ? (
          <View style={styles.availableSlotsCard}>
            <Text style={styles.availableSlotsTitle}>Orari disponibili</Text>
            {availabilityLoading ? <ActivityIndicator color="#1E5FAF" /> : null}
            {availableSlots.length > 0 ? (
              <View style={styles.availableSlotsWrap}>
                {availableSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.availableSlotChip,
                      startLabel === slot && styles.availableSlotChipSelected,
                    ]}
                    onPress={() => handleSelectAvailableSlot(slot)}
                  >
                    <Text
                      style={[
                        styles.availableSlotChipText,
                        startLabel === slot && styles.availableSlotChipTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            {!availabilityLoading && availableSlots.length === 0 && !availabilityError ? (
              <Text style={styles.availableSlotsEmpty}>Nessun orario disponibile per la data selezionata.</Text>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.label}>Data</Text>
        <TouchableOpacity style={styles.timeButton} onPress={() => setPickerTarget('date')}>
          <Text style={styles.timeButtonText}>{dateLabel}</Text>
        </TouchableOpacity>

        {pickerTarget === 'date' ? (
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Seleziona data</Text>
              <TouchableOpacity onPress={() => setPickerTarget(null)}>
                <Text style={styles.pickerClose}>Chiudi</Text>
              </TouchableOpacity>
            </View>

            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={handlePickerChange}
              minimumDate={new Date()}
            />
          </View>
        ) : null}

        <Text style={styles.label}>Ora inizio</Text>
        <TouchableOpacity style={styles.timeButton} onPress={() => setPickerTarget('startTime')}>
          <Text style={styles.timeButtonText}>{startLabel}</Text>
        </TouchableOpacity>

        {pickerTarget === 'startTime' ? (
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Seleziona ora inizio</Text>
              <TouchableOpacity onPress={() => setPickerTarget(null)}>
                <Text style={styles.pickerClose}>Chiudi</Text>
              </TouchableOpacity>
            </View>

            <DateTimePicker
              value={startTime}
              mode="time"
              display="spinner"
              is24Hour
              minuteInterval={isPadel ? 30 : 60}
              onChange={handlePickerChange}
            />
          </View>
        ) : null}

        <Text style={styles.label}>Ora fine (calcolata)</Text>
        <TouchableOpacity style={[styles.timeButton, styles.timeButtonDisabled]} disabled>
          <Text style={styles.timeButtonText}>{endLabel}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Durata</Text>
        <TouchableOpacity style={[styles.timeButton, styles.timeButtonDisabled]} disabled>
          <Text style={styles.timeButtonText}>{bookingDurationMinutes} min</Text>
        </TouchableOpacity>

        <Text style={styles.helperText}>
          Fascia selezionata: {startLabel} - {endLabel}
          {isPadel ? ' (slot da 30 minuti, durata 90 min)' : ' (solo ore piene, durata 60 min)'}
        </Text>

        <TouchableOpacity style={styles.weatherButton} onPress={handleCheckWeather}>
          <Text style={styles.weatherButtonText}>Controlla il Meteo</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Invita utenti (username, email o ID separati da virgola)</Text>
        <TextInput
          value={participantUserIdsInput}
          onChangeText={setParticipantUserIdsInput}
          placeholder="es. mario.rossi, anna@email.com"
          autoCapitalize="none"
          style={sharedStyles.input}
        />

        <TouchableOpacity style={sharedStyles.button} onPress={handleConfirmBooking} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={sharedStyles.buttonText}>Conferma prenotazione</Text>
          }
        </TouchableOpacity>

        {visibleBookingError ? <Text style={sharedStyles.errorText}>{visibleBookingError}</Text> : null}

      </ScrollView>

      {isSuccessModalVisible ? (
        <View style={styles.successModalBackdrop}>
          <View style={styles.successModalCard}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Prenotazione confermata</Text>
            <Text style={styles.successSubtitle}>La tua prenotazione e stata registrata con successo.</Text>
            <TouchableOpacity style={styles.successCloseButton} onPress={handleCloseSuccessModal}>
              <Text style={styles.successCloseButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E5FAF',
  },
  fieldName: {
    marginTop: 4,
    fontSize: 16,
    color: '#2A7DE1',
    fontWeight: '600',
  },
  fieldSport: {
    marginTop: 4,
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
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
    color: '#1E5FAF',
    fontWeight: '500',
  },
  timeButtonDisabled: {
    backgroundColor: '#F3F6F9',
  },
  helperText: {
    color: '#5C6F82',
    marginBottom: 12,
    fontSize: 12,
  },
  weatherButton: {
    marginBottom: 12,
    backgroundColor: '#1E5FAF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  weatherButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerCard: {
    borderWidth: 1,
    borderColor: '#D6DFE6',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 10,
    marginBottom: 12,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pickerTitle: {
    color: '#1E5FAF',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerClose: {
    color: '#2A7DE1',
    fontSize: 13,
    fontWeight: '700',
  },
  findAvailabilityButton: {
    marginBottom: 10,
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  findAvailabilityButtonDisabled: {
    opacity: 0.7,
  },
  findAvailabilityButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  availableSlotsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6DFE6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  availableSlotsTitle: {
    color: '#1E5FAF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  availableSlotsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availableSlotsEmpty: {
    color: '#5C6F82',
    fontSize: 13,
  },
  availableSlotChip: {
    backgroundColor: '#EAF4FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#B8D8FF',
  },
  availableSlotChipSelected: {
    backgroundColor: '#2A7DE1',
    borderColor: '#2A7DE1',
  },
  availableSlotChipText: {
    color: '#1E5FAF',
    fontSize: 12,
    fontWeight: '700',
  },
  availableSlotChipTextSelected: {
    color: '#FFFFFF',
  },
  successModalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 30,
  },
  successModalCard: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2E7D32',
    backgroundColor: '#EEF8EE',
    paddingVertical: 20,
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  successIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#2E7D32',
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    overflow: 'hidden',
    marginBottom: 10,
  },
  successTitle: {
    color: '#2E7D32',
    fontSize: 22,
    fontWeight: '800',
  },
  successSubtitle: {
    marginTop: 6,
    color: '#3F5B46',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  successCloseButton: {
    marginTop: 14,
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 26,
  },
  successCloseButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
