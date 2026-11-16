import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Calendar from 'expo-calendar/legacy';
import { Contact } from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import MedicationDetailScreen from '../src/screens/MedicationDetailScreen';
import { useAuthStore } from '../src/store/authStore';
import { useMedicationStore } from '../src/store/medicationStore';

// El Detalle lee la medicación del store global por el id que llega en los params de navegación
const navigation = { setOptions: jest.fn(), goBack: jest.fn() };
const renderDetail = (id) => render(<MedicationDetailScreen route={{ params: { id } }} navigation={navigation} />);

beforeEach(async () => {
  await AsyncStorage.clear();
  useMedicationStore.getState().reset();
  await useAuthStore.getState().restore();
  await useAuthStore.getState().login('demo', '1234');
});

test('sin recursos asociados muestra los estados vacíos', async () => {
  const med = await useMedicationStore.getState().add({ name: 'Ibuprofeno', time: '21:00' });
  renderDetail(med.id);

  expect(screen.getByText('Ibuprofeno')).toBeTruthy();
  expect(screen.getByText('21:00')).toBeTruthy();
  expect(screen.getByText('Sin foto')).toBeTruthy();
  expect(screen.getByText('Sin ubicación')).toBeTruthy();
  expect(screen.getByText('Sin contacto')).toBeTruthy();
  expect(screen.getByText('Sin evento en el calendario')).toBeTruthy();
  // Indicadores de permisos (los mocks devuelven "concedido")
  expect(await screen.findByLabelText('Permiso de Cámara: concedido')).toBeTruthy();
  expect(screen.getByLabelText('Permiso de Ubicación: concedido')).toBeTruthy();
});

test('muestra foto, farmacia, contacto y evento guardados', async () => {
  const med = await useMedicationStore.getState().add({ name: 'Ibuprofeno', time: '21:00' });
  await useMedicationStore.getState().update(med.id, {
    photoUri: 'file:///foto.jpg',
    pharmacy: { latitude: -34.60372, longitude: -58.38159, address: 'Av. Corrientes 1234, CABA' },
    contact: { id: 'c-1', name: 'Dra. López', phone: '11 5555-1234' },
    calendarEventId: 'ev-1',
  });
  renderDetail(med.id);

  expect(screen.getByLabelText('Foto de Ibuprofeno')).toBeTruthy();
  expect(screen.getByText('Av. Corrientes 1234, CABA')).toBeTruthy();
  expect(screen.getByText('-34.60372, -58.38159')).toBeTruthy();
  expect(screen.getByText('Dra. López')).toBeTruthy();
  expect(screen.getByText('11 5555-1234')).toBeTruthy();
  expect(screen.getByText('Evento diario creado a las 21:00')).toBeTruthy();
  expect(await screen.findByText('Cambiar foto')).toBeTruthy();
});

// Simula que el usuario elige una opción en el Alert (menú de la foto o aviso de permiso)
const pressAlertOption = (option) =>
  jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
    buttons?.find((b) => b.text === option)?.onPress?.();
  });

test('sacar una foto con la cámara la asocia a la medicación', async () => {
  const alertSpy = pressAlertOption('Sacar foto');
  const med = await useMedicationStore.getState().add({ name: 'Ibuprofeno', time: '21:00' });
  renderDetail(med.id);

  fireEvent.press(await screen.findByText('Agregar foto'));

  expect(await screen.findByLabelText('Foto de Ibuprofeno')).toBeTruthy();
  const saved = useMedicationStore.getState().medications[0];
  expect(saved.photoUri).toMatch(/^file:\/\/\/documents\/photos\/med-\d+\.jpg$/);
  alertSpy.mockRestore();
});

test('con el permiso de cámara denegado avisa y no guarda foto', async () => {
  const alertSpy = pressAlertOption('Sacar foto');
  ImagePicker.launchCameraAsync.mockClear();
  const med = await useMedicationStore.getState().add({ name: 'Ibuprofeno', time: '21:00' });
  renderDetail(med.id);
  await screen.findByLabelText('Permiso de Cámara: concedido');

  // El usuario rechazó la cámara (ej. desde Ajustes) justo antes de tocar el botón
  ImagePicker.getCameraPermissionsAsync.mockResolvedValueOnce({ status: 'denied', granted: false, canAskAgain: false });
  fireEvent.press(screen.getByText('Agregar foto'));

  await waitFor(() =>
    expect(alertSpy).toHaveBeenCalledWith('Permiso de Cámara denegado', expect.any(String), expect.any(Array))
  );
  expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
  expect(useMedicationStore.getState().medications[0].photoUri).toBeNull();
  alertSpy.mockRestore();
});

test('"Usar mi ubicación actual" guarda la farmacia y la muestra', async () => {
  const med = await useMedicationStore.getState().add({ name: 'Ibuprofeno', time: '21:00' });
  renderDetail(med.id);

  fireEvent.press(await screen.findByText('Usar mi ubicación actual'));

  expect(await screen.findByText('Av. Corrientes 1234, Buenos Aires')).toBeTruthy();
  expect(screen.getByText('-34.60370, -58.38160')).toBeTruthy();
  expect(screen.getByText('🗺️ Ver en el mapa')).toBeTruthy();
  expect(useMedicationStore.getState().medications[0].pharmacy).toEqual({
    latitude: -34.6037,
    longitude: -58.3816,
    address: 'Av. Corrientes 1234, Buenos Aires',
  });
});

test('"Elegir de la agenda" guarda el contacto con su teléfono', async () => {
  const med = await useMedicationStore.getState().add({ name: 'Ibuprofeno', time: '21:00' });
  renderDetail(med.id);

  fireEvent.press(await screen.findByText('Elegir de la agenda'));

  expect(await screen.findByText('Dra. López')).toBeTruthy();
  expect(screen.getByText('11 5555-1234')).toBeTruthy();
  expect(screen.getByText('📞 Llamar')).toBeTruthy();
  expect(useMedicationStore.getState().medications[0].contact).toEqual({
    id: 'contact-1',
    name: 'Dra. López',
    phone: '11 5555-1234',
  });
});

test('si el contacto tiene varios teléfonos el usuario elige cuál guardar', async () => {
  Contact.presentPicker.mockResolvedValueOnce({
    id: 'contact-2',
    getFullName: async () => 'Mamá',
    getPhones: async () => [{ number: '11 1111-1111' }, { number: '11 2222-2222' }],
  });
  const alertSpy = pressAlertOption('11 2222-2222');
  const med = await useMedicationStore.getState().add({ name: 'Ibuprofeno', time: '21:00' });
  renderDetail(med.id);

  fireEvent.press(await screen.findByText('Elegir de la agenda'));

  expect(await screen.findByText('Mamá')).toBeTruthy();
  expect(useMedicationStore.getState().medications[0].contact).toEqual({
    id: 'contact-2',
    name: 'Mamá',
    phone: '11 2222-2222',
  });
  alertSpy.mockRestore();
});

test('"Agregar al calendario" crea el evento diario y guarda su id', async () => {
  const med = await useMedicationStore.getState().add({ name: 'Ibuprofeno', time: '21:00' });
  renderDetail(med.id);

  fireEvent.press(await screen.findByText('Agregar al calendario'));

  expect(await screen.findByText('Evento diario creado a las 21:00')).toBeTruthy();
  expect(screen.getByText('📅 Ver en el calendario')).toBeTruthy();
  expect(useMedicationStore.getState().medications[0].calendarEventId).toBe('event-1');
});

test('eliminar la medicación borra también su evento del calendario', async () => {
  Calendar.deleteEventAsync.mockClear();
  const med = await useMedicationStore.getState().add({ name: 'Ibuprofeno', time: '21:00' });
  await useMedicationStore.getState().update(med.id, { calendarEventId: 'event-1' });

  await useMedicationStore.getState().remove(med.id);

  expect(useMedicationStore.getState().medications).toHaveLength(0);
  expect(Calendar.deleteEventAsync).toHaveBeenCalledWith('event-1', { futureEvents: true });
});

test('elegir una foto de la galería la asocia a la medicación', async () => {
  const alertSpy = pressAlertOption('Elegir de la galería');
  const med = await useMedicationStore.getState().add({ name: 'Ibuprofeno', time: '21:00' });
  renderDetail(med.id);

  fireEvent.press(await screen.findByText('Agregar foto'));

  expect(await screen.findByLabelText('Foto de Ibuprofeno')).toBeTruthy();
  expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
  alertSpy.mockRestore();
});

test('"Quitar" saca la ubicación, el contacto y el evento del calendario', async () => {
  Calendar.deleteEventAsync.mockClear();
  const med = await useMedicationStore.getState().add({ name: 'Ibuprofeno', time: '21:00' });
  await useMedicationStore.getState().update(med.id, {
    pharmacy: { latitude: -34.6, longitude: -58.38, address: 'Av. Corrientes 1234, CABA' },
    contact: { id: 'c-1', name: 'Dra. López', phone: '11 5555-1234' },
    calendarEventId: 'event-1',
  });
  renderDetail(med.id);

  const alertSpy = pressAlertOption('Quitar ubicación');
  fireEvent.press(await screen.findByText('Cambiar ubicación'));
  expect(await screen.findByText('Sin ubicación')).toBeTruthy();

  alertSpy.mockRestore();
  pressAlertOption('Quitar contacto');
  fireEvent.press(screen.getByText('Cambiar contacto'));
  expect(await screen.findByText('Sin contacto')).toBeTruthy();

  Alert.alert.mockRestore();
  pressAlertOption('Quitar del calendario');
  fireEvent.press(screen.getByText('Quitar del calendario'));
  expect(await screen.findByText('Sin evento en el calendario')).toBeTruthy();
  expect(Calendar.deleteEventAsync).toHaveBeenCalledWith('event-1', { futureEvents: true });
  Alert.alert.mockRestore();

  expect(useMedicationStore.getState().medications[0]).toMatchObject({
    pharmacy: null,
    contact: null,
    calendarEventId: null,
  });
});
