import React from 'react';
import CardGrid from '../components/Grid/CardGrid';
import BookmarksFlyout from '../components/BookmarksFlyout/BookmarksFlyout';
import QuickNotes from '../components/QuickNotes/QuickNotes';
import { useSettingsStore } from '../stores/settingsStore';
import NotesPathSelector from '../components/NotesPathSelector/NotesPathSelector';

function App() {
  const { theme, showQuickNotes, gridColumns, noteSettingsPath, showShortcuts, _hasHydrated, loadFileSettings } = useSettingsStore();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if(theme === 'dark')
      document.documentElement.setAttribute('data-color-mode', 'dark')
  }, [theme]);

  // Load notes data when the app starts
  React.useEffect(() => {
    const loadData = async () => {
      if (_hasHydrated && noteSettingsPath) {
        try {
          await loadFileSettings();
        } catch (error) {
          console.error('Failed to load notes data:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadData();
  }, [_hasHydrated, noteSettingsPath, loadFileSettings]);

  // Show loading state while data is being loaded
  if (!_hasHydrated && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-xl">Loading...</h1>
        </div>
      </div>
    );
  }

  // If no notes path is set, show the NotesPathSelector
  if (!noteSettingsPath && showQuickNotes) {
    return <NotesPathSelector />;
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-2">

        {showShortcuts && <CardGrid columns={gridColumns} />}
        {showQuickNotes && <QuickNotes />}
        <BookmarksFlyout />
      </div>
    </div>
  );
}

export default App; 