import React from 'react';
import ReactDOM from 'react-dom/client';
import Settings from './components/Settings/Settings';
import { settingsService, ExtensionSettings } from './services/settingsService';
import './styles/index.css'; // Import global styles

const OptionsPage: React.FC = () => {
  const [settings, setSettings] = React.useState<ExtensionSettings | null>(null);

  React.useEffect(() => {
    // Load settings when the options page mounts
    settingsService.getSettings().then((loadedSettings) => {
      setSettings(loadedSettings);
    });
  }, []);

  const handleSettingChange = async <K extends keyof ExtensionSettings>(
    key: K,
    value: ExtensionSettings[K]
  ) => {
    if (!settings) return; // Should not happen if loaded correctly
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    await settingsService.updateSetting(key, value);
  };

  if (!settings) {
    return <div>Loading settings...</div>; // Loading state
  }

  // The Settings component expects specific props, we'll map our state and handler to them.
  // Note: The Settings component itself will manage its internal state for tabs, notesPath, etc.
  // We are only passing the top-level settings values and a generic change handler.
  // We might need to adjust the Settings component props later if needed.
  return (
    <div className="container mx-auto p-4">
      <Settings
        showQuickNotes={settings.showQuickNotes}
        onQuickNotesChange={(value) => handleSettingChange('showQuickNotes', value)}
        gridColumns={settings.gridColumns}
        onGridColumnsChange={(value) => handleSettingChange('gridColumns', value)}
        // Pass other settings properties as needed by the Settings component
        // The Settings component currently manages theme, notesPath, and activeTab internally
        // We should refactor Settings.tsx to take these as props as well for better control from OptionsPage
        // For now, the Settings component's internal logic for these will interact directly with settingsService.
        // This is a temporary approach; a better design would be to pass all relevant settings as props.
      />
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <OptionsPage />
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element to mount the React app.');
} 