import AsyncStorage from '@react-native-async-storage/async-storage';

// Claves de AsyncStorage (sin cifrado: la consigna no lo exige)
export const USERS_KEY = 'users';
export const SESSION_KEY = 'session';

// Usuarios de prueba: se crean solo si todavía no hay ningún usuario guardado
export const TEST_USERS = [
  { username: 'demo', password: '1234' },
  { username: 'ana', password: '1234' },
];

export async function getUsers() {
  const json = await AsyncStorage.getItem(USERS_KEY);
  return json ? JSON.parse(json) : [];
}

async function saveUsers(users) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function seedTestUsers() {
  const users = await getUsers();
  if (users.length === 0) {
    await saveUsers(TEST_USERS);
  }
}

const sameUsername = (a, b) => a.toLowerCase() === b.toLowerCase();

// Devuelve el usuario creado o lanza un Error con un mensaje para mostrar en pantalla
export async function registerUser(username, password) {
  const cleanUsername = username.trim();
  if (!cleanUsername || !password) {
    throw new Error('Completá usuario y contraseña.');
  }

  const users = await getUsers();
  if (users.some((u) => sameUsername(u.username, cleanUsername))) {
    throw new Error('Ese usuario ya existe. Elegí otro.');
  }

  const user = { username: cleanUsername, password };
  await saveUsers([...users, user]);
  return { username: cleanUsername };
}

export async function loginUser(username, password) {
  const users = await getUsers();
  const found = users.find((u) => sameUsername(u.username, username.trim()));
  if (!found || found.password !== password) {
    throw new Error('Usuario o contraseña incorrectos.');
  }
  return { username: found.username };
}

export async function saveSession(username) {
  await AsyncStorage.setItem(SESSION_KEY, username);
}

export async function getSession() {
  return AsyncStorage.getItem(SESSION_KEY);
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
