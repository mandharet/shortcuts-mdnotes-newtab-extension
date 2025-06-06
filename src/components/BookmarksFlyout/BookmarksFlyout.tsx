import React from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { FolderArrowDownIcon, FolderIcon, LinkIcon } from '@heroicons/react/24/outline';
import { LinkSlashIcon } from '@heroicons/react/20/solid';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  parentId?: string;
}

interface BookmarkFolder {
  id: string;
  title: string;
  children: (Bookmark | BookmarkFolder)[];
}

const isBookmark = (item: Bookmark | BookmarkFolder): item is Bookmark => {
  return 'url' in item;
};

const BookmarksFlyout: React.FC = () => {
  const [bookmarks, setBookmarks] = React.useState<BookmarkFolder[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { isPinnedBookMarkFlyout, setIsPinnedBookMarkFlyout, updateFileSettings } = useSettingsStore();

  const convertBookmarkNode = (node: chrome.bookmarks.BookmarkTreeNode): Bookmark | BookmarkFolder => {
    if (node.url) {
      return {
        id: node.id,
        title: node.title,
        url: node.url,
        parentId: node.parentId
      };
    } else {
      return {
        id: node.id,
        title: node.title,
        children: (node.children || []).map(convertBookmarkNode)
      };
    }
  };

  // Helper to get all folder IDs that have children
  const getNonEmptyFolders = (nodes: (Bookmark | BookmarkFolder)[]): BookmarkFolder[] => {
    let folders: BookmarkFolder[] = [];
    for (const node of nodes) {
      if (!isBookmark(node) && node.children && node.children.length > 0) {
        folders.push(node);
        folders = folders.concat(getNonEmptyFolders(node.children));
      } else if (!isBookmark(node) && node.children && node.children.length === 0 && node.title) {
        // Include empty folders if they have a title, so they are still visible
        folders.push(node);
      }
    }
    return folders;
  };

  React.useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const tree = await chrome.bookmarks.getTree();
        const rootChildren = tree[0].children || [];
        const convertedBookmarks = rootChildren.map(convertBookmarkNode) as BookmarkFolder[];
        setBookmarks(convertedBookmarks);
        // Expand all non-empty folders by default
        const foldersToExpand = getNonEmptyFolders(convertedBookmarks);
        setExpandedFolders(new Set(foldersToExpand.map(folder => folder.id)));
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
      }
    };
    loadBookmarks();
  }, []);

  React.useEffect(() => {
    // Expand when pinned
    if (isPinnedBookMarkFlyout) {
      const foldersToExpand = getNonEmptyFolders(bookmarks);
      setExpandedFolders(new Set(foldersToExpand.map(folder => folder.id)));
      setIsExpanded(true); // Ensure expanded state is true when pinned
    } else {
      setIsExpanded(false); // Collapse when unpinned
    }
  }, [isPinnedBookMarkFlyout, bookmarks]);

  const handlePinToggle = async () => {
    const newPinnedState = !isPinnedBookMarkFlyout;
    setIsPinnedBookMarkFlyout(newPinnedState);
    await updateFileSettings({ isPinnedBookMarkFlyout: newPinnedState });
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      // In search mode, only expand folders that contain matching bookmarks or whose title matches
      const foldersToExpand = getNonEmptyFolders(bookmarks).filter(folder =>
        folder.title.toLowerCase().includes(query.toLowerCase()) ||
        folder.children.some(child =>
          (isBookmark(child) && (child.title.toLowerCase().includes(query.toLowerCase()) || child.url.toLowerCase().includes(query.toLowerCase()))) || (!isBookmark(child) && getNonEmptyFolders([child]).some(subfolder =>
            subfolder.children.some(grandchild => isBookmark(grandchild) && (grandchild.title.toLowerCase().includes(query.toLowerCase()) || grandchild.url.toLowerCase().includes(searchQuery.toLowerCase())))
          ))
        )
      );
      setExpandedFolders(new Set(foldersToExpand.map(folder => folder.id)));
      setIsExpanded(true); // Ensure flyout is expanded in search mode
    } else {
      // When search is cleared, revert to default expansion (all non-empty folders)
      const foldersToExpand = getNonEmptyFolders(bookmarks);
      setExpandedFolders(new Set(foldersToExpand.map(folder => folder.id)));
      if (!isPinnedBookMarkFlyout) setIsExpanded(false); // Collapse if not pinned after clearing search
    }
  };

  const renderBookmark = (bookmark: Bookmark) => (
    <a
      key={bookmark.id}
      href={bookmark.url}
      rel="noopener noreferrer"
      className="flex items-center px-4 py-2 text-sm hover:border rounded-md "
    >
      <LinkIcon className='w-4 h-4 mr-2' />
      {bookmark.title}
    </a>
  );

  const renderFolder = (folder: BookmarkFolder) => {
    const isFolderExpanded = expandedFolders.has(folder.id);
    // Filter children based on search query
    const filteredChildren = folder.children.filter(child => {
      if (isBookmark(child)) {
        return child.title.toLowerCase().includes(searchQuery.toLowerCase()) || child.url.toLowerCase().includes(searchQuery.toLowerCase());
      } else {
        // For folders, check if folder title matches or any of its children match recursively
        return child.title.toLowerCase().includes(searchQuery.toLowerCase()) || getNonEmptyFolders([child]).some(subfolder =>
          subfolder.children.some(grandchild => isBookmark(grandchild) && (grandchild.title.toLowerCase().includes(searchQuery.toLowerCase()) || grandchild.url.toLowerCase().includes(searchQuery.toLowerCase())))
        );
      }
    });

    if (searchQuery && filteredChildren.length === 0 && !folder.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return null; // Hide folder if searching and no children match and folder title doesn't match
    }

    return (
      <div key={folder.id} className="mb-4">
        <button
          onClick={() => toggleFolder(folder.id)}
          className="flex items-center w-full px-4 py-2 text-sm hover:bg-hover-bg border rounded-md"
        >
          {isFolderExpanded ?
            <FolderArrowDownIcon className='w-4 h-4 mr-2' /> :
            <FolderIcon className='w-4 h-4 mr-2' />}
          {folder.title}
        </button>
        {isFolderExpanded && filteredChildren.length > 0 && (
          <div className="ml-4">
            {filteredChildren.map(child =>
              isBookmark(child) ? renderBookmark(child) : renderFolder(child)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full z-50 transform transition-transform transition-colors duration-300 ${isExpanded ? 'w-[45vw] translate-x-0' : 'w-10 translate-x-[calc(100%-2.5rem)]'} ${isPinnedBookMarkFlyout ? '' : 'hover:w-[45vw] hover:translate-x-0'} bg-primary`}
      onMouseEnter={() => { if (!isPinnedBookMarkFlyout) setIsExpanded(true); }}
      onMouseLeave={() => { if (!isPinnedBookMarkFlyout) setIsExpanded(false); }}
    >
      {isExpanded ? (
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium ">Bookmarks</h2>
            <button
              onClick={handlePinToggle}
              className="p-2 rounded-full hover:bg-hover-bg "
              title={isPinnedBookMarkFlyout ? 'Unpin' : 'Pin'}
            >
              {!isPinnedBookMarkFlyout && (<svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isPinnedBookMarkFlyout ? "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" : "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"}
                />
              </svg>)}


              {isPinnedBookMarkFlyout && (<svg
                className="w-5 h-5"
                fill="currentColor"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isPinnedBookMarkFlyout ? "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" : "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"}
                />
              </svg>)}
            </button>
          </div>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full p-2 rounded-lg bg-surface  border border-border-color"
            />
          </div>

          <div className="overflow-y-auto flex-grow">
            {bookmarks.map(bookmark =>
              isBookmark(bookmark) ? renderBookmark(bookmark) : renderFolder(bookmark)
            )}
          </div>
          <div className="p-2 text-xs text-secondary border-t border-border-color mt-auto">
            To manage bookmarks, use your browser's bookmarks manager.
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <span className="transform -rotate-90 whitespace-nowrap text-sm font-medium ">
            Bookmarks
          </span>
        </div>
      )}
    </div>
  );
};

export default BookmarksFlyout; 