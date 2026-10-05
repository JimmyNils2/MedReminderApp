import { createContext, useContext, useEffect, useState } from 'react';
import {
  clearSession,
  getSession,
  loginUser,
  registerUser,
  saveSession,
  seedTestUsers,
} from '../storage/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true mientras se leen los usuarios y la sesión guardada al abrir la app
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await seedTestUsers();
        const username = await getSession();
        if (username) {
          setUser({ username });
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // login y register lanzan un Error con el mensaje para mostrar si algo falla
  const login = async (username, password) => {
    const loggedUser = await loginUser(username, password);
    await saveSession(loggedUser.username);
    setUser(loggedUser);
  };

  const register = (username, password) => registerUser(username, password);

  const logout = async () => {
    await clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
