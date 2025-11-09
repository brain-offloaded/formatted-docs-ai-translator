import { Box, Typography, Fade, useTheme, CircularProgress } from '@mui/material';
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import AppLayout from './layouts/AppLayout';
import { TranslationProvider } from './contexts/TranslationContext';
import { ModalProvider } from './contexts/ModalContext';
import { ModalRoot } from './components/common/ModalRoot';
import AppSettingsView from './views/AppSettingsView';
import SettingsView from './views/SettingsView';
import PresetView from './views/PresetView';
import TranslateView from './views/TranslateView';
import LogView from './views/LogView';
import CacheView from './views/CacheView';
import CacheTagView from './views/CacheTagView';
import BugReportView from './views/BugReportView';
import ImageViewerView from './views/ImageViewerView';
import type { Page as ActiveView } from './types'; // Page를 ActiveView로 사용

// 로딩 컴포넌트
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
    <CircularProgress color="primary" />
  </Box>
);

const App: React.FC = () => {
  const { t } = useTranslation();
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
        return t('menu.translation');
      case 'image-viewer':
        return t('menu.imageViewer');
      case 'presets':
        return t('menu.presets');
      case 'app-settings':
        return t('menu.appSettings');
      case 'model-settings':
        return t('menu.modelSettings');
      case 'log':
        return t('menu.log');
      case 'cache':
        return t('menu.cache');
      case 'cache-tags':
        return t('menu.cacheTags');
      case 'bug-report':
        return t('menu.bugReport');
      default:
        return '';
    }
  }, [activeView, t]);

  const renderActiveView = useCallback(() => {
    switch (activeView) {
      case 'translation':
        return <TranslateView />;
      case 'image-viewer':
        return <ImageViewerView />;
      case 'presets':
        return <PresetView />;
      case 'app-settings':
        return <AppSettingsView />;
      case 'model-settings':
        return <SettingsView />;
      case 'log':
        return <LogView />;
      case 'cache':
        return <CacheView />;
      case 'cache-tags':
        return <CacheTagView />;
      case 'bug-report':
        return <BugReportView />;
      default:
        return null;
    }
  }, [activeView]);

  return (
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
  );
};

export default App;
