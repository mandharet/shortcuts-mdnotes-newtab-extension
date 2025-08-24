import React, { useEffect, useState } from 'react';

export interface BookmarkOption {
  id: string;
  title: string;
  url: string;
  backgroundColor?: string;
}

interface ImportBookmarksModalProps {
  open: boolean;
  onClose: () => void;
  existingShortcuts: BookmarkOption[];
  onImportShortcuts: (updatedShortcuts: BookmarkOption[]) => void;
}

const ImportBookmarksModal: React.FC<ImportBookmarksModalProps> = ({
  open,
  onClose,
  existingShortcuts,
  onImportShortcuts,
}) => {
  const [bookmarks, setBookmarks] = useState<BookmarkOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper to flatten bookmarks
  const flattenBookmarks = (nodes: any[]): BookmarkOption[] => {
    let result: BookmarkOption[] = [];
    for (const node of nodes) {
      if (node.url) {
        result.push({ id: node.id, title: node.title, url: node.url });
      } else if (node.children) {
        result = result.concat(flattenBookmarks(node.children));
      }
    }
    return result;
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      (async () => {
        try {
          const tree = await (window.chrome?.bookmarks?.getTree?.() ?? Promise.resolve([]));
          const flat = tree.length > 0 ? flattenBookmarks(tree[0].children || []) : [];
          setBookmarks(flat);
        } catch (e) {
          setBookmarks([]);
        } finally {
          setLoading(false);
        }
      })();
      setSelectedIds([]);
    }
  }, [open]);

  const allSelected = bookmarks.length > 0 && selectedIds.length === bookmarks.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(bookmarks.map(b => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleCheckbox = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleImport = () => {
    const existingUrls = new Set((existingShortcuts || []).map((s: BookmarkOption) => s.url));
    const selected = bookmarks.filter(b => selectedIds.includes(b.id));
    const newShortcuts = selected.filter(b => !existingUrls.has(b.url)).map(b => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      title: b.title && b.title.trim() !== '' ? b.title : b.url,
      url: b.url,
      backgroundColor: '',
    }));
    const updatedShortcuts = [...(existingShortcuts || []), ...newShortcuts];
    onImportShortcuts(updatedShortcuts);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Import Bookmarks as Shortcuts</h3>
        {loading ? (
          <div>Loading bookmarks...</div>
        ) : bookmarks.length === 0 ? (
          <div>No bookmarks found.</div>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="select-all-bookmarks"
                checked={allSelected}
                onChange={e => handleSelectAll(e.target.checked)}
              />
              <label htmlFor="select-all-bookmarks" className="font-medium cursor-pointer">Select All</label>
            </div>
            <div className="mb-4 max-h-60 overflow-y-auto border rounded p-2">
              {bookmarks.map(b => (
                <label key={b.id} className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(b.id)}
                    onChange={() => handleCheckbox(b.id)}
                  />
                  <span className="truncate" title={b.title || b.url}>{b.title && b.title.trim() !== '' ? b.title : b.url}</span>
                </label>
              ))}
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-3 py-1 rounded border"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
            onClick={handleImport}
            disabled={selectedIds.length === 0}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportBookmarksModal; 