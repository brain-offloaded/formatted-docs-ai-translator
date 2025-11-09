import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';

export interface TextPanelProps {
  texts: string[];
  width: number;
  fontSizeRem?: number;
  bgOpacity?: number;
}

export const TextPanel: React.FC<TextPanelProps> = ({
  texts,
  width,
  fontSizeRem = 0.95,
  bgOpacity = 0.4,
}) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        width,
        height: '100%',
        bgcolor: `rgba(0,0,0,${bgOpacity})`,
        color: 'white',
        borderRadius: 1,
        p: 0.75,
        overflow: 'auto',
        wordBreak: 'break-word',
        fontSize: `${fontSizeRem}rem`,
        lineHeight: 1.5,
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

export default TextPanel;
