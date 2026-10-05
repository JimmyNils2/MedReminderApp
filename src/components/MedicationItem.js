import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../theme';

// Ítem reutilizable de la lista de medicaciones
export default function MedicationItem({ name, time, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.timeBadge}>
        <Text style={styles.timeText}>{time}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.subtitle}>Todos los días</Text>
      </View>
      <TouchableOpacity
        onPress={onDelete}
        style={styles.deleteButton}
        accessibilityRole="button"
        accessibilityLabel={`Eliminar ${name}`}
      >
        <Text style={styles.deleteText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  timeBadge: {
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: spacing.md,
  },
  timeText: { color: colors.primaryDark, fontWeight: '700', fontSize: 16 },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  deleteButton: { paddingVertical: 6, paddingHorizontal: 8 },
  deleteText: { color: colors.danger, fontWeight: '600' },
});
