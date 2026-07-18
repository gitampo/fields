import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Field } from '../types';
import { getFieldImageFocusStyle, getFieldImageSource } from '../lib/fieldImages';

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
    <Image
      source={getFieldImageSource(`${field.sport || ''} ${field.name || ''}`)}
      resizeMode="cover"
      style={[styles.imageBackground, getFieldImageFocusStyle(`${field.sport || ''} ${field.name || ''}`)]}
    />
    <View style={styles.overlay}>
      <Text style={styles.fieldName}>{field.name}</Text>
      <Text style={styles.fieldMeta}>{field.sport} • Capienza: {field.capacity}</Text>
      <Text style={styles.fieldMeta}>€/h: {field.pricePerHour}</Text>
      {isSelected ? <Text style={styles.selectedLabel}>Selezionato</Text> : null}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fieldCard: {
    borderRadius: 14,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D9E5F2',
    backgroundColor: '#1E5FAF',
  },
  fieldCardSelected: {
    borderColor: '#2A7DE1',
  },
  imageBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    minHeight: 180,
    backgroundColor: 'rgba(11, 31, 51, 0.52)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'flex-end',
  },
  fieldName: {
    fontSize: 21,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fieldMeta: {
    marginTop: 3,
    color: '#E6F0FB',
    fontSize: 13,
    fontWeight: '600',
  },
  selectedLabel: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: '#2A7DE1',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
