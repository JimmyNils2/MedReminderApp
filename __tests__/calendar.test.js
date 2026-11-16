import * as Calendar from 'expo-calendar/legacy';
import { Alert, Linking } from 'react-native';
import {
  createMedicationEvent,
  deleteMedicationEvent,
  nextOccurrence,
  openCalendarAt,
} from '../src/services/calendar';

afterEach(() => jest.restoreAllMocks());

test('nextOccurrence: hoy si la hora no pasó, mañana si ya pasó', () => {
  const now = new Date(2026, 10, 12, 10, 0);
  expect(nextOccurrence('21:00', now)).toEqual(new Date(2026, 10, 12, 21, 0));
  expect(nextOccurrence('08:30', now)).toEqual(new Date(2026, 10, 13, 8, 30));
});

test('crea un evento diario "Tomar X" a la hora de la medicación', async () => {
  Calendar.createEventAsync.mockClear();
  expect(await createMedicationEvent({ name: 'Ibuprofeno', time: '21:00' })).toBe('event-1');

  const [calendarId, event] = Calendar.createEventAsync.mock.calls[0];
  expect(calendarId).toBe('calendar-1');
  expect(event.title).toBe('💊 Tomar Ibuprofeno');
  expect(event.recurrenceRule).toEqual({ frequency: 'daily' });
  expect(event.startDate.getHours()).toBe(21);
  expect(event.startDate.getMinutes()).toBe(0);
  expect(event.endDate - event.startDate).toBe(15 * 60 * 1000);
});

test('con el permiso de calendario denegado avisa y no crea el evento', async () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  Calendar.getCalendarPermissionsAsync.mockResolvedValueOnce({ status: 'denied', granted: false, canAskAgain: false });
  Calendar.createEventAsync.mockClear();

  expect(await createMedicationEvent({ name: 'Ibuprofeno', time: '21:00' })).toBeNull();
  expect(alertSpy).toHaveBeenCalledWith('Permiso de Calendario denegado', expect.any(String), expect.any(Array));
  expect(Calendar.createEventAsync).not.toHaveBeenCalled();
});

test('si falla la creación da un mensaje claro', async () => {
  Calendar.createEventAsync.mockRejectedValueOnce(new Error('nativo'));
  await expect(createMedicationEvent({ name: 'Ibuprofeno', time: '21:00' })).rejects.toThrow(
    'No se pudo crear el evento en el calendario.'
  );
});

test('borrar el evento elimina toda la serie y no falla si ya no existe', async () => {
  Calendar.deleteEventAsync.mockClear();
  await deleteMedicationEvent('event-1');
  expect(Calendar.deleteEventAsync).toHaveBeenCalledWith('event-1', { futureEvents: true });

  Calendar.deleteEventAsync.mockRejectedValueOnce(new Error('no existe'));
  await expect(deleteMedicationEvent('event-viejo')).resolves.toBeUndefined();

  Calendar.deleteEventAsync.mockClear();
  await deleteMedicationEvent(null);
  expect(Calendar.deleteEventAsync).not.toHaveBeenCalled();
});

test('"Ver en el calendario" abre la app Calendario en esa fecha', async () => {
  const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue();
  await openCalendarAt(new Date('2001-01-02T00:00:00Z'));
  expect(openSpy).toHaveBeenCalledWith('calshow:86400');
});
