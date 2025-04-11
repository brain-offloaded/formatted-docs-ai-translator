import { CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './react/App';
import './react/styles/index.css';
import { theme } from './react/theme';
import { registerAllTranslators } from './react/factories/TranslatorRegistration';

// 모든 번역기와 파싱 옵션 등록
registerAllTranslators();

// React 애플리케이션을 렌더링합니다
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
}
