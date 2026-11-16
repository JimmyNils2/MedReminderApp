import { Contact, getPermissionsAsync } from 'expo-contacts';
import { Alert, Linking } from 'react-native';
import { callPhone, pickContact, telUrl } from '../src/services/contacts';

afterEach(() => jest.restoreAllMocks());

test('elegir un contacto de la agenda devuelve nombre y teléfonos', async () => {
  expect(await pickContact()).toEqual({ id: 'contact-1', name: 'Dra. López', phones: ['11 5555-1234'] });
});

test('si el usuario cierra la agenda sin elegir devuelve null', async () => {
  Contact.presentPicker.mockResolvedValueOnce(null);
  expect(await pickContact()).toBeNull();
});

test('con el permiso de contactos denegado avisa y no abre la agenda', async () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  getPermissionsAsync.mockResolvedValueOnce({ status: 'denied', granted: false, canAskAgain: false });
  Contact.presentPicker.mockClear();

  expect(await pickContact()).toBeNull();
  expect(alertSpy).toHaveBeenCalledWith('Permiso de Contactos denegado', expect.any(String), expect.any(Array));
  expect(Contact.presentPicker).not.toHaveBeenCalled();
});

test('"Llamar" abre el teléfono con el número limpio', async () => {
  const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue();
  expect(telUrl('+54 (11) 5555-1234')).toBe('tel:+541155551234');
  await callPhone('11 5555-1234');
  expect(openSpy).toHaveBeenCalledWith('tel:1155551234');
});
