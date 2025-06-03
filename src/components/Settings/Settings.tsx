import React from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { settingsService, ExtensionSettings } from '../../services/settingsService';

interface SettingsProps {
  showQuickNotes: boolean;
  onQuickNotesChange: (value: boolean) => void;
  gridColumns: number;
  onGridColumnsChange: (value: number) => void;
}

const MATERIAL_THEMES = [
  { value: 'google-blue', label: 'Google Blue' },
  { value: 'deep-purple', label: 'Deep Purple' },
  { value: 'teal', label: 'Teal' },
  { value: 'orange', label: 'Orange' },
  { value: 'pink', label: 'Pink' },
  { value: 'green', label: 'Green' },
  { value: 'red', label: 'Red' },
  { value: 'dark', label: 'Dark' },
];

const Settings: React.FC<SettingsProps> = ({
  showQuickNotes,
  onQuickNotesChange,
  gridColumns,
  onGridColumnsChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'general' | 'quicknotes'>('general');
  const [noteSettingsPath, setNotesPath] = React.useState('');
  const [notesPathError, setNotesPathError] = React.useState('');
  const folderInputRef = React.useRef<HTMLInputElement>(null);
  const [theme, setTheme] = React.useState('google-blue');

  React.useEffect(() => {
    // Load settings when component mounts
    settingsService.getSettings().then((settings) => {
      setTheme(settings.theme);
      setNotesPath(settings.noteSettingsPath);
      document.documentElement.dataset.theme = settings.theme;
    });
  }, []);

  const handleSave = async () => {
    if (showQuickNotes && !noteSettingsPath) {
      setActiveTab('quicknotes');
      setNotesPathError('Please select a file path for notes.');
      return;
    }

    await settingsService.saveSettings({
      theme,
      showQuickNotes,
      noteSettingsPath,
    });

    setIsOpen(false);
  };

  const pickFolder = async () => {
    try {
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();
      // Store the handle in IndexedDB for persistence
      if ('indexedDB' in window) {
        const dbOpen = indexedDB.open('notesHandles', 1);
        dbOpen.onupgradeneeded = () => {
          dbOpen.result.createObjectStore('handles');
        };
        dbOpen.onsuccess = () => {
          const db = dbOpen.result;
          const tx = db.transaction('handles', 'readwrite');
          tx.objectStore('handles').put(dirHandle, 'notesDirHandle');
          tx.oncomplete = () => db.close();
        };
      }
      setNotesPath('noteSettings.json');
      setNotesPathError('');
    } catch (e) {
      alert('Folder selection was cancelled or not supported.');
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.dataset.theme = newTheme;
    await settingsService.updateSetting('theme', newTheme);
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
      if (e.key === 'Enter') handleSave();
    };
    const handleClick = (e: MouseEvent) => {
      const modal = document.getElementById('settings-modal');
      if (modal && !modal.contains(e.target as Node)) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, showQuickNotes, gridColumns]);

  React.useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"
      >
        <Cog6ToothIcon className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div id="settings-modal" className="bg-white rounded-lg p-6 w-[32rem]">
            <h2 className="text-xl font-medium mb-4">Settings</h2>
            <div className="flex border-b mb-4">
              <button onClick={() => setActiveTab('general')} className={`px-4 py-2 ${activeTab === 'general' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}>General</button>
              <button onClick={() => setActiveTab('quicknotes')} className={`px-4 py-2 ${activeTab === 'quicknotes' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}>Quick Notes</button>
            </div>
            
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">Theme</label>
                  <select
                    value={theme}
                    onChange={e => handleThemeChange(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    {MATERIAL_THEMES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Grid Columns ({gridColumns})</label>
                  <input
                    type="number"
                    min="4"
                    max="10"
                    value={gridColumns}
                    onChange={(e) => onGridColumnsChange(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {activeTab === 'quicknotes' && (
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showQuickNotes}
                      onChange={(e) => onQuickNotesChange(e.target.checked)}
                    />
                    Enable Quick Notes
                  </label>
                </div>
                {showQuickNotes && (
                  <div>
                    <label className="block mb-2">Notes Save Location</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteSettingsPath}
                        readOnly
                        placeholder="Select a folder to save notes"
                        className="flex-1 p-2 border rounded"
                        hidden
                      />
                      <button
                        onClick={pickFolder}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Pick Folder
                      </button>
                    </div>
                    {notesPathError && (
                      <p className="text-red-500 text-sm mt-1">{notesPathError}</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 btn-secondary rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 btn-primary rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Settings; 