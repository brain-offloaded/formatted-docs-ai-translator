import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Fade, Typography } from '@mui/material';

export interface ProgressiveImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  onLoad?: (ev: React.SyntheticEvent<HTMLImageElement>) => void;
  preloadImage: (url: string) => Promise<HTMLImageElement>;
  progress?: number; // 0-100, undefined이면 indeterminate
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  style,
  onLoad,
  preloadImage,
  progress,
}) => {
  const { t } = useTranslation();
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    setImageState('loading');
    setDisplaySrc(null);

    let cancelled = false;
    preloadImage(src)
      .then(() => {
        if (cancelled) return;
        setDisplaySrc(src);
        setImageState('loaded');
      })
      .catch(() => {
        if (cancelled) return;
        setImageState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [src, preloadImage]);

  if (imageState === 'error') {
    return (
      <Box
        sx={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.7)',
          borderRadius: 1,
          minHeight: 200,
        }}
      >
        <Typography variant="body2">{t('advancedImageViewer.progressiveImage.error')}</Typography>
      </Box>
    );
  }

  if (imageState === 'loading') {
    return (
      <Box
        sx={{
          ...style,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,0.05)',
          borderRadius: 1,
          minHeight: 200,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            animation: 'shimmer 1.5s ease-in-out infinite',
            '@keyframes shimmer': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' },
            },
          }}
        />

        <CircularProgress
          size={40}
          sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}
          variant={typeof progress === 'number' ? 'determinate' : 'indeterminate'}
          value={progress || 0}
        />

        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {t('advancedImageViewer.progressiveImage.loading')}
        </Typography>

        {typeof progress === 'number' && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
            {Math.round(progress)}%
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Fade in={imageState === 'loaded'} timeout={300}>
      <img
        src={displaySrc || ''}
        alt={alt}
        style={{
          containIntrinsicSize: 'auto 480px',
          contentVisibility: 'auto',
          ...style,
        }}
        onLoad={onLoad}
        decoding="async"
        // High priority for main viewport image rendering
        fetchPriority="high"
        loading="eager"
      />
    </Fade>
  );
};

export default ProgressiveImage;
