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
type HistoryFilter = 'all' | 'active' | 'ended';

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
  const [showBookingHistory, setShowBookingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

  useFocusEffect(
    useCallback(() => {
      void handleLoadFields();
      void handleLoadMyBookings();
    }, [handleLoadFields, handleLoadMyBookings]),
  );

  const homeBookings = useMemo(() => (
    myBookings
      .slice()
      .sort((a, b) => {
        const aCreatedAt = new Date(a.createdAt || a.startTime).getTime();
        const bCreatedAt = new Date(b.createdAt || b.startTime).getTime();
        return bCreatedAt - aCreatedAt;
      })
  ), [myBookings]);

  const filteredHistoryBookings = useMemo(() => {
    const now = new Date();

    if (historyFilter === 'active') {
      return homeBookings.filter((booking) => {
        const bookingEnd = new Date(booking.endTime);
        return bookingEnd.getTime() > now.getTime();
      });
    }

    if (historyFilter === 'ended') {
      return homeBookings.filter((booking) => {
        const bookingEnd = new Date(booking.endTime);
        return bookingEnd.getTime() <= now.getTime();
      });
    }

    return homeBookings;
  }, [historyFilter, homeBookings]);

  const historyEmptyText = useMemo(() => {
    if (historyFilter === 'active') {
      return 'Non hai prenotazioni attive.';
    }

    if (historyFilter === 'ended') {
      return 'Non hai prenotazioni terminate.';
    }

    return 'Non hai ancora prenotazioni effettuate.';
  }, [historyFilter]);

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
        onPress={() => setShowBookingHistory((current) => !current)}
      >
        <Text style={styles.bookingsToggleText}>
          {showBookingHistory ? 'Nascondi storico prenotazioni' : 'Storico prenotazioni'}
        </Text>
      </TouchableOpacity>

      {showBookingHistory ? (
        <View style={styles.myBookingsSection}>
          <Text style={styles.bookingsTitle}>Storico prenotazioni</Text>

          <View style={styles.historyFiltersRow}>
            <TouchableOpacity
              style={[styles.historyFilterButton, historyFilter === 'all' && styles.historyFilterButtonActive]}
              onPress={() => setHistoryFilter('all')}
            >
              <Text style={[styles.historyFilterText, historyFilter === 'all' && styles.historyFilterTextActive]}>Tutte</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.historyFilterButton, historyFilter === 'active' && styles.historyFilterButtonActive]}
              onPress={() => setHistoryFilter('active')}
            >
              <Text style={[styles.historyFilterText, historyFilter === 'active' && styles.historyFilterTextActive]}>Attive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.historyFilterButton, historyFilter === 'ended' && styles.historyFilterButtonActive]}
              onPress={() => setHistoryFilter('ended')}
            >
              <Text style={[styles.historyFilterText, historyFilter === 'ended' && styles.historyFilterTextActive]}>Terminate</Text>
            </TouchableOpacity>
          </View>

          {filteredHistoryBookings.length > 0 ? filteredHistoryBookings.map((booking) => {
            const isIngresso = booking.bookingRole === 'participant';
            const bookingTypeLabel = isIngresso ? 'INGRESSO' : 'PRENOTAZIONE';
            const start = new Date(booking.startTime).toLocaleString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });
            const end = new Date(booking.endTime).toLocaleString('it-IT', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <TouchableOpacity
                key={booking.id}
                style={[
                  styles.featuredBookingCard,
                  isIngresso ? styles.featuredBookingCardIngresso : styles.featuredBookingCardPrenotazione,
                ]}
                onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
              >
                <Text style={[styles.featuredBadge, isIngresso ? styles.featuredBadgeIngresso : styles.featuredBadgePrenotazione]}>
                  {bookingTypeLabel}
                </Text>
                <Text style={[styles.featuredTitle, isIngresso ? styles.featuredTitleIngresso : styles.featuredTitlePrenotazione]}>
                  {booking.field?.name || booking.fieldId}
                </Text>
                <Text style={[styles.featuredMeta, isIngresso ? styles.featuredMetaIngresso : styles.featuredMetaPrenotazione]}>{start} - {end}</Text>
                <Text style={[styles.featuredTapHint, isIngresso ? styles.featuredTapHintIngresso : styles.featuredTapHintPrenotazione]}>
                  Tocca per dettagli e azioni
                </Text>
              </TouchableOpacity>
            );
          }) : <Text style={styles.emptyBookings}>{historyEmptyText}</Text>}
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
  historyFiltersRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  historyFilterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B8D8FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  historyFilterButtonActive: {
    backgroundColor: '#2A7DE1',
    borderColor: '#2A7DE1',
  },
  historyFilterText: {
    color: '#1E5FAF',
    fontWeight: '700',
    fontSize: 12,
  },
  historyFilterTextActive: {
    color: '#FFFFFF',
  },
  featuredBookingCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  featuredBookingCardPrenotazione: {
    backgroundColor: '#EAF4FF',
    borderColor: '#B8D8FF',
  },
  featuredBookingCardIngresso: {
    backgroundColor: '#F2FBF8',
    borderColor: '#9BDDC5',
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
    marginBottom: 8,
  },
  featuredBadgePrenotazione: {
    backgroundColor: '#2A7DE1',
  },
  featuredBadgeIngresso: {
    backgroundColor: '#1B9E77',
  },
  featuredTitle: {
    fontWeight: '700',
    fontSize: 16,
  },
  featuredTitlePrenotazione: {
    color: '#1E5FAF',
  },
  featuredTitleIngresso: {
    color: '#177A5B',
  },
  featuredMeta: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '600',
  },
  featuredMetaPrenotazione: {
    color: '#334E68',
  },
  featuredMetaIngresso: {
    color: '#2F5F50',
  },
  featuredTapHint: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  featuredTapHintPrenotazione: {
    color: '#2A7DE1',
  },
  featuredTapHintIngresso: {
    color: '#1B9E77',
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
