import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!username.trim() || !password || !confirmPassword) {
      Alert.alert('Faltan datos', 'Completá todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    try {
      await register(username, password);
      Alert.alert('Cuenta creada', 'Ya podés iniciar sesión.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('No se pudo registrar', error.message);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.intro}>Creá tu cuenta para guardar tus recordatorios.</Text>

      <FormInput label="Usuario" value={username} onChangeText={setUsername} placeholder="Elegí un usuario" />
      <FormInput
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        placeholder="Tu contraseña"
        secureTextEntry
      />
      <FormInput
        label="Confirmar contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Repetí la contraseña"
        secureTextEntry
      />

      <PrimaryButton title="Registrarme" onPress={handleRegister} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.lg },
});
