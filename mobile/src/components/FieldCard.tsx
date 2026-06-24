import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Field } from '../types';

type Props = {
  field: Field;
  isSelected: boolean;
  onPress: (id: string) => void;
};

export const FieldCard = ({ field, isSelected, onPress }: Props) => (
  <TouchableOpacity
    style={[styles.fieldCard, isSelected && styles.fieldCardSelected]}
    onPress={() => onPress(field.id)}
  >
    <Text style={styles.fieldName}>{field.name}</Text>
    <Text style={styles.fieldMeta}>{field.sport} • {field.location || 'Posizione non disponibile'}</Text>
    <Text style={styles.fieldMeta}>Capienza: {field.capacity} • €/h: {field.pricePerHour}</Text>
    {isSelected ? <Text style={styles.selectedLabel}>Selezionato</Text> : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fieldCard: {
    borderWidth: 1,
    borderColor: '#E3EAF0',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    backgroundColor: '#FBFDFF',
  },
  fieldCardSelected: {
    borderColor: '#0A84FF',
    backgroundColor: '#EAF4FF',
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B1F33',
  },
  fieldMeta: {
    marginTop: 2,
    color: '#5C6F82',
    fontSize: 13,
  },
  selectedLabel: {
    marginTop: 6,
    color: '#0A84FF',
    fontSize: 12,
    fontWeight: '600',
  },
});
