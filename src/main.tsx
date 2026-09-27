import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import { initPerformanceMonitoring } from './utils/performanceMonitor';

// Initialize Core Web Vitals & hardware performance monitoring
initPerformanceMonitoring();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
