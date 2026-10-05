import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  // El Login no tiene header: respetamos el notch/Dynamic Island arriba y la barra de inicio abajo
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Faltan datos', 'Ingresá usuario y contraseña.');
      return;
    }
    try {
      await login(username, password);
    } catch (error) {
      Alert.alert('No se pudo ingresar', error.message);
    }
  };

  // Tres bloques: logo arriba, campos en el centro y botones abajo (a mano del pulgar)
  return (
    <ScreenContainer
      hasHeader={false}
      contentStyle={{ paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.md }}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>💊</Text>
        <Text style={styles.title}>MedReminder</Text>
        <Text style={styles.subtitle}>Tus recordatorios de medicación</Text>
      </View>

      <View style={styles.form}>
        <FormInput label="Usuario" value={username} onChangeText={setUsername} placeholder="Ej: demo" />
        <FormInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Tu contraseña"
          secureTextEntry
        />
      </View>

      <View>
        <PrimaryButton title="Ingresar" onPress={handleLogin} />
        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>¿No tenés cuenta? Registrate</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center' },
  // Ocupa el espacio libre entre el logo y los botones y centra los campos en él
  form: { flex: 1, justifyContent: 'center', paddingVertical: spacing.lg },
  logo: { fontSize: 56 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: spacing.xs },
  link: { alignItems: 'center', paddingVertical: spacing.md },
  linkText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});
