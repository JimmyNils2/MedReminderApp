import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

// Contenedor para pantallas con formulario: evita que el teclado tape los campos.
// contentStyle: estilos extra para el contenido (ej. distribuir bloques en el Login)
// hasHeader: si la pantalla tiene header, el teclado tiene que compensar su altura
export default function ScreenContainer({ children, contentStyle, hasHeader = true }) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' && hasHeader ? 100 : 0}
    >
      <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing.lg },
});
