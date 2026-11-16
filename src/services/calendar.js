// Se usa la API "legacy" de expo-calendar: en SDK 58 la API nueva (orientada a objetos) todavía
// no está disponible en Expo Go, y las funciones viejas importadas desde 'expo-calendar' tiran error.
import * as Calendar from 'expo-calendar/legacy';
import { Linking, Platform } from 'react-native';
import { ensurePermission } from './permissions';

// Error con un mensaje listo para mostrarle al usuario
export class CalendarError extends Error {}

const EVENT_DURATION_MINUTES = 15;

// Próxima vez que toca la toma: hoy a esa hora, o mañana si ya pasó. time = "HH:mm"
export function nextOccurrence(time, now = new Date()) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(now);
  date.setHours(hours, minutes, 0, 0);
  if (date <= now) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

// Calendario donde se guarda el evento: el predeterminado en iOS; en Android el principal editable
async function getWritableCalendarId() {
  if (Platform.OS === 'ios') {
    const calendar = await Calendar.getDefaultCalendarAsync();
    return calendar.id;
  }
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.filter((calendar) => calendar.allowsModifications);
  const calendar = writable.find((c) => c.isPrimary) ?? writable[0];
  if (!calendar) {
    throw new Error('sin calendarios editables');
  }
  return calendar.id;
}

// Crea en el calendario del teléfono un evento diario "Tomar X" a la hora de la medicación.
// Devuelve el id del evento (para guardarlo en calendarEventId) o null si no hay permiso.
// Sin alarma: el aviso ya lo da la notificación de la app (así no suena dos veces).
export async function createMedicationEvent({ name, time }) {
  if (!(await ensurePermission('calendar'))) {
    return null;
  }
  try {
    const calendarId = await getWritableCalendarId();
    const startDate = nextOccurrence(time);
    const endDate = new Date(startDate.getTime() + EVENT_DURATION_MINUTES * 60 * 1000);
    return await Calendar.createEventAsync(calendarId, {
      title: `💊 Tomar ${name}`,
      notes: 'Evento creado por MedReminder.',
      startDate,
      endDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      recurrenceRule: { frequency: Calendar.Frequency.DAILY },
      alarms: [],
    });
  } catch {
    throw new CalendarError('No se pudo crear el evento en el calendario.');
  }
}

// Borra el evento y todas sus repeticiones. Si el usuario ya lo borró a mano no pasa nada.
export async function deleteMedicationEvent(eventId) {
  if (!eventId) return;
  try {
    await Calendar.deleteEventAsync(eventId, { futureEvents: true });
  } catch {
    // Sin permiso o evento inexistente: la medicación igual se borra/actualiza
  }
}

// Abre la app Calendario en el día de la próxima toma (en iOS con el esquema calshow:)
export function openCalendarAt(date) {
  if (Platform.OS === 'ios') {
    const secondsSince2001 = Math.floor(date.getTime() / 1000 - 978307200);
    return Linking.openURL(`calshow:${secondsSince2001}`);
  }
  return Linking.openURL(`content://com.android.calendar/time/${date.getTime()}`);
}
