import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Party } from '../types';
import { getFieldImageFocusStyle, getFieldImageSource } from '../lib/fieldImages';

type Props = {
  party: Party;
  canDelete?: boolean;
  canJoin?: boolean;
  backgroundImageSource?: ImageSourcePropType;
  onDelete?: (id: string) => void;
  onViewDetails?: (bookingId: string) => void;
  onJoin: (id: string) => void;
};

export const PartyCard = ({
  party,
  canDelete = false,
  canJoin = true,
  backgroundImageSource,
  onDelete,
  onViewDetails,
  onJoin,
}: Props) => {
  const joined = party.joinedCount ?? 1 + (party.members?.length || 0);
  const remaining = party.remainingSlots ?? Math.max(party.maxPlayers - joined, 0);
  const partyImageKey = `${party.title || ''}`;
  const imageSource = backgroundImageSource ?? getFieldImageSource(partyImageKey);

  return (
    <View style={styles.card}>
      <Image source={imageSource} resizeMode="cover" style={[styles.imageBackground, getFieldImageFocusStyle(partyImageKey)]} />
      <View style={styles.overlay}>
        <Text style={styles.title}>{party.title}</Text>
        <Text style={styles.meta}>Partecipanti: {joined}/{party.maxPlayers}</Text>
        <Text style={styles.meta}>Posti liberi: {remaining}</Text>
        <Text style={styles.meta}>Owner: {party.owner?.name || party.ownerId}</Text>

        {canJoin ? (
          <TouchableOpacity
            style={[styles.actionButton, remaining === 0 && styles.actionButtonDisabled]}
            disabled={remaining === 0}
            onPress={() => onJoin(party.id)}
          >
            <Text style={styles.actionButtonText}>{remaining === 0 ? 'Party pieno' : 'Unisciti'}</Text>
          </TouchableOpacity>
        ) : null}


        {party.bookingId && onViewDetails ? (
          <TouchableOpacity style={[styles.actionButton, styles.detailsButton]} onPress={() => onViewDetails(party.bookingId as string)}>
            <Text style={styles.actionButtonText}>Visualizza dettagli</Text>
          </TouchableOpacity>
        ) : null}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D9E5F2',
    backgroundColor: '#1E5FAF',
  },
  imageBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    minHeight: 154,
    backgroundColor: 'rgba(11, 31, 51, 0.56)',
    padding: 11,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 7,
  },
  meta: {
    marginTop: 3,
    color: '#E6F0FB',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionButton: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  actionButtonDisabled: {
    backgroundColor: '#D3D9E1',
  },
  actionButtonText: {
    color: '#1E5FAF',
    fontWeight: '700',
    fontSize: 12,
  },
  deleteButton: {
    marginTop: 8,
    backgroundColor: '#D93025',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  detailsButton: {
    marginTop: 8,
  },
});
