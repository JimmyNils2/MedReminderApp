import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from '../App';

// Navegación condicional: sin sesión solo Login/Registro, con sesión solo Home/Alta.
// (El botón "atrás" del header es nativo y no existe en Jest, por eso cada flujo arranca de cero)

// La sesión ahora se guarda en AsyncStorage: cada test arranca sin usuarios ni sesión
beforeEach(async () => {
  await AsyncStorage.clear();
});

async function login(username = 'demo') {
  fireEvent.changeText(await screen.findByLabelText('Usuario'), username);
  fireEvent.changeText(screen.getByLabelText('Contraseña'), '1234');
  fireEvent.press(screen.getByText('Ingresar'));
  await screen.findByText(`Hola, ${username} 👋`);
}

test('sin sesión muestra el Login y no la Home', async () => {
  render(<App />);
  expect(await screen.findByText('Ingresar')).toBeTruthy();
  expect(screen.queryByText('+ Agregar medicación')).toBeNull();
});

test('desde el Login se llega al Registro', async () => {
  render(<App />);
  fireEvent.press(await screen.findByText('¿No tenés cuenta? Registrate'));
  expect(await screen.findByText('Registrarme')).toBeTruthy();
});

test('al iniciar sesión muestra la Home y desde ahí el Alta', async () => {
  render(<App />);
  await login();
  fireEvent.press(screen.getByText('+ Agregar medicación'));
  expect(await screen.findByText('Guardar')).toBeTruthy();
});

test('al cerrar sesión vuelve al Login', async () => {
  render(<App />);
  await login();
  fireEvent.press(screen.getByText('Cerrar sesión'));
  expect(await screen.findByText('Ingresar')).toBeTruthy();
  expect(screen.queryByText('Hola, demo 👋')).toBeNull();
});

test('con contraseña incorrecta no entra', async () => {
  render(<App />);
  fireEvent.changeText(await screen.findByLabelText('Usuario'), 'demo');
  fireEvent.changeText(screen.getByLabelText('Contraseña'), 'mala');
  fireEvent.press(screen.getByText('Ingresar'));
  expect(await screen.findByText('Ingresar')).toBeTruthy();
  expect(screen.queryByText('Hola, demo 👋')).toBeNull();
});

test('la sesión se mantiene al reabrir la app', async () => {
  const { unmount } = render(<App />);
  await login('ana');
  unmount();

  render(<App />);
  expect(await screen.findByText('Hola, ana 👋')).toBeTruthy();
});

async function addMedicationFromHome(name, time) {
  fireEvent.press(screen.getByText('+ Agregar medicación'));
  fireEvent.changeText(await screen.findByLabelText('Medicamento'), name);
  fireEvent.changeText(screen.getByLabelText('Hora (HH:MM)'), time);
  fireEvent.press(screen.getByText('Guardar'));
}

test('agregar una medicación la muestra en la Home y persiste', async () => {
  const { unmount } = render(<App />);
  await login();
  expect(await screen.findByText(/No tenés medicaciones cargadas/)).toBeTruthy();

  await addMedicationFromHome('Ibuprofeno', '8:30');
  expect(await screen.findByText('Ibuprofeno')).toBeTruthy();
  expect(screen.getByText('08:30')).toBeTruthy();
  unmount();

  render(<App />);
  expect(await screen.findByText('Ibuprofeno')).toBeTruthy();
});

test('con hora inválida no guarda y avisa', async () => {
  const alertSpy = jest.spyOn(Alert, 'alert');
  render(<App />);
  await login();
  await addMedicationFromHome('Ibuprofeno', '25:00');

  expect(alertSpy).toHaveBeenCalledWith('Hora inválida', expect.any(String));
  expect(screen.getByText('Guardar')).toBeTruthy();
  alertSpy.mockRestore();
});

test('eliminar pide confirmación y saca la medicación de la lista', async () => {
  // Simula que el usuario toca "Eliminar" en el diálogo de confirmación
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
    buttons?.find((b) => b.text === 'Eliminar')?.onPress();
  });
  render(<App />);
  await login();
  await addMedicationFromHome('Ibuprofeno', '08:30');

  fireEvent.press(await screen.findByLabelText('Eliminar Ibuprofeno'));
  expect(await screen.findByText(/No tenés medicaciones cargadas/)).toBeTruthy();
  alertSpy.mockRestore();
});

test('las medicaciones de un usuario no se ven con otro', async () => {
  render(<App />);
  await login('demo');
  await addMedicationFromHome('Ibuprofeno', '08:30');
  await screen.findByText('Ibuprofeno');

  fireEvent.press(screen.getByText('Cerrar sesión'));
  await login('ana');
  expect(await screen.findByText(/No tenés medicaciones cargadas/)).toBeTruthy();
  expect(screen.queryByText('Ibuprofeno')).toBeNull();
});
