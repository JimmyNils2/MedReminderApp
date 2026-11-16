# 💊 MedReminder

App móvil de **recordatorio de medicación** hecha con React Native + Expo.

- **Versión 1:** registro/login local, alta y lista de medicaciones, notificaciones diarias y tests.
- **Versión 2:** recursos del dispositivo (**foto, ubicación de la farmacia, contacto y evento en el calendario**), manejo de **permisos**, estado global con **Zustand** y más tests.

| Video demo (≤ 1 min) | Link |
|---|---|
| Demo de la app | https://youtube.com/shorts/xE5vXZWWhEk |

## Cómo ejecutar la app

**Requisitos**
- [Node.js](https://nodejs.org/) 22.13 o superior (LTS 22 o 24)
- La app **Expo Go** en el celular, compatible con **Expo SDK 58** (la versión actual de la App Store / Play Store)
- La computadora y el celular en la **misma red wifi**

**Pasos**
```bash
git clone https://github.com/JimmyNils2/MedReminderApp.git
cd MedReminderApp
npm install
npx expo start
```
Después escanear el código QR: en **iPhone** con la cámara, en **Android** desde la app Expo Go.

**Usuarios de prueba** (se crean solos la primera vez que se abre la app):

| Usuario | Contraseña |
|---|---|
| `demo` | `1234` |
| `ana` | `1234` |

También se puede crear un usuario nuevo desde "¿No tenés cuenta? Registrate".

## Nuevas funcionalidades (versión 2)

Tocando una medicación de la lista se abre su **Detalle**, desde donde se le asocian los recursos del dispositivo:

| Recurso | Qué hace | Librería |
|---|---|---|
| 📷 **Foto del medicamento** | Sacar una foto con la **cámara** o elegirla de la **galería** (recorte 4:3). Se ve en grande en el Detalle y como **miniatura en la lista**. Se puede cambiar o quitar. | `expo-image-picker`, `expo-file-system` |
| 📍 **Farmacia** | "Usar mi ubicación actual" guarda las **coordenadas** y la **dirección aproximada**. "Ver en el mapa" la abre en Apple Maps / Google Maps. | `expo-location` |
| 👤 **Contacto** (médico o familiar) | Elegir un contacto de la **agenda** del teléfono; se guarda nombre y teléfono (si tiene varios, se elige cuál). Botón "📞 Llamar". | `expo-contacts` |
| 📅 **Calendario** | Crea en el calendario del teléfono un **evento diario** "💊 Tomar X" a la hora de la medicación. "Ver en el calendario" abre la app Calendario. Al quitarlo o **eliminar la medicación**, se borra el evento. | `expo-calendar` |

### Permisos

- Cada recurso **pide su permiso antes de usarse** (servicio común en `src/services/permissions.js`).
- Se manejan los 3 estados: **concedido**, **denegado** y **pendiente** (todavía no se preguntó). El Detalle muestra un indicador por permiso (✓ / ✕ / pendiente) que se actualiza al volver de Ajustes.
- Si el permiso está **rechazado**, se muestra un mensaje claro ("Sin este permiso no podemos…") con un botón **"Abrir Ajustes"**.
- Si falla algo del recurso (GPS apagado, sin señal, sin internet para la dirección), se avisa con un mensaje entendible. Sin internet la ubicación se guarda igual, solo con coordenadas.

### Estado global con Zustand

`AuthContext` y el `useState` de la lista se reemplazaron por dos stores (`src/store/`):

- **`authStore`**: usuario logueado y acciones `restore`, `login`, `register`, `logout`.
- **`medicationStore`**: lista de medicaciones del usuario y acciones **`add`, `update`, `remove`**, `load`, `reset` + selector `selectMedicationById`.

Las pantallas leen y modifican el estado con selectores del store (`useMedicationStore((state) => state.medications)`), sin prop drilling: la Home, el Alta y el Detalle ven siempre el mismo dato. AsyncStorage sigue siendo la persistencia (cada acción guarda y actualiza el store).

## Funcionalidades de la versión 1

- **Registro e inicio de sesión locales**: usuario + contraseña guardados en AsyncStorage. No permite usuarios repetidos y muestra un error si los datos no coinciden.
- **Sin sesión no se entra a la app**: la navegación es condicional. Sin sesión solo existen Login y Registro; con sesión, Home, Alta y Detalle.
- **Sesión recordada**: al cerrar y volver a abrir la app sigue logueado hasta tocar "Cerrar sesión".
- **Alta de medicación**: nombre + hora en formato `HH:MM` (24 h). Valida que la hora sea correcta (`25:00` ❌, `8:30` → `08:30` ✅).
- **Lista de medicaciones** ordenada por hora, con opción de **eliminar** (pide confirmación).
- **Datos por usuario**: cada usuario ve solo sus medicaciones, y se mantienen al cerrar la app.
- **Notificación local diaria** a la hora de cada medicación ("Hora de tomar Ibuprofeno"). Al eliminar la medicación se cancela su notificación.
- **Notificación de prueba**: la campanita 🔔 de la Home envía una notificación a los 10 segundos.

## Tests

```bash
npm test                  # corre todos los tests
npm test -- --verbose     # muestra el nombre de cada test
npx jest --coverage       # reporte de cobertura (carpeta coverage/)
```

**63 tests en 12 archivos** con **Jest + React Native Testing Library** (cobertura ≈ 84 % de líneas). Los recursos nativos (cámara, GPS, contactos, calendario, archivos, notificaciones) se simulan con mocks en `jest.setup.js`, con permiso concedido por defecto; cada test puede simular un permiso denegado.

| Archivo | Qué prueba |
|---|---|
| `stores.test.js` | **Store de Zustand**: agregar, actualizar y eliminar actualizan el store y AsyncStorage; login/logout; cambio de usuario |
| `permissions.test.js` | Estados concedido / denegado / pendiente; **permiso denegado** muestra el aviso con "Abrir Ajustes" |
| `MedicationDetailScreen.test.js` | **Detalle**: estados vacíos, foto (cámara y galería), ubicación, contacto (con varios teléfonos), calendario, quitar recursos, cámara denegada, eliminar borra el evento |
| `location.test.js` | Ubicación + dirección, sin internet guarda solo coordenadas, permiso denegado, GPS apagado, link al mapa |
| `contacts.test.js` | Elegir contacto, cancelar la agenda, permiso denegado, link para llamar |
| `calendar.test.js` | Evento diario a la hora correcta, permiso denegado, error al crear, borrar toda la serie |
| `MedicationItem.test.js` | Componente de la lista: nombre, hora, eliminar, abrir detalle y miniatura |
| `navigation.test.js` | Flujos completos: login, sesión recordada, alta, eliminar, cambio de usuario, abrir el detalle |
| `notifications.test.js` | Programar y cancelar notificaciones, permiso denegado, notificación de prueba |
| `medicationStorage.test.js` | Agregar, ordenar, eliminar, actualizar y datos separados por usuario |
| `authStorage.test.js` | Registro, usuario duplicado, login inválido, usuarios de prueba y sesión |
| `time.test.js` | Validación y formato de la hora |

## Tecnologías

- **Expo SDK 58** · React Native 0.88 · React 19
- **Zustand** para el estado global
- **React Navigation** (Native Stack)
- **AsyncStorage** para usuarios, sesión y medicaciones
- **expo-image-picker**, **expo-file-system**, **expo-location**, **expo-contacts**, **expo-calendar**, **expo-notifications**
- **Jest** (`jest-expo`) + **React Native Testing Library**

## Estructura

```
src/
├── components/   Componentes reutilizables: MedicationItem, PermissionBadge, PrimaryButton, FormInput, ScreenContainer
├── navigation/   AppNavigator (Stack condicional según la sesión)
├── screens/      Login, Registro, Home, Alta y Detalle de medicación
├── services/     Permisos, foto, ubicación, contactos, calendario y notificaciones
├── storage/      Acceso a AsyncStorage (usuarios, sesión, medicaciones)
├── store/        Stores de Zustand: authStore y medicationStore
├── utils/        Validación de la hora
└── theme.js      Colores y espaciados compartidos
__tests__/        Tests de Jest
jest.setup.js     Mocks de los módulos nativos
```

**Modelo de una medicación**
```js
{
  id, name, time: 'HH:MM', notificationId,
  photoUri,                               // foto copiada a la carpeta de documentos de la app
  pharmacy: { latitude, longitude, address },
  contact: { id, name, phone },
  calendarEventId,                        // id del evento diario en el calendario del teléfono
}
```
Las medicaciones guardadas con la versión 1 se leen igual: los campos nuevos quedan en `null`.

## Notas

- **Expo SDK 58:** en esta versión `expo-contacts` y `expo-calendar` cambiaron su API. Las funciones viejas importadas desde el paquete tiran error, así que la app usa la **API nueva de contactos** (`Contact.presentPicker()`) y, para el calendario, **`expo-calendar/legacy`**, porque la API nueva de calendario todavía no está disponible en Expo Go.
- La foto se **copia a la carpeta de la app** (la de la cámara/galería es temporal) y se borra al cambiarla, quitarla o eliminar la medicación.
- El evento del calendario **no tiene alarma**: el aviso ya lo da la notificación de la app, así no suena dos veces.
- **Limitación conocida:** si se quita el evento o se elimina la medicación **con el permiso de calendario denegado**, la app no puede borrar el evento y queda en el calendario del teléfono (se puede borrar a mano con "Eliminar todos los eventos futuros").
- En **Expo Go** los textos de los diálogos de permisos son los de Expo Go. Los propios de la app están configurados en `app.json` y se usan en un build propio.
- Las contraseñas se guardan **sin cifrar** en el dispositivo: la consigna no lo requiere y no hay backend.
- Las medicaciones se guardan con la clave `medications:<usuario>`, así cada usuario tiene su propia lista.
- Los recordatorios **siguen activos al cerrar sesión**: son del teléfono y la persona tiene que tomar la medicación igual. Por eso el texto de la notificación incluye el usuario ("Hora de tomar Ibuprofeno (demo)").
