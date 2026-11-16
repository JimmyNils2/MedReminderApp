// Calendario: API legacy (en SDK 58 la nueva no está en Expo Go y las viejas desde 'expo-calendar' tiran error)
import * as Calendar from 'expo-calendar/legacy';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

// Los 3 estados de permiso que maneja la app (el sistema devuelve granted / denied / undetermined)
export const PermissionStatus = {
  GRANTED: 'granted', // concedido: se puede usar el recurso
  DENIED: 'denied', // denegado: hay que habilitarlo desde Ajustes
  PENDING: 'pending', // pendiente: todavía no se le preguntó al usuario
};

// Cada recurso del dispositivo con su par de funciones "consultar" / "pedir" de Expo
// y el texto que se le explica al usuario si rechaza el permiso
export const RESOURCES = {
  camera: {
    label: 'Cámara',
    reason: 'sacarle una foto al medicamento',
    get: ImagePicker.getCameraPermissionsAsync,
    request: ImagePicker.requestCameraPermissionsAsync,
  },
  gallery: {
    label: 'Fotos',
    reason: 'elegir una imagen de tu galería',
    get: ImagePicker.getMediaLibraryPermissionsAsync,
    request: ImagePicker.requestMediaLibraryPermissionsAsync,
  },
  location: {
    label: 'Ubicación',
    reason: 'guardar la ubicación de tu farmacia',
    get: Location.getForegroundPermissionsAsync,
    request: Location.requestForegroundPermissionsAsync,
  },
  contacts: {
    label: 'Contactos',
    reason: 'asociar un médico o familiar a la medicación',
    get: Contacts.getPermissionsAsync,
    request: Contacts.requestPermissionsAsync,
  },
  calendar: {
    label: 'Calendario',
    reason: 'crear el evento de la toma en tu calendario',
    get: Calendar.getCalendarPermissionsAsync,
    request: Calendar.requestCalendarPermissionsAsync,
  },
};

// Traduce la respuesta de Expo a uno de los 3 estados de la app
export function toPermissionStatus(response) {
  if (response?.granted) return PermissionStatus.GRANTED;
  if (response?.status === 'undetermined') return PermissionStatus.PENDING;
  return PermissionStatus.DENIED;
}

// Consulta el estado SIN mostrar el diálogo del sistema (para pintar los indicadores del Detalle)
export async function getPermissionStatus(resource) {
  return toPermissionStatus(await RESOURCES[resource].get());
}

export async function getAllPermissionStatuses() {
  const keys = Object.keys(RESOURCES);
  const statuses = await Promise.all(keys.map(getPermissionStatus));
  return Object.fromEntries(keys.map((key, i) => [key, statuses[i]]));
}

// Mensaje claro cuando el permiso está rechazado, con acceso directo a los Ajustes del teléfono
export function showPermissionDenied(resource) {
  const { label, reason } = RESOURCES[resource];
  Alert.alert(
    `Permiso de ${label} denegado`,
    `Sin este permiso no podemos ${reason}. Podés habilitarlo desde Ajustes.`,
    [
      { text: 'Ahora no', style: 'cancel' },
      { text: 'Abrir Ajustes', onPress: () => Linking.openSettings() },
    ]
  );
}

// Pide el permiso ANTES de usar el recurso. Devuelve true si quedó concedido.
// - concedido: sigue sin preguntar
// - pendiente (o el sistema todavía deja volver a preguntar): muestra el diálogo del sistema
// - denegado: avisa con showPermissionDenied y devuelve false
export async function ensurePermission(resource) {
  const { get, request } = RESOURCES[resource];
  const current = await get();
  if (current.granted) {
    return true;
  }
  if (current.status === 'undetermined' || current.canAskAgain) {
    const requested = await request();
    if (requested.granted) {
      return true;
    }
  }
  showPermissionDenied(resource);
  return false;
}
