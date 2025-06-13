import React from 'react';
import MDEditor, { commands } from '@uiw/react-md-editor';
import { useSettingsStore, getNote, setNote } from '../../stores/settingsStore';
import { ChevronLeftIcon, ChevronRightIcon, Square2StackIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import NotesPathSelector from '../NotesPathSelector/NotesPathSelector';
import { logger } from '../../utils/logger';

const SAVE_DEBOUNCE_MS = 2000;

const QuickNotes: React.FC = () => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const { notes, setNotes, showShortcuts, updateFileSettings, noteSettingsPath, loadFileSettings, setNoteSettingsPath, showQuickNotes } = useSettingsStore();
  const [saveStatus, setSaveStatus] = React.useState<{ type: 'success' | 'error' | 'autosaving' | null; message: string }>({ type: null, message: '✒️' });
  const [isLoading, setIsLoading] = React.useState(true);
  const saveTimeout = React.useRef<number | null>(null);
  const [editorContent, setEditorContent] = React.useState<string>('');

  // Load notes data when component mounts or noteSettingsPath changes
  React.useEffect(() => {
    if (noteSettingsPath) {
      setIsLoading(true);
      loadFileSettings()
        .then(() => {
          setIsLoading(false);
        })
        .catch(error => {
          logger.error('Failed to load notes:', error);
          setSaveStatus({ type: 'error', message: 'Failed to load notes 🔴' });
          setIsLoading(false);
        });
    }
  }, [noteSettingsPath, loadFileSettings, showQuickNotes]);

  // Update local editor content when selected date or notes change
  React.useEffect(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    logger.info('Current notes state:', notes);
    const note = getNote(notes, dateStr);
    logger.info('Retrieved note for date:', { date: dateStr, note });
    setEditorContent(note?.content || '');
  }, [selectedDate, notes]);

  const handleReset = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to reset the notes path?');
    if (!confirmed) return;

    try {
      setIsLoading(true);
      // First read current data to ensure we don't lose it
      await loadFileSettings();
      // Then clear the path
      setNoteSettingsPath('');
      setSaveStatus({ type: 'success', message: 'Reset successful 🟢' });
    } catch (error) {
      logger.error('Failed to reset:', error);
      setSaveStatus({ type: 'error', message: 'Failed to reset 🔴' });
    } finally {
      setIsLoading(false);
    }
  };

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

    setSaveStatus({ type: 'autosaving', message: '✒️' });

    if (saveTimeout.current) {
      window.clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = window.setTimeout(async () => {
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        logger.info('Current notes before update:', notes);
        const updatedNotes = setNote(notes, dateStr, {
          content: value || '',
          date: dateStr
        });
        logger.info('Updated notes:', updatedNotes);

        setNotes(updatedNotes);
        await updateFileSettings({ notes: updatedNotes });
        setSaveStatus({ type: 'success', message: 'Saved 🟢' });
        setTimeout(() => setSaveStatus({ type: 'success', message: '🟢' }), 2000);
      } catch (error) {
        logger.error('Error saving notes:', error);
        setSaveStatus({ type: 'error', message: 'Failed to save 🔴' });
      }
    }, SAVE_DEBOUNCE_MS);
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

  // Show NotesPathSelector if no path is set
  if (!noteSettingsPath) {
    return <NotesPathSelector />;
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto mb-2 flex items-center justify-center h-[45vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto mb-2">
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
        onChange={handleEditorChange}
        autoFocus={true}
        autoFocusEnd={true}
        height={showShortcuts ? "45vh" : "80vh"}
        commands={
          [
            commands.checkedListCommand,
            commands.title,
            commands.divider,
            commands.bold,
            commands.italic,
            commands.strikethrough,
            commands.hr,
            commands.divider,
            commands.codeBlock,
            commands.code,
            commands.divider,
            commands.link,
            commands.quote,
            commands.divider,
            commands.table,
            commands.divider,
            commands.unorderedListCommand,
            commands.orderedListCommand,
            commands.divider,
            commands.divider,
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
            {
              name: 'Reset Path',
              keyCommand: 'ResetPath',
              buttonProps: { 'aria-label': 'Reset Path' },
              icon: (
                <ArrowPathIcon className='w-4 h-4' />
              ),
              execute: () => {
                handleReset();
              }
            },
          ]
        }
        extraCommands={[
          commands.help,
          commands.divider,
          commands.codeLive,
          commands.codeEdit,
          commands.codePreview,
          commands.divider,
          commands.fullscreen,
        ]}
      />
    </div>
  );
};

export default QuickNotes; 