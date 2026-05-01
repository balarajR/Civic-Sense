/**
 * @file   main.tsx
 * @module Main
 * @description Application entry point. Mounts the React root component inside
 *              StrictMode for development warnings and double-render detection.
 *
 * @author  CivicSense Team
 * @created 2025-04-28
 *
 * @dependencies react, react-dom
 * @exports      none (side-effect module)
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
