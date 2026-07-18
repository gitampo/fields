import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  ImageStyle,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { useFields } from '../hooks/useFields';
import { useBookings } from '../hooks/useBookings';
import { useParties } from '../hooks/useParties';
import { API_URL, getApiErrorMessage } from '../lib/api';
import { BONUS_BOOKINGS_TARGET, getBonusProgressMessage } from '../lib/bonusProgress';
import { sharedStyles } from '../lib/styles';
import {
  getCarouselImageFocusStyle,
  getCarouselImageResizeMode,
  fieldFallbackImage,
  getFieldImageFocusStyle,
  getFieldImageSource,
} from '../lib/fieldImages';
import Screen from '../components/Screen';
import { ApiErrorBody, Booking, BookingInvite } from '../types';

const openPartyBanner = require('../assets/fields/sportmanship.jpg');
const calmPartyBanner = require('../assets/fields/sportmanship.jpg');

const OPEN_BANNER_ZOOM = 1.00;
const OPEN_BANNER_OFFSET_X = 10;
const OPEN_BANNER_OFFSET_Y = 20;
const CALM_BANNER_ZOOM = OPEN_BANNER_ZOOM;
const CALM_BANNER_OFFSET_X = OPEN_BANNER_OFFSET_X;
const CALM_BANNER_OFFSET_Y = OPEN_BANNER_OFFSET_Y;

type HomeCarouselSlide = {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  imageFocusStyle: ImageStyle;
  imageResizeMode: 'cover' | 'contain';
  onPress?: () => void;
};

const formatBookingDate = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatBookingTime = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getParticipantCount = (booking: Booking) => 1 + (booking.participants?.length || 0);

const getAvailableSpots = (booking: Booking) => {
  const capacity = booking.field?.capacity;
  if (typeof capacity !== 'number') {
    return null;
  }

  return Math.max(capacity - getParticipantCount(booking), 0);
};

type CompletedStats = {
  totalCompletedBookings: number;
};

const COMPLETED_PROGRESS_REFRESH_MS = 30 * 1000;



export default function HomeScreen() {
  const { token, currentUser } = useAuthContext();
  const navigation = useNavigation<any>();
  const carouselRef = React.useRef<ScrollView | null>(null);
  const { fields, loading: fieldsLoading, fieldsError, handleLoadFields } = useFields(token);
  const {
    myBookings,
    pendingInvites,
    invitesLoading,
    bookingsError,
    handleLoadMyBookings,
    handleLoadPendingInvites,
    handleRespondToInvite,
  } = useBookings(token);
  const {
    parties,
    partiesError,
    handleLoadParties,
  } = useParties(token);

  useFocusEffect(
    React.useCallback(() => {
      void handleLoadFields();
      void handleLoadParties();
      void handleLoadMyBookings();
      void handleLoadPendingInvites();
    }, [handleLoadFields, handleLoadParties, handleLoadMyBookings, handleLoadPendingInvites]),
  );

  const handleInviteResponse = (invite: BookingInvite, action: 'accept' | 'reject') => {
    const actionLabel = action === 'accept' ? 'accettare' : 'rifiutare';
    Alert.alert(
      action === 'accept' ? 'Accetta invito' : 'Rifiuta invito',
      `Confermi di voler ${actionLabel} l'invito per ${invite.booking.field?.name || invite.booking.fieldId}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: action === 'accept' ? 'Accetta' : 'Rifiuta',
          style: action === 'accept' ? 'default' : 'destructive',
          onPress: () => {
            void handleRespondToInvite(invite.booking.id, action);
          },
        },
      ],
    );
  };

  const getBookingImageKey = (booking: Booking) => (
    `${booking.field?.sport || ''} ${booking.field?.name || ''}`
  );

  const getBookingBackgroundImage = (booking: Booking) => {
    const key = getBookingImageKey(booking);
    return getFieldImageSource(key, fieldFallbackImage);
  };

  const getBookingBackgroundFocusStyle = (booking: Booking) => {
    const key = getBookingImageKey(booking);
    return getFieldImageFocusStyle(key);
  };

  const openParties = useMemo(
    () => parties.filter((party) => {
      const hasSlots = (party.remainingSlots ?? party.maxPlayers) > 0;
      const startsInFuture = new Date(party.startTime).getTime() > Date.now();
      return hasSlots && startsInFuture;
    }),
    [parties],
  );

  const urgentOpenParties = openParties.filter((party) => {
    const remaining = party.remainingSlots ?? party.maxPlayers;
    return remaining > 0 && remaining <= 2;
  });
  const hasOpenParties = openParties.length > 0;

  const [carouselItemWidth, setCarouselItemWidth] = React.useState(1);
  const [completedBookings, setCompletedBookings] = React.useState(0);
  const [progressLoading, setProgressLoading] = React.useState(false);

  const specialSlides = useMemo<HomeCarouselSlide[]>(() => {
    const eventImage = require('../assets/fields/loc.avif');
    const skillsImage = require('../assets/fields/skills.avif');
    const photoImage = require('../assets/fields/calcetto.avif');
    const partiesImage = require('../assets/fields/tennis.avif');

    return [
      {
        id: 'event',
        label: 'EVENTO',
        title: 'Torneo di calcetto',
        subtitle: 'Iscrivi la tua squadra e partecipa al torneo',
        image: eventImage,
        imageFocusStyle: { height: '100%' },
        imageResizeMode: 'cover',
        onPress: () => {
          // TODO: Navigare a una schermata eventi quando disponibile
          alert('Sezione eventi in arrivo presto!');
        },
      },
      {
        id: 'skills',
        label: 'PROFILO',
        title: 'Definisci le tue Abilità',
        subtitle: 'Completa il tuo profilo di giocatore',
        image: skillsImage,
        imageFocusStyle: getCarouselImageFocusStyle('skills'),
        imageResizeMode: getCarouselImageResizeMode('skills'),
        onPress: () => {
          navigation.navigate('Profilo');
        },
      },
      {
        id: 'gallery',
        label: 'FOTO',
        title: 'Esplora le Foto',
        subtitle: 'Galleria dei campi',
        image: photoImage,
        imageFocusStyle: getCarouselImageFocusStyle('gallery'),
        imageResizeMode: getCarouselImageResizeMode('gallery'),
        onPress: () => {
          // TODO: Navigare a una galleria foto quando disponibile
          alert('Galleria foto in arrivo presto!');
        },
      },
    ];
  }, [navigation]);

  const fieldSlides = useMemo<HomeCarouselSlide[]>(() => {
    if (fields.length === 0) {
      return [
        {
          id: 'padel',
          label: 'CAMPI',
          title: 'Padel',
          subtitle: 'Campi indoor e outdoor',
          image: getFieldImageSource('padel', fieldFallbackImage),
          imageFocusStyle: getCarouselImageFocusStyle('padel'),
          imageResizeMode: getCarouselImageResizeMode('padel'),
        },
        {
          id: 'tennis',
          label: 'CAMPI',
          title: 'Tennis',
          subtitle: 'Terra rossa e sintetico',
          image: getFieldImageSource('tennis', fieldFallbackImage),
          imageFocusStyle: getCarouselImageFocusStyle('tennis'),
          imageResizeMode: getCarouselImageResizeMode('tennis'),
        },
        {
          id: 'calcetto',
          label: 'CAMPI',
          title: 'Calcetto',
          subtitle: 'Partite veloci con gli amici',
          image: getFieldImageSource('calcetto', fieldFallbackImage),
          imageFocusStyle: getCarouselImageFocusStyle('calcetto'),
          imageResizeMode: getCarouselImageResizeMode('calcetto'),
        },
      ];
    }

    return fields.map((field) => {
      const key = `${field.sport || ''} ${field.name || ''}`;

      return {
        id: field.id,
        label: 'CAMPI',
        title: field.name,
        subtitle: `${field.sport} • Capienza ${field.capacity}`,
        image: getFieldImageSource(key, fieldFallbackImage),
        imageFocusStyle: getCarouselImageFocusStyle(key),
        imageResizeMode: getCarouselImageResizeMode(key),
      };
    });
  }, [fields]);

  const allCarouselSlides = useMemo<HomeCarouselSlide[]>(
    () => specialSlides,
    [specialSlides],
  );

  const loopedSlides = useMemo<HomeCarouselSlide[]>(() => {
    if (allCarouselSlides.length <= 1) {
      return allCarouselSlides;
    }

    const first = allCarouselSlides[0];
    const last = allCarouselSlides[allCarouselSlides.length - 1];
    return [last, ...allCarouselSlides, first];
  }, [allCarouselSlides]);

  const [carouselIndex, setCarouselIndex] = React.useState(0);

  const loadCompletedBookingProgress = React.useCallback(async () => {
    if (!token) {
      setCompletedBookings(0);
      return;
    }

    setProgressLoading(true);
    try {
      const response = await fetch(`${API_URL}/bookings/me/stats/completed`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      let data: unknown = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(getApiErrorMessage(response.status, (data as ApiErrorBody) || {}));
      }

      const stats = data as CompletedStats;
      setCompletedBookings(typeof stats.totalCompletedBookings === 'number' ? stats.totalCompletedBookings : 0);
    } catch {
      setCompletedBookings(0);
    } finally {
      setProgressLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    setCarouselIndex(0);
    const initialX = allCarouselSlides.length > 1 ? carouselItemWidth : 0;
    carouselRef.current?.scrollTo({ x: initialX, animated: false });
  }, [allCarouselSlides.length, carouselItemWidth]);

  useFocusEffect(
    React.useCallback(() => {
      void loadCompletedBookingProgress();

      const intervalId = setInterval(() => {
        void loadCompletedBookingProgress();
      }, COMPLETED_PROGRESS_REFRESH_MS);

      return () => {
        clearInterval(intervalId);
      };
    }, [loadCompletedBookingProgress]),
  );

  const bonusCycleProgress = React.useMemo(() => {
    if (completedBookings <= 0) {
      return 0;
    }

    const remainder = completedBookings % BONUS_BOOKINGS_TARGET;
    return remainder === 0 ? BONUS_BOOKINGS_TARGET : remainder;
  }, [completedBookings]);

  const bonusProgressRatio = Math.min(bonusCycleProgress / BONUS_BOOKINGS_TARGET, 1);
  const bonusProgressMessage = getBonusProgressMessage(BONUS_BOOKINGS_TARGET);

  React.useEffect(() => {
    if (allCarouselSlides.length <= 1) {
      return;
    }

    const intervalId = setInterval(() => {
      setCarouselIndex((prev) => {
        const next = (prev + 1) % allCarouselSlides.length;
        carouselRef.current?.scrollTo({ x: (next + 1) * carouselItemWidth, animated: true });
        return next;
      });
    }, 6000);

    return () => clearInterval(intervalId);
  }, [allCarouselSlides.length, carouselItemWidth]);

  const onViewPartyBookingDetails = (bookingId: string) => {
    navigation.navigate('Prenotazioni', {
      screen: 'BookingDetails',
      params: { bookingId },
      initial: false,
    });
  };

  const onCarouselLayout = (event: any) => {
    const nextWidth = Math.max(Math.round(event.nativeEvent.layout.width), 1);
    setCarouselItemWidth((prev) => (prev !== nextWidth ? nextWidth : prev));
  };

  const hasPendingInvites = pendingInvites.length > 0;

  const recentBookings = useMemo(
    () => myBookings
      .slice()
      .sort((a, b) => {
        const aCreatedAt = new Date(a.createdAt || a.startTime).getTime();
        const bCreatedAt = new Date(b.createdAt || b.startTime).getTime();
        return bCreatedAt - aCreatedAt;
      }),
    [myBookings],
  );

  const invitesSection = (
    <>
      <Text style={styles.sectionTitle}>Inviti ricevuti</Text>

      {invitesLoading ? <ActivityIndicator color="#2A7DE1" /> : null}

      {pendingInvites.length === 0 ? (
        <Text style={styles.empty}>Nessun invito in attesa.</Text>
      ) : (
        pendingInvites.slice(0, 3).map((invite) => {
          const booking = invite.booking;
          const fieldName = booking.field?.name || booking.fieldId;
          return (
            <View key={invite.inviteId} style={styles.inviteCard}>
              <Text style={styles.inviteTitle}>Sei stato invitato a: {fieldName}</Text>
              <Text style={styles.inviteMeta}>Inizio: {formatBookingDate(booking.startTime)} {formatBookingTime(booking.startTime)}</Text>
              <Text style={styles.inviteMeta}>Fine: {formatBookingDate(booking.endTime)} {formatBookingTime(booking.endTime)}</Text>
              <Text style={styles.inviteMeta}>Owner: {booking.owner?.name || booking.ownerId}</Text>

              <View style={styles.inviteActionsRow}>
                <TouchableOpacity
                  style={[styles.inviteActionButton, styles.inviteAcceptButton]}
                  onPress={() => handleInviteResponse(invite, 'accept')}
                >
                  <Text style={styles.inviteActionText}>Accetta</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inviteActionButton, styles.inviteRejectButton]}
                  onPress={() => handleInviteResponse(invite, 'reject')}
                >
                  <Text style={styles.inviteActionText}>Rifiuta</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </>
  );

  const bookingsSection = (
    <>
      <Text style={styles.sectionTitle}>Le tue prenotazioni</Text>

      {recentBookings.length === 0 ? (
        <Text style={styles.empty}>Non hai ancora prenotazioni attive.</Text>
      ) : (
        recentBookings.slice(0, 3).map((booking: Booking) => {
          const fieldName = booking.field?.name || 'Campo prenotato';
          const bookingTitleText = booking.ownerId === currentUser?.id
            ? `Hai prenotato: ${fieldName}`
            : `Ti sei unito a: ${fieldName}`;

          return (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingHeroCard}
              onPress={() => onViewPartyBookingDetails(booking.id)}
            >
              <Image
                source={getBookingBackgroundImage(booking)}
                style={[styles.bookingHeroImage, getBookingBackgroundFocusStyle(booking)]}
                resizeMode="cover"
              />
              <View style={styles.bookingHeroOverlay}>
                <Text style={styles.bookingTitle}>{bookingTitleText}</Text>
                <Text style={styles.bookingMeta}>
                  Partecipanti: {getParticipantCount(booking)}
                </Text>
                <Text style={styles.bookingMeta}>
                  Posti liberi: {getAvailableSpots(booking) ?? '-'}
                </Text>
                <Text style={styles.bookingMeta}>
                  Data: {formatBookingDate(booking.startTime)}
                </Text>
                <Text style={styles.bookingMeta}>
                  Orario: {formatBookingTime(booking.startTime)} - {formatBookingTime(booking.endTime)}
                </Text>

                <TouchableOpacity
                  style={styles.bookingDetailsButton}
                  onPress={() => onViewPartyBookingDetails(booking.id)}
                >
                  <Text style={styles.bookingDetailsButtonText}>Visualizza dettagli</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </>
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
        //il primo iindica il colore in alto, il secondo il colore in basso
          colors={['#11449b', '#0b295daf']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topBluePanel}
        >
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>Ciao, {currentUser?.name || 'Giocatore'}!</Text>
            <Text style={styles.heroSubtitle}>Scendi in campo e fai del tuo meglio!</Text>
          </View>

          <View style={styles.bonusProgressCard}>
            <View style={styles.bonusProgressRow}>
              <View style={styles.bonusProgressTrack}>
                <View style={[styles.bonusProgressFill, { width: `${bonusProgressRatio * 100}%` }]} />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="clip"
                  adjustsFontSizeToFit
                  minimumFontScale={0.55}
                  style={styles.bonusProgressTrackText}
                >
                  {bonusProgressMessage}
                </Text>
                <View
                  pointerEvents="none"
                  style={[styles.bonusProgressFillTextMask, { width: `${bonusProgressRatio * 110}%` }]}
                >
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="clip"
                    adjustsFontSizeToFit
                    minimumFontScale={0.55}
                    style={styles.bonusProgressTrackTextOnFill}
                  >
                    {bonusProgressMessage}
                  </Text>
                </View>
              </View>
              <Text style={styles.bonusProgressValue}>{bonusCycleProgress}/{BONUS_BOOKINGS_TARGET}</Text>
            </View>
            {progressLoading ? <ActivityIndicator style={styles.bonusProgressLoader} color="#1E5FAF" /> : null}
          </View>


          <View style={styles.mainCarouselCard} onLayout={onCarouselLayout}>
            <ScrollView
              ref={carouselRef}
              horizontal
              pagingEnabled
              bounces={false}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={20}
              snapToInterval={carouselItemWidth}
              snapToAlignment="start"
              disableIntervalMomentum
              onMomentumScrollEnd={(event: any) => {
                const x = event.nativeEvent.contentOffset.x;
                if (allCarouselSlides.length <= 1) {
                  setCarouselIndex(0);
                  return;
                }

                const loopedIndex = Math.round(x / carouselItemWidth);

                if (loopedIndex <= 0) {
                  carouselRef.current?.scrollTo({ x: allCarouselSlides.length * carouselItemWidth, animated: false });
                  setCarouselIndex(allCarouselSlides.length - 1);
                  return;
                }

                if (loopedIndex >= allCarouselSlides.length + 1) {
                  carouselRef.current?.scrollTo({ x: carouselItemWidth, animated: false });
                  setCarouselIndex(0);
                  return;
                }

                setCarouselIndex(loopedIndex - 1);
              }}
            >
              {loopedSlides.map((slide, index) => (
                <TouchableOpacity
                  key={`${slide.id}-${index}`}
                  style={[styles.carouselSlide, { width: carouselItemWidth }]}
                  onPress={slide.onPress}
                  activeOpacity={0.8}
                >
                  <Image source={slide.image} resizeMode={slide.imageResizeMode} style={[styles.carouselImage, slide.imageFocusStyle]} />
                  <LinearGradient
                    colors={['transparent', 'rgba(2,14,28,0.55)', 'rgba(2,14,28,0.90)']}
                    locations={[0.2, 0.6, 1]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.carouselTextWrap}>
                    <Text style={styles.carouselLabel}>{slide.label}</Text>
                    <Text style={styles.carouselTitle}>{slide.title}</Text>
                    <Text style={styles.carouselSubtitle}>{slide.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {allCarouselSlides.length > 1 ? (
              <View style={styles.carouselDotsRow}>
                {allCarouselSlides.map((slide, index) => (
                  <View
                    key={slide.id}
                    style={[styles.carouselDot, index === carouselIndex && styles.carouselDotActive]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </LinearGradient>

        
        <View style={styles.bookingsSectionCard}>
          {hasPendingInvites ? (
            <>
              {invitesSection}
              {bookingsSection}
            </>
          ) : (
            <>
              {bookingsSection}
              {invitesSection}
            </>
          )}

          <TouchableOpacity style={styles.bookFieldButton} onPress={() => navigation.navigate('Prenotazioni')}>
            <Text style={styles.bookFieldButtonText}>Prenota un campo</Text>
          </TouchableOpacity>
        </View>
       
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
                {hasOpenParties ? 'PARTITE APERTE' : 'NESSUNA PARTITA APERTA'}
              </Text>
              
              <Text style={[styles.urgencyTitle, !hasOpenParties && styles.urgencyTitleCalm]}>
                {hasOpenParties ? `${openParties.length} partite con posti disponibili` : 'Al momento non ci sono partite a cui unirsi'}
              </Text>
              <Text style={[styles.urgencyText, !hasOpenParties && styles.urgencyTextCalm]}>
                {hasOpenParties
                  ? (urgentOpenParties.length > 0
                    ? `${urgentOpenParties.length} partite sono quasi piene: entra ora.`
                    : 'Ci sono ancora posti liberi: controlla e unisciti quando vuoi.')
                  : 'Aspetta che altri utenti creino partite a cui unirsi'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.urgencyActionButton, !hasOpenParties && styles.urgencyActionButtonCalm]}
              onPress={() => navigation.navigate('Prenotazioni', { screen: 'OpenBookings' })}
            >
              <Text style={styles.urgencyActionText}>
                {hasOpenParties ? 'Unisciti' : 'Unisciti'}
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
    paddingBottom: 30,
  },
  topBluePanel: {
    backgroundColor: '#11449b',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    marginBottom: 10,
  },
  heroTextBlock: {
    marginTop: 4,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  heroSubtitle: {
    marginTop: 4,
    color: '#ffffff',
    fontSize: 15,
  },
  bonusProgressCard: {
    marginTop: 10,
    marginBottom: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#11449b',
    backgroundColor: '#ffffff62',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bonusProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  bonusProgressValue: {
    color: '#11449b',
    fontSize: 12,
    fontWeight: '800',
  },
  bonusProgressTrack: {
    flex: 1,
    minHeight: 24,
    borderRadius: 999,
    backgroundColor: '#E6EEF8',
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  bonusProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    height: '100%',
    backgroundColor: '#11449b',
  },
  bonusProgressTrackText: {
    color: '#1E5FAF',
    fontSize: 11,
    fontWeight: '700',
  },
  bonusProgressFillTextMask: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 10,
  },
  bonusProgressTrackTextOnFill: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bonusProgressLoader: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  mainCarouselCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: '#D9E5F2',
    backgroundColor: '#0E2C4A',
    marginTop: 10,
  },
  carouselSlide: {
    height: 220,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    paddingBottom: 0,
  },
  carouselImage: {
    ...StyleSheet.absoluteFillObject,
  },
  carouselVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  carouselBottomShadeTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 100,
    height: 90,
    backgroundColor: 'rgba(2, 14, 28, 0.16)',
  },
  carouselBottomShadeMid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 58,
    height: 92,
    backgroundColor: 'rgba(2, 14, 28, 0.36)',
  },
  carouselBottomShadeStrong: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 118,
    backgroundColor: 'rgba(2, 14, 28, 0.62)',
  },
  carouselTextWrap: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 25,
  },
  carouselLabel: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    color: '#1E5FAF',
    fontSize: 10,
    fontWeight: '800',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  carouselTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 5, height: 5 },
    textShadowRadius: 30,
  },
  carouselSubtitle: {
    marginTop: 4,
    color: '#E7F1FF',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 5, height: 5 },
    textShadowRadius: 30,
  },
  carouselDotsRow: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 15,
    flexDirection: 'row',
    gap: 6,
  },
  carouselDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.50)',
  },
  carouselDotActive: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
  urgencyCard: {
    borderRadius: 12,
    borderWidth: 1,
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
    backgroundColor: 'rgba(11, 59, 8, 0.63)',
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
    backgroundColor: '#1E5FAF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  urgencyActionButtonCalm: {
    backgroundColor: '#1E5FAF',
  },
  urgencyActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#1E5FAF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 10,
  },
  bookingsSectionCard: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#D7E2EC',
    borderRadius: 12,
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  bookingHeroCard: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 170,
    marginBottom: 15,
  },
  bookingHeroImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  bookingHeroOverlay: {
    backgroundColor: 'rgba(10, 37, 68, 0.58)',
    padding: 12,
    minHeight: 170,
    justifyContent: 'center',
  },
  bookingTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    color: '#1E5FAF',
    fontSize: 10,
    fontWeight: '800',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  bookingTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 13,
  },
  bookingMeta: {
    marginTop: 3,
    color: '#EAF3FF',
    fontSize: 12,
  },
  bookingDetailsButton: {
    marginTop: 15,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bookingDetailsButtonText: {
    color: '#1E5FAF',
    fontSize: 12,
    fontWeight: '700',
  },
  inviteCard: {
    borderWidth: 1,
    borderColor: '#D7E2EC',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8FBFF',
    marginBottom: 10,
  },
  inviteTitle: {
    color: '#1E5FAF',
    fontSize: 16,
    fontWeight: '700',
  },
  inviteMeta: {
    marginTop: 3,
    color: '#5C6F82',
    fontSize: 13,
  },
  inviteActionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  inviteActionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  inviteAcceptButton: {
    backgroundColor: '#188038',
  },
  inviteRejectButton: {
    backgroundColor: '#B3261E',
  },
  inviteActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  empty: {
    textAlign: 'left',
    color: '#29649f',
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
  bookFieldButton: {
    marginTop: 6,
    marginBottom: 10,
    backgroundColor: '#1E5FAF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E5FAF',

  },
  bookFieldButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  onBookFieldButton: {
    marginTop: 6,
    marginBottom: 14,
    backgroundColor: '#1E5FAF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E5FAF',
  },
  onBookFieldButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },  
});
