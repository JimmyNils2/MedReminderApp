import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../theme';

// Botón reutilizable de la app (variantes: primary, danger)
export default function PrimaryButton({ title, onPress, variant = 'primary', disabled = false }) {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.5 },
  text: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
