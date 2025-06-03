import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { settingsService } from '../../services/settingsService';

interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

const BookmarksFlyout: React.FC = () => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [bookmarks, setBookmarks] = React.useState<BookmarkNode[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());
  const [isPinned, setIsPinned] = React.useState(false);

  React.useEffect(() => {
    // Load settings when component mounts
    settingsService.getSettings().then((settings) => {
      setIsPinned(settings.isPinnedBookMarkFlyout);
    });

    // Load bookmarks from Chrome
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      setBookmarks(bookmarkTreeNodes);
      // Expand all folders by default using getNonEmptyFolders
      const folders = getNonEmptyFolders(bookmarkTreeNodes);
      setExpandedFolders(new Set(folders.map(folder => folder.id)));
    });
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      chrome.bookmarks.search(query, (results) => {
        setIsExpanded(true);
        // Expand all folders in search results
        const matchingFolderIds = new Set<string>();
        const collectFolderIds = (nodes: BookmarkNode[]) => {
          nodes.forEach(node => {
            if (!node.url && node.children) {
              matchingFolderIds.add(node.id);
              collectFolderIds(node.children);
            }
          });
        };
        const filteredTree = bookmarks
          .map((bookmark) => filterBookmarksTree(bookmark, query))
          .filter(Boolean) as BookmarkNode[];
        collectFolderIds(filteredTree);
        setExpandedFolders(matchingFolderIds);
      });
    } else {
      // Expand all non-empty folders when search is cleared
      const folders = getNonEmptyFolders(bookmarks);
      setExpandedFolders(new Set(folders.map(folder => folder.id)));
    }
  };

  const getNonEmptyFolders = (nodes: BookmarkNode[]): BookmarkNode[] => {
    let folders: BookmarkNode[] = [];
    for (const node of nodes) {
      if (!node.url && !node.children) {
        return folders;
      }
      if (!node.url) {
        folders.push(node);
        if (node.children) {
          folders = folders.concat(getNonEmptyFolders(node.children));
        }
      }
    }
    return folders;
  };

  const handlePinToggle = async () => {
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);
    await settingsService.updateSetting('isPinnedBookMarkFlyout', newPinnedState);
  };

  const toggleFolder = (id: string) => {
    const newExpandedFolders = new Set(expandedFolders);
    if (newExpandedFolders.has(id)) {
      newExpandedFolders.delete(id);
    } else {
      newExpandedFolders.add(id);
    }
    setExpandedFolders(newExpandedFolders);
  };

  const renderBookmarkNode = (node: BookmarkNode, parentId: string = 'root') => {
    const key = `${parentId}-${node.id}`;
    if (node.url) {
      return (
        <a
          key={key}
          href={node.url}
          rel="noopener noreferrer"
          className="block px-4 py-2 hover:bg-gray-100 text-sm ml-4"
        >
          {node.title}
        </a>
      );
    }
    const isExpanded = expandedFolders.has(node.id);
    return (
      <div key={key} className="mb-1">
        <div
          className="flex items-center cursor-pointer px-4 py-2 font-medium text-sm hover:bg-gray-50 select-none"
          onClick={() => toggleFolder(node.id)}
        >
          <span className="mr-2 text-lg">
            {isExpanded ? '📂' : '📁'}
          </span>
          {node.title}
        </div>
        {isExpanded && node.children && (
          <div className="ml-6 border-l border-gray-200">
            {node.children.map(child => renderBookmarkNode(child, node.id))}
          </div>
        )}
      </div>
    );
  };

  // Recursive filter for search
  const filterBookmarksTree = (node: BookmarkNode, query: string): BookmarkNode | null => {
    const queryLower = query.toLowerCase();
    const matchesQuery = 
      node.title.toLowerCase().includes(queryLower) || 
      (node.url && node.url.toLowerCase().includes(queryLower));

    if (node.url) {
      if (matchesQuery) {
        return node;
      }
      return null;
    }
    // Folder: filter children
    const filteredChildren = (node.children || [])
      .map(child => filterBookmarksTree(child, query))
      .filter(Boolean) as BookmarkNode[];
    
    // Include folder if it matches query or has matching children
    if (matchesQuery || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
    return null;
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full bg-surface/90 backdrop-blur-md shadow-lg transition-all duration-300 z-10 ${
        isExpanded ? 'w-[40vw]' : 'w-10'
      } border-l`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => { if (!isPinned) setIsExpanded(false); }}
    >
      {isExpanded ? (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-surface text-primary"
              />
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-secondary" />
            </div>
            <button
              className={`ml-2 text-xl ${isPinned ? 'text-primary' : 'text-secondary'} hover:text-primary`}
              title={isPinned ? 'Unpin bookmarks' : 'Pin bookmarks'}
              onClick={handlePinToggle}
            >
              {isPinned ? '📌' : '🔓'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {searchQuery ? (
              bookmarks
                .map((bookmark) => filterBookmarksTree(bookmark, searchQuery))
                .filter(Boolean)
                .map((bookmark) => renderBookmarkNode(bookmark!))
            ) : (
              bookmarks.map((bookmark) => renderBookmarkNode(bookmark))
            )}
          </div>
          <div className="p-2 text-xs text-secondary border-t mt-2">
            To edit bookmarks, use your browser's bookmarks toolbar or manager.
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <span className="transform -rotate-90 whitespace-nowrap text-sm font-medium text-primary">
            Bookmarks
          </span>
        </div>
      )}
    </div>
  );
};

export default BookmarksFlyout; 