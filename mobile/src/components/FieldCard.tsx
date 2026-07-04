import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Field } from '../types';

type Props = {
  field: Field;
  isSelected: boolean;
  onPress: (id: string) => void;
};

const padelImage = require('../assets/fields/padel.avif');
const tennisImage = require('../assets/fields/tennis.avif');
const calcettoImage = require('../assets/fields/calcetto.avif');
const bocceImage = require('../assets/fields/bocce.jpg');

const getFieldImageUrl = (field: Field) => {
  const key = field.sport?.toLowerCase() || '';

  if (key.includes('basket')) {
    return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80';
  }

  return 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80';
};

const getFieldImageBackgroundSource = (field: Field) => {
  const key = field.sport?.toLowerCase() || '';
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

  return { uri: getFieldImageUrl(field) };
};

const getFieldImageFocusStyle = (field: Field) => {
  const key = field.sport?.toLowerCase() || '';

  if (key.includes('bocce')) {
    // Valori regolabili: X negativo mostra piu parte destra dell'immagine.
    return { transform: [{ scale: 1.22 }, { translateX: -36 }, { translateY: -380 }] };
  }

  if (key.includes('calcetto') || key.includes('calcio')) {
    return { transform: [{ scale: 1.1 }, { translateX: -8 }] };
  }

  if (key.includes('sportmanship')) {
    return { transform: [{ scale: 1.00 }, { translateX: 0 }] };
  }

  return { transform: [{ scale: 1.06 }, { translateX: 0 }] };
};

export const FieldCard = ({ field, isSelected, onPress }: Props) => (
  <TouchableOpacity
    style={[styles.fieldCard, isSelected && styles.fieldCardSelected]}
    onPress={() => onPress(field.id)}
  >
    <Image
      source={getFieldImageBackgroundSource(field)}
      resizeMode="cover"
      style={[styles.imageBackground, getFieldImageFocusStyle(field)]}
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
    transform: [
      { scale: 1.00 },     // zoom
      { translateX: -300 }, // sinistra/destra (negativo = mostra più a destra)
      { translateY: -10 }, // su/giu (negativo = mostra più in basso)
    ],
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
