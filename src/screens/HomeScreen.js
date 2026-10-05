import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MedicationItem from '../components/MedicationItem';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { cancelReminder, scheduleTestNotification } from '../services/notifications';
import { deleteMedication, getMedications } from '../storage/medicationStorage';
import { colors, spacing } from '../theme';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Se recarga cada vez que la pantalla toma foco (por ejemplo, al volver del Alta)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getMedications(user.username)
        .then((list) => active && setMedications(list))
        .catch(() => Alert.alert('Error', 'No se pudieron cargar tus medicaciones.'))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [user.username])
  );

  const removeMedication = async (id) => {
    try {
      const deleted = await deleteMedication(user.username, id);
      await cancelReminder(deleted?.notificationId);
      setMedications((current) => current.filter((med) => med.id !== id));
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
            <MedicationItem name={item.name} time={item.time} onDelete={() => handleDelete(item)} />
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
