import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// The AscentUI theme first, so the site's own styles (unlayered) sit on top of it.
import '@tokens/tokens.css';
import './site.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
