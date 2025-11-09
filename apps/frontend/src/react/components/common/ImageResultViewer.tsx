import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Grid, Paper, Tooltip } from '@mui/material';
import { Box2D } from '@apps/common/dist/utils/box2d';
import type { ImageTextBoundingBoxDto } from '@/react/api/generated/models/ImageTextBoundingBoxDto';

interface ImageResultViewerProps {
  file: File;
  ocrResult: ImageTextBoundingBoxDto[];
  translatedResult: ImageTextBoundingBoxDto[];
}

const ImageResultViewer: React.FC<ImageResultViewerProps> = ({
  file,
  ocrResult,
  translatedResult,
}) => {
  const { t } = useTranslation();
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const translatedCanvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
  }>({ visible: false, x: 0, y: 0, text: '' });

  useEffect(() => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.src = imageUrl;

    image.onload = () => {
      const drawCanvas = (
        canvas: HTMLCanvasElement,
        data: Pick<ImageTextBoundingBoxDto, 'box_2d'>[]
      ) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.font = '16px Arial';
        ctx.fillStyle = 'red';

        data.forEach((item) => {
          const bbox = item.box_2d as Box2D;
          const { x1, y1, x2, y2 } = Box2D.getCoordinate(bbox);
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        });
      };

      if (originalCanvasRef.current) {
        drawCanvas(originalCanvasRef.current, ocrResult);
      }
      if (translatedCanvasRef.current) {
        drawCanvas(translatedCanvasRef.current, translatedResult);
      }
    };

    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }, [file, ocrResult, translatedResult]);

  // const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>, data: ImageOcrResultItem[]) => {
  //   const canvas = e.currentTarget;
  //   const rect = canvas.getBoundingClientRect();
  //   const x = e.clientX - rect.left;
  //   const y = e.clientY - rect.top;

  //   let found = false;
  //   for (const item of data) {
  //     const { x1, y1, x2, y2 } = Box2D.getCoordinate(item.box_2d);
  //     if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
  //       setTooltip({ visible: true, x: e.pageX, y: e.pageY, text: item.text });
  //       found = true;
  //       break;
  //     }
  //   }

  //   if (!found) {
  //     setTooltip({ visible: false, x: 0, y: 0, text: '' });
  //   }
  // };

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        {file.name}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" align="center">
            {t('imageResultViewer.originalImage')}
          </Typography>
          <canvas
            ref={originalCanvasRef}
            style={{ maxWidth: '100%', height: 'auto' }}
            // onMouseMove={(e) => handleMouseMove(e, ocrResult)}
            onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, text: '' })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" align="center">
            {t('imageResultViewer.translatedImage')}
          </Typography>
          <canvas
            ref={translatedCanvasRef}
            style={{ maxWidth: '100%', height: 'auto' }}
            // onMouseMove={(e) => handleMouseMove(e, translatedResult)}
            onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, text: '' })}
          />
        </Grid>
      </Grid>
      <Tooltip title={tooltip.text} open={tooltip.visible} placement="top" arrow>
        <div
          style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, pointerEvents: 'none' }}
        />
      </Tooltip>
    </Paper>
  );
};

export default ImageResultViewer;
