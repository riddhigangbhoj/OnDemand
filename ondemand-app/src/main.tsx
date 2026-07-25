import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { StoreProvider } from './store/store';
import { PanesProvider } from './shared/panes';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <StoreProvider>
        <PanesProvider>
          <App />
        </PanesProvider>
      </StoreProvider>
    </HashRouter>
  </StrictMode>,
);
