import { fireEvent, render, screen } from '@testing-library/react-native';
import MedicationItem from '../src/components/MedicationItem';

test('muestra el nombre y la hora de la medicación', () => {
  render(<MedicationItem name="Ibuprofeno 400mg" time="08:30" onDelete={() => {}} />);

  expect(screen.getByText('Ibuprofeno 400mg')).toBeTruthy();
  expect(screen.getByText('08:30')).toBeTruthy();
  expect(screen.getByText('Todos los días')).toBeTruthy();
});

test('el botón eliminar llama al callback', () => {
  const onDelete = jest.fn();
  render(<MedicationItem name="Ibuprofeno 400mg" time="08:30" onDelete={onDelete} />);

  fireEvent.press(screen.getByLabelText('Eliminar Ibuprofeno 400mg'));
  expect(onDelete).toHaveBeenCalledTimes(1);
});

test('tocar la tarjeta abre el detalle y muestra la miniatura si hay foto', () => {
  const onPress = jest.fn();
  render(<MedicationItem name="Ibuprofeno" time="08:30" photoUri="file:///foto.jpg" onPress={onPress} onDelete={() => {}} />);

  expect(screen.getByLabelText('Foto de Ibuprofeno')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Ver detalle de Ibuprofeno'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
