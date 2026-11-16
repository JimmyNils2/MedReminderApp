import AsyncStorage from '@react-native-async-storage/async-storage';
import { addMedication, deleteMedication, getMedications, updateMedication } from '../src/storage/medicationStorage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('agrega medicaciones ordenadas por hora', async () => {
  await addMedication('demo', { name: 'Omeprazol', time: '21:00' });
  await addMedication('demo', { name: ' Vitamina D ', time: '08:00' });

  const list = await getMedications('demo');
  expect(list.map((m) => [m.name, m.time])).toEqual([
    ['Vitamina D', '08:00'],
    ['Omeprazol', '21:00'],
  ]);
  expect(list[0]).toEqual(expect.objectContaining({ id: expect.any(String), notificationId: null }));
});

test('cada usuario tiene su propia lista', async () => {
  await addMedication('demo', { name: 'Ibuprofeno', time: '10:00' });
  await addMedication('ana', { name: 'Aspirina', time: '12:00' });

  expect((await getMedications('demo')).map((m) => m.name)).toEqual(['Ibuprofeno']);
  expect((await getMedications('Ana')).map((m) => m.name)).toEqual(['Aspirina']);
});

test('elimina una medicación y la devuelve', async () => {
  const med = await addMedication('demo', { name: 'Ibuprofeno', time: '10:00' });
  await addMedication('demo', { name: 'Aspirina', time: '12:00' });

  expect(await deleteMedication('demo', med.id)).toEqual(med);
  expect((await getMedications('demo')).map((m) => m.name)).toEqual(['Aspirina']);
  expect(await deleteMedication('demo', 'no-existe')).toBeNull();
});

test('updateMedication mezcla los cambios y devuelve null si no existe', async () => {
  const med = await addMedication('demo', { name: 'Ibuprofeno', time: '21:00' });
  const updated = await updateMedication('demo', med.id, { contact: { name: 'Dra. López' } });
  expect(updated).toMatchObject({ id: med.id, name: 'Ibuprofeno', contact: { name: 'Dra. López' } });
  expect((await getMedications('demo'))[0].contact.name).toBe('Dra. López');
  expect(await updateMedication('demo', 'no-existe', { name: 'X' })).toBeNull();
});
