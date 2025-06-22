# Shortcuts and daily notes new tab - Chrome Extension

Transform your new tab into a productivity powerhouse with quick access to your favorite sites, bookmarks, and markdown notes - all in one beautiful, customizable interface.

## Features

### 🎯 Quick Access
- **URL Cards**: Create and organize quick-access cards for your most-used websites
- **Smart Bookmarks**: Seamless integration with Chrome bookmarks
- **Drag & Drop**: Intuitive organization of all your shortcuts and notes

### 📝 Markdown Notes
- **Built-in Editor**: Write and edit notes with full markdown support
- **Auto-save**: Never lose your work with automatic saving
- **Date-based Organization**: Notes are automatically organized by date

### 🎨 Customization
- **Themes**: Choose from multiple color themes
- **Layout Control**: Customize the number of columns and component order
- **Responsive Design**: Works beautifully on all screen sizes

## Installation

### From Chrome Web Store
1. Visit the Chrome Web Store (link to be added)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Development)
1. Clone this repository:
   ```bash
   git clone https://github.com/mandharet/shortcuts-mdnotes-newtab-extension.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from the project directory

## Development

### Prerequisites
- Node.js (v18 or higher)
- npm (v10 or higher)

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Build for production:
   ```bash
   npm run build
   ```

### Project Structure
```
productivity-extension/
├── src/                    # Source code
│   ├── EntryPoint/        # Main entry points
│   ├── components/        # React components
│   └── store/            # State management
├── icons/                 # Extension icons
├── dist/                  # Build output
└── manifest.json         # Extension manifest
```

## Technologies Used

- React 18
- TypeScript
- TailwindCSS
- Zustand (State Management)
- React Beautiful DnD (Drag and Drop)
- Markdown Editor
- Vite (Build Tool)

## Features in Detail

### URL Cards
- Create, edit, and delete URL cards
- Drag and drop to reorder
- Custom icons and colors
- Quick access to frequently visited sites

### Bookmarks
- Access your Chrome bookmarks
- Pin important bookmarks
- Search and filter functionality
- Customizable display options

### Quick Notes
- Markdown support
- Real-time preview
- Auto-save functionality
- Drag and drop organization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Author

Tejas Mandhare
- Website: [tejas.mandhare.com](https://tejas.mandhare.com)
- GitHub: [@mandharet](https://github.com/mandharet)

## Acknowledgments

- Chrome Extension API
- React Community
- All contributors and users of this extension
- Special thanks to all the open-source projects that made this extension possible 

## Credits and Dependencies

### Core Dependencies
- [React](https://reactjs.org/) - UI Library
- [React DOM](https://reactjs.org/) - React DOM rendering
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework

### UI Components and Icons
- [@heroicons/react](https://heroicons.com/) - Beautiful hand-crafted SVG icons
- [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd) - Drag and drop functionality

### Markdown Support
- [@uiw/react-md-editor](https://github.com/uiwjs/react-md-editor) - Markdown editor component

### Development Tools
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool and development server
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) - React plugin for Vite
- [PostCSS](https://postcss.org/) - CSS processing
- [Autoprefixer](https://github.com/postcss/autoprefixer) - CSS vendor prefixing

### Type Definitions
- [@types/chrome](https://www.npmjs.com/package/@types/chrome) - Chrome extension types
- [@types/node](https://www.npmjs.com/package/@types/node) - Node.js types
- [@types/react](https://www.npmjs.com/package/@types/react) - React types
- [@types/react-beautiful-dnd](https://www.npmjs.com/package/@types/react-beautiful-dnd) - React Beautiful DnD types
- [@types/react-dom](https://www.npmjs.com/package/@types/react-dom) - React DOM types
