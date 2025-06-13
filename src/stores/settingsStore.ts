import { create } from 'zustand';
import { persist, PersistStorage, StorageValue } from 'zustand/middleware';
import { logger } from '../utils/logger';

export interface NoteData {
  content: string;
  date: string;
}

export interface DayNotes {
  [day: string]: NoteData;
}

export interface MonthNotes {
  [month: string]: DayNotes;
}

export interface YearNotes {
  [year: string]: MonthNotes;
}

export interface FileSettings {
  notes: YearNotes;
}

export interface PersistedSettings {
  shortcuts: any[];
  theme: string;
  showQuickNotes: boolean;
  showShortcuts: boolean;
  isPinnedBookMarkFlyout: boolean;
  gridColumns: number;
  noteSettingsPath: string;
  layoutOrder: 'notes-first' | 'shortcuts-first';
}

export interface SettingsState extends PersistedSettings, FileSettings {
  setNoteSettingsPath: (path: string) => void;
  setTheme: (theme: string) => void;
  setShowQuickNotes: (show: boolean) => void;
  setShowShortcuts: (show: boolean) => void;
  setGridColumns: (columns: number) => void;
  setIsPinnedBookMarkFlyout: (isPinned: boolean) => void;
  setNotes: (notes: YearNotes) => void;
  setShortcuts: (shortcuts: any[]) => void;
  updateFileSettings: (settings: Partial<PersistedSettings & FileSettings>) => Promise<void>;
  loadFileSettings: () => Promise<void>;
  _hasHydrated: boolean;
  _setHasHydrated: (hydrated: boolean) => void;
  setLayoutOrder: (layout: 'notes-first' | 'shortcuts-first') => void;
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
  layoutOrder: 'shortcuts-first'
};

// Helper function to parse date into year, month, day
export const parseDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return {
    year: date.getFullYear().toString(),
    month: (date.getMonth() + 1).toString().padStart(2, '0'),
    day: date.getDate().toString().padStart(2, '0')
  };
};

// Helper function to get note from hierarchical structure
export const getNote = (notes: YearNotes, dateStr: string): NoteData | undefined => {
  const { year, month, day } = parseDate(dateStr);
  return notes[year]?.[month]?.[day];
};

// Helper function to set note in hierarchical structure
export const setNote = (notes: YearNotes, dateStr: string, noteData: NoteData): YearNotes => {
  const { year, month, day } = parseDate(dateStr);
  return {
    ...notes,
    [year]: {
      ...notes[year],
      [month]: {
        ...notes[year]?.[month],
        [day]: noteData
      }
    }
  };
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
    logger.warn('IndexedDB not available. Cannot retrieve directory handle.');
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
    logger.error('Failed to get directory handle:', error);
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
      logger.info('notesData.json not found.');
      return null;
    } else if (error.name === 'NotReadableError') {
      logger.error('Permission denied to read notesData.json', error);
      return null;
    }
    logger.error('Failed to read settings file:', error);
    return null;
  }
};

const writeSettingsToFile = async (handle: FileSystemDirectoryHandle, settings: FileSettings): Promise<void> => {
  try {
    if (!settings.notes || Object.keys(settings.notes).length === 0) {
      logger.warn('Attempted to write empty notes to file. Operation cancelled.');
      return;
    }

    const fileHandle = await handle.getFileHandle('notesData.json', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(settings, null, 2));
    await writable.close();
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      logger.error('Permission denied to write to notesData.json', error);
    } else {
      logger.error('Failed to write settings file:', error);
    }
  }
};

export const saveDirectoryHandle = async (handle: FileSystemDirectoryHandle): Promise<void> => {
  if (!('indexedDB' in window)) {
    logger.warn('IndexedDB not available. Directory handle not saved.');
    return;
  }
  try {
    const db = await getHandleDb();
    const tx = db.transaction('handles', 'readwrite');
    await tx.objectStore('handles').put(handle, 'notesDirHandle');
    await tx.commit();
    db.close();
  } catch (error) {
    logger.error('Failed to save directory handle:', error);
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
              logger.error(`Failed to retrieve or parse stored state for ${name}:`, e);
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });
      });
    } else {
      logger.warn('chrome.storage.local not available.');
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
      logger.warn('chrome.storage.local not available.');
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
      logger.warn('chrome.storage.local not available.');
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
        logger.info('Setting showQuickNotes:', {
          show,
          currentNotes: get().notes,
          stack: new Error().stack
        });
        set({ showQuickNotes: show });
      },
      setShowShortcuts: (show: boolean) => set({ showShortcuts: show }),
      setGridColumns: (columns: number) => set({ gridColumns: columns }),
      setIsPinnedBookMarkFlyout: (isPinned: boolean) => set({ isPinnedBookMarkFlyout: isPinned }),
      setNotes: (notes: YearNotes) => set({ notes }),
      setShortcuts: (shortcuts: any[]) => set({ shortcuts }),

      _setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),
      setLayoutOrder: (layout: 'notes-first' | 'shortcuts-first') => set({ layoutOrder: layout }),

      updateFileSettings: async (settings: Partial<PersistedSettings & FileSettings>) => {
        const handle = await getDirectoryHandle();
        if (!handle) {
          logger.warn('Directory handle not available. File settings not saved.');
          set(settings);
          return;
        }

        const currentState = get();
        logger.info('updateFileSettings called with:', {
          settings,
          currentStateNotes: currentState.notes,
          hasNotesInSettings: !!settings.notes,
          notesKeys: settings.notes ? Object.keys(settings.notes) : [],
          stack: new Error().stack
        });

        // Safety check: Don't overwrite notes with empty data
        if (settings.notes && Object.keys(settings.notes).length === 0) {
          logger.warn('Attempted to save empty notes data. Operation cancelled.');
          return;
        }

        // Use the new notes data if provided, otherwise use current state
        const contentToWriteToFile: FileSettings = {
          notes: settings.notes || currentState.notes
        };

        logger.info('Writing to file:', contentToWriteToFile);
        await writeSettingsToFile(handle, contentToWriteToFile);
      },

      loadFileSettings: async () => {
        const handle = await getDirectoryHandle();
        if (!handle) {
          logger.warn('Directory handle not available. Cannot load file settings.');
          return;
        }

        const content = await readSettingsFromFile(handle);
        logger.info('Loaded content:', content);

        if (content?.notes) {
          // Directly use the notes from the file
          set({ notes: content.notes });
          logger.info('Updated state with notes:', content.notes);
        } else {
          logger.warn('No notes found in the loaded content');
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
      partialize: (state) => {
        const { notes, ...uiSettings } = state;
        return uiSettings;
      },
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