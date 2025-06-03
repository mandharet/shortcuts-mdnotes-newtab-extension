// Mock Chrome API for development
const mockChrome = {
  storage: {
    local: {
      get: (keys: string[], callback: (result: any) => void) => {
        const result: any = {};
        if (keys.includes('cards')) {
          result.cards = [];
        }
        if (keys.includes('showQuickNotes')) {
          result.showQuickNotes = false;
        }
        if (keys.includes('gridColumns')) {
          result.gridColumns = 4;
        }
        callback(result);
      },
      set: (items: any, callback?: () => void) => {
        if (callback) callback();
      }
    }
  },
  bookmarks: {
    getTree: () => {
      return Promise.resolve([
        {
          id: '1',
          title: 'Bookmarks Bar',
          children: [
            {
              id: '2',
              title: 'Example Bookmark',
              url: 'https://example.com'
            },
            {
              id: '11',
              title: '11Bookmarks Bar',
              children: [
                {
                  id: '21',
                  title: 'Example Bookmark',
                  url: 'https://example.com'
                },
                {
                  id: '22',
                  title: 'Example Bookmark',
                  url: 'https://example.com'
                },
                {
                  id: '23',
                  title: 'Example Bookmark',
                  url: 'https://example.com'
                },
                {
                  id: '24',
                  title: 'Example Bookmark',
                  url: 'https://example.com'
                },
              ]
            }
          ]
        }
      ]);
    },
    search: (query: string, callback: (results: any[]) => void) => {
      callback([
        {
          id: '2',
          title: 'Example Bookmark',
          url: 'https://example.com'
        }
      ]);
    }
  }
};

// Apply mock Chrome API if the native one is not available or incomplete
if (typeof window.chrome === 'undefined' || typeof window.chrome.bookmarks === 'undefined') {
  (window as any).chrome = mockChrome;
} else if (typeof window.chrome.bookmarks.getTree === 'undefined') {
  (window as any).chrome.bookmarks = mockChrome.bookmarks;
} 