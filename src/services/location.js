import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';
import { ensurePermission } from './permissions';

// Arma una dirección corta a partir del resultado de reverseGeocodeAsync
// ej. { street: 'Av. Corrientes', streetNumber: '1234', city: 'Buenos Aires' } → "Av. Corrientes 1234, Buenos Aires"
export function formatAddress(place) {
  if (!place) return null;
  const street = place.street ? [place.street, place.streetNumber].filter(Boolean).join(' ') : place.name;
  const city = place.city || place.district || place.subregion || place.region;
  const parts = [street, city].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

// Error con un mensaje listo para mostrarle al usuario
export class LocationError extends Error {}

// Ubicación actual del dispositivo para asociarla como farmacia: { latitude, longitude, address }.
// Devuelve null si no hay permiso (ensurePermission ya le avisó al usuario).
export async function getCurrentPharmacyLocation() {
  if (!(await ensurePermission('location'))) {
    return null;
  }
  if (!(await Location.hasServicesEnabledAsync())) {
    throw new LocationError('La ubicación del teléfono está desactivada. Activala en Ajustes > Privacidad > Localización.');
  }

  let coords;
  try {
    ({ coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  } catch {
    throw new LocationError('No pudimos obtener tu ubicación. Probá de nuevo en un lugar con mejor señal.');
  }
  const { latitude, longitude } = coords;

  // La dirección es "aproximada" y opcional: si falla (ej. sin internet) se guardan solo las coordenadas
  let address = null;
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    address = formatAddress(place);
  } catch {
    address = null;
  }
  return { latitude, longitude, address };
}

// Link para abrir la ubicación en la app de mapas del teléfono (Apple Maps en iOS, Google Maps en Android)
export function mapsUrl({ latitude, longitude }, label = 'Farmacia') {
  const query = encodeURIComponent(label);
  return Platform.OS === 'ios'
    ? `https://maps.apple.com/?ll=${latitude},${longitude}&q=${query}`
    : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${query})`;
}

export function openInMaps(location, label) {
  return Linking.openURL(mapsUrl(location, label));
}
