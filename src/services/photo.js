import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { ensurePermission } from './permissions';

// Opciones comunes: solo imágenes, recorte 4:3 (como se muestra en el Detalle) y comprimidas
const PICKER_OPTIONS = { mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.6 };

// Las fotos se copian a la carpeta de documentos de la app: la que devuelve image-picker
// está en la caché y el sistema la puede borrar
const photosDir = () => new Directory(Paths.document, 'photos');

async function persistPhoto(uri) {
  const dir = photosDir();
  dir.create({ idempotent: true });
  const extension = uri.split('.').pop()?.split('?')[0] || 'jpg';
  const destination = new File(dir, `med-${Date.now()}.${extension}`);
  await new File(uri).copy(destination);
  return destination.uri;
}

// source: 'camera' | 'gallery'. Pide el permiso correspondiente, abre la cámara o la galería
// y devuelve la URI guardada, o null si no hay permiso o el usuario canceló
export async function pickPhoto(source) {
  if (!(await ensurePermission(source))) {
    return null;
  }
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  if (result.canceled || !result.assets?.length) {
    return null;
  }
  return persistPhoto(result.assets[0].uri);
}

// Borra una foto guardada por la app (al cambiarla, quitarla o eliminar la medicación)
export function deletePhoto(uri) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Si ya no existe no hay nada que limpiar
  }
}
