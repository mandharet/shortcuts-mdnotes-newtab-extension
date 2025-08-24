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


export const DEFAULT_DATA_SETTINGS: PersistedSettings & FileSettings = {
    shortcuts: [],
    theme: 'purple',
    showQuickNotes: false,
    showShortcuts: true,
    isPinnedBookMarkFlyout: true,
    gridColumns: 4,
    noteSettingsPath: '',
    notes: {},
    layoutOrder: 'shortcuts-first'
};
