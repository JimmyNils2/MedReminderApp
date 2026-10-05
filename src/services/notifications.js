import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'medication-reminders';

// Se llama una vez al iniciar la app (App.js)
export function configureNotifications() {
  // Sin este handler, las notificaciones no se muestran si la app está abierta
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Android necesita un canal para mostrar notificaciones (en iOS no aplica)
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorios de medicación',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

// Pide permiso solo la primera vez; devuelve true si se pueden mostrar notificaciones
export async function ensureNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  if (!current.canAskAgain) {
    return false;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Programa el recordatorio diario y devuelve su id (o null si no hay permiso)
export async function scheduleDailyReminder({ name, time, username }) {
  if (!(await ensureNotificationPermission())) {
    return null;
  }
  const [hour, minute] = time.split(':').map(Number);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Hora de tu medicación',
      // Se incluye el usuario porque todos comparten el mismo teléfono
      body: `Hora de tomar ${name} (${username})`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelReminder(notificationId) {
  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
}

// Para la demo: una notificación de prueba en 10 segundos. Devuelve false si no hay permiso
export async function scheduleTestNotification() {
  if (!(await ensureNotificationPermission())) {
    return false;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Notificación de prueba',
      body: 'Así te vamos a avisar cuando tengas que tomar tu medicación.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
      channelId: CHANNEL_ID,
    },
  });
  return true;
}
