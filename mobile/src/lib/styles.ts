import { StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

export const sharedStyles = StyleSheet.create({
  // ─── Form ────────────────────────────────────────────────────────────────
  input: {
    borderWidth: 1,
    borderColor:      theme.colors.border,
    borderRadius:     theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm + 4,   // 12
    paddingVertical:   theme.spacing.sm + 2,   // 10
    marginBottom:      theme.spacing.sm + 2,
    backgroundColor:  theme.colors.surface,
    fontSize:         theme.fontSize.md,
    color:            theme.colors.text,
  },

  // ─── Pulsanti ────────────────────────────────────────────────────────────
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius:    theme.borderRadius.md,
    paddingVertical: theme.spacing.sm + 4,     // 12
    alignItems:      'center',
    marginBottom:    theme.spacing.sm + 2,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.secondary,
    borderRadius:    theme.borderRadius.md,
    paddingVertical: theme.spacing.sm + 4,
    alignItems:      'center',
    marginBottom:    theme.spacing.sm + 2,
  },
  buttonText: {
    color:      theme.colors.surface,
    fontWeight: theme.fontWeight.semibold,
    fontSize:   theme.fontSize.md,
  },

  // ─── Feedback ────────────────────────────────────────────────────────────
  errorText: {
    color:        theme.colors.error,
    marginTop:    -4,
    marginBottom: theme.spacing.sm,
    fontSize:     theme.fontSize.xs,
  },
  successText: {
    color:        theme.colors.success,
    marginTop:    -4,
    marginBottom: theme.spacing.sm,
    fontSize:     theme.fontSize.xs,
  },
});
