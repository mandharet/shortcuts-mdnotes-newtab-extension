import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';

const Popup: React.FC = () => {
  return (
    <div className="w-64 p-4 bg-surface">
      <div className="space-y-2">
        <a
          href="https://github.com/mandharet/productivityNewTabExtension"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-hover-bg text-primary transition-colors"
        >
          <span>⁉️Report Issue</span>
        </a>
        <a
          href="https://tejas.mandhare.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-hover-bg text-primary transition-colors"
        >
          <span>👷‍♂️Tejas Mandhare</span>
        </a>
      </div>
    </div>
  );
};

// Create root and render popup
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}

export default Popup; 