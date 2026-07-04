import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { useFields } from '../hooks/useFields';
import { useBookings } from '../hooks/useBookings';
import { useParties } from '../hooks/useParties';
import { sharedStyles } from '../lib/styles';
import Screen from '../components/Screen';
import { PartyCard } from '../components/PartyCard';
import { Booking, Party } from '../types';

const openPartyBanner = require('../assets/fields/sportmanship.jpg');
const calmPartyBanner = require('../assets/fields/sportmanship.jpg');
const homePartyFallbackBackground = require('../assets/fields/sportmanship.jpg');
const padelImage = require('../assets/fields/padel.avif');
const tennisImage = require('../assets/fields/tennis.avif');
const calcettoImage = require('../assets/fields/calcetto.avif');
const bocceImage = require('../assets/fields/bocce.jpg');

const OPEN_BANNER_ZOOM = 1.00;
const OPEN_BANNER_OFFSET_X = 10;
const OPEN_BANNER_OFFSET_Y = 20;
const CALM_BANNER_ZOOM = OPEN_BANNER_ZOOM;
const CALM_BANNER_OFFSET_X = OPEN_BANNER_OFFSET_X;
const CALM_BANNER_OFFSET_Y = OPEN_BANNER_OFFSET_Y;



export default function HomeScreen() {
  const { token, currentUser } = useAuthContext();
  const navigation = useNavigation<any>();
  const { fields, loading: fieldsLoading, fieldsError, handleLoadFields } = useFields(token);
  const { myBookings, bookingsError, handleDeleteBooking, handleLoadMyBookings } = useBookings(token);
  const {
    parties,
    partiesLoading,
    partiesError,
    handleLoadParties,
    handleJoinParty,
    handleDeleteParty,
  } = useParties(token);

  useFocusEffect(
    React.useCallback(() => {
      void handleLoadFields();
      void handleLoadParties();
      void handleLoadMyBookings();
    }, [handleLoadFields, handleLoadParties, handleLoadMyBookings]),
  );

  const bookingsById = useMemo(() => {
    const map = new Map<string, Booking>();
    myBookings.forEach((booking) => {
      map.set(booking.id, booking);
    });
    return map;
  }, [myBookings]);

  const getPartyBackgroundFromBooking = (party: Party) => {
    if (!party.bookingId) {
      return homePartyFallbackBackground;
    }

    const booking = bookingsById.get(party.bookingId);
    const key = (booking?.field?.sport || booking?.field?.name || '').toLowerCase();

    if (key.includes('padel')) {
      return padelImage;
    }
    if (key.includes('tennis')) {
      return tennisImage;
    }
    if (key.includes('calcetto') || key.includes('calcio')) {
      return calcettoImage;
    }
    if (key.includes('bocce')) {
      return bocceImage;
    }

    return homePartyFallbackBackground;
  };

  const openParties = useMemo(
    () => parties.filter((party) => (party.remainingSlots ?? party.maxPlayers) > 0),
    [parties],
  );

  const urgentOpenParties = openParties.filter((party) => {
    const remaining = party.remainingSlots ?? party.maxPlayers;
    return remaining > 0 && remaining <= 2;
  });
  const hasOpenParties = openParties.length > 0;

  const onDeleteParty = (partyId: string) => {
    Alert.alert('Elimina party', 'Vuoi eliminare questo party?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: () => {
          const partyToDelete = parties.find((party) => party.id === partyId);
          const linkedBookingId = partyToDelete?.bookingId;

          const runDelete = async () => {
            const deletedParty = await handleDeleteParty(partyId);
            if (deletedParty && linkedBookingId) {
              await handleDeleteBooking(linkedBookingId);
            }
          };

          void runDelete();
        },
      },
    ]);
  };

  const onViewPartyBookingDetails = (bookingId: string) => {
    navigation.navigate('Prenotazioni', {
      screen: 'BookingDetails',
      params: { bookingId },
      initial: false,
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.heroTitle}>Ciao, {currentUser?.name || 'Giocatore'}!</Text>
          <Text style={styles.heroSubtitle}>Pronto a scendere in campo?</Text>
        </View>

       
        
        {openParties.slice(0, 4).map((party: Party) => (
          <PartyCard
            key={party.id}
            party={party}
            backgroundImageSource={getPartyBackgroundFromBooking(party)}
            onJoin={handleJoinParty}
            canJoin={Boolean(!currentUser || party.ownerId !== currentUser.id)}
            canDelete={Boolean(currentUser && party.ownerId === currentUser.id)}
            onDelete={onDeleteParty}
            onViewDetails={onViewPartyBookingDetails}
          />
        ))}

         <View style={[styles.urgencyCard, !hasOpenParties && styles.urgencyCardCalm]}>
          <Image
            source={hasOpenParties ? openPartyBanner : calmPartyBanner}
            resizeMode="cover"
            style={[
              styles.urgencyBackgroundImage,
              hasOpenParties
                ? {
                  transform: [
                    { scale: OPEN_BANNER_ZOOM },
                    { translateX: OPEN_BANNER_OFFSET_X },
                    { translateY: OPEN_BANNER_OFFSET_Y },
                  ],
                }
                : {
                  transform: [
                    { scale: CALM_BANNER_ZOOM },
                    { translateX: CALM_BANNER_OFFSET_X },
                    { translateY: CALM_BANNER_OFFSET_Y },
                  ],
                },
            ]}
          />
          <View style={[styles.urgencyOverlay, !hasOpenParties && styles.urgencyOverlayCalm]}>
            <View style={styles.urgencyContent}>
              <Text style={[styles.urgencyLabel, !hasOpenParties && styles.urgencyLabelCalm]}>
                {hasOpenParties ? 'PARTITE APERTE' : 'NESSUN PARTY'}
              </Text>
              <Text style={[styles.urgencyTitle, !hasOpenParties && styles.urgencyTitleCalm]}>
                {hasOpenParties ? `${openParties.length} party con posti disponibili` : 'Al momento non ci sono party aperti'}
              </Text>
              <Text style={[styles.urgencyText, !hasOpenParties && styles.urgencyTextCalm]}>
                {hasOpenParties
                  ? (urgentOpenParties.length > 0
                    ? `${urgentOpenParties.length} party sono quasi pieni: entra ora.`
                    : 'Ci sono ancora posti liberi: controlla e unisciti quando vuoi.')
                  : 'Crea un party e invita i tuoi amici a giocare insieme!'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.urgencyActionButton, !hasOpenParties && styles.urgencyActionButtonCalm]}
              onPress={() => navigation.navigate('Prenotazioni')}
            >
              <Text style={styles.urgencyActionText}>
                {hasOpenParties ? 'Vedi party aperti' : 'Vai alle prenotazioni'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>


        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Centro Assistenza</Text>
          <Text style={styles.helpText}>Hai bisogno di supporto su prenotazioni o pagamenti?</Text>
          <Text style={styles.helpText}>Email: support@fieldsapp.it</Text>
          <Text style={styles.helpText}>Tel: +39 02 1234 5678 (09:00 - 19:00)</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Altre info utili</Text>
          <Text style={styles.infoText}>Campi disponibili oggi: {fields.length}</Text>
          <Text style={styles.infoText}>Ricorda di arrivare 10 minuti prima dell'orario prenotato.</Text>
          <Text style={styles.infoText}>Le cancellazioni oltre i limiti previsti possono ridurre i punti.</Text>
        </View>

        {partiesError ? <Text style={sharedStyles.errorText}>{partiesError}</Text> : null}
        {bookingsError ? <Text style={sharedStyles.errorText}>{bookingsError}</Text> : null}
        {fieldsError ? <Text style={sharedStyles.errorText}>{fieldsError}</Text> : null}
        {fieldsLoading ? <ActivityIndicator color="#2A7DE1" style={styles.bottomLoader} /> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 6,
    paddingBottom: 30,
  },
  heroTextBlock: {
    marginBottom: 8,
  },
  heroTitle: {
    color: '#1E5FAF',
    fontSize: 28,
    fontWeight: '700',
  },
  heroSubtitle: {
    marginTop: 4,
    color: '#355C86',
    fontSize: 15,
  },
  urgencyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E7D32',
    backgroundColor: '#EEF8EE',
    marginBottom: 14,
    marginTop: 14,
    overflow: 'hidden',
  },
  urgencyCardCalm: {
    borderColor: '#B8BDC5',
    backgroundColor: '#ECEFF3',
  },
  urgencyBackgroundImage: {
    position: 'absolute',
    width: '140%',
    height: '140%',
    left: '-20%',
    top: '-20%',
  },
  urgencyOverlay: {
    padding: 12,
    minHeight: 154,
    backgroundColor: 'rgba(11, 59, 8, 0.67)',
    justifyContent: 'space-between',
  },
  urgencyOverlayCalm: {
    backgroundColor: 'rgba(69, 78, 92, 0.62)',
  },
  urgencyLabel: {
    alignSelf: 'flex-start',
    backgroundColor: '#2E7D32',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  urgencyLabelCalm: {
    backgroundColor: '#8A939E',
  },
  urgencyTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  urgencyTitleCalm: {
    color: '#ffffff',
  },
  urgencyText: {
    marginTop: 4,
    color: '#ffffff',
    fontSize: 13,
  },
  urgencyContent: {
    flexShrink: 1,
  },
  urgencyTextCalm: {
    color: '#ffffff',
    marginTop: 10,
  },
  urgencyActionButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  urgencyActionButtonCalm: {
    backgroundColor: '#FFFFFF',
  },
  urgencyActionText: {
    color: '#1E5FAF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#1E5FAF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 30,
  },
  empty: {
    textAlign: 'center',
    color: '#29649f',
    marginTop: 10,
    marginBottom: 8,
  },
  helpCard: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7E2EC',
    backgroundColor: '#F8FBFF',
    padding: 14,
  },
  helpTitle: {
    color: '#1E5FAF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  helpText: {
    color: '#29649f',
    fontSize: 13,
    marginTop: 2,
  },
  infoCard: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE7F1',
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  infoTitle: {
    color: '#1E5FAF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoText: {
    color: '#29649f',
    fontSize: 13,
    marginTop: 3,
  },
  bottomLoader: {
    marginTop: 14,
  },
});
