import React from 'react';
import { settingsService, ExtensionSettings } from '../services/settingsService';

interface SettingsFlyoutProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const MATERIAL_THEMES = [
    { value: 'google-blue', label: 'Google Blue' },
    { value: 'deep-purple', label: 'Deep Purple' },
    { value: 'teal', label: 'Teal' },
    { value: 'orange', label: 'Orange' },
    { value: 'pink', label: 'Pink' },
    { value: 'green', label: 'Green' },
    { value: 'red', label: 'Red' },
    // Removed 'dark' as it's now system preference based
];

const SettingsFlyout: React.FC<SettingsFlyoutProps> = ({
    isOpen,
    setIsOpen,
}) => {
    const [notesPath, setNotesPath] = React.useState('');
    const [notesPathError, setNotesPathError] = React.useState('');
    const [theme, setTheme] = React.useState('google-blue');
    const [showQuickNotes, setShowQuickNotes] = React.useState(false);
    const [gridColumns, setGridColumns] = React.useState(4);
    const folderInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        // Load settings when component mounts
        settingsService.getSettings().then((settings: ExtensionSettings) => {
            setTheme(settings.theme);
            setNotesPath(settings.noteSettingsPath);
            if (!notesPath) {
                setNotesPathError('Please select a folder to save settings');
            }
            setShowQuickNotes(settings.showQuickNotes);
            setGridColumns(settings.gridColumns);
            // Apply theme on load
            document.documentElement.dataset.theme = settings.theme;
        });
    }, []);

    const pickFolder = async () => {
        try {
            // @ts-ignore
            const dirHandle = await window.showDirectoryPicker();

            // Use the settings service to save the directory handle and update the path setting
            await settingsService.setNoteSettingsDirectoryHandle(dirHandle);
            // Update local state to show the selected path immediately
            setNotesPath(dirHandle.name);
            setNotesPathError('');
        } catch (e: any) {
            if (e.name === 'AbortError') {
                setNotesPathError('Folder selection was cancelled.');
            } else if (e.name === 'NotAllowedError') {
                setNotesPathError('Permission to access the folder was denied.');
            } else if (!('showDirectoryPicker' in window)) {
                setNotesPathError('Folder selection is not supported in your browser. Please use a modern browser like Chrome, Edge, or Opera.');
            } else {
                setNotesPathError('An error occurred while selecting the folder. Please try again.');
            }
        }
    };

    const handleThemeChange = async (newTheme: string) => {
        setTheme(newTheme);
        document.documentElement.dataset.theme = newTheme;
        await settingsService.updateSetting('theme', newTheme);
    };

    const handleQuickNotesChange = async (value: boolean) => {
        setShowQuickNotes(value);
        await settingsService.updateSetting('showQuickNotes', value);
    };

    const handleGridColumnsChange = async (value: number) => {
        setGridColumns(value);
        await settingsService.updateSetting('gridColumns', value);
    };

    React.useEffect(() => {
        if (!isOpen) return;
        setNotesPathError('');
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        const handleClick = (e: MouseEvent) => {
            const flyout = document.getElementById('settings-flyout');
            if (flyout && !flyout.contains(e.target as Node)) setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousedown', handleClick);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleClick);
        };
    }, [isOpen, showQuickNotes, gridColumns, notesPath]);

    React.useEffect(() => {
        if (folderInputRef.current) {
            folderInputRef.current.setAttribute('webkitdirectory', '');
            folderInputRef.current.setAttribute('directory', '');
        }
        console.log(folderInputRef);
    }, [isOpen]);

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}
            <div
                id="settings-flyout"
                className={`fixed top-0 left-0 h-full w-80 bg-surface/50 backdrop-blur-md shadow-lg z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-surface/20`}
            >
                <div className="p-6">
                    <h2 className="text-xl font-medium mb-4 text-white">Settings</h2>

                    <div className="space-y-4">
                        
                    <div>
                                <label className="block mb-2 text-white">Settings Save Location</label>
                                {!notesPath && (<button
                                    onClick={pickFolder}
                                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 border"
                                >
                                    Choose Directory
                                </button>)}

                                {notesPath && (<label
                                    onClick={pickFolder}
                                    className="block mt-2 text-white/70">{(notesPath + "/noteSettings.json")}</label>)}
                                {notesPathError && (
                                    <p className="text-red-400 text-sm mt-1">{notesPathError}</p>
                                )}
                                <p className="text-sm text-white/70 mt-2">Notes will be saved in a 'noteSettings.json' file with other settings.</p>
                            </div>
                        <div>
                            <label className="flex items-center gap-2 text-white">
                                <input
                                    type="checkbox"
                                    checked={showQuickNotes}
                                    onChange={(e) => handleQuickNotesChange(e.target.checked)}
                                    className="text-primary"
                                />
                                Enable Quick Notes
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4 mt-6">
                        <div>
                            <label className="block mb-2 text-white">Theme</label>
                            <select
                                value={theme}
                                onChange={e => handleThemeChange(e.target.value)}
                                className="w-full p-2 border border-white/20 rounded-lg bg-white/10 text-white"
                            >
                                {MATERIAL_THEMES.map(t => (
                                    <option key={t.value} value={t.value} className="text-black">{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2 text-white">Grid Columns ({gridColumns})</label>
                            <input
                                type="range"
                                min="4"
                                max="10"
                                value={gridColumns}
                                onChange={(e) => handleGridColumnsChange(Number(e.target.value))}
                                className="w-full p-2 border border-white/20 rounded-lg bg-white/10 text-white"
                            />
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </>
    );
};

export default SettingsFlyout;