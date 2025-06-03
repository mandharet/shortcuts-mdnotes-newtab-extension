import React from 'react';
import MdEditor from 'react-markdown-editor-lite';
import MarkdownIt from 'markdown-it';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import 'react-markdown-editor-lite/lib/index.css';
import { useSettingsStore } from '../../stores/settingsStore';

interface QuickNotesProps {
  enabled: boolean;
}

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

const QuickNotes: React.FC<QuickNotesProps> = ({ enabled }) => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [notes, setNotes] = React.useState<string>('');
  const [saveStatus, setSaveStatus] = React.useState<{ type: 'success' | 'error' | 'autosaving' | null; message: string }>({ type: null, message: '' });
  const mdParser = new MarkdownIt();
  const saveTimeout = React.useRef<number | null>(null);

  const { noteSettingsPath, notes: storedNotes, setNotes: setStoredNotes, updateFileSettings } = useSettingsStore();

  // Load notes for selected date
  React.useEffect(() => {
    if (enabled) {
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
    }
  }, [enabled, selectedDate, noteSettingsPath, storedNotes]);

  // Debounced auto-save
  React.useEffect(() => {
    if (!enabled) return;
    if (!noteSettingsPath) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveNotes(notes);
    }, 1000);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [notes, selectedDate, enabled, noteSettingsPath]);

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

  const handleEditorChange = ({ text }: { text: string }) => {
      setNotes(text);
  };

  const changeDay = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + delta);
    setSelectedDate(newDate);
  };

  if (!enabled) return null;

  return (
    <div className="max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between mb-4">
        {noteSettingsPath && (
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => changeDay(-1)}
              className="p-2 rounded hover:bg-gray-100 bg-surface text-primary border"
              title="Previous Day"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div className="rounded-lg bg-surface text-primary ">
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  setSelectedDate(new Date(e.target.value));
                }}
                className="w-full p-2 rounded-lg"
              />
            </div>
            <button
              onClick={() => changeDay(1)}
              className="p-2 rounded hover:bg-gray-100 bg-surface text-primary border"
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
        <MdEditor
          value={notes}
          style={{ height: '45vh' }}
          renderHTML={(text) => mdParser.render(text)}
          onChange={handleEditorChange}
          config={{
            view: {
              menu: true,
              md: true,
              html: true
            }
          }}
        />
      )}
    </div>
  );
};

export default QuickNotes; 