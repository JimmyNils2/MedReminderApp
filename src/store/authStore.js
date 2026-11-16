import { create } from 'zustand';
import {
  clearSession,
  getSession,
  loginUser,
  registerUser,
  saveSession,
  seedTestUsers,
} from '../storage/authStorage';

// Estado global del usuario autenticado (reemplaza al AuthContext de la versión 1).
// AsyncStorage sigue siendo la "base de datos"; el store es lo que leen las pantallas.
export const useAuthStore = create((set) => ({
  user: null,
  // true mientras se leen los usuarios y la sesión guardada al abrir la app
  loading: true,

  // Se llama al montar la app: crea los usuarios de prueba y recupera la sesión guardada
  restore: async () => {
    set({ loading: true });
    try {
      await seedTestUsers();
      const username = await getSession();
      set({ user: username ? { username } : null });
    } finally {
      set({ loading: false });
    }
  },

  // login y register lanzan un Error con el mensaje para mostrar si algo falla
  login: async (username, password) => {
    const user = await loginUser(username, password);
    await saveSession(user.username);
    set({ user });
  },

  register: (username, password) => registerUser(username, password),

  logout: async () => {
    await clearSession();
    set({ user: null });
  },
}));
