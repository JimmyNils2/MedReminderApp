# 💊 MedReminder

App móvil de **recordatorio de medicación** hecha con React Native + Expo para el Parcial 1 de Aplicaciones Móviles (ISTEA).

- **Opción elegida:** Recordatorio de medicación (nombre del medicamento + hora de recordatorio)
- **Video demo (≤ 1 min):** https://youtube.com/shorts/xE5vXZWWhEk

  [![Video demo](https://img.youtube.com/vi/xE5vXZWWhEk/0.jpg)](https://youtube.com/shorts/xE5vXZWWhEk)

## Cómo ejecutar la app

**Requisitos**
- [Node.js](https://nodejs.org/) 18 o superior
- La app **Expo Go** en el celular, compatible con **Expo SDK 57** (la versión actual de la App Store / Play Store)
- La computadora y el celular en la **misma red wifi**

**Pasos**
```bash
git clone <url-de-este-repo>
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

## Funcionalidades

- **Registro e inicio de sesión locales**: usuario + contraseña guardados en AsyncStorage. No permite usuarios repetidos y muestra un error si los datos no coinciden.
- **Sin sesión no se entra a la app**: la navegación es condicional. Sin sesión solo existen Login y Registro; con sesión, Home y Alta.
- **Sesión recordada**: al cerrar y volver a abrir la app sigue logueado hasta tocar "Cerrar sesión".
- **Alta de medicación**: nombre + hora en formato `HH:MM` (24 h). Valida que la hora sea correcta (`25:00` ❌, `8:30` → `08:30` ✅).
- **Lista de medicaciones** ordenada por hora, con opción de **eliminar** (pide confirmación).
- **Datos por usuario**: cada usuario ve solo sus medicaciones, y se mantienen al cerrar la app.
- **Notificación local diaria** a la hora de cada medicación ("Hora de tomar Ibuprofeno"). Al eliminar la medicación se cancela su notificación.
- **Notificación de prueba**: la campanita 🔔 de la Home envía una notificación a los 10 segundos.

## Tests

```bash
npm test
```
26 tests con **Jest + React Native Testing Library**:

| Archivo | Qué prueba |
|---|---|
| `MedicationItem.test.js` | Componente reutilizable: muestra nombre y hora; el botón eliminar llama al callback |
| `time.test.js` | Lógica: validación y formato de la hora (`isValidTime`, `normalizeTime`) |
| `authStorage.test.js` | Registro, usuario duplicado, login inválido, usuarios de prueba y sesión |
| `medicationStorage.test.js` | Agregar, ordenar, eliminar y datos separados por usuario |
| `notifications.test.js` | Programar y cancelar notificaciones, permiso denegado, notificación de prueba |
| `navigation.test.js` | Flujos completos: login, sesión recordada, alta, eliminar, cambio de usuario |

### Resultado

Para ver el detalle de cada test:

```bash
npm test -- --verbose
```

```
> medreminderapp@1.0.0 test
> jest --verbose

PASS __tests__/time.test.js
  ✓ acepta horas válidas en formato 24 h (5 ms)
  ✓ rechaza horas inválidas
  ✓ normaliza la hora a HH:MM

PASS __tests__/authStorage.test.js
  ✓ crea los usuarios de prueba solo si no hay usuarios (5 ms)
  ✓ no permite registrar un usuario duplicado (8 ms)
  ✓ login valida usuario y contraseña (2 ms)
  ✓ guarda y borra la sesión (1 ms)

PASS __tests__/medicationStorage.test.js
  ✓ agrega medicaciones ordenadas por hora (29 ms)
  ✓ cada usuario tiene su propia lista (1 ms)
  ✓ elimina una medicación y la devuelve (1 ms)

PASS __tests__/MedicationItem.test.js
  ✓ muestra el nombre y la hora de la medicación (241 ms)
  ✓ el botón eliminar llama al callback (8 ms)

PASS __tests__/notifications.test.js
  ✓ programa un recordatorio diario a la hora indicada (4 ms)
  ✓ sin permiso no programa nada (1 ms)
  ✓ al agregar se programa la notificación y al eliminar se cancela (670 ms)
  ✓ la campanita del header programa una notificación de prueba (161 ms)

PASS __tests__/navigation.test.js
  ✓ sin sesión muestra el Login y no la Home (121 ms)
  ✓ desde el Login se llega al Registro (78 ms)
  ✓ al iniciar sesión muestra la Home y desde ahí el Alta (152 ms)
  ✓ al cerrar sesión vuelve al Login (173 ms)
  ✓ con contraseña incorrecta no entra (78 ms)
  ✓ la sesión se mantiene al reabrir la app (167 ms)
  ✓ agregar una medicación la muestra en la Home y persiste (258 ms)
  ✓ con hora inválida no guarda y avisa (127 ms)
  ✓ eliminar pide confirmación y saca la medicación de la lista (231 ms)
  ✓ las medicaciones de un usuario no se ven con otro (295 ms)

Test Suites: 6 passed, 6 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        4.272 s
Ran all test suites.
```

## Tecnologías

- **Expo SDK 57** · React Native 0.86 · React 19
- **React Navigation** (Native Stack)
- **AsyncStorage** para usuarios, sesión y medicaciones
- **expo-notifications** para las notificaciones locales
- **Jest** (`jest-expo`) + **React Native Testing Library**

## Estructura

```
src/
├── components/   Componentes reutilizables: MedicationItem, PrimaryButton, FormInput, ScreenContainer
├── context/      AuthContext (usuario logueado, login, registro, logout)
├── navigation/   AppNavigator (Stack condicional según la sesión)
├── screens/      Login, Registro, Home y Alta de medicación
├── services/     Notificaciones locales
├── storage/      Acceso a AsyncStorage (usuarios, sesión, medicaciones)
├── utils/        Validación de la hora
└── theme.js      Colores y espaciados compartidos
__tests__/        Tests de Jest
```

## Notas

- Las contraseñas se guardan **sin cifrar** en el dispositivo: la consigna no lo requiere y no hay backend.
- Las medicaciones se guardan con la clave `medications:<usuario>`, así cada usuario tiene su propia lista.
- Los recordatorios **siguen activos al cerrar sesión**: son del teléfono y la persona tiene que tomar la medicación igual. Por eso el texto de la notificación incluye el usuario ("Hora de tomar Ibuprofeno (demo)").
- La primera vez que se agrega una medicación (o se toca la campanita) la app pide permiso de notificaciones. Si se rechaza, la medicación se guarda igual y se avisa que no va a haber recordatorio.
