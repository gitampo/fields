import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Party } from '../types';

type Props = {
  party: Party;
  onJoin: (id: string) => void;
};

export const PartyCard = ({ party, onJoin }: Props) => {
  const joined = party.joinedCount ?? 1 + (party.members?.length || 0);
  const remaining = party.remainingSlots ?? Math.max(party.maxPlayers - joined, 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{party.title}</Text>
      <Text style={styles.meta}>Visibilita: {party.isPublic ? 'Pubblico' : 'Privato'}</Text>
      <Text style={styles.meta}>Partecipanti: {joined}/{party.maxPlayers}</Text>
      <Text style={styles.meta}>Posti liberi: {remaining}</Text>
      <Text style={styles.meta}>Owner: {party.owner?.name || party.ownerId}</Text>

      <TouchableOpacity
        style={[styles.joinButton, remaining === 0 && styles.joinButtonDisabled]}
        disabled={remaining === 0}
        onPress={() => onJoin(party.id)}
      >
        <Text style={styles.joinButtonText}>{remaining === 0 ? 'Party pieno' : 'Unisciti'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#E3EAF0',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    backgroundColor: '#F8FBFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1F33',
  },
  meta: {
    marginTop: 2,
    color: '#5C6F82',
    fontSize: 13,
  },
  joinButton: {
    marginTop: 10,
    backgroundColor: '#0A84FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  joinButtonDisabled: {
    backgroundColor: '#A5B4C2',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
