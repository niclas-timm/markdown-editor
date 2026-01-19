import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useSettingsStore } from './stores/settingsStore';
import { useThemeStore } from './stores/themeStore';
import { migrateFromLocalStorage } from './lib/settings';

async function initializeApp() {
  // Migrate from localStorage if needed
  const migrated = migrateFromLocalStorage();

  // Load settings from file
  await useSettingsStore.getState().initializeSettings();

  // Apply migrated settings if any
  if (migrated) {
    await useSettingsStore.getState().updateSettings(migrated);
  }

  // Initialize theme from settings
  useThemeStore.getState().updateResolvedTheme();
}

initializeApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
