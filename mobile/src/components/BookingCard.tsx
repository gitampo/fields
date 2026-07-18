import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Booking } from '../types';

type Props = {
  booking: Booking;
  currentUserId?: string;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
};

export const BookingCard = ({ booking, currentUserId, canDelete = false, onDelete }: Props) => {
  const isJoinedEntry = booking.bookingRole
    ? booking.bookingRole === 'participant'
    : Boolean(currentUserId && booking.ownerId !== currentUserId);
  const fieldName = booking.field?.name || booking.fieldId;
  const title = isJoinedEntry ? `Ti sei unito a: ${fieldName}` : `Hai prenotato: ${fieldName}`;

  return (
  <View style={styles.bookingCard}>
    <Text style={styles.fieldName}>{title}</Text>
    <Text style={styles.fieldMeta}>{booking.startTime} → {booking.endTime}</Text>
    <Text style={styles.fieldMeta}>Stato: {booking.status}</Text>
    <Text style={styles.fieldMeta}>Owner: {booking.owner?.name || booking.ownerId}</Text>
    <Text style={styles.fieldMeta}>
      Invitati: {booking.participants?.map((p) => p.user?.name || p.userId).join(', ') || 'nessuno'}
    </Text>
    {canDelete ? (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete?.(booking.id)}
      >
        <Text style={styles.deleteButtonText}>Elimina prenotazione</Text>
      </TouchableOpacity>
    ) : null}
  </View>
  );
};

const styles = StyleSheet.create({
  bookingCard: {
    borderWidth: 1,
    borderColor: '#E3EAF0',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    backgroundColor: '#F8FBFF',
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E5FAF',
  },
  fieldMeta: {
    marginTop: 2,
    color: '#5C6F82',
    fontSize: 13,
  },
  deleteButton: {
    marginTop: 10,
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
});
