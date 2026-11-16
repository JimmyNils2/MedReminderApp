import AsyncStorage from '@react-native-async-storage/async-storage';

// Cada usuario tiene su propia lista: "medications:demo", "medications:ana", ...
export const medicationsKey = (username) => `medications:${username.toLowerCase()}`;

// Lista ordenada por hora. Modelo:
// { id, name, time: "HH:MM", notificationId,
//   photoUri,                                  // foto del medicamento (cámara o galería)
//   pharmacy: { latitude, longitude, address }, // ubicación de la farmacia
//   contact: { id, name, phone },               // médico o familiar
//   calendarEventId }                           // evento diario en el calendario del dispositivo
// Los recursos del dispositivo son opcionales (null) y se cargan desde el Detalle.
// Las medicaciones guardadas con la versión 1 no los tienen: se leen como null con EMPTY_RESOURCES.
export async function getMedications(username) {
  const json = await AsyncStorage.getItem(medicationsKey(username));
  const medications = json ? JSON.parse(json) : [];
  return medications.map((med) => ({ ...EMPTY_RESOURCES, ...med }));
}

async function saveMedications(username, medications) {
  await AsyncStorage.setItem(medicationsKey(username), JSON.stringify(medications));
}

const byTime = (a, b) => a.time.localeCompare(b.time);

export const EMPTY_RESOURCES = { photoUri: null, pharmacy: null, contact: null, calendarEventId: null };

export async function addMedication(username, { name, time, notificationId = null }) {
  const medication = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    time,
    // Lo completa la tarea #10 al programar la notificación diaria
    notificationId,
    ...EMPTY_RESOURCES,
  };
  const medications = await getMedications(username);
  await saveMedications(username, [...medications, medication].sort(byTime));
  return medication;
}

// Devuelve la medicación eliminada (para cancelar su notificación) o null si no existía
export async function deleteMedication(username, id) {
  const medications = await getMedications(username);
  const deleted = medications.find((med) => med.id === id) ?? null;
  await saveMedications(
    username,
    medications.filter((med) => med.id !== id)
  );
  return deleted;
}

// Mezcla los cambios en la medicación y devuelve la versión actualizada (o null si no existe)
export async function updateMedication(username, id, changes) {
  const medications = await getMedications(username);
  const current = medications.find((med) => med.id === id);
  if (!current) {
    return null;
  }
  const updated = { ...current, ...changes, id };
  await saveMedications(
    username,
    medications.map((med) => (med.id === id ? updated : med)).sort(byTime)
  );
  return updated;
}
