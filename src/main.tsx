import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/comfortaa/400.css';
import '@fontsource/comfortaa/700.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/baloo-2/600.css';
import { App } from './App';
import { I18nProvider } from './hooks/useI18n';
import { AuthProvider } from './hooks/useAuth';
import { ClayThemeProvider } from './blog/utils/clayThemes';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <AuthProvider>
          <ClayThemeProvider>
            <App />
          </ClayThemeProvider>
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
