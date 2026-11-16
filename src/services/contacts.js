import { Contact } from 'expo-contacts';
import { Linking } from 'react-native';
import { ensurePermission } from './permissions';

// Error con un mensaje listo para mostrarle al usuario
export class ContactError extends Error {}

// Abre la agenda nativa para elegir un médico o familiar.
// Devuelve { id, name, phones: ['11 5555-1234', ...] }, o null si no hay permiso o el usuario canceló.
// (En SDK 58 se usa la API nueva de expo-contacts: Contact.presentPicker + getFullName / getPhones)
export async function pickContact() {
  if (!(await ensurePermission('contacts'))) {
    return null;
  }

  let contact;
  try {
    contact = await Contact.presentPicker();
  } catch {
    throw new ContactError('No se pudo abrir la agenda de contactos.');
  }
  if (!contact) {
    return null; // el usuario cerró la agenda sin elegir
  }

  try {
    const [name, phones] = await Promise.all([contact.getFullName(), contact.getPhones()]);
    return {
      id: contact.id,
      name: name?.trim() || 'Contacto sin nombre',
      phones: phones.map((phone) => phone.number?.trim()).filter(Boolean),
    };
  } catch {
    throw new ContactError('No se pudieron leer los datos del contacto elegido.');
  }
}

// Link para llamar desde el teléfono (se quitan espacios, guiones y paréntesis)
export function telUrl(phone) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function callPhone(phone) {
  return Linking.openURL(telUrl(phone));
}
