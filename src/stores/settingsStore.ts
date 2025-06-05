import { create } from 'zustand';
import { persist, StateStorage, PersistStorage, StorageValue } from 'zustand/middleware';


export interface FileSettings {
  notes: any;
}


export interface PersistedSettings {
  shortcuts: any[];
  theme: string;
  showQuickNotes: boolean;
  showShortcuts: boolean;
  isPinnedBookMarkFlyout: boolean;
  gridColumns: number;
}


export interface PersistedPathSetting {
  noteSettingsPath: string;
}


export interface SettingsState extends PersistedSettings, FileSettings, PersistedPathSetting {

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
}

const DEFAULT_DATA_SETTINGS: PersistedSettings & FileSettings & PersistedPathSetting = {

  shortcuts: [],
  theme: 'google-blue',
  showQuickNotes: true,
  showShortcuts: true,
  isPinnedBookMarkFlyout: false,
  gridColumns: 4,

  notes: {},

  noteSettingsPath: '',
};


const getPersistDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const dbOpen = indexedDB.open('productivityExtension', 1);
    dbOpen.onupgradeneeded = (event) => {
      const db = dbOpen.result;
      if (!db.objectStoreNames.contains('settings-store')) {
        db.createObjectStore('settings-store');
      }
    };
    dbOpen.onsuccess = () => resolve(dbOpen.result);
    dbOpen.onerror = () => reject(dbOpen.error);
  });
};


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


type PersistedStateSubset = PersistedSettings & PersistedPathSetting;

const indexedDbStorage: PersistStorage<PersistedStateSubset> = {
    getItem: async (name: string): Promise<StorageValue<PersistedStateSubset> | null> => {
        const db = await getPersistDb();
        const tx = db.transaction('settings-store', 'readonly');
        const request = tx.objectStore('settings-store').get(name);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    try {
                        const parsedResult = JSON.parse(result);
                        resolve(parsedResult as StorageValue<PersistedStateSubset>);
                    } catch (e) {
                        console.error(`Failed to parse stored state for ${name}:`, e);
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    },
    setItem: async (name: string, value: StorageValue<PersistedStateSubset>): Promise<void> => {
        const db = await getPersistDb();
        const tx = db.transaction('settings-store', 'readwrite');
        await tx.objectStore('settings-store').put(JSON.stringify(value), name);
        await tx.commit();
         db.close();
    },
    removeItem: async (name: string): Promise<void> => {
         const db = await getPersistDb();
        const tx = db.transaction('settings-store', 'readwrite');
        await tx.objectStore('settings-store').delete(name);
        await tx.commit();
         db.close();
    },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_DATA_SETTINGS,


      setNoteSettingsPath: (path: string) => set({ noteSettingsPath: path }),
      setTheme: (theme: string) => set({ theme }),
      setShowQuickNotes: (show: boolean) => set({ showQuickNotes: show }),
      setShowShortcuts: (show: boolean) => set({ showShortcuts: show }),
      setGridColumns: (columns: number) => set({ gridColumns: columns }),
      setIsPinnedBookMarkFlyout: (isPinned: boolean) => set({ isPinnedBookMarkFlyout: isPinned }),
      setNotes: (notes: any) => set({ notes }),
      setShortcuts: (shortcuts: any[]) => set({ shortcuts }),



      updateFileSettings: async (settings: Partial<PersistedSettings & FileSettings>) => {
        const handle = await getDirectoryHandle();
        if (!handle) {
          console.warn('Directory handle not available. File settings not saved.');
          return;
        }


        const existingContent = await readSettingsFromFile(handle) || {};


        const currentState = get();




        const contentToWriteToFile: PersistedSettings & FileSettings = {

          shortcuts: currentState.shortcuts,
          theme: currentState.theme,
          showQuickNotes: currentState.showQuickNotes,
          showShortcuts: currentState.showShortcuts,
          isPinnedBookMarkFlyout: currentState.isPinnedBookMarkFlyout,
          gridColumns: currentState.gridColumns,
          notes: currentState.notes,

          ...settings,
        };

        await writeSettingsToFile(handle, contentToWriteToFile);



      },



      loadFileSettings: async () => {
        const handle = await getDirectoryHandle();
        if (!handle) {
          console.warn('Directory handle not available. Cannot load file settings.');
          return;
        }

        const content = await readSettingsFromFile(handle);
        if (content) {



          if (content.hasOwnProperty('notes')) {
            set({ notes: content.notes });
          }


        }
      },
    }),
    {
      name: 'local-settings',
      storage: indexedDbStorage,

      partialize: (state): PersistedStateSubset => ({

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