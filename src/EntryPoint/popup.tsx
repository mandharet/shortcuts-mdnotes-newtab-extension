import React from 'react';
import ReactDOM from 'react-dom/client';
import SettingsPage from '../components/SettingsPage/SettingsPage';
import '../styles/index.css';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container!); 

root.render(
  <React.StrictMode>
    <SettingsPage />
  </React.StrictMode>
);

export default SettingsPage; 