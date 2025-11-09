import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Collapse, IconButton, Tooltip, Slider } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import { Mode } from '../types';

export interface TopBarProps {
  pagesLength: number;
  idx: number;
  mode: Mode;
  helpOpen: boolean;
  onToggleHelp: () => void;
  textFontSize: number;
  textBgOpacity: number;
  onChangeFontSize: (v: number) => void;
  onChangeBgOpacity: (v: number) => void;
}

export const TopBar = React.forwardRef<HTMLDivElement, TopBarProps>(
  (
    {
      pagesLength,
      idx,
      mode,
      helpOpen,
      onToggleHelp,
      textFontSize,
      textBgOpacity,
      onChangeFontSize,
      onChangeBgOpacity,
    },
    ref
  ) => {
    const { t } = useTranslation();

    return (
      <Box
        ref={ref}
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 0.5,
          pointerEvents: 'none', // 내부 버튼만 이벤트 처리
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            maxWidth: 520,
            backdropFilter: helpOpen ? 'blur(4px)' : 'blur(2px)',
            background: helpOpen ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 1.5,
            px: 1.25,
            py: 0.75,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            pointerEvents: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {pagesLength > 0
                ? `${idx + 1} / ${pagesLength} · ${
                    mode === 'applied'
                      ? t('advancedImageViewer.topBar.appliedImage')
                      : t('advancedImageViewer.topBar.originalWithText')
                  }`
                : t('advancedImageViewer.topBar.uploadZip')}
            </Typography>
            <Tooltip
              title={t(
                helpOpen
                  ? 'advancedImageViewer.topBar.closeHelp'
                  : 'advancedImageViewer.topBar.openHelp'
              )}
              placement="right"
              arrow
            >
              <IconButton
                size="small"
                onClick={onToggleHelp}
                sx={{ color: 'rgba(255,255,255,0.8)', p: 0.5 }}
              >
                {helpOpen ? <CloseIcon fontSize="small" /> : <HelpOutlineIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
          <Collapse in={helpOpen} timeout={200} unmountOnExit>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pb: 0.25 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'auto auto',
                  columnGap: 2,
                  rowGap: 0.25,
                  fontSize: 12,
                  lineHeight: 1.4,
                  pr: 1,
                }}
              >
                <Key k="←/→" desc={t('advancedImageViewer.topBar.navigatePages')} />
                <Key k="Tab" desc={t('advancedImageViewer.topBar.switchMode')} />
                <Key k="G" desc={t('advancedImageViewer.topBar.toggleThumbnails')} />
                <Key k="H" desc={t('advancedImageViewer.topBar.toggleHelp')} />
                <Key k="R" desc={t('advancedImageViewer.topBar.resetTextPanel')} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>
                    {t('advancedImageViewer.topBar.fontSize')} {textFontSize.toFixed(2)}rem
                  </Typography>
                  <Slider
                    value={textFontSize}
                    onChange={(_, newValue) => onChangeFontSize(newValue as number)}
                    min={0.6}
                    max={1.6}
                    step={0.05}
                    sx={{
                      width: 180,
                      color: 'rgba(255,255,255,0.8)',
                      '& .MuiSlider-thumb': {
                        width: 16,
                        height: 16,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0 0 0 8px rgba(255,255,255,0.16)',
                        },
                      },
                      '& .MuiSlider-track': {
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        border: 'none',
                      },
                      '& .MuiSlider-rail': {
                        backgroundColor: 'rgba(255,255,255,0.3)',
                      },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>
                    {t('advancedImageViewer.topBar.backgroundOpacity')} {textBgOpacity.toFixed(2)}
                  </Typography>
                  <Slider
                    value={textBgOpacity}
                    onChange={(_, newValue) => onChangeBgOpacity(newValue as number)}
                    min={0}
                    max={0.9}
                    step={0.05}
                    sx={{
                      width: 180,
                      color: 'rgba(255,255,255,0.8)',
                      '& .MuiSlider-thumb': {
                        width: 16,
                        height: 16,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0 0 0 8px rgba(255,255,255,0.16)',
                        },
                      },
                      '& .MuiSlider-track': {
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        border: 'none',
                      },
                      '& .MuiSlider-rail': {
                        backgroundColor: 'rgba(255,255,255,0.3)',
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Collapse>
        </Box>
      </Box>
    );
  }
);

TopBar.displayName = 'TopBar';

export default TopBar;

interface KeyProps {
  k: string;
  desc: string;
}

const Key: React.FC<KeyProps> = ({ k, desc }) => (
  <>
    <Typography
      component="span"
      sx={{
        fontFamily: 'monospace',
        bgcolor: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.25)',
        px: 0.75,
        py: '2px',
        borderRadius: 0.75,
        fontSize: 11,
        lineHeight: 1.2,
        letterSpacing: 0.5,
      }}
    >
      {k}
    </Typography>
    <Typography component="span" sx={{ opacity: 0.8, fontSize: 12 }}>
      {desc}
    </Typography>
  </>
);
