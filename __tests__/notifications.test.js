import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import App from '../App';
import { scheduleDailyReminder } from '../src/services/notifications';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

test('programa un recordatorio diario a la hora indicada', async () => {
  const id = await scheduleDailyReminder({ name: 'Ibuprofeno', time: '08:30', username: 'demo' });

  expect(id).toBe('notification-id');
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.objectContaining({ body: 'Hora de tomar Ibuprofeno (demo)' }),
      trigger: expect.objectContaining({ type: 'daily', hour: 8, minute: 30 }),
    })
  );
});

test('sin permiso no programa nada', async () => {
  Notifications.getPermissionsAsync.mockResolvedValueOnce({ granted: false, canAskAgain: false });

  expect(await scheduleDailyReminder({ name: 'Ibuprofeno', time: '08:30', username: 'demo' })).toBeNull();
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});

test('al agregar se programa la notificación y al eliminar se cancela', async () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
    buttons?.find((b) => b.text === 'Eliminar')?.onPress();
  });
  render(<App />);
  fireEvent.changeText(await screen.findByLabelText('Usuario'), 'demo');
  fireEvent.changeText(screen.getByLabelText('Contraseña'), '1234');
  fireEvent.press(screen.getByText('Ingresar'));

  fireEvent.press(await screen.findByText('+ Agregar medicación'));
  fireEvent.changeText(await screen.findByLabelText('Medicamento'), 'Ibuprofeno');
  fireEvent.changeText(screen.getByLabelText('Hora (HH:MM)'), '08:30');
  fireEvent.press(screen.getByText('Guardar'));
  await screen.findByText('Ibuprofeno');
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);

  fireEvent.press(screen.getByLabelText('Eliminar Ibuprofeno'));
  await screen.findByText(/No tenés medicaciones cargadas/);
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notification-id');
  alertSpy.mockRestore();
});

test('la campanita del header programa una notificación de prueba', async () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  render(<App />);
  fireEvent.changeText(await screen.findByLabelText('Usuario'), 'demo');
  fireEvent.changeText(screen.getByLabelText('Contraseña'), '1234');
  fireEvent.press(screen.getByText('Ingresar'));

  fireEvent.press(await screen.findByLabelText('Probar notificación en 10 segundos'));
  await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Notificación programada', expect.any(String)));
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({ trigger: expect.objectContaining({ type: 'timeInterval', seconds: 10 }) })
  );
  alertSpy.mockRestore();
});
