import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';

export interface TextOverlayProps {
  texts: string[];
  overlayWidth: number;
  overlayHeight: number;
  fontSizeRem?: number; // 실제 rem 값 (기본 0.95)
  bgOpacity?: number; // 0 ~ 1 (기본 0.45)
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  texts,
  overlayWidth,
  overlayHeight,
  fontSizeRem = 0.95,
  bgOpacity = 0.45,
}) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        width: overlayWidth,
        height: overlayHeight,
        bgcolor: `rgba(0,0,0,${bgOpacity})`,
        color: 'white',
        borderRadius: 1,
        p: 1,
        overflow: 'auto',
        wordBreak: 'break-word',
        fontSize: `${fontSizeRem}rem`,
        lineHeight: 1.5,
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(1px)',
        transition: 'background-color 120ms ease, font-size 120ms ease',
      }}
    >
      {texts.length > 0 ? (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', font: 'inherit' }}>
          {texts.join('\n\n')}
        </pre>
      ) : (
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          {t('advancedImageViewer.textPanel.noText')}
        </Typography>
      )}
    </Box>
  );
};

export default TextOverlay;
