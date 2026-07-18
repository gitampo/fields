import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { useParties } from '../hooks/useParties';
import { sharedStyles } from '../lib/styles';
import Screen from '../components/Screen';
import BackButton from '../components/backButton';
import { Party } from '../types';

const normalizePartyTitle = (title: string) => (
  title.replace(/^hai\s+prenotato\s*[:\-]?\s*/i, '').trim()
);

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

export default function OpenBookingsScreen() {
  const navigation = useNavigation<any>();
  const { token, currentUser } = useAuthContext();
  const { parties, partiesLoading, partiesError, handleLoadParties, handleJoinParty } = useParties(token);
  const [selectedField, setSelectedField] = useState('all');
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      void handleLoadParties();
    }, [handleLoadParties]),
  );

  const openBookings = useMemo(
    () => parties.filter((party) => {
      const hasSlots = (party.remainingSlots ?? party.maxPlayers) > 0;
      const startsInFuture = new Date(party.startTime).getTime() > Date.now();
      return hasSlots && startsInFuture;
    }),
    [parties],
  );

  const fieldOptions = useMemo(() => {
    const fields = new Set<string>();

    openBookings.forEach((party) => {
      const fieldName = party.booking?.field?.name;
      if (fieldName) {
        fields.add(fieldName);
      }
    });

    return ['Tutti i campi', ...Array.from(fields).sort((a, b) => a.localeCompare(b, 'it-IT'))];
  }, [openBookings]);

  const filteredOpenBookings = useMemo(() => {
    if (selectedField === 'all') {
      return openBookings;
    }

    return openBookings.filter((party) => party.booking?.field?.name === selectedField);
  }, [openBookings, selectedField]);

  const selectedFieldLabel = selectedField === 'all' ? 'Tutti i campi' : selectedField;

  const onOpenBookingDetails = (party: Party) => {
    if (!party.bookingId) {
      return;
    }

    navigation.navigate('BookingDetails', { bookingId: party.bookingId });
  };

  const onJoinOpenParty = (party: Party) => {
    if (!currentUser || party.ownerId === currentUser.id) {
      return;
    }

    void handleJoinParty(party.id);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton title="Indietro" />

        <Text style={styles.title}>Prenotazioni aperte</Text>
        <Text style={styles.subtitle}>Qui trovi tutte le prenotazioni in cui manca almeno un giocatore.</Text>

        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setIsFieldDropdownOpen((current) => !current)}
          >
            <Text style={styles.dropdownLabel}>Filtra per campo</Text>
            <Text style={styles.dropdownValue}>{selectedFieldLabel}</Text>
          </TouchableOpacity>

          {isFieldDropdownOpen ? (
            <View style={styles.dropdownMenu}>
              {fieldOptions.map((option) => {
                const value = option === 'Tutti i campi' ? 'all' : option;
                const isSelected = selectedField === value;

                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                    onPress={() => {
                      setSelectedField(value);
                      setIsFieldDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownOptionText, isSelected && styles.dropdownOptionTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>

        {partiesLoading ? <ActivityIndicator color="#2A7DE1" style={styles.loader} /> : null}
        {partiesError ? <Text style={sharedStyles.errorText}>{partiesError}</Text> : null}

        {filteredOpenBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nessuna prenotazione aperta per il filtro selezionato.</Text>
          </View>
        ) : (
          filteredOpenBookings.map((party) => {
            const missing = party.remainingSlots ?? party.maxPlayers;
            const baseTitle = normalizePartyTitle(party.title);
            const isAlreadyJoined = Boolean(party.isJoinedByMe);
            const cardTitle = party.ownerId === currentUser?.id
              ? `Hai prenotato: ${baseTitle}`
              : baseTitle;
            const fieldName = party.booking?.field?.name || 'Campo non disponibile';

            return (
              <View key={party.id} style={styles.card}>
                <Text style={styles.cardTitle}>{cardTitle}</Text>
                <Text style={styles.meta}>Campo: {fieldName}</Text>
                <Text style={styles.meta}>Inizio: {formatDateTime(party.startTime)}</Text>
                <Text style={styles.meta}>Fine: {formatDateTime(party.endTime)}</Text>
                <Text style={styles.meta}>Posti mancanti: {missing}</Text>

                {party.bookingId ? (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onOpenBookingDetails(party)}
                  >
                    <Text style={styles.actionButtonText}>Apri prenotazione</Text>
                  </TouchableOpacity>
                ) : null}

                {currentUser && party.ownerId !== currentUser.id ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.joinButton]}
                    onPress={() => onJoinOpenParty(party)}
                    disabled={partiesLoading || isAlreadyJoined}
                  >
                    <Text style={styles.actionButtonText}>{isAlreadyJoined ? 'Gia dentro' : 'Unisciti alla partita'}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  title: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: '700',
    color: '#1E5FAF',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 12,
    color: '#5C6F82',
    fontSize: 13,
  },
  filtersRow: {
    marginBottom: 10,
  },
  dropdownTrigger: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#D6DFE6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownLabel: {
    fontSize: 13,
    color: '#54677A',
    fontWeight: '600',
  },
  dropdownValue: {
    fontSize: 13,
    color: '#1E5FAF',
    fontWeight: '700',
  },
  dropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D6DFE6',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  loader: {
    marginTop: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: '#D7E2EC',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8FBFF',
    marginBottom: 10,
  },
  cardTitle: {
    color: '#1E5FAF',
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    marginTop: 3,
    color: '#5C6F82',
    fontSize: 13,
  },
  actionButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#1E5FAF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  joinButton: {
    backgroundColor: '#188038',
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: '#D7E2EC',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    color: '#5C6F82',
  },
});
