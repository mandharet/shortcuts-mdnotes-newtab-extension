import React from 'react';
import CardGrid from './components/Grid/CardGrid';
import BookmarksFlyout from './components/BookmarksFlyout/BookmarksFlyout';
import SettingsFlyout from './components/SettingsFlyout';
import QuickNotes from './components/QuickNotes/QuickNotes';
import { useSettingsStore } from './stores/settingsStore';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

function App() {
  const { theme, showQuickNotes, gridColumns } = useSettingsStore();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-primary">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-flex-end mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full hover:bg-surface-hover text-primary"
              title="Open Settings"
            >
              <Cog6ToothIcon className="w-6 h-6" />
            </button>
            <SettingsFlyout isOpen={isSettingsOpen} setIsOpen={setIsSettingsOpen} />
            <BookmarksFlyout />
          </div>
        </div>
        <CardGrid columns={gridColumns} />
        {showQuickNotes && <QuickNotes enabled={showQuickNotes} />}
      </div>
    </div>
  );
}

export default App; 