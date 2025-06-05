import React from 'react';
import CardGrid from './components/Grid/CardGrid';
import BookmarksFlyout from './components/BookmarksFlyout/BookmarksFlyout';
import QuickNotes from './components/QuickNotes/QuickNotes';
import { useSettingsStore } from './stores/settingsStore';
import NotesPathSelector from './components/NotesPathSelector/NotesPathSelector';

function App() {
  const { theme, showQuickNotes, gridColumns, noteSettingsPath, showShortcuts, _hasHydrated } = useSettingsStore();

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if(theme === 'dark')
      document.documentElement.setAttribute('data-color-mode', 'dark')
  }, [theme]);

  // Wait for the store to hydrate from local storage
  if (!_hasHydrated) {
    return <h1>Loading....</h1>; // Or a loading spinner
  }

  // If no notes path is set, show the NotesPathSelector
  if (!noteSettingsPath) {
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