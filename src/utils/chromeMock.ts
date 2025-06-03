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
    getTree: (callback: (bookmarkTreeNodes: any[]) => void) => {
      callback([
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

// Use mock Chrome API in development
if (process.env.NODE_ENV === 'development') {
  (window as any).chrome = mockChrome;
} 