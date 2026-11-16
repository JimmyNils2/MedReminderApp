import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../src/store/authStore';
import { selectMedicationById, useMedicationStore } from '../src/store/medicationStore';
import { getMedications } from '../src/storage/medicationStorage';

// Estado global con Zustand: los stores se prueban sin pantallas, llamando a sus acciones
beforeEach(async () => {
  await AsyncStorage.clear();
  useAuthStore.setState({ user: null, loading: true });
  useMedicationStore.getState().reset();
});

async function loginAs(username) {
  await useAuthStore.getState().restore();
  await useAuthStore.getState().login(username, '1234');
}

test('authStore: restore crea los usuarios de prueba y login/logout cambian el usuario', async () => {
  await useAuthStore.getState().restore();
  expect(useAuthStore.getState()).toMatchObject({ user: null, loading: false });

  await useAuthStore.getState().login('Demo', '1234');
  expect(useAuthStore.getState().user).toEqual({ username: 'demo' });

  await useAuthStore.getState().logout();
  expect(useAuthStore.getState().user).toBeNull();
});

test('medicationStore: agregar, actualizar y eliminar actualizan el store y AsyncStorage', async () => {
  await loginAs('demo');
  const store = useMedicationStore.getState();

  const med = await store.add({ name: 'Ibuprofeno', time: '21:00', notificationId: 'n-1' });
  await store.add({ name: 'Vitamina D', time: '08:30' });
  expect(useMedicationStore.getState().medications.map((m) => m.name)).toEqual(['Vitamina D', 'Ibuprofeno']);

  await store.update(med.id, { photoUri: 'file:///foto.jpg', time: '07:00' });
  const updated = selectMedicationById(med.id)(useMedicationStore.getState());
  expect(updated).toMatchObject({ name: 'Ibuprofeno', time: '07:00', photoUri: 'file:///foto.jpg' });
  // Al cambiar la hora se reordena la lista
  expect(useMedicationStore.getState().medications[0].id).toBe(med.id);

  await store.remove(med.id);
  expect(useMedicationStore.getState().medications.map((m) => m.name)).toEqual(['Vitamina D']);
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('n-1');
  expect(await getMedications('demo')).toHaveLength(1);
});

test('medicationStore: al cambiar de usuario carga solo su lista', async () => {
  await loginAs('demo');
  await useMedicationStore.getState().add({ name: 'Ibuprofeno', time: '21:00' });

  await useAuthStore.getState().logout();
  await useAuthStore.getState().login('ana', '1234');
  await useMedicationStore.getState().load();

  expect(useMedicationStore.getState()).toMatchObject({ medications: [], loadedFor: 'ana', loading: false });
});
