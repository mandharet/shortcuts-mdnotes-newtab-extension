import ReactDOM from 'react-dom/client'
import App from './App'
import '../styles/index.css'
import '../utils/chromeMock'


window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  const newColorScheme = e.matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-color-mode', newColorScheme);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
) 