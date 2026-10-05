import { isValidTime, normalizeTime } from '../src/utils/time';

test('acepta horas válidas en formato 24 h', () => {
  ['08:30', '8:30', '00:00', '23:59', ' 21:00 '].forEach((value) => {
    expect(isValidTime(value)).toBe(true);
  });
});

test('rechaza horas inválidas', () => {
  ['25:00', '24:00', '12:60', '8.30', '0830', 'abc', ''].forEach((value) => {
    expect(isValidTime(value)).toBe(false);
  });
});

test('normaliza la hora a HH:MM', () => {
  expect(normalizeTime('8:05')).toBe('08:05');
  expect(normalizeTime(' 21:00 ')).toBe('21:00');
});
