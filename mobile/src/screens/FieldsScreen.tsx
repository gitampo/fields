import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthContext } from '../context/AuthContext';
import { useFields } from '../hooks/useFields';
import { useBookings } from '../hooks/useBookings';
import { FieldCard } from '../components/FieldCard';
import { sharedStyles } from '../lib/styles';
import { FieldsStackParamList } from '../navigation/MainTabs';
import Screen from '../components/Screen';
import { Field } from '../types';

type NavigationProp = StackNavigationProp<FieldsStackParamList, 'FieldsList'>;
type SortValue = 'name' | 'priceAsc' | 'priceDesc' | 'playersAsc' | 'playersDesc';

const sortOptions: Array<{ label: string; value: SortValue }> = [
  { label: 'Nome', value: 'name' },
  { label: 'Prezzo crescente', value: 'priceAsc' },
  { label: 'Prezzo decrescente', value: 'priceDesc' },
  { label: 'Capienza crescente', value: 'playersAsc' },
  { label: 'Capienza decrescente', value: 'playersDesc' },
];

export default function FieldsScreen() {
  const { token } = useAuthContext();
  const navigation = useNavigation<NavigationProp>();
  const { fields, loading, fieldsError, handleLoadFields } = useFields(token);
  const {
    myBookings,
    bookingsError,
    handleLoadMyBookings,
  } = useBookings(token);
  const [sortBy, setSortBy] = useState<SortValue>('name');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [showMyBookings, setShowMyBookings] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void handleLoadFields();
      void handleLoadMyBookings();
    }, [handleLoadFields, handleLoadMyBookings]),
  );

  const homeBookings = useMemo(() => (
    myBookings
      .slice()
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  ), [myBookings]);

  const filteredFields = useMemo(() => {
    const next = fields.slice();

    if (sortBy === 'priceAsc') {
      next.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sortBy === 'priceDesc') {
      next.sort((a, b) => b.pricePerHour - a.pricePerHour);
    } else if (sortBy === 'playersAsc') {
      next.sort((a, b) => a.capacity - b.capacity);
    } else if (sortBy === 'playersDesc') {
      next.sort((a, b) => b.capacity - a.capacity);
    } else {
      next.sort((a, b) => a.name.localeCompare(b.name));
    }

    return next;
  }, [fields, sortBy]);

  const selectedSortLabel = useMemo(
    () => sortOptions.find((option) => option.value === sortBy)?.label ?? 'Nome',
    [sortBy],
  );

  const listHeader = (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Prenota un campo</Text>
          <Text style={styles.subtitle}>Tocca un campo per prenotarlo</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.bookingsToggleButton}
        onPress={() => setShowMyBookings((current) => !current)}
      >
        <Text style={styles.bookingsToggleText}>
          {showMyBookings ? 'Nascondi prenotazioni' : 'Mostra le mie prenotazioni'}
        </Text>
      </TouchableOpacity>

      {showMyBookings ? (
        <View style={styles.myBookingsSection}>
          <Text style={styles.bookingsTitle}>Le mie prenotazioni</Text>
          {homeBookings.length > 0 ? homeBookings.map((booking) => {
            const start = new Date(booking.startTime).toLocaleString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });
            const end = new Date(booking.endTime).toLocaleString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <TouchableOpacity
                key={booking.id}
                style={styles.featuredBookingCard}
                onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
              >
                <Text style={styles.featuredBadge}>LA TUA PRENOTAZIONE</Text>
                <Text style={styles.featuredTitle}>{booking.field?.name || booking.fieldId}</Text>
                <Text style={styles.featuredMeta}>{start} - {end}</Text>
                <Text style={styles.featuredTapHint}>Tocca per dettagli e azioni</Text>
              </TouchableOpacity>
            );
          }) : <Text style={styles.emptyBookings}>Non hai ancora prenotazioni effettuate.</Text>}
        </View>
      ) : null}

      {fieldsError ? <Text style={sharedStyles.errorText}>{fieldsError}</Text> : null}
      {bookingsError ? <Text style={sharedStyles.errorText}>{bookingsError}</Text> : null}

      {loading && fields.length === 0 ? <ActivityIndicator style={styles.initialLoader} /> : null}

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setIsSortMenuOpen((current) => !current)}
        >
          <Text style={styles.dropdownLabel}>Ordina per</Text>
          <Text style={styles.dropdownValue}>{selectedSortLabel}</Text>
        </TouchableOpacity>

        {isSortMenuOpen ? (
          <View style={styles.dropdownMenu}>
            {sortOptions.map((option) => {
              const isSelected = option.value === sortBy;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                  onPress={() => {
                    setSortBy(option.value);
                    setIsSortMenuOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, isSelected && styles.dropdownOptionTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>

      
    </>

    
  );


  return (
    <Screen>
      <FlatList
        data={filteredFields}
        keyExtractor={(item: Field) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={listHeader}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleLoadFields} />}
        ListEmptyComponent={<Text style={styles.empty}>Nessun campo disponibile</Text>}
        renderItem={({ item }: { item: Field }) => (
          <FieldCard
            field={item}
            isSelected={false}
            onPress={() => navigation.navigate('Booking', { fieldId: item.id, fieldName: item.name, fieldSport: item.sport })}
          />
        )}
        
      />
    </Screen>

    
  );

  
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E5FAF',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#54677A',
  },
  logoutButton: {
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
  controlsRow: {
    marginTop: 6,
    marginBottom: 10,
  },
  bookingsToggleButton: {
    marginTop: 6,
    marginBottom: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B8D8FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  bookingsToggleText: {
    color: '#1E5FAF',
    fontWeight: '700',
    fontSize: 13,
  },
  myBookingsSection: {
    marginBottom: 8,
  },
  bookingsTitle: {
    marginBottom: 8,
    color: '#1E5FAF',
    fontSize: 18,
    fontWeight: '700',
  },
  featuredBookingCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#EAF4FF',
    borderWidth: 1,
    borderColor: '#B8D8FF',
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#2A7DE1',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
    marginBottom: 8,
  },
  featuredTitle: {
    color: '#1E5FAF',
    fontWeight: '700',
    fontSize: 16,
  },
  featuredMeta: {
    marginTop: 3,
    color: '#334E68',
    fontSize: 13,
    fontWeight: '600',
  },
  featuredTapHint: {
    marginTop: 8,
    color: '#2A7DE1',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBookings: {
    color: '#7A8C9E',
    fontSize: 13,
    marginBottom: 12,
  },
  initialLoader: {
    marginTop: 16,
  },
  list: {
    paddingBottom: 20,
  },
  empty: {
    textAlign: 'center',
    color: '#7A8C9E',
    marginTop: 40,
  },
  dropdownTrigger: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownLabel: {
    fontSize: 14,
    color: '#54677A',
    fontWeight: '600',
  },
  dropdownValue: {
    fontSize: 14,
    color: '#1E5FAF',
    fontWeight: '600',
  },
  dropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D6DFE6',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dropdownOptionSelected: {
    backgroundColor: '#EAF4FF',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#1E5FAF',
  },
  dropdownOptionTextSelected: {
    color: '#2A7DE1',
    fontWeight: '700',
  },
  dropdownText: {
    fontSize: 14,
  },
});
