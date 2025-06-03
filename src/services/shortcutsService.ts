import { CardData } from '../components/Grid/CardGrid';

interface ShortcutsData {
  shortcuts: CardData[][];
}

export const shortcutsService = {
  async getShortcutsFileHandle() {
    return new Promise<any>((resolve, reject) => {
      if (!('indexedDB' in window)) return reject('IndexedDB not supported');
      const dbOpen = indexedDB.open('notesHandles', 1);
      dbOpen.onupgradeneeded = () => dbOpen.result.createObjectStore('handles');
      dbOpen.onsuccess = async () => {
        const db = dbOpen.result;
        const tx = db.transaction('handles', 'readonly');
        const req = tx.objectStore('handles').get('notesDirHandle');
        req.onsuccess = async () => {
          const dirHandle = req.result;
          if (dirHandle && dirHandle.getFileHandle) {
            const fileHandle = await dirHandle.getFileHandle('noteSettings.json', { create: true });
            resolve(fileHandle);
          } else {
            reject('No directory handle found');
          }
          db.close();
        };
        req.onerror = () => reject('Failed to get handle');
      };
    });
  },

  async loadShortcuts(): Promise<ShortcutsData> {
    try {
      const fileHandle = await this.getShortcutsFileHandle();
      const file = await fileHandle.getFile();
      const text = await file.text();
      const data = JSON.parse(text);
      return {
        shortcuts: data.shortcuts || []
      };
    } catch {
      return { shortcuts: [] };
    }
  },

  async saveShortcuts(shortcuts: CardData[][]): Promise<void> {
    try {
      const fileHandle = await this.getShortcutsFileHandle();
      const file = await fileHandle.getFile();
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Update shortcuts while preserving notes data
      const updatedData = {
        ...data,
        shortcuts
      };

      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(updatedData));
      await writable.close();
    } catch (error) {
      console.error('Failed to save shortcuts:', error);
      throw error;
    }
  },

  async updateShortcutPosition(
    sourceRow: number,
    sourceCol: number,
    destRow: number,
    destCol: number
  ): Promise<void> {
    try {
      const data = await this.loadShortcuts();
      const shortcuts = data.shortcuts;
      
      // Ensure arrays exist
      if (!shortcuts[sourceRow]) shortcuts[sourceRow] = [];
      if (!shortcuts[destRow]) shortcuts[destRow] = [];
      
      // Move the shortcut
      const [movedShortcut] = shortcuts[sourceRow].splice(sourceCol, 1);
      shortcuts[destRow].splice(destCol, 0, movedShortcut);
      
      await this.saveShortcuts(shortcuts);
    } catch (error) {
      console.error('Failed to update shortcut position:', error);
      throw error;
    }
  }
}; 