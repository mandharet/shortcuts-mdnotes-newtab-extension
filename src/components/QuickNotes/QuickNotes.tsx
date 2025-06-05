import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { useSettingsStore } from '../../stores/settingsStore';

interface NoteObject {
  notesdata: string;
  lastModified: string;
  characterCount: number;
}

interface NotesData {
  notes: {
    [year: string]: {
      [month: string]: {
        [day: string]: NoteObject;
      };
    };
  };
}

const QuickNotes: React.FC = () => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [notes, setNotes] = React.useState<string>('');
  const [saveStatus, setSaveStatus] = React.useState<{ type: 'success' | 'error' | 'autosaving' | null; message: string }>({ type: null, message: '' });
  const saveTimeout = React.useRef<number | null>(null);

  const { noteSettingsPath, notes: storedNotes, setNotes: setStoredNotes, updateFileSettings } = useSettingsStore();

  // Load notes for selected date
  React.useEffect(() => {
    if (!noteSettingsPath) {
      setSaveStatus({ type: 'error', message: 'Please select a folder to save settings' });
    } else {
      setSaveStatus({ type: null, message: '🟢' });
    }
    const year = selectedDate.getFullYear().toString();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const notesData = storedNotes?.[year]?.[month]?.[day]?.notesdata || '';
    setNotes(notesData);

  }, [selectedDate, noteSettingsPath, storedNotes]);

  // Debounced auto-save
  React.useEffect(() => {
    if (!noteSettingsPath) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveNotes(notes);
    }, 1000);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [notes, selectedDate, noteSettingsPath]);

  const saveNotes = async (content: string) => {
    try {
      setSaveStatus({ type: 'autosaving', message: 'AutoSaving 🟡' });

      const year = selectedDate.getFullYear().toString();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const day = selectedDate.getDate().toString().padStart(2, '0');

      const updatedNotes = {
        ...storedNotes,
        [year]: {
          ...(storedNotes?.[year] || {}),
          [month]: {
            ...(storedNotes?.[year]?.[month] || {}),
            [day]: {
              notesdata: content,
              lastModified: new Date().toISOString(),
              characterCount: content.length
            }
          }
        }
      };

      setStoredNotes(updatedNotes);
      await updateFileSettings({ notes: updatedNotes });
      setSaveStatus({ type: 'success', message: 'Saved 🟢' });
      // Clear success message after 2 seconds
      setTimeout(() => setSaveStatus({ type: null, message: '🟢' }), 2000);
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Failed to save notes 🔴' });
    }
  };

  const handleEditorChange = (value?: string) => {
    setNotes(value || '');
  };

  const changeDay = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + delta);
    setSelectedDate(newDate);
  };


  return (
    <div className="max-w-5xl mx-auto mb-2 ">
      <div className="flex items-center justify-between mb-4">
        {noteSettingsPath && (
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => changeDay(-1)}
              className="p-2 rounded border border-border-color"
              title="Previous Day"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div className="rounded-lg border border-border-color">
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  setSelectedDate(new Date(e.target.value));
                }}
                className="w-full p-2 rounded-lg border border-border-color"
              />
            </div>
            <button
              onClick={() => changeDay(1)}
              className="p-2 rounded border border-border-color"
              title="Next Day"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-4">
          <span className={`text-sm ${saveStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {saveStatus.message}
          </span>
        </div>
      </div>
      {noteSettingsPath && (
        <MDEditor
          value={notes}
          height={"50vh"}
          onChange={handleEditorChange}
          autoFocus={true}
          autoFocusEnd={true}

        />
      )}
    </div>
  );
};

export default QuickNotes; 