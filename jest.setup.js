// Mock oficial de AsyncStorage: guarda en memoria durante cada test
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Las notificaciones son nativas: en los tests solo simulamos las funciones que usamos
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted', granted: true, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted', granted: true, canAskAgain: true })),
  setNotificationChannelAsync: jest.fn(async () => null),
  scheduleNotificationAsync: jest.fn(async () => 'notification-id'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  SchedulableTriggerInputTypes: { DAILY: 'daily', TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { HIGH: 4 },
}));

// Sin este mock SafeAreaProvider no conoce el tamaño de pantalla y no renderiza nada en los tests
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

// Recursos del dispositivo: todos nativos, se simulan con permiso concedido por defecto.
// Cada test puede cambiar la respuesta con mockResolvedValueOnce (por ejemplo, permiso denegado).
const grantedPermission = { status: 'granted', granted: true, canAskAgain: true };

jest.mock('expo-image-picker', () => ({
  getCameraPermissionsAsync: jest.fn(async () => grantedPermission),
  requestCameraPermissionsAsync: jest.fn(async () => grantedPermission),
  getMediaLibraryPermissionsAsync: jest.fn(async () => grantedPermission),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => grantedPermission),
  launchCameraAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'file:///camera.jpg' }] })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'file:///gallery.jpg' }] })),
}));

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => grantedPermission),
  requestForegroundPermissionsAsync: jest.fn(async () => grantedPermission),
  hasServicesEnabledAsync: jest.fn(async () => true),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: -34.6037, longitude: -58.3816 } })),
  reverseGeocodeAsync: jest.fn(async () => [{ street: 'Av. Corrientes', streetNumber: '1234', city: 'Buenos Aires' }]),
  Accuracy: { Balanced: 3 },
}));

// expo-contacts (API nueva de SDK 58): Contact.presentPicker devuelve una instancia con getFullName / getPhones
jest.mock('expo-contacts', () => {
  const pickedContact = () => ({
    id: 'contact-1',
    getFullName: jest.fn(async () => 'Dra. López'),
    getPhones: jest.fn(async () => [{ id: 'p-1', label: 'mobile', number: '11 5555-1234' }]),
  });
  return {
    getPermissionsAsync: jest.fn(async () => grantedPermission),
    requestPermissionsAsync: jest.fn(async () => grantedPermission),
    Contact: { presentPicker: jest.fn(async () => pickedContact()) },
  };
});

// expo-calendar: se usa la API legacy (la nueva no está disponible en Expo Go en SDK 58)
jest.mock('expo-calendar/legacy', () => ({
  getCalendarPermissionsAsync: jest.fn(async () => grantedPermission),
  requestCalendarPermissionsAsync: jest.fn(async () => grantedPermission),
  getDefaultCalendarAsync: jest.fn(async () => ({ id: 'calendar-1' })),
  getCalendarsAsync: jest.fn(async () => [{ id: 'calendar-1', allowsModifications: true, isPrimary: true }]),
  createEventAsync: jest.fn(async () => 'event-1'),
  deleteEventAsync: jest.fn(async () => undefined),
  EntityTypes: { EVENT: 'event' },
  Frequency: { DAILY: 'daily' },
}));

// Sistema de archivos (fotos copiadas a la carpeta de documentos): se simula sin tocar el disco
jest.mock('expo-file-system', () => {
  class Directory {
    constructor(...parts) {
      this.uri = parts.map((p) => (typeof p === 'string' ? p : p.uri)).join('/');
    }
    create() {}
  }
  class File extends Directory {
    exists = true;
    copy = jest.fn(async () => undefined);
    delete = jest.fn();
  }
  return { Directory, File, Paths: { document: new Directory('file:///documents') } };
});
