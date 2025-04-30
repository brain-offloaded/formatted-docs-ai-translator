import { Box, Paper, Typography, Fade, useTheme, CircularProgress } from '@mui/material';
import React, { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react';

import AppLayout from './layouts/AppLayout';
import { TranslationProvider } from './contexts/TranslationContext';
import TranslationPanel from './components/TranslationPanel';
import { ModalProvider } from './contexts/ModalContext';
import { ModalRoot } from './components/common/ModalRoot';
import type { Page } from './types';

// 컴포넌트 지연 로딩 적용
const ConfigPanel = lazy(() => import('./components/ConfigPanel'));
const CacheManagerPanel = lazy(() => import('./components/CacheManagerPanel'));
const LogViewer = lazy(() => import('./components/LogViewer'));
const BugReportPanel = lazy(() => import('./components/BugReportPanel'));
// const PromptPresetPanel = lazy(() => import('./components/PromptPresetPanel')); // 제거
const PresetManagementPanel = lazy(() => import('./components/PresetManagementPanel')); // 통합 패널 추가

// 로딩 컴포넌트
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
    <CircularProgress color="primary" />
  </Box>
);

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // 로컬 스토리지에서 마지막 페이지 가져오기
    const savedPage = localStorage.getItem('lastVisitedPage');
    return (savedPage as Page) || 'translation';
  });
  const [pageTransition, setPageTransition] = useState(true);

  // 페이지 변경 간 메모리 관리를 위한 참조
  const prevPageRef = useRef<Page>(currentPage);

  const theme = useTheme();

  // 페이지 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('lastVisitedPage', currentPage);
  }, [currentPage]);

  // 사용하지 않는 컴포넌트 메모리 정리
  useEffect(() => {
    return () => {
      // 이 효과 정리 함수는 앱이 종료될 때 실행됩니다
      localStorage.removeItem('tempFormData');
    };
  }, []);

  // 성능 모니터링을 위한 효과
  useEffect(() => {
    if (prevPageRef.current !== currentPage) {
      // 메모리 사용량 로깅 (개발 모드에서만)
      if (process.env.NODE_ENV === 'development') {
        // Chrome의 Performance 인터페이스 확장 속성 타입 안전하게 접근
        const perf = performance as unknown as {
          memory?: {
            totalJSHeapSize: number;
            usedJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        };

        if (perf.memory) {
          console.log('메모리 사용량:', {
            totalJSHeapSize: Math.round(perf.memory.totalJSHeapSize / (1024 * 1024)) + 'MB',
            usedJSHeapSize: Math.round(perf.memory.usedJSHeapSize / (1024 * 1024)) + 'MB',
            jsHeapSizeLimit: Math.round(perf.memory.jsHeapSizeLimit / (1024 * 1024)) + 'MB',
          });
        }
      }

      prevPageRef.current = currentPage;
    }
  }, [currentPage]);

  // 페이지 전환 핸들러
  const handlePageChange = useCallback(
    (page: Page) => {
      if (currentPage !== page) {
        setPageTransition(false);
        // 페이지 변경 시 이전 페이지의 임시 상태 정리 (TranslationPanel 제외)
        window.localStorage.removeItem('tempFormData');

        setTimeout(() => {
          setCurrentPage(page);
          setPageTransition(true);
        }, 200); // Fade timeout과 맞추거나 약간 길게 조정
      }
    },
    [currentPage]
  );

  // 페이지 제목 가져오기
  const getPageTitle = useCallback(() => {
    switch (currentPage) {
      case 'translation':
        return '텍스트 번역';
      case 'cache':
        return '번역 캐시 관리';
      case 'log':
        return '로그 보기';
      case 'bug-report':
        return '버그 제보';
      case 'presets': // 수정
        return '프리셋 관리';
      default:
        return '';
    }
  }, [currentPage]);

  // 현재 페이지에 맞는 메인 패널 컴포넌트를 반환하는 함수
  const getMainPanelComponent = useCallback(() => {
    switch (currentPage) {
      case 'translation':
        // ConfigPanel은 translation 페이지의 일부로 간주하고 여기서 렌더링
        return <ConfigPanel />;
      case 'cache':
        return <CacheManagerPanel />;
      case 'log':
        return <LogViewer />;
      case 'bug-report':
        return <BugReportPanel />;
      case 'presets': // 수정
        return <PresetManagementPanel />;
      default:
        return null;
    }
  }, [currentPage]);

  // 메인 패널 렌더링 로직 (공통 Paper, Suspense 적용)
  const renderMainPanel = useCallback(() => {
    const MainPanel = getMainPanelComponent();
    if (!MainPanel) return null;

    // ConfigPanel은 TranslationPanel과 별도의 Paper로 감싸지 않도록 조건 추가
    const wrapInPaper = currentPage !== 'translation';

    const panelContent = <Suspense fallback={<LoadingFallback />}>{MainPanel}</Suspense>;

    if (wrapInPaper) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 0, // 내부 패널에서 패딩 관리하도록 0으로 설정
            borderRadius: '12px',
            overflow: 'hidden',
            // mb: 3, // TranslationPanel과의 간격은 TranslationPanel 렌더링 시 조절
          }}
        >
          {panelContent}
        </Paper>
      );
    }

    // ConfigPanel의 경우 Paper 없이 바로 렌더링 (TranslationPanel과 함께 배치될 것을 가정)
    return panelContent;
  }, [currentPage, getMainPanelComponent]);

  // TranslationPanel 및 ConfigPanel 렌더링 (translation 페이지 전용)
  const renderTranslationPageContent = useCallback(() => {
    if (currentPage !== 'translation') return null;

    return (
      <>
        {/* ConfigPanel (Paper 없음) */}
        <Box sx={{ mb: 3 }}>
          {' '}
          {/* ConfigPanel과 TranslationPanel 사이 간격 */}
          <Suspense fallback={<LoadingFallback />}>
            <ConfigPanel />
          </Suspense>
        </Box>

        {/* TranslationPanel (Paper로 감쌈) */}
        <Paper
          elevation={0}
          sx={{
            // mb: 3, // 다른 패널과의 간격은 필요 없음
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <TranslationPanel />
        </Paper>
      </>
    );
  }, [currentPage]);

  return (
    <ModalProvider>
      <TranslationProvider>
        <AppLayout currentPage={currentPage} onPageChange={handlePageChange}>
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
              {getPageTitle()}
            </Typography>
          </Box>
          <Fade in={pageTransition} timeout={200}>
            <Box>
              {/* 현재 페이지가 translation이면 전용 컨텐츠 렌더링 */}
              {currentPage === 'translation' && renderTranslationPageContent()}
              {/* 현재 페이지가 translation이 아니면 메인 패널 렌더링 */}
              {currentPage !== 'translation' && renderMainPanel()}
            </Box>
          </Fade>
        </AppLayout>
      </TranslationProvider>
      <ModalRoot />
    </ModalProvider>
  );
};

export default App;
