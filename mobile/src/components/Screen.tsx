import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Sovrascrive o estende lo stile del contenitore */
  style?: StyleProp<ViewStyle>;
}

/**
 * Wrapper condiviso per tutte le schermate.
 * Applica SafeAreaView + padding + background di default dal tema.
 * Personalizza padding/background modificando theme.ts — si propaga ovunque.
 */
export default function Screen({ children, style }: ScreenProps) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 0,
  },
});