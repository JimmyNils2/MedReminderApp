import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';
import {
  PermissionStatus,
  ensurePermission,
  getAllPermissionStatuses,
  toPermissionStatus,
} from '../src/services/permissions';

const denied = { status: 'denied', granted: false, canAskAgain: false };
const undetermined = { status: 'undetermined', granted: false, canAskAgain: true };
const granted = { status: 'granted', granted: true, canAskAgain: true };

afterEach(() => jest.restoreAllMocks());

test('traduce la respuesta del sistema a concedido / denegado / pendiente', () => {
  expect(toPermissionStatus(granted)).toBe(PermissionStatus.GRANTED);
  expect(toPermissionStatus(denied)).toBe(PermissionStatus.DENIED);
  expect(toPermissionStatus(undetermined)).toBe(PermissionStatus.PENDING);
});

test('consulta el estado de todos los recursos sin pedir permisos', async () => {
  Location.getForegroundPermissionsAsync.mockResolvedValueOnce(undetermined);
  const statuses = await getAllPermissionStatuses();

  expect(statuses).toEqual({
    camera: 'granted',
    gallery: 'granted',
    location: 'pending',
    contacts: 'granted',
    calendar: 'granted',
  });
  expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
});

test('con permiso pendiente muestra el diálogo del sistema', async () => {
  ImagePicker.getCameraPermissionsAsync.mockResolvedValueOnce(undetermined);
  ImagePicker.requestCameraPermissionsAsync.mockClear();

  expect(await ensurePermission('camera')).toBe(true);
  expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalledTimes(1);
});

test('con permiso denegado avisa al usuario y ofrece abrir Ajustes', async () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
    buttons.find((b) => b.text === 'Abrir Ajustes').onPress();
  });
  const settingsSpy = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
  ImagePicker.getCameraPermissionsAsync.mockResolvedValueOnce(denied);

  expect(await ensurePermission('camera')).toBe(false);
  expect(alertSpy).toHaveBeenCalledWith('Permiso de Cámara denegado', expect.any(String), expect.any(Array));
  expect(settingsSpy).toHaveBeenCalled();
});
