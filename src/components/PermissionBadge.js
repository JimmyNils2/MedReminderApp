import { StyleSheet, Text } from 'react-native';
import { PermissionStatus } from '../services/permissions';

// Indicador del estado de un permiso: concedido / denegado / pendiente
const VARIANTS = {
  [PermissionStatus.GRANTED]: { text: 'concedido', icon: '✓', color: '#1E7B34', background: '#E6F4EA' },
  [PermissionStatus.DENIED]: { text: 'denegado', icon: '✕', color: '#B42318', background: '#FDECEC' },
  [PermissionStatus.PENDING]: { text: 'pendiente', icon: '•', color: '#8A5A00', background: '#FFF4D6' },
};

export default function PermissionBadge({ label, status }) {
  const variant = VARIANTS[status];
  if (!variant) return null; // todavía no se consultó
  return (
    <Text
      style={[styles.badge, { color: variant.color, backgroundColor: variant.background }]}
      accessibilityLabel={`Permiso de ${label}: ${variant.text}`}
    >
      {variant.icon} {label}: {variant.text}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
