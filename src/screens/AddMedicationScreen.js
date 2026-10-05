import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { cancelReminder, scheduleDailyReminder } from '../services/notifications';
import { addMedication } from '../storage/medicationStorage';
import { colors, spacing } from '../theme';
import { isValidTime, normalizeTime } from '../utils/time';

export default function AddMedicationScreen({ navigation }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !time.trim()) {
      Alert.alert('Faltan datos', 'Completá el nombre y la hora.');
      return;
    }
    if (!isValidTime(time)) {
      Alert.alert('Hora inválida', 'Usá el formato HH:MM de 24 horas, por ejemplo 08:30 o 21:00.');
      return;
    }

    setSaving(true);
    const medication = { name: name.trim(), time: normalizeTime(time) };
    let notificationId = null;
    try {
      notificationId = await scheduleDailyReminder({ ...medication, username: user.username });
      await addMedication(user.username, { ...medication, notificationId });
    } catch {
      // Si no se pudo guardar, no dejamos un recordatorio "huérfano"
      await cancelReminder(notificationId).catch(() => {});
      Alert.alert('Error', 'No se pudo guardar la medicación. Probá de nuevo.');
      setSaving(false);
      return;
    }

    // La Home recarga la lista al volver a tener foco
    if (notificationId) {
      navigation.goBack();
    } else {
      Alert.alert(
        'Guardada sin recordatorio',
        'Las notificaciones están desactivadas. Activalas en Ajustes > Expo Go > Notificaciones para recibir el aviso.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.intro}>Vas a recibir un recordatorio todos los días a esa hora.</Text>

      <FormInput
        label="Medicamento"
        value={name}
        onChangeText={setName}
        placeholder="Ej: Ibuprofeno 400mg"
        autoCapitalize="sentences"
      />
      <FormInput
        label="Hora (HH:MM)"
        value={time}
        onChangeText={setTime}
        placeholder="Ej: 08:30"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />

      <PrimaryButton title={saving ? 'Guardando...' : 'Guardar'} onPress={handleSave} disabled={saving} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.lg },
});
