import { create } from 'zustand';
import { deleteMedicationEvent } from '../services/calendar';
import { cancelReminder } from '../services/notifications';
import { deletePhoto } from '../services/photo';
import {
  addMedication,
  deleteMedication,
  getMedications,
  updateMedication,
} from '../storage/medicationStorage';
import { useAuthStore } from './authStore';

// Las acciones trabajan siempre con el usuario logueado (los datos están separados por usuario)
const currentUsername = () => useAuthStore.getState().user?.username;

// Estado global de la lista de medicaciones. Cada acción actualiza AsyncStorage y el store,
// así todas las pantallas (Home, Detalle, Alta) ven el mismo dato sin recargar ni pasar props.
export const useMedicationStore = create((set, get) => ({
  medications: [],
  loading: false,
  // Usuario cuya lista está cargada: si cambia (logout + otro login) se limpia antes de cargar
  loadedFor: null,

  load: async () => {
    const username = currentUsername();
    if (!username) return;
    if (get().loadedFor !== username) {
      set({ medications: [], loading: true, loadedFor: username });
    }
    try {
      set({ medications: await getMedications(username) });
    } finally {
      set({ loading: false });
    }
  },

  add: async (data) => {
    const medication = await addMedication(currentUsername(), data);
    set({ medications: await getMedications(currentUsername()) });
    return medication;
  },

  update: async (id, changes) => {
    const updated = await updateMedication(currentUsername(), id, changes);
    set({ medications: await getMedications(currentUsername()) });
    return updated;
  },

  // Borra la medicación, cancela su recordatorio diario, borra su foto y su evento del calendario
  remove: async (id) => {
    const deleted = await deleteMedication(currentUsername(), id);
    set((state) => ({ medications: state.medications.filter((med) => med.id !== id) }));
    deletePhoto(deleted?.photoUri);
    deleteMedicationEvent(deleted?.calendarEventId);
    await cancelReminder(deleted?.notificationId);
    return deleted;
  },

  reset: () => set({ medications: [], loading: false, loadedFor: null }),
}));

// Selector para la pantalla de detalle: lee una sola medicación del store
export const selectMedicationById = (id) => (state) =>
  state.medications.find((med) => med.id === id);
