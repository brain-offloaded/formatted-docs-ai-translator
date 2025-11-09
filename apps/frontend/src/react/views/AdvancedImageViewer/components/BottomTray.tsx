import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Fade, Typography, TextField, MenuItem } from '@mui/material';
import { PageItem } from '../types';
import { VirtualThumbList } from './VirtualThumbList';

export interface BottomTrayProps {
  visible: boolean;
  pages: PageItem[];
  idx: number;
  onChangeIndex: (i: number) => void;
  overscan?: number;
}

const BottomTrayInner: React.FC<BottomTrayProps> = ({
  visible,
  pages,
  idx,
  onChangeIndex,
  overscan,
}) => {
  const { t } = useTranslation();
  const [selectValue, setSelectValue] = useState(Math.min(Math.max(1, idx + 1), pages.length || 1));

  useEffect(() => {
    setSelectValue(Math.min(Math.max(1, idx + 1), pages.length || 1));
  }, [idx, pages.length]);

  return (
    <Fade in={visible && pages.length > 0} timeout={150}>
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          pt: 6,
          pb: 1,
          px: 2,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            select
            label={t('advancedImageViewer.bottomTray.page', { idx: idx + 1, length: pages.length })}
            value={selectValue}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSelectValue(v);
              onChangeIndex(Math.min(pages.length - 1, Math.max(0, v - 1)));
            }}
            sx={{ minWidth: 140, '& .MuiInputBase-root': { background: 'rgba(0,0,0,0.4)' } }}
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: { maxHeight: 360 },
                },
              },
            }}
          >
            {pages.map((p, i) => (
              <MenuItem key={p.key} value={i + 1} sx={{ fontSize: 13 }}>
                {i + 1}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            {t('advancedImageViewer.bottomTray.jumpTo')}
          </Typography>
        </Box>
        <VirtualThumbList
          pages={pages}
          currentIndex={idx}
          visible={visible}
          active={visible}
          overscan={overscan}
          onSelect={onChangeIndex}
        />
      </Box>
    </Fade>
  );
};
export const BottomTray = React.memo(BottomTrayInner);
BottomTray.displayName = 'BottomTray';

export default BottomTray;
