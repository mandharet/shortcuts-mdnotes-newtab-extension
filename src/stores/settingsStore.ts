import { create } from 'zustand';
import { persist, StateStorage, PersistStorage, StorageValue } from 'zustand/middleware';

// Data that should always be in the file (currently just notes)
export interface FileSettings {
  notes: any;
}

// Data stored in Local Storage (chrome.storage.local) via persist middleware, and also in the file
export interface PersistedSettings {
  shortcuts: any[];
  theme: string;
  showQuickNotes: boolean;
  showShortcuts: boolean;
  isPinnedBookMarkFlyout: boolean;
  gridColumns: number;
  noteSettingsPath: string;
}

// Combined state for the Zustand store
export interface SettingsState extends PersistedSettings, FileSettings {
  // Actions
  setNoteSettingsPath: (path: string) => void;
  setTheme: (theme: string) => void;
  setShowQuickNotes: (show: boolean) => void;
  setShowShortcuts: (show: boolean) => void;
  setGridColumns: (columns: number) => void;
  setIsPinnedBookMarkFlyout: (isPinned: boolean) => void;
  setNotes: (notes: any) => void;
  setShortcuts: (shortcuts: any[]) => void;
  updateFileSettings: (settings: Partial<PersistedSettings & FileSettings>) => Promise<void>;
  loadFileSettings: () => Promise<void>;
  _hasHydrated: boolean; // Add hydration flag
  _setHasHydrated: (hydrated: boolean) => void; // Action to set hydration flag
}

const DEFAULT_DATA_SETTINGS: PersistedSettings & FileSettings = {
  // Default PersistedSettings
  shortcuts: [],
  theme: 'google-blue',
  showQuickNotes: true,
  showShortcuts: true,
  isPinnedBookMarkFlyout: false,
  gridColumns: 4,
  noteSettingsPath: '',
  // Default FileSettings
  notes: {},
};

// Helper functions for file system operations (Directory Handle) - Keep these for file access
// Note: The directory handle is still stored in IndexedDB separately, as chrome.storage cannot store handles.
const getHandleDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const dbOpen = indexedDB.open('notesHandlesDb', 1);
    dbOpen.onupgradeneeded = (event) => {
        const db = dbOpen.result;
         if (!db.objectStoreNames.contains('handles')) {
             db.createObjectStore('handles');
         }
    };
    dbOpen.onsuccess = () => resolve(dbOpen.result);
    dbOpen.onerror = () => reject(dbOpen.error);
  });
};

const getDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | undefined> => {
  if (!('indexedDB' in window)) {
    console.warn('IndexedDB not available. Cannot retrieve directory handle.');
    return undefined;
  }
  try {
    const db = await getHandleDb();
    const tx = db.transaction('handles', 'readonly');
    const request = tx.objectStore('handles').get('notesDirHandle');
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get directory handle:', error);
    return undefined;
  }
};

const readSettingsFromFile = async (handle: FileSystemDirectoryHandle): Promise<Partial<PersistedSettings & FileSettings> | null> => {
  try {
    const fileHandle = await handle.getFileHandle('noteSettings.json', { create: false });
    const file = await fileHandle.getFile();
    const contents = await file.text();
    return JSON.parse(contents);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      console.info('noteSettings.json not found.');
      return null;
    } else if (error.name === 'NotReadableError') {
      console.error('Permission denied to read noteSettings.json', error);
      return null;
    }
    console.error('Failed to read settings file:', error);
    return null;
  }
};

const writeSettingsToFile = async (handle: FileSystemDirectoryHandle, settings: PersistedSettings & FileSettings): Promise<void> => {
  try {
    const fileHandle = await handle.getFileHandle('noteSettings.json', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(settings, null, 2));
    await writable.close();
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      console.error('Permission denied to write to noteSettings.json', error);
    } else {
      console.error('Failed to write settings file:', error);
    }
  }
};

// Function to save the directory handle to IndexedDB
export const saveDirectoryHandle = async (handle: FileSystemDirectoryHandle): Promise<void> => {
  if (!('indexedDB' in window)) {
    console.warn('IndexedDB not available. Directory handle not saved.');
    return;
  }
  try {
    const db = await getHandleDb();
    const tx = db.transaction('handles', 'readwrite');
    await tx.objectStore('handles').put(handle, 'notesDirHandle');
    await tx.commit();
    db.close();
  } catch (error) {
    console.error('Failed to save directory handle:', error);
  }
};

// Define the subset of state to be persisted
type PersistedStateSubset = PersistedSettings;

// Custom storage adapter for chrome.storage.local
const chromeStorage: PersistStorage<PersistedStateSubset> = {
    getItem: async (name: string): Promise<StorageValue<PersistedStateSubset> | null> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return new Promise((resolve) => {
                chrome.storage.local.get(name, (result) => {
                    const storedValue = result?.[name];
                    if (storedValue !== undefined) {
                        try {
                            resolve(storedValue as StorageValue<PersistedStateSubset>);
                        } catch (e) {
                            console.error(`Failed to retrieve or parse stored state for ${name}:`, e);
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                });
            });
        } else {
            console.warn('chrome.storage.local not available.');
            return null;
        }
    },
    setItem: async (name: string, value: StorageValue<PersistedStateSubset>): Promise<void> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return new Promise((resolve) => {
                chrome.storage.local.set({ [name]: value }, () => {
                    // Notify other contexts about the change
                    if (chrome.runtime) {
                        chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED', data: value });
                    }
                    resolve();
                });
            });
        } else {
            console.warn('chrome.storage.local not available.');
            return Promise.resolve();
        }
    },
    removeItem: async (name: string): Promise<void> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return new Promise((resolve) => {
                chrome.storage.local.remove(name, () => {
                    resolve();
                });
            });
        } else {
            console.warn('chrome.storage.local not available.');
            return Promise.resolve();
        }
    },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_DATA_SETTINGS,
      _hasHydrated: false,

      // Actions
      setNoteSettingsPath: (path: string) => set({ noteSettingsPath: path }),
      setTheme: (theme: string) => set({ theme }),
      setShowQuickNotes: (show: boolean) => set({ showQuickNotes: show }),
      setShowShortcuts: (show: boolean) => set({ showShortcuts: show }),
      setGridColumns: (columns: number) => set({ gridColumns: columns }),
      setIsPinnedBookMarkFlyout: (isPinned: boolean) => set({ isPinnedBookMarkFlyout: isPinned }),
      setNotes: (notes: any) => set({ notes }),
      setShortcuts: (shortcuts: any[]) => set({ shortcuts }),

      // Hydration action
      _setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),

      // File system operations
      // This action saves ALL persisted settings and notes to the file.
      updateFileSettings: async (settings: Partial<PersistedSettings & FileSettings>) => {
        const handle = await getDirectoryHandle();
        if (!handle) {
          console.warn('Directory handle not available. File settings not saved.');
           // If file handle is not available, we still want to update the store state for persisted settings
           set(settings); // This will trigger local storage persistence (chrome.storage.local)
          return;
        }

        // Get the current state from the store (which includes data loaded by persist from local storage and current notes)
        const currentState = get();

        // Prepare the content to write to the file.
        // We want the file to contain ALL persisted settings and notes from the current store state,
        // plus any specific updates passed to this function.
        const contentToWriteToFile: PersistedSettings & FileSettings = {
            // Start with current state for all properties intended for the file
            shortcuts: currentState.shortcuts,
            theme: currentState.theme,
            showQuickNotes: currentState.showQuickNotes,
            showShortcuts: currentState.showShortcuts,
            isPinnedBookMarkFlyout: currentState.isPinnedBookMarkFlyout,
            gridColumns: currentState.gridColumns,
            noteSettingsPath: currentState.noteSettingsPath,
            notes: currentState.notes,
            // Overlay with any specific settings passed to this function
            ...settings,
          };

        await writeSettingsToFile(handle, contentToWriteToFile);

        // No need to call set() here, as the store state is already updated by individual setters or persist middleware.
      },

      // This action loads settings primarily from the file (currently only notes).
      // Persisted settings are loaded automatically by the persist middleware on store initialization from local storage.
      loadFileSettings: async () => {
        const handle = await getDirectoryHandle();
        if (!handle) {
          console.warn('Directory handle not available. Cannot load file settings.');
          return;
        }

        const content = await readSettingsFromFile(handle);
        if (content) {
             // Update only FileSettings (notes) from the file content.
             // Persisted settings (theme, shortcuts, etc.) are handled by the persist middleware loading from local storage.
             // We should NOT overwrite the state loaded by persist with potentially older data from the file here.
            if (content.hasOwnProperty('notes')) {
                 set({ notes: content.notes });
            }
             // Note: If the file schema evolves to include new properties not in PersistedSettings,
             // we might need merging logic here to update the state from the file for those properties.
        }
      },
    }),
    {
      name: 'local-settings',
      storage: typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local ? chromeStorage : undefined,
      onRehydrateStorage: (state) => {
        return (state) => {
          state?._setHasHydrated(true);
        };
      },
      partialize: (state) => ({
        shortcuts: state.shortcuts,
        theme: state.theme,
        showQuickNotes: state.showQuickNotes,
        showShortcuts: state.showShortcuts,
        isPinnedBookMarkFlyout: state.isPinnedBookMarkFlyout,
        gridColumns: state.gridColumns,
        noteSettingsPath: state.noteSettingsPath,
      }),
      version: 1,
    }
  )
);

// Listen for settings updates from other contexts
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SETTINGS_UPDATED') {
      const store = useSettingsStore.getState();
      store._setHasHydrated(true);
      // The store will automatically rehydrate from storage
    }
  });
} 