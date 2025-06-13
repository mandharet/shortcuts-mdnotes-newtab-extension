import React from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

const MATERIAL_THEMES = [
    { value: 'google-blue', label: 'Google Blue' },
    { value: 'deep-purple', label: 'Deep Purple' },
    { value: 'teal', label: 'Teal' },
    { value: 'orange', label: 'Orange' },
    { value: 'pink', label: 'Pink' },
    { value: 'green', label: 'Green' },
    { value: 'red', label: 'Red' },
];

const SettingsPage: React.FC = () => {
    const {
        theme,
        showQuickNotes,
        showShortcuts,
        gridColumns,
        layoutOrder,
        setTheme,
        setShowQuickNotes,
        setShowShortcuts,
        setGridColumns,
        setLayoutOrder,
        updateFileSettings,
    } = useSettingsStore();

    const handleThemeChange = async (newTheme: string) => {
        setTheme(newTheme);
        await updateFileSettings({ theme: newTheme });
    };

    const handleQuickNotesChange = async (value: boolean) => {
        setShowQuickNotes(value);
        await updateFileSettings({ showQuickNotes: value });
    };

    const handleShowShortcutsChange = async (value: boolean) => {
        setShowShortcuts(value);
        await updateFileSettings({ showShortcuts: value });
    };

    const handleGridColumnsChange = async (value: number) => {
        setGridColumns(value);
        await updateFileSettings({ gridColumns: value });
    };

    const handleLayoutOrderChange = async (newOrder: "notes-first" | "shortcuts-first") => {
        setLayoutOrder(newOrder);
        await updateFileSettings({ layoutOrder: newOrder });
    };

    return (
        <div className="p-6" style={{minWidth: "250px"}}>
            <h2 className="text-xl font-medium mb-4 ">Settings</h2>

            <div className="space-y-4">
                <div>
                    <label className="flex items-center gap-2 ">
                        <input
                            type="checkbox"
                            checked={showQuickNotes}
                            onChange={(e) => handleQuickNotesChange(e.target.checked)}
                            className=""
                        />
                        Enable Quick Notes
                    </label>
                </div>

                <div>
                    <label className="flex items-center gap-2 ">
                        <input
                            type="checkbox"
                            checked={showShortcuts}
                            onChange={(e) => handleShowShortcutsChange(e.target.checked)}
                            className=""
                        />
                        Enable Shortcuts
                    </label>
                </div>

                {showShortcuts && (<div>
                    <label className="block mb-2 ">Grid Columns ({gridColumns})</label>
                    <input
                        type="range"
                        min="3"
                        max="5"
                        value={gridColumns}
                        onChange={(e) => handleGridColumnsChange(Number(e.target.value))}
                        className="w-full p-2 border border-white/20 rounded-lg bg-white/10 "
                    />
                </div>)}
                

                {showQuickNotes && showShortcuts && (
                        <div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={layoutOrder === "shortcuts-first"}
                                    onChange={(e) => handleLayoutOrderChange(e.target.checked ? "shortcuts-first" : "notes-first")}
                                    className=""
                                />
                                Show Shortcuts First
                            </label>
                        </div>
                )}
                <div>
                    <label className="block mb-2 ">Theme</label>
                    <select
                        value={theme}
                        onChange={e => handleThemeChange(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white/10 "
                    >
                        {MATERIAL_THEMES.map(t => (
                            <option key={t.value} value={t.value} >
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>

            </div>
        </div>
    );
};

export default SettingsPage; 