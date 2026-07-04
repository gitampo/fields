import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import { useAuthContext } from '../context/AuthContext';
import { API_URL, getApiErrorMessage } from '../lib/api';
import { sharedStyles } from '../lib/styles';
import { ApiErrorBody, UserProfile } from '../types';

const formatDate = (isoDate: string) => {
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

type PlayerRole = 'Portiere' | 'Difensore' | 'Centrocampista' | 'Attaccante' | 'Doppista' | 'Singolarista' | 'Universale';

type PlayerInfo = {
  sport: string;
  dominantSide: string;
  role: PlayerRole | 'N/A';
  level: string;
  city: string;
  availability: string;
};

type BadgeDefinition = {
  id: string;
  title: string;
  requirement: string;
};

const BADGES: BadgeDefinition[] = [
  { id: 'starter', title: 'Primo Passo', requirement: 'Completa il profilo giocatore.' },
  { id: 'team', title: 'Spirito di Squadra', requirement: 'Imposta il tuo sport e il ruolo.' },
  { id: 'point100', title: 'Centurione', requirement: 'Raggiungi almeno 100 punti.' },
  { id: 'point250', title: 'MVP Locale', requirement: 'Raggiungi almeno 250 punti.' },
  { id: 'weekend', title: 'Weekend Warrior', requirement: 'Indica disponibilita nel weekend.' },
];

const FOOT_SPORTS = ['calcetto'];

const ROLES_BY_SPORT: Record<string, PlayerRole[]> = {
  calcetto: ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'],
  tennis: ['Singolarista', 'Doppista', 'Universale'],
  padel: ['Doppista', 'Universale'],
};

const SPORTS = ['Calcetto', 'Padel', 'Tennis', 'Bocce'];
const LEVELS = ['Principiante', 'Intermedio', 'Avanzato', 'Competitivo'];
const AVAILABILITY = ['Mattina', 'Pomeriggio', 'Sera', 'Weekend', 'Flessibile'];

const getRolesForSport = (sport: string): PlayerRole[] => {
  return ROLES_BY_SPORT[sport.toLowerCase()] || [];
};

const getSideLabelForSport = (sport: string) => {
  if (FOOT_SPORTS.includes(sport.toLowerCase())) {
    return 'Piede preferito';
  }

  return 'Mano preferita';
};

const getSideOptionsForSport = (sport: string) => {
  if (FOOT_SPORTS.includes(sport.toLowerCase())) {
    return ['Destro', 'Sinistro', 'Entrambi'];
  }

  return ['Destra', 'Sinistra', 'Entrambe'];
};

const getEarnedBadges = (profile: UserProfile | null, playerInfo: PlayerInfo | null) => {
  const earned: string[] = [];
  const points = profile?.points ?? 0;

  if (playerInfo) {
    earned.push('starter');
    if (playerInfo.sport && playerInfo.role !== 'N/A') {
      earned.push('team');
    }
    if (playerInfo.availability.toLowerCase().includes('weekend')) {
      earned.push('weekend');
    }
  }
  if (points >= 100) {
    earned.push('point100');
  }
  if (points >= 250) {
    earned.push('point250');
  }

  return earned;
};

const getBadgeLogo = (badgeId: string) => {
  switch (badgeId) {
    case 'starter':
      return 'SP';
    case 'team':
      return 'TS';
    case 'point100':
      return '100';
    case 'point250':
      return '250';
    case 'weekend':
      return 'WE';
    default:
      return 'BD';
  }
};

export default function MyProfileScreen() {
  const { token, logout } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [isPersonalDataModalVisible, setPersonalDataModalVisible] = useState(false);
  const [isPlayerInfoModalVisible, setPlayerInfoModalVisible] = useState(false);
  const [isBadgeModalVisible, setBadgeModalVisible] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [draftSport, setDraftSport] = useState('');
  const [draftDominantSide, setDraftDominantSide] = useState('');
  const [draftRole, setDraftRole] = useState<PlayerRole | 'N/A'>('N/A');
  const [draftLevel, setDraftLevel] = useState('Intermedio');
  const [draftCity, setDraftCity] = useState('Milano');
  const [draftAvailability, setDraftAvailability] = useState('Sera');

  const loadProfile = useCallback(async () => {
    if (!token) {
      setProfile(null);
      setError('Sessione non valida, effettua di nuovo il login');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(getApiErrorMessage(response.status, (data as ApiErrorBody) || {}));
      }

      setProfile(data as UserProfile);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Errore inatteso');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Vuoi uscire dal tuo account?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Esci',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  }, [logout]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Elimina account',
      'Questa azione e irreversibile. Vuoi continuare?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            const runDelete = async () => {
              setDeleteLoading(true);
              setError('');

              try {
                const response = await fetch(`${API_URL}/auth/me`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                });

                let data: unknown = null;
                try {
                  data = await response.json();
                } catch {
                  data = null;
                }

                if (!response.ok) {
                  throw new Error(getApiErrorMessage(response.status, (data as ApiErrorBody) || {}));
                }

                Alert.alert('Account eliminato', 'Il tuo account e stato eliminato con successo.');
                await logout();
              } catch (nextError) {
                setError(nextError instanceof Error ? nextError.message : 'Errore inatteso');
              } finally {
                setDeleteLoading(false);
              }
            };

            void runDelete();
          },
        },
      ],
    );
  }, [logout, token]);

  const earnedBadges = getEarnedBadges(profile, playerInfo);

  const openPlayerInfoModal = useCallback(() => {
    setWizardStep(1);
    setDraftSport(playerInfo?.sport || '');
    setDraftDominantSide(playerInfo?.dominantSide || '');
    setDraftRole(playerInfo?.role || 'N/A');
    setDraftLevel(playerInfo?.level || 'Intermedio');
    setDraftCity(playerInfo?.city || 'Milano');
    setDraftAvailability(playerInfo?.availability || 'Sera');
    setPlayerInfoModalVisible(true);
  }, [playerInfo]);

  const handleSelectSport = useCallback((sport: string) => {
    setDraftSport(sport);
    setDraftDominantSide('');
    const sportRoles = getRolesForSport(sport);
    setDraftRole(sportRoles.length > 0 ? sportRoles[0] : 'N/A');
    setWizardStep(2);
  }, []);

  const handleSelectDominantSide = useCallback((side: string) => {
    setDraftDominantSide(side);
    const sportRoles = getRolesForSport(draftSport);
    if (sportRoles.length > 0) {
      setWizardStep(3);
      return;
    }
    setWizardStep(4);
  }, [draftSport]);

  const handleSavePlayerInfo = useCallback(() => {
    if (!draftSport || !draftDominantSide) {
      Alert.alert('Compila i dati', 'Seleziona sport e lato preferito per continuare.');
      return;
    }

    setPlayerInfo({
      sport: draftSport,
      dominantSide: draftDominantSide,
      role: draftRole,
      level: draftLevel,
      city: draftCity,
      availability: draftAvailability,
    });

    setPlayerInfoModalVisible(false);
    Alert.alert('Profilo giocatore aggiornato', 'Le informazioni giocatore sono state salvate.');
  }, [draftAvailability, draftCity, draftDominantSide, draftLevel, draftRole, draftSport]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Il mio profilo</Text>
          <Text style={styles.subtitle}>Gestisci informazioni, stile di gioco e obiettivi</Text>
        

        {loading ? <ActivityIndicator style={styles.loader} color="#2A7DE1" /> : null}
        {error ? <Text style={sharedStyles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.panelCard} onPress={() => setPersonalDataModalVisible(true)}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Dati personali</Text>
            
          </View>
          <Text style={styles.panelSubtitle}>
              <Text>Nome, email, username, punti e data iscrizione</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.panelCard} onPress={openPlayerInfoModal}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Informazioni giocatore</Text>
            
          </View>
          <Text style={styles.panelSubtitle}>
            {playerInfo
              ? `${playerInfo.sport} • ${getSideLabelForSport(playerInfo.sport)}: ${playerInfo.dominantSide}`
              : 'Imposta sport, mano/piede, ruolo e altre preferenze'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.panelCard} onPress={() => setBadgeModalVisible(true)}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Badge</Text>
            
          </View>
          <Text style={styles.panelSubtitle}>
            {earnedBadges.length > 0
              ? `${earnedBadges.length} badge ottenuti finora`
              : 'Nessun badge ottenuto: scopri i requisiti'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={sharedStyles.button} onPress={handleLogout} disabled={loading || deleteLoading}>
          <Text style={sharedStyles.buttonText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, deleteLoading && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={deleteLoading || loading}
        >
          {deleteLoading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.deleteButtonText}>Elimina account</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      {isPlayerInfoModalVisible ? (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Informazioni giocatore</Text>
            <Text style={styles.modalStep}>Step {wizardStep} di 4</Text>

            {wizardStep === 1 ? (
              <View>
                <Text style={styles.modalQuestion}>Scegli il tuo sport</Text>
                <View style={styles.optionGrid}>
                  {SPORTS.map((sport) => (
                    <TouchableOpacity key={sport} style={styles.optionButton} onPress={() => handleSelectSport(sport)}>
                      <Text style={styles.optionText}>{sport}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {wizardStep === 2 ? (
              <View>
                <Text style={styles.modalQuestion}>{getSideLabelForSport(draftSport)}</Text>
                <View style={styles.optionGrid}>
                  {getSideOptionsForSport(draftSport).map((side) => (
                    <TouchableOpacity key={side} style={styles.optionButton} onPress={() => handleSelectDominantSide(side)}>
                      <Text style={styles.optionText}>{side}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {wizardStep === 3 ? (
              <View>
                <Text style={styles.modalQuestion}>Scegli il ruolo</Text>
                <View style={styles.optionGrid}>
                  {getRolesForSport(draftSport).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.optionButton, draftRole === role && styles.optionButtonSelected]}
                      onPress={() => {
                        setDraftRole(role);
                        setWizardStep(4);
                      }}
                    >
                      <Text style={[styles.optionText, draftRole === role && styles.optionTextSelected]}>{role}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {wizardStep === 4 ? (
              <View>
                <Text style={styles.modalQuestion}>Altre informazioni utili</Text>

                <Text style={styles.inlineLabel}>Livello</Text>
                <View style={styles.optionGrid}>
                  {LEVELS.map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[styles.optionButton, draftLevel === level && styles.optionButtonSelected]}
                      onPress={() => setDraftLevel(level)}
                    >
                      <Text style={[styles.optionText, draftLevel === level && styles.optionTextSelected]}>{level}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inlineLabel}>Disponibilita principale</Text>
                <View style={styles.optionGrid}>
                  {AVAILABILITY.map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.optionButton, draftAvailability === slot && styles.optionButtonSelected]}
                      onPress={() => setDraftAvailability(slot)}
                    >
                      <Text style={[styles.optionText, draftAvailability === slot && styles.optionTextSelected]}>{slot}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inlineLabel}>Citta</Text>
                <View style={styles.optionGrid}>
                  {['Milano', 'Roma', 'Torino', 'Napoli', 'Bologna'].map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={[styles.optionButton, draftCity === city && styles.optionButtonSelected]}
                      onPress={() => setDraftCity(city)}
                    >
                      <Text style={[styles.optionText, draftCity === city && styles.optionTextSelected]}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => {
                  if (wizardStep === 1) {
                    setPlayerInfoModalVisible(false);
                  } else {
                    setWizardStep((prev) => prev - 1);
                  }
                }}
              >
                <Text style={styles.modalSecondaryButtonText}>{wizardStep === 1 ? 'Chiudi' : 'Indietro'}</Text>
              </TouchableOpacity>

              {wizardStep < 4 ? (
                <TouchableOpacity
                  style={[styles.modalPrimaryButton, (!draftSport || (wizardStep >= 2 && !draftDominantSide)) && styles.modalPrimaryButtonDisabled]}
                  disabled={!draftSport || (wizardStep >= 2 && !draftDominantSide)}
                  onPress={() => setWizardStep((prev) => prev + 1)}
                >
                  <Text style={styles.modalPrimaryButtonText}>Avanti</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.modalPrimaryButton} onPress={handleSavePlayerInfo}>
                  <Text style={styles.modalPrimaryButtonText}>Salva</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      ) : null}

      {isPersonalDataModalVisible ? (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Dati personali</Text>
            <Text style={styles.modalStep}>Informazioni account aggiornate</Text>

            <View style={styles.infoCard}>
              <InfoRow label="Nome" value={profile?.name || '-'} />
              <InfoRow label="Email" value={profile?.email || '-'} />
              <InfoRow label="Username" value={profile?.username || '-'} />
              <InfoRow label="Punti" value={typeof profile?.points === 'number' ? String(profile.points) : '-'} />
              <InfoRow label="Iscritto dal" value={profile?.createdAt ? formatDate(profile.createdAt) : '-'} />
            </View>

            <TouchableOpacity style={styles.modalPrimaryButtonStandalone} onPress={() => setPersonalDataModalVisible(false)}>
              <Text style={styles.modalPrimaryButtonText}>Chiudi</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {isBadgeModalVisible ? (
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.badgeModalCard]}>
            <Text style={styles.modalTitle}>Badge giocatore</Text>
            <Text style={styles.modalStep}>Obiettivi, loghi e riepilogo</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalQuestion}>Badge disponibili</Text>
              {BADGES.map((badge) => {
                const unlocked = earnedBadges.includes(badge.id);
                return (
                  <View key={badge.id} style={[styles.badgePreviewCard, unlocked && styles.badgePreviewCardUnlocked]}>
                    <View style={[styles.badgeLogo, unlocked && styles.badgeLogoUnlocked]}>
                      <Text style={styles.badgeLogoText}>{getBadgeLogo(badge.id)}</Text>
                    </View>
                    <View style={styles.badgeTextArea}>
                      <Text style={styles.badgeTitle}>{badge.title}</Text>
                      <Text style={styles.badgeRequirement}>Requisito: {badge.requirement}</Text>
                    </View>
                  </View>
                );
              })}

              <Text style={[styles.modalQuestion, styles.badgeSummaryTitle]}>Riepilogo tuoi badge</Text>
              {earnedBadges.length === 0 ? (
                <Text style={styles.badgeEmpty}>Ancora nessun badge sbloccato.</Text>
              ) : (
                BADGES.filter((badge) => earnedBadges.includes(badge.id)).map((badge) => (
                  <View key={`owned-${badge.id}`} style={styles.badgeSummaryRow}>
                    <Text style={styles.badgeSummaryBullet}>•</Text>
                    <Text style={styles.badgeSummaryText}>{badge.title}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.modalPrimaryButtonStandalone} onPress={() => setBadgeModalVisible(false)}>
              <Text style={styles.modalPrimaryButtonText}>Chiudi</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    marginTop: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E5FAF',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 30,
    color: '#5C6F82',
    fontSize: 16,
  },
  loader: {
    marginVertical: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E6EDF3',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E5FAF',
    marginBottom: 6,
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F8',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6E7F91',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1E5FAF',
    fontWeight: '600',
  },
  panelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2EAF2',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    color: '#1E5FAF',
    fontSize: 17,
    fontWeight: '700',
  },
  panelAction: {
    color: '#1E5FAF',
    fontWeight: '700',
    fontSize: 13,
  },
  panelSubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: '#4E6480',
    lineHeight: 18,
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: '#C62828',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 18,
    zIndex: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    maxHeight: '90%',
  },
  badgeModalCard: {
    maxHeight: '88%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E5FAF',
  },
  modalStep: {
    marginTop: 4,
    fontSize: 12,
    color: '#6E7F91',
    marginBottom: 12,
  },
  modalQuestion: {
    color: '#1E5FAF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 2,
  },
  inlineLabel: {
    marginTop: 10,
    marginBottom: 6,
    color: '#516173',
    fontSize: 12,
    fontWeight: '600',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#F3F8FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D3E3F7',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#2e4f7d',
    borderColor: '#2e4f7d',
  },
  optionText: {
    color: '#1E5FAF',
    fontSize: 12,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  modalActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalSecondaryButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E5FAF',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  modalSecondaryButtonText: {
    color: '#1E5FAF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalPrimaryButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#1E5FAF',
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  modalPrimaryButtonStandalone: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#1E5FAF',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 48,
  },
  modalPrimaryButtonDisabled: {
    opacity: 0.5,
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  badgePreviewCard: {
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E8F2',
    backgroundColor: '#F8FBFF',
    padding: 10,
    flexDirection: 'row',
  },
  badgePreviewCardUnlocked: {
    borderColor: '#2E7D32',
    backgroundColor: '#EEF8EE',
  },
  badgeLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D5E5F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  badgeLogoUnlocked: {
    backgroundColor: '#F57C00',
  },
  badgeLogoText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  badgeTextArea: {
    flex: 1,
  },
  badgeTitle: {
    color: '#1E5FAF',
    fontSize: 15,
    fontWeight: '700',
  },
  badgeRequirement: {
    marginTop: 4,
    color: '#516173',
    fontSize: 12,
    lineHeight: 17,
  },
  badgeSummaryTitle: {
    marginTop: 10,
  },
  badgeEmpty: {
    color: '#516173',
    fontSize: 13,
    marginBottom: 14,
  },
  badgeSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeSummaryBullet: {
    marginRight: 6,
    color: '#4E6480',
    fontSize: 16,
  },
  badgeSummaryText: {
    color: '#1E5FAF',
    fontSize: 13,
    fontWeight: '600',
  },
});

