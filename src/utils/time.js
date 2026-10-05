// Hora válida en formato 24 h: "08:30", "8:30" o "23:59" (no "24:00", "12:60" ni "8.30")
const TIME_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value) {
  return TIME_REGEX.test(value.trim());
}

// Completa con cero a la izquierda para guardar siempre "HH:MM" ("8:30" → "08:30")
export function normalizeTime(value) {
  const [, hours, minutes] = value.trim().match(TIME_REGEX);
  return `${hours.padStart(2, '0')}:${minutes}`;
}
