import { create } from 'zustand';
import { persist, PersistStorage, StorageValue } from 'zustand/middleware';


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
  noteSettingsPath: string;
}


export interface SettingsState extends PersistedSettings, FileSettings {

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
  _hasHydrated: boolean;
  _setHasHydrated: (hydrated: boolean) => void;
}

const DEFAULT_DATA_SETTINGS: PersistedSettings & FileSettings = {

  shortcuts: [],
  theme: 'google-blue',
  showQuickNotes: true,
  showShortcuts: true,
  isPinnedBookMarkFlyout: false,
  gridColumns: 4,
  noteSettingsPath: '',
  notes: {},
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
    const fileHandle = await handle.getFileHandle('notesData.json', { create: false });
    const file = await fileHandle.getFile();
    const contents = await file.text();
    return JSON.parse(contents);
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      console.info('notesData.json not found.');
      return null;
    } else if (error.name === 'NotReadableError') {
      console.error('Permission denied to read notesData.json', error);
      return null;
    }
    console.error('Failed to read settings file:', error);
    return null;
  }
};

const writeSettingsToFile = async (handle: FileSystemDirectoryHandle, settings: FileSettings): Promise<void> => {
  try {
    const fileHandle = await handle.getFileHandle('notesData.json', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(settings, null, 2));
    await writable.close();
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      console.error('Permission denied to write to notesData.json', error);
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


type PersistedStateSubset = PersistedSettings;


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


      setNoteSettingsPath: (path: string) => set({ noteSettingsPath: path }),
      setTheme: (theme: string) => set({ theme }),
      setShowQuickNotes: (show: boolean) => {
        set({ showQuickNotes: show });
        if(!show) {
          set({ noteSettingsPath: undefined })
        }
      },
      setShowShortcuts: (show: boolean) => set({ showShortcuts: show }),
      setGridColumns: (columns: number) => set({ gridColumns: columns }),
      setIsPinnedBookMarkFlyout: (isPinned: boolean) => set({ isPinnedBookMarkFlyout: isPinned }),
      setNotes: (notes: any) => set({ notes }),
      setShortcuts: (shortcuts: any[]) => set({ shortcuts }),


      _setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),



      updateFileSettings: async (settings: Partial<PersistedSettings & FileSettings>) => {
        const handle = await getDirectoryHandle();
        if (!handle) {
          console.warn('Directory handle not available. File settings not saved.');

          set(settings);
          return;
        }


        const currentState = get();




        const contentToWriteToFile: FileSettings = {
          notes: currentState.notes,
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


if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SETTINGS_UPDATED') {
      const store = useSettingsStore.getState();
      store._setHasHydrated(true);

    }
  });
} 