import { CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import App from './react/App';
import AdvancedImageViewer from './react/views/AdvancedImageViewer';
import { theme } from './react/theme';
import i18n from './react/config/i18n';
import { SettingsService as SettingsApiService } from './react/api/generated/services/SettingsService';

// React 애플리케이션을 렌더링합니다
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  const isAdvancedViewer = window.location.hash === '#advanced-viewer';

  // DB에서 저장된 언어 설정 로드
  void SettingsApiService.settingsControllerGetSetting({ key: 'uiLanguage' })
    .then((response) => {
      if (response.success && typeof response.result === 'string' && response.result) {
        return i18n.changeLanguage(response.result);
      }
      return undefined;
    })
    .catch(() => {
      // 오류 발생 시 기본 언어 사용
    });

  root.render(
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {isAdvancedViewer ? <AdvancedImageViewer /> : <App />}
        </ThemeProvider>
      </I18nextProvider>
    </React.StrictMode>
  );
}
