import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PermissionBadge from '../components/PermissionBadge';
import PrimaryButton from '../components/PrimaryButton';
import { CalendarError, createMedicationEvent, deleteMedicationEvent, nextOccurrence, openCalendarAt } from '../services/calendar';
import { ContactError, callPhone, pickContact } from '../services/contacts';
import { LocationError, getCurrentPharmacyLocation, openInMaps } from '../services/location';
import { getAllPermissionStatuses } from '../services/permissions';
import { deletePhoto, pickPhoto } from '../services/photo';
import { selectMedicationById, useMedicationStore } from '../store/medicationStore';
import { colors, spacing } from '../theme';

// Bloque reutilizable del Detalle: título, contenido y (si hay) un botón para agregar/cambiar el recurso
// permissions: indicadores del estado de los permisos que usa la sección
// busy: muestra un indicador de carga mientras se obtiene el recurso (ej. la ubicación por GPS)
function DetailSection({ icon, title, children, actionLabel, onAction, permissions = [], busy = false, busyLabel }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {icon} {title}
      </Text>
      {permissions.length ? (
        <View style={styles.badges}>
          {permissions.map(({ label, status }) => (
            <PermissionBadge key={label} label={label} status={status} />
          ))}
        </View>
      ) : null}
      <View style={styles.sectionBody}>{children}</View>
      {busy ? (
        <View style={styles.busy}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.muted}>{busyLabel}</Text>
        </View>
      ) : onAction ? (
        <TouchableOpacity onPress={onAction} style={styles.sectionAction} accessibilityRole="button">
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const Empty = ({ children }) => <Text style={styles.empty}>{children}</Text>;

// Detalle de una medicación: lee el dato del store global por id (llega por params de navegación).
// Desde acá se asocian los recursos del dispositivo: foto, farmacia, contacto y evento de calendario.
export default function MedicationDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const medication = useMedicationStore(selectMedicationById(id));
  const removeMedication = useMedicationStore((state) => state.remove);
  const updateMedication = useMedicationStore((state) => state.update);
  const [permissions, setPermissions] = useState({});
  const [locating, setLocating] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  // Estado de los permisos: al entrar, después de cada pedido y al volver de Ajustes
  const refreshPermissions = useCallback(() => {
    getAllPermissionStatuses()
      .then(setPermissions)
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshPermissions();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPermissions();
    });
    return () => subscription.remove();
  }, [refreshPermissions]);

  useLayoutEffect(() => {
    if (medication) {
      navigation.setOptions({ title: medication.name });
    }
  }, [navigation, medication]);

  // Si la medicación ya no existe (ej. se eliminó) no hay nada que mostrar
  if (!medication) {
    return (
      <View style={styles.notFound}>
        <Empty>Esta medicación ya no existe.</Empty>
      </View>
    );
  }

  const { name, time, photoUri, pharmacy, contact, calendarEventId } = medication;

  // Guarda un cambio de la medicación en el store (y AsyncStorage)
  const saveChanges = async (changes) => {
    try {
      await updateMedication(id, changes);
      return true;
    } catch {
      Alert.alert('Error', 'No se pudo guardar el cambio.');
      return false;
    }
  };

  const choosePhoto = async (source) => {
    try {
      const uri = await pickPhoto(source);
      if (uri && (await saveChanges({ photoUri: uri }))) {
        deletePhoto(photoUri); // la foto anterior ya no se usa
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar la foto.');
    } finally {
      refreshPermissions();
    }
  };

  const removePhoto = async () => {
    if (await saveChanges({ photoUri: null })) {
      deletePhoto(photoUri);
    }
  };

  const handlePhoto = () => {
    const options = [
      { text: 'Sacar foto', onPress: () => choosePhoto('camera') },
      { text: 'Elegir de la galería', onPress: () => choosePhoto('gallery') },
    ];
    if (photoUri) {
      options.push({ text: 'Quitar foto', style: 'destructive', onPress: removePhoto });
    }
    options.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert('Foto del medicamento', '¿De dónde querés sacar la foto?', options);
  };

  // Farmacia: guarda la ubicación actual del teléfono (coordenadas + dirección aproximada)
  const saveCurrentLocation = async () => {
    setLocating(true);
    try {
      const location = await getCurrentPharmacyLocation();
      if (location) {
        await saveChanges({ pharmacy: location });
      }
    } catch (error) {
      const message = error instanceof LocationError ? error.message : 'No se pudo obtener la ubicación.';
      Alert.alert('Ubicación no disponible', message);
    } finally {
      setLocating(false);
      refreshPermissions();
    }
  };

  const handlePharmacy = () => {
    if (!pharmacy) {
      saveCurrentLocation();
      return;
    }
    Alert.alert('Ubicación de la farmacia', 'Usá esta opción cuando estés en la farmacia.', [
      { text: 'Actualizar con mi ubicación actual', onPress: saveCurrentLocation },
      { text: 'Quitar ubicación', style: 'destructive', onPress: () => saveChanges({ pharmacy: null }) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleOpenMaps = () => {
    openInMaps(pharmacy, `Farmacia (${name})`).catch(() =>
      Alert.alert('Error', 'No se pudo abrir la app de mapas.')
    );
  };

  // Contacto: elegir un médico o familiar de la agenda y guardar nombre + teléfono
  const saveContact = (picked, phone) =>
    saveChanges({ contact: { id: picked.id, name: picked.name, phone: phone ?? null } });

  const chooseContact = async () => {
    try {
      const picked = await pickContact();
      if (!picked) return;
      if (picked.phones.length <= 1) {
        await saveContact(picked, picked.phones[0]);
        return;
      }
      // Si tiene varios teléfonos, el usuario elige cuál guardar
      Alert.alert(picked.name, '¿Qué teléfono querés guardar?', [
        ...picked.phones.map((phone) => ({ text: phone, onPress: () => saveContact(picked, phone) })),
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } catch (error) {
      const message = error instanceof ContactError ? error.message : 'No se pudo elegir el contacto.';
      Alert.alert('Contacto no disponible', message);
    } finally {
      refreshPermissions();
    }
  };

  const handleContact = () => {
    if (!contact) {
      chooseContact();
      return;
    }
    Alert.alert('Contacto', `Médico o familiar asociado a ${name}.`, [
      { text: 'Elegir otro contacto', onPress: chooseContact },
      { text: 'Quitar contacto', style: 'destructive', onPress: () => saveChanges({ contact: null }) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleCall = () => {
    callPhone(contact.phone).catch(() => Alert.alert('Error', 'No se pudo iniciar la llamada.'));
  };

  // Calendario: evento diario "Tomar X" a la hora de la medicación
  const addCalendarEvent = async () => {
    setScheduling(true);
    try {
      const eventId = await createMedicationEvent({ name, time });
      if (eventId && !(await saveChanges({ calendarEventId: eventId }))) {
        deleteMedicationEvent(eventId); // no se pudo guardar: no dejar un evento huérfano
      }
    } catch (error) {
      const message = error instanceof CalendarError ? error.message : 'No se pudo crear el evento.';
      Alert.alert('Calendario no disponible', message);
    } finally {
      setScheduling(false);
      refreshPermissions();
    }
  };

  const removeCalendarEvent = async () => {
    if (await saveChanges({ calendarEventId: null })) {
      deleteMedicationEvent(calendarEventId);
    }
  };

  const handleCalendar = () => {
    if (!calendarEventId) {
      addCalendarEvent();
      return;
    }
    Alert.alert('Evento en el calendario', `Se borra el evento diario de ${name} de tu calendario.`, [
      { text: 'Quitar del calendario', style: 'destructive', onPress: removeCalendarEvent },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleOpenCalendar = () => {
    openCalendarAt(nextOccurrence(time)).catch(() =>
      Alert.alert('Error', 'No se pudo abrir la app de calendario.')
    );
  };

  const handleDelete = () => {
    Alert.alert('Eliminar medicación', `¿Eliminar "${name}" de las ${time}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMedication(id);
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'No se pudo eliminar la medicación.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>{time}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.muted}>Recordatorio todos los días</Text>
        </View>
      </View>

      <DetailSection
        icon="📷"
        title="Foto del medicamento"
        permissions={[
          { label: 'Cámara', status: permissions.camera },
          { label: 'Fotos', status: permissions.gallery },
        ]}
        actionLabel={photoUri ? 'Cambiar foto' : 'Agregar foto'}
        onAction={handlePhoto}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} accessibilityLabel={`Foto de ${name}`} />
        ) : (
          <Empty>Sin foto</Empty>
        )}
      </DetailSection>

      <DetailSection
        icon="📍"
        title="Farmacia"
        permissions={[{ label: 'Ubicación', status: permissions.location }]}
        actionLabel={pharmacy ? 'Cambiar ubicación' : 'Usar mi ubicación actual'}
        onAction={handlePharmacy}
        busy={locating}
        busyLabel="Obteniendo ubicación…"
      >
        {pharmacy ? (
          <>
            <Text style={styles.value}>{pharmacy.address ?? 'Dirección no disponible'}</Text>
            <Text style={styles.muted}>
              {pharmacy.latitude.toFixed(5)}, {pharmacy.longitude.toFixed(5)}
            </Text>
            <TouchableOpacity onPress={handleOpenMaps} style={styles.inlineLink} accessibilityRole="link">
              <Text style={styles.sectionActionText}>🗺️ Ver en el mapa</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Empty>Sin ubicación</Empty>
        )}
      </DetailSection>

      <DetailSection
        icon="👤"
        title="Contacto (médico o familiar)"
        permissions={[{ label: 'Contactos', status: permissions.contacts }]}
        actionLabel={contact ? 'Cambiar contacto' : 'Elegir de la agenda'}
        onAction={handleContact}
      >
        {contact ? (
          <>
            <Text style={styles.value}>{contact.name}</Text>
            {contact.phone ? (
              <>
                <Text style={styles.muted}>{contact.phone}</Text>
                <TouchableOpacity onPress={handleCall} style={styles.inlineLink} accessibilityRole="link">
                  <Text style={styles.sectionActionText}>📞 Llamar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.muted}>Sin teléfono</Text>
            )}
          </>
        ) : (
          <Empty>Sin contacto</Empty>
        )}
      </DetailSection>

      <DetailSection
        icon="📅"
        title="Calendario"
        permissions={[{ label: 'Calendario', status: permissions.calendar }]}
        actionLabel={calendarEventId ? 'Quitar del calendario' : 'Agregar al calendario'}
        onAction={handleCalendar}
        busy={scheduling}
        busyLabel="Creando evento…"
      >
        {calendarEventId ? (
          <>
            <Text style={styles.value}>Evento diario creado a las {time}</Text>
            <Text style={styles.muted}>💊 Tomar {name}</Text>
            <TouchableOpacity onPress={handleOpenCalendar} style={styles.inlineLink} accessibilityRole="link">
              <Text style={styles.sectionActionText}>📅 Ver en el calendario</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Empty>Sin evento en el calendario</Empty>
        )}
      </DetailSection>

      <View style={styles.deleteButton}>
        <PrimaryButton title="Eliminar medicación" variant="danger" onPress={handleDelete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.lg },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  timeBadge: {
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: spacing.md,
  },
  timeText: { color: colors.primaryDark, fontWeight: '700', fontSize: 20 },
  headerInfo: { flex: 1 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  sectionBody: { gap: 2 },
  sectionAction: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  busy: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  inlineLink: { marginTop: spacing.xs, alignSelf: 'flex-start' },
  sectionActionText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  value: { fontSize: 16, color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
  empty: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 8, backgroundColor: colors.border },
  deleteButton: { marginTop: spacing.md },
});
