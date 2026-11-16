import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';
import { formatAddress, getCurrentPharmacyLocation, mapsUrl, openInMaps } from '../src/services/location';

afterEach(() => jest.restoreAllMocks());

test('formatAddress arma una dirección corta', () => {
  expect(formatAddress({ street: 'Av. Corrientes', streetNumber: '1234', city: 'Buenos Aires' })).toBe(
    'Av. Corrientes 1234, Buenos Aires'
  );
  expect(formatAddress({ name: 'Farmacia Central', district: 'Palermo' })).toBe('Farmacia Central, Palermo');
  expect(formatAddress({})).toBeNull();
  expect(formatAddress(undefined)).toBeNull();
});

test('devuelve coordenadas y dirección aproximada de la ubicación actual', async () => {
  expect(await getCurrentPharmacyLocation()).toEqual({
    latitude: -34.6037,
    longitude: -58.3816,
    address: 'Av. Corrientes 1234, Buenos Aires',
  });
});

test('si falla la dirección guarda solo las coordenadas', async () => {
  Location.reverseGeocodeAsync.mockRejectedValueOnce(new Error('sin internet'));
  expect(await getCurrentPharmacyLocation()).toEqual({ latitude: -34.6037, longitude: -58.3816, address: null });
});

test('con el permiso de ubicación denegado avisa y no consulta el GPS', async () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  Location.getForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied', granted: false, canAskAgain: false });
  Location.getCurrentPositionAsync.mockClear();

  expect(await getCurrentPharmacyLocation()).toBeNull();
  expect(alertSpy).toHaveBeenCalledWith('Permiso de Ubicación denegado', expect.any(String), expect.any(Array));
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});

test('con la ubicación del teléfono desactivada da un mensaje claro', async () => {
  Location.hasServicesEnabledAsync.mockResolvedValueOnce(false);
  await expect(getCurrentPharmacyLocation()).rejects.toThrow(/ubicación del teléfono está desactivada/);
});

test('"Ver en el mapa" abre la app de mapas con las coordenadas', async () => {
  const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue();
  const location = { latitude: -34.6037, longitude: -58.3816 };

  expect(mapsUrl(location)).toBe('https://maps.apple.com/?ll=-34.6037,-58.3816&q=Farmacia');
  await openInMaps(location);
  expect(openSpy).toHaveBeenCalledWith(mapsUrl(location));
});
