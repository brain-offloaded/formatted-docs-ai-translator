import { Box, Typography, Fade, useTheme, CircularProgress } from '@mui/material';
import React, { useState, useEffect, Suspense, useCallback } from 'react';

import AppLayout from './layouts/AppLayout';
import { TranslationProvider } from './contexts/TranslationContext';
import { ModalProvider } from './contexts/ModalContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { PresetProvider } from './contexts/PresetContext';
import { ModalRoot } from './components/common/ModalRoot';
import SettingsView from './views/SettingsView';
import PresetView from './views/PresetView';
import TranslateView from './views/TranslateView';
import LogView from './views/LogView';
import CacheView from './views/CacheView';
import BugReportPanel from './components/BugReportPanel';
import type { Page as ActiveView } from './types'; // Page를 ActiveView로 사용

// 로딩 컴포넌트
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
    <CircularProgress color="primary" />
  </Box>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const savedView = localStorage.getItem('lastVisitedView');
    return (savedView as ActiveView) || 'translation';
  });
  const [viewTransition, setViewTransition] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    localStorage.setItem('lastVisitedView', activeView);
  }, [activeView]);

  const handleViewChange = useCallback(
    (view: ActiveView) => {
      if (activeView !== view) {
        setViewTransition(false);
        setTimeout(() => {
          setActiveView(view);
          setViewTransition(true);
        }, 200);
      }
    },
    [activeView]
  );

  const getViewTitle = useCallback(() => {
    switch (activeView) {
      case 'translation':
        return '번역 실행';
      case 'presets':
        return '프리셋 관리';
      case 'settings':
        return '설정';
      case 'log':
        return '로그 보기';
      case 'cache':
        return '캐시 관리';
      case 'bug-report':
        return '버그 제보';
      default:
        // 'bug-report' 등 다른 페이지 타입에 대한 처리 추가 가능
        return '';
    }
  }, [activeView]);

  const renderActiveView = useCallback(() => {
    switch (activeView) {
      case 'translation':
        return <TranslateView />;
      case 'presets':
        return <PresetView />;
      case 'settings':
        return <SettingsView />;
      case 'log':
        return <LogView />;
      case 'cache':
        return <CacheView />;
      case 'bug-report':
        return <BugReportPanel />;
      default:
        return null;
    }
  }, [activeView]);

  return (
    <SettingsProvider>
      <PresetProvider>
        <ModalProvider>
          <TranslationProvider>
            <AppLayout activeView={activeView} onViewChange={handleViewChange}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h5"
                  fontWeight="medium"
                  color="text.primary"
                  sx={{
                    position: 'relative',
                    '&:after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -1,
                      left: 0,
                      width: '40px',
                      height: '4px',
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: '4px',
                    },
                  }}
                >
                  {getViewTitle()}
                </Typography>
              </Box>
              <Fade in={viewTransition} timeout={200}>
                <Box>
                  <Suspense fallback={<LoadingFallback />}>{renderActiveView()}</Suspense>
                </Box>
              </Fade>
            </AppLayout>
          </TranslationProvider>
          <ModalRoot />
        </ModalProvider>
      </PresetProvider>
    </SettingsProvider>
  );
};

export default App;
