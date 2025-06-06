import React from 'react';
import MDEditor, { commands } from '@uiw/react-md-editor';
import { useSettingsStore } from '../../stores/settingsStore';
import { ChevronLeftIcon, ChevronRightIcon, Square2StackIcon } from '@heroicons/react/24/outline';

interface NoteObject {
  notesdata: string;
  lastModified: string;
  characterCount: number;
}

interface NoteData {
  content: string;
  date: string;
}

const QuickNotes: React.FC = () => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const { notes, setNotes, updateFileSettings, noteSettingsPath } = useSettingsStore();
  const [saveStatus, setSaveStatus] = React.useState<{ type: 'success' | 'error' | 'autosaving' | null; message: string }>({ type: null, message: '✒️' });
  const saveTimeout = React.useRef<number | null>(null);
  const [editorContent, setEditorContent] = React.useState<string>(''); // Local state for editor content

  // Update local editor content when selected date or notes change
  React.useEffect(() => {
    const date = selectedDate.toISOString().split('T')[0];
    setEditorContent(notes[date]?.content || '');
  }, [selectedDate, notes]);

  // Function to check if a note is locked

  // Handle date change
  const changeDay = (days: number) => {
    if (saveStatus.type === 'autosaving' || saveStatus.type === 'error') {
      setSaveStatus({ type: 'error', message: 'Please wait for save to complete or fix errors before changing date 🟡' });
      return;
    }
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // Handle editor change with debounce
  const handleEditorChange = (value: string | undefined) => {
    setEditorContent(value || ''); // Update local state immediately

    if (!noteSettingsPath) return;

    const date = selectedDate.toISOString().split('T')[0];

    setSaveStatus({ type: 'autosaving', message: '✒️' });

    if (saveTimeout.current) {
      window.clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = window.setTimeout(async () => {
      try {
        const updatedNotes = {
          ...notes,
          [date]: {
            content: value || '', // Save the debounced value
            date: date
          }
        };
        setNotes(updatedNotes); // Update global store state
        await updateFileSettings({ notes: updatedNotes }); // Save to file
        setSaveStatus({ type: 'success', message: 'Saved 🟢' });
        setTimeout(() => setSaveStatus({ type: 'success', message: '🟢' }), 2000);
      } catch (error) {
        setSaveStatus({ type: 'error', message: 'Failed to save 🔴' });
      }
    }, 1000);
  };


  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editorContent);
      setSaveStatus({ type: 'success', message: 'Copied to clipboard! 🟢' });
      setTimeout(() => setSaveStatus({ type: 'success', message: '🟢' }), 2000);
    } catch (err) {
      setSaveStatus({ type: 'error', message: 'Failed to copy to clipboard 🟡' });
    }
  };

  if (!noteSettingsPath) return null;

  return (
    <div className="max-w-5xl mx-auto mb-2">
      <div className="flex items-center justify-between mb-4">
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
                if (saveStatus.type === 'autosaving' || saveStatus.type === 'error') {
                  setSaveStatus({ type: 'error', message: 'Please wait for save to complete or fix errors before changing date 🟡' });
                  return;
                }
                const newDate = new Date(e.target.value);
                setSelectedDate(newDate);
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
        <div className="flex items-center gap-4">
          <span className={`text-sm ${saveStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {saveStatus.message}
          </span>
        </div>
      </div>

      <MDEditor
        value={editorContent}
        height={"50vh"}
        onChange={handleEditorChange}
        autoFocus={true}
        autoFocusEnd={true}
        extraCommands={
          [
            {
            name: 'copy',
            keyCommand: 'copy',
            buttonProps: { 'aria-label': 'Copy content' },
            icon: (
              <Square2StackIcon className='w-4 h-4' />
            ),
            execute: () => {
              copyToClipboard();
            }
          },
            commands.codeLive,
            commands.codePreview,
            commands.fullscreen,
          ]}
      />
    </div>
  );
};

export default QuickNotes; 