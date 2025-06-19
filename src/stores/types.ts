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

// Add color scheme detection
const getColorScheme = () => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Define light and dark mode colors for default ShortCuts
const SHORTCUT_COLORS = {
    light: {
        google: "#E8F0FE",
        chatgpt: "#E6F4EA",
        claude: "#F3E8FF",
        jira: "#DEEBFF",
        gemini: "#F3E5F5"
    },
    dark: {
        google: "#4285F4",
        chatgpt: "#10A37F",
        claude: "#6B4EFF",
        jira: "#0052CC",
        gemini: "#8E24AA"
    }
};


export const DEFAULT_DATA_SETTINGS: PersistedSettings & FileSettings = {
    shortcuts: [
        {
            "backgroundColor": SHORTCUT_COLORS[getColorScheme()].google,
            "id": "1749984710711",
            "title": "Google",
            "url": "www.google.com",
        },
        {
            "backgroundColor": SHORTCUT_COLORS[getColorScheme()].chatgpt,
            "id": "1749984723076",
            "title": "ChatGPT",
            "url": "www.chat.com",
        },
        {
            "backgroundColor": SHORTCUT_COLORS[getColorScheme()].claude,
            "id": "1749984732074",
            "title": "claude",
            "url": "claude.ai",
        },
        {
            "backgroundColor": SHORTCUT_COLORS[getColorScheme()].jira,
            "id": "1749984819847",
            "title": "Jira",
            "url": "jira.com",
        },
        {
            "backgroundColor": SHORTCUT_COLORS[getColorScheme()].gemini,
            "id": "1749984802427",
            "title": "Gemini",
            "url": "https://gemini.google.com/app",
        }
    ],
    theme: 'purple',
    showQuickNotes: false,
    showShortcuts: true,
    isPinnedBookMarkFlyout: false,
    gridColumns: 4,
    noteSettingsPath: '',
    notes: {},
    layoutOrder: 'shortcuts-first'
};
