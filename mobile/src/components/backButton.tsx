import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface BackButtonProps {
  title?: string;
  onPress?: () => void;
}

export default function BackButton({
  title = 'Indietro',
  onPress,
}: BackButtonProps) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.backButton}
      onPress={onPress || (() => navigation.goBack())}
    >
      <Text style={styles.backText}>← {title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EAF3FF',
    borderRadius: 8,
  },
  backText: {
    color: '#2A7DE1',
    fontSize: 15,
    fontWeight: '600',
  },
});