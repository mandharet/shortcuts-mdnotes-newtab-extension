import React from 'react';
import CardGrid, { CardData } from './components/Grid/CardGrid';
import BookmarksFlyout from './components/BookmarksFlyout/BookmarksFlyout';
import QuickNotes from './components/QuickNotes/QuickNotes';
import ErrorBoundary from './components/ErrorBoundary';
import { settingsService } from './services/settingsService';
import SettingsFlyout from './components/SettingsFlyout';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [isSettingsFlyoutOpen, setIsSettingsFlyoutOpen] = React.useState(false);
  const [showQuickNotes, setShowQuickNotes] = React.useState(false);
    const [notesPath, setNotesPath] = React.useState('');
  const [gridColumns, setGridColumns] = React.useState(4);

  React.useEffect(() => {
    // Load settings when component mounts
    settingsService.getSettings().then((settings) => {
      document.documentElement.dataset.theme = settings.theme;
      setShowQuickNotes(settings.showQuickNotes);
      setGridColumns(settings.gridColumns);
      setNotesPath(settings.noteSettingsPath);
    });
  }, []);

  return (
    <div className="min-h-screen">
      <button
        onClick={() => setIsSettingsFlyoutOpen(true)}
        className="fixed top-4 left-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 z-40"
        aria-label="Open Settings"
      >
        <Cog6ToothIcon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
      </button>

      <SettingsFlyout
        isOpen={isSettingsFlyoutOpen}
        setIsOpen={setIsSettingsFlyoutOpen}
      />

      <div className="flex h-screen">
        <main className="flex-1 p-4">
          <ErrorBoundary>
            <BookmarksFlyout />
          </ErrorBoundary>
          <ErrorBoundary>
            <QuickNotes enabled={showQuickNotes} />
          </ErrorBoundary>
          <ErrorBoundary>
            <CardGrid columns={gridColumns} />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default App; 