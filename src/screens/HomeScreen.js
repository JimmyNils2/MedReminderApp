import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useLayoutEffect } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MedicationItem from '../components/MedicationItem';
import PrimaryButton from '../components/PrimaryButton';
import { useAuthStore } from '../store/authStore';
import { useMedicationStore } from '../store/medicationStore';
import { scheduleTestNotification } from '../services/notifications';
import { colors, spacing } from '../theme';

export default function HomeScreen({ navigation }) {
  // Estado global (Zustand): cada selector re-renderiza la Home solo cuando cambia ese dato
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const medications = useMedicationStore((state) => state.medications);
  const loading = useMedicationStore((state) => state.loading);
  const loadMedications = useMedicationStore((state) => state.load);
  const deleteMedication = useMedicationStore((state) => state.remove);

  // Lee AsyncStorage al entrar a la Home (y al volver a ella); el resto de los cambios llegan por el store
  useFocusEffect(
    useCallback(() => {
      loadMedications().catch(() => Alert.alert('Error', 'No se pudieron cargar tus medicaciones.'));
    }, [loadMedications])
  );

  const removeMedication = async (id) => {
    try {
      await deleteMedication(id);
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la medicación.');
    }
  };

  const handleDelete = (medication) => {
    Alert.alert('Eliminar medicación', `¿Eliminar "${medication.name}" de las ${medication.time}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeMedication(medication.id) },
    ]);
  };

  const handleTestNotification = async () => {
    const scheduled = await scheduleTestNotification();
    if (scheduled) {
      Alert.alert('Notificación programada', 'Te llega en 10 segundos. Podés salir de la app para verla.');
    } else {
      Alert.alert('Notificaciones desactivadas', 'Activalas en Ajustes > Expo Go > Notificaciones.');
    }
  };

  // Campanita en el header: notificación de prueba para la demo, sin ocupar lugar en la pantalla
  useLayoutEffect(() => {
    const bell = (
      <TouchableOpacity
        style={styles.bellButton}
        onPress={handleTestNotification}
        accessibilityRole="button"
        accessibilityLabel="Probar notificación en 10 segundos"
      >
        <Text style={styles.bellText}>🔔</Text>
      </TouchableOpacity>
    );
    navigation.setOptions({
      headerRight: () => bell,
      // En iOS 26 los botones del header llevan un fondo redondo de "vidrio";
      // hidesSharedBackground lo quita para que la campanita quede sobre el color del header
      unstable_headerRightItems: () => [{ type: 'custom', element: bell, hidesSharedBackground: true }],
    });
  });

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hola, {user.username} 👋</Text>
      <Text style={styles.subtitle}>Tus recordatorios de medicación</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MedicationItem
              name={item.name}
              time={item.time}
              photoUri={item.photoUri}
              onPress={() => navigation.navigate('MedicationDetail', { id: item.id })}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={styles.empty}>No tenés medicaciones cargadas.{'\n'}Agregá la primera con el botón de abajo.</Text>
            </View>
          }
          contentContainerStyle={styles.list}
        />
      )}

      <PrimaryButton
        title="+ Agregar medicación"
        onPress={() => navigation.navigate('AddMedication')}
      />
      <View style={styles.logout}>
        <Button title="Cerrar sesión" color={colors.danger} onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  greeting: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md },
  loader: { flex: 1 },
  list: { flexGrow: 1 },
  // La lista ocupa todo el alto (flexGrow) y el mensaje vacío se centra en ese espacio
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: spacing.sm },
  empty: { textAlign: 'center', color: colors.textMuted, lineHeight: 22 },
  bellButton: { paddingHorizontal: spacing.xs },
  bellText: { fontSize: 20 },
  logout: { marginTop: spacing.sm, marginBottom: spacing.md },
});
