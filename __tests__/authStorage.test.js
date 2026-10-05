import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearSession,
  getSession,
  getUsers,
  loginUser,
  registerUser,
  saveSession,
  seedTestUsers,
} from '../src/storage/authStorage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('crea los usuarios de prueba solo si no hay usuarios', async () => {
  await seedTestUsers();
  expect((await getUsers()).map((u) => u.username)).toEqual(['demo', 'ana']);

  await registerUser('juan', 'abc');
  await seedTestUsers();
  expect(await getUsers()).toHaveLength(3);
});

test('no permite registrar un usuario duplicado', async () => {
  await registerUser('juan', 'abc');
  await expect(registerUser('Juan ', 'otra')).rejects.toThrow('Ese usuario ya existe');
});

test('login valida usuario y contraseña', async () => {
  await registerUser('juan', 'abc');
  await expect(loginUser('juan', 'abc')).resolves.toEqual({ username: 'juan' });
  await expect(loginUser('juan', 'mala')).rejects.toThrow('Usuario o contraseña incorrectos');
  await expect(loginUser('nadie', 'abc')).rejects.toThrow('Usuario o contraseña incorrectos');
});

test('guarda y borra la sesión', async () => {
  await saveSession('juan');
  expect(await getSession()).toBe('juan');
  await clearSession();
  expect(await getSession()).toBeNull();
});
