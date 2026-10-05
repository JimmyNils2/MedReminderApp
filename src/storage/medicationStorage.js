import AsyncStorage from '@react-native-async-storage/async-storage';

// Cada usuario tiene su propia lista: "medications:demo", "medications:ana", ...
export const medicationsKey = (username) => `medications:${username.toLowerCase()}`;

// Lista ordenada por hora. Modelo: { id, name, time: "HH:MM", notificationId }
export async function getMedications(username) {
  const json = await AsyncStorage.getItem(medicationsKey(username));
  return json ? JSON.parse(json) : [];
}

async function saveMedications(username, medications) {
  await AsyncStorage.setItem(medicationsKey(username), JSON.stringify(medications));
}

const byTime = (a, b) => a.time.localeCompare(b.time);

export async function addMedication(username, { name, time, notificationId = null }) {
  const medication = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    time,
    // Lo completa la tarea #10 al programar la notificación diaria
    notificationId,
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
