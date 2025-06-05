import React from 'react';
import { useSettingsStore, saveDirectoryHandle } from '../../stores/settingsStore';

const NotesPathSelector: React.FC = () => {
    const { setNoteSettingsPath, loadFileSettings } = useSettingsStore();
    const [error, setError] = React.useState('');

    const pickFolder = async () => {
        try {
            // @ts-ignore
            const dirHandle = await window.showDirectoryPicker();
            await saveDirectoryHandle(dirHandle);
            setNoteSettingsPath(dirHandle.name);
            setError('');
            // Load settings from the newly selected file
            await loadFileSettings();
        } catch (e: any) {
            if (e.name === 'AbortError') {
                setError('Folder selection was cancelled.');
            } else if (e.name === 'NotAllowedError') {
                setError('Permission to access the folder was denied.');
            } else if (!('showDirectoryPicker' in window)) {
                setError('Folder selection is not supported in your browser. Please use a modern browser like Chrome, Edge, or Opera.');
            } else {
                setError('An error occurred while selecting the folder. Please try again.');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-surface/50 backdrop-blur-md flex items-center justify-center">
            <div className="bg-surface/80 p-8 rounded-lg shadow-lg max-w-md w-full mx-4 border border-surface/20">
                <div className="text-center space-y-6">
                    <h2 className="text-2xl font-medium">Welcome to Quick Notes</h2>
                    
                    <div className="space-y-4">
                        <p className="opacity-70">
                            Please select a folder to store your notes and settings.
                        </p>
                        
                        <button
                            onClick={pickFolder}
                            className="w-full px-6 py-3 bg-primary rounded-lg hover:bg-primary/90 transition-colors border border-primary/20"
                        >
                            Choose Directory
                        </button>

                        {error && (
                            <p className="text-red-400 text-sm">{error}</p>
                        )}

                        <p className="text-sm">
                            Your notes and settings will be saved in a 'noteSettings.json' file within the selected directory.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotesPathSelector; 