import { create } from 'zustand';
import { persist, StateStorage } from 'zustand/middleware';

export interface FileSettings {
  theme: string;
  showQuickNotes: boolean;
  isPinnedBookMarkFlyout: boolean;
  gridColumns: number;
  notes: any;
  shortcuts: any[];
}

export interface LocalSettings {
  noteSettingsPath: string;
}

export interface ExtensionSettings extends LocalSettings, FileSettings {}

const DEFAULT_SETTINGS: ExtensionSettings = {
  theme: 'google-blue',
  showQuickNotes: true,
  noteSettingsPath: '',
  isPinnedBookMarkFlyout: false,
  gridColumns: 4,
  notes: {},
  shortcuts: [],
};

interface SettingsState extends ExtensionSettings {
  // Actions
  setNoteSettingsPath: (path: string) => void;
  setTheme: (theme: string) => void;
  setShowQuickNotes: (show: boolean) => void;
  setGridColumns: (columns: number) => void;
  setIsPinnedBookMarkFlyout: (isPinned: boolean) => void;
  setNotes: (notes: any) => void;
  setShortcuts: (shortcuts: any[]) => void;
  updateFileSettings: (settings: Partial<FileSettings>) => Promise<void>;
  loadFileSettings: () => Promise<void>;
}

// Helper functions for file system operations
const getDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const dbOpen = indexedDB.open('notesHandles', 1);
    dbOpen.onupgradeneeded = () => {
      dbOpen.result.createObjectStore('handles');
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
    const db = await getDb();
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

const readSettingsFromFile = async (handle: FileSystemDirectoryHandle): Promise<Partial<FileSettings> | null> => {
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

const writeSettingsToFile = async (handle: FileSystemDirectoryHandle, settings: Partial<FileSettings>): Promise<void> => {
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
    const db = await getDb();
    const tx = db.transaction('handles', 'readwrite');
    await tx.objectStore('handles').put(handle, 'notesDirHandle');
    await tx.commit(); // Use commit for modern IndexedDB
    db.close();
  } catch (error) {
    console.error('Failed to save directory handle:', error);
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set: (state: Partial<SettingsState>) => void, get: () => SettingsState) => ({
      ...DEFAULT_SETTINGS,

      // Local storage actions
      setNoteSettingsPath: (path: string) => set({ noteSettingsPath: path }),

      // File settings actions
      setTheme: (theme: string) => {
        set({ theme });
        document.documentElement.dataset.theme = theme;
      },
      setShowQuickNotes: (show: boolean) => set({ showQuickNotes: show }),
      setGridColumns: (columns: number) => set({ gridColumns: columns }),
      setIsPinnedBookMarkFlyout: (isPinned: boolean) => set({ isPinnedBookMarkFlyout: isPinned }),
      setNotes: (notes: any) => set({ notes }),
      setShortcuts: (shortcuts: any[]) => set({ shortcuts }),

      // File system operations
      updateFileSettings: async (settings: Partial<FileSettings>) => {
        const handle = await getDirectoryHandle();
        if (!handle) {
          console.warn('Directory handle not available. File settings not saved.');
          return;
        }

        const existingContent = await readSettingsFromFile(handle) || {};
        const mergedContent = {
          ...existingContent,
          ...settings,
        };

        // Preserve notes and shortcuts if not in new settings
        if (!settings.hasOwnProperty('notes') && existingContent.notes) {
          mergedContent.notes = existingContent.notes;
        }
        if (!settings.hasOwnProperty('shortcuts') && existingContent.shortcuts) {
          mergedContent.shortcuts = existingContent.shortcuts;
        }

        await writeSettingsToFile(handle, mergedContent);
        set(mergedContent);
      },

      loadFileSettings: async () => {
        const handle = await getDirectoryHandle();
        if (!handle) {
          console.warn('Directory handle not available. Cannot load file settings.');
          return;
        }

        const content = await readSettingsFromFile(handle);
        if (content) {
          set(content);
        }
      },
    }),
    {
      name: 'local-settings',
      partialize: (state: SettingsState) => ({
        noteSettingsPath: state.noteSettingsPath,
      }),
    }
  )
); 