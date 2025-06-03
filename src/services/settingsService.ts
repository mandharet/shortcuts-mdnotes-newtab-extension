export interface ExtensionSettings {
  theme: string;
  showQuickNotes: boolean;
  noteSettingsPath: string;
  isPinnedBookMarkFlyout: boolean;
  gridColumns: number;
  notes: any;
  shortcuts: any[];
}

export interface LocalSettings {
  noteSettingsPath: string;
}

export interface FileSettings {
  theme: string;
  showQuickNotes: boolean;
  isPinnedBookMarkFlyout: boolean;
  gridColumns: number;
  notes: any;
  shortcuts: any[];
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

// Function to get the IndexedDB database instance
const getDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const dbOpen = indexedDB.open('notesHandles', 1);

    dbOpen.onupgradeneeded = () => {
      dbOpen.result.createObjectStore('handles');
    };

    dbOpen.onsuccess = () => {
      resolve(dbOpen.result);
    };

    dbOpen.onerror = () => {
      reject(dbOpen.error);
    };
  });
};

// Function to save the directory handle to IndexedDB
const saveDirectoryHandle = async (handle: FileSystemDirectoryHandle): Promise<void> => {
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

// Function to get the directory handle from IndexedDB
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

// Function to read settings from the noteSettings.json file
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

// Function to write settings to the noteSettings.json file
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

// --- Helper functions for reading/writing specific setting groups ---

// Reads settings designated for chrome.storage.local
const _getLocalSettings = async (): Promise<Partial<LocalSettings>> => {
    console.log('Attempting to get local settings...');
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['settings'], (result) => {
                const settings = result.settings as Partial<LocalSettings> || {};
                console.log('Retrieved local settings:', settings);
                resolve({ noteSettingsPath: settings.noteSettingsPath });
            });
        });
    } else {
        console.warn('chrome.storage.local not available. Cannot read local settings.');
        return {};
    }
};

// Saves settings designated for chrome.storage.local
const _saveLocalSettings = async (settings: Partial<LocalSettings>): Promise<void> => {
    console.log('Attempting to save local settings:', settings);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['settings'], (result) => {
                const currentLocalSettings = result.settings || {};
                const newLocalSettings = { ...currentLocalSettings, ...settings };
                // Ensure only allowed keys are saved back
                const finalLocalSettings: Partial<LocalSettings> = {};
                if (newLocalSettings.hasOwnProperty('showQuickNotes')) {
                    (finalLocalSettings as any).showQuickNotes = (newLocalSettings as any).showQuickNotes;
                }
                if (newLocalSettings.hasOwnProperty('noteSettingsPath')) {
                    (finalLocalSettings as any).noteSettingsPath = (newLocalSettings as any).noteSettingsPath;
                }
                chrome.storage.local.set({ settings: finalLocalSettings }, () => {
                    console.log('Local settings saved.', finalLocalSettings);
                    resolve();
                });
            });
        });
    } else {
         console.warn('chrome.storage.local not available. Local settings not saved.');
         return Promise.resolve();
    }
};

// Reads settings designated for the noteSettings.json file
const _getFileSettings = async (): Promise<Partial<FileSettings> | null> => {
    console.log('Attempting to get file settings...');
    const handle = await getDirectoryHandle();
    if (!handle) {
        console.warn('Directory handle not available. Cannot read file settings.');
        return null;
    }
    console.log('Directory handle available. Reading file...');
    const content = await readSettingsFromFile(handle);
    // readSettingsFromFile already filters for FileSettings keys
    console.log('Retrieved file settings:', content);
    return content; 
};

// Saves settings designated for the noteSettings.json file
const _saveFileSettings = async (settings: Partial<FileSettings>): Promise<void> => {
     console.log('Attempting to save file settings:', settings);
     if (Object.keys(settings).length === 0) return; // Nothing to save

     const handle = await getDirectoryHandle();
     if (!handle) {
         console.warn('Directory handle not available. File settings not saved.');
         // Consider queuing file saves if handle becomes available later
         return;
     }
     console.log('Directory handle available. Writing file...');
     // Read existing file settings to merge (important for not overwriting other data like notes/shortcuts)
     const existingFileContent = await readSettingsFromFile(handle) || {};

     const mergedFileContent = { 
         ...(existingFileContent || {}), // Spread existing content
         ...settings // Spread the new file settings
     };
     // Explicitly preserve notes and shortcuts if they were in existing content and not in new settings
     if (!settings.hasOwnProperty('notes') && (existingFileContent as FileSettings)?.notes) {
         (mergedFileContent as FileSettings).notes = (existingFileContent as FileSettings).notes;
     }
     if (!settings.hasOwnProperty('shortcuts') && (existingFileContent as FileSettings)?.shortcuts) {
         (mergedFileContent as FileSettings).shortcuts = (existingFileContent as FileSettings).shortcuts;
     }

     await writeSettingsToFile(handle, mergedFileContent);
     console.log('File settings saved.', mergedFileContent);
};


// --- Main settingsService methods ---

export const settingsService = {
  async getSettings(): Promise<ExtensionSettings> {
    console.log('Getting all settings...');
    // 1. Read from chrome.storage.local
    const localSettings = await _getLocalSettings();
    let fileSettings: Partial<FileSettings> = {};

    // 2. If noteSettingsPath is available, try to read from file
    const noteSettingsPath = localSettings.noteSettingsPath;
    if (noteSettingsPath) {
        const content = await _getFileSettings();
        if (content) {
             fileSettings = content;
        }
    }

    // 3. Merge settings: Default -> Local Storage -> File
    const finalSettings = { ...DEFAULT_SETTINGS, ...localSettings, ...fileSettings };
    console.log('Final merged settings:', finalSettings);
    return finalSettings;
  },

  async saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    console.log('Saving settings:', settings);
    const localSettingsToSave: Partial<LocalSettings> = {};
    const fileSettingsToSave: Partial<FileSettings> = {};

    // Separate settings based on where they should be stored
    if (settings.hasOwnProperty('noteSettingsPath')) localSettingsToSave.noteSettingsPath = settings.noteSettingsPath;
    
    if (settings.hasOwnProperty('showQuickNotes')) fileSettingsToSave.showQuickNotes = settings.showQuickNotes;
    if (settings.hasOwnProperty('gridColumns')) fileSettingsToSave.gridColumns = settings.gridColumns;
    if (settings.hasOwnProperty('isPinnedBookMarkFlyout')) fileSettingsToSave.isPinnedBookMarkFlyout = settings.isPinnedBookMarkFlyout;
    if (settings.hasOwnProperty('theme')) fileSettingsToSave.theme = settings.theme;
    if (settings.hasOwnProperty('notes')) fileSettingsToSave.notes = settings.notes; 
    if (settings.hasOwnProperty('shortcuts')) fileSettingsToSave.shortcuts = settings.shortcuts; 

    // 1. Save to chrome.storage.local
    if (Object.keys(localSettingsToSave).length > 0) {
        await _saveLocalSettings(localSettingsToSave);
    }

    // 2. Save to noteSettings.json
    if (Object.keys(fileSettingsToSave).length > 0) {
        await _saveFileSettings(fileSettingsToSave);
    }
    console.log('Save settings complete.');
  },

  async updateSetting<K extends keyof ExtensionSettings>(
    key: K,
    value: ExtensionSettings[K]
  ): Promise<void> {
    console.log(`Updating setting: ${key} with value: ${value}`);
    // Use saveSettings to handle the logic of saving to the correct location
    await this.saveSettings({ [key]: value } as Partial<ExtensionSettings>);
  },

  // New function to save the directory handle
  async setNoteSettingsDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
      console.log('Setting notes directory handle...');
      await saveDirectoryHandle(handle);
      // Update the noteSettingsPath setting in local storage
      const fullPath = handle.name; // Note: This is just the directory name, not the full system path
      console.log(`Saving noteSettingsPath to local storage: ${fullPath}`);
      await this.updateSetting('noteSettingsPath', fullPath);
      console.log('Notes directory handle set and path updated.');
  }
}; 