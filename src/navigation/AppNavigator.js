import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import AddMedicationScreen from '../screens/AddMedicationScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import MedicationDetailScreen from '../screens/MedicationDetailScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

// Stack condicional: sin sesión solo existen Login y Registro, con sesión solo Home, Alta y Detalle.
// Así no se puede entrar a la app sin loguearse ni volver a Home con "atrás" después del logout.
export default function AppNavigator() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const restore = useAuthStore((state) => state.restore);

  // Al abrir la app: usuarios de prueba + sesión guardada
  useEffect(() => {
    restore();
  }, [restore]);

  // Mientras se lee la sesión guardada no mostramos Login para que no "parpadee" si ya estaba logueado
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
          // Solo la flecha "<": con texto, iOS lo acorta según el espacio ("V...er") y queda inconsistente
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Mis medicaciones' }} />
            <Stack.Screen name="AddMedication" component={AddMedicationScreen} options={{ title: 'Nueva medicación' }} />
            <Stack.Screen name="MedicationDetail" component={MedicationDetailScreen} options={{ title: 'Detalle' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
