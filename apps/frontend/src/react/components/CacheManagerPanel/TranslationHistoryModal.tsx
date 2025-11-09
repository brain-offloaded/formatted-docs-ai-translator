import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';

import type { TranslationHistoryDto } from '@/react/api/generated';
import { CopyButton } from '../common/CopyButton';

interface TranslationHistoryModalProps {
  translationHistory: TranslationHistoryDto[] | null;
}

/**
 * 번역 이력을 보여주는 모달 콘텐츠 컴포넌트
 * 새로운 모달 시스템용으로 수정
 */
export const TranslationHistoryModal: React.FC<TranslationHistoryModalProps> = ({
  translationHistory,
}) => {
  const { t } = useTranslation();
  if (!translationHistory) return null;
  const length = translationHistory.length;
  const headerCellSx = {
    top: 0,
    backgroundColor: (theme: Theme) => theme.palette.background.paper,
    zIndex: 1,
  };

  return (
    <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 360 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headerCellSx}>{t('translationHistoryModal.version')}</TableCell>
            <TableCell sx={headerCellSx}>{t('translationHistoryModal.translatedText')}</TableCell>
            <TableCell sx={headerCellSx}>{t('translationHistoryModal.cacheTag')}</TableCell>
            <TableCell sx={headerCellSx}>{t('translationHistoryModal.modifiedAt')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {translationHistory.map((history, index) => (
            <TableRow key={length - index} hover>
              <TableCell sx={{ width: 80 }}>V{length - index}</TableCell>
              <TableCell sx={{ minWidth: 200 }}>
                <Typography
                  id={`history-${index}`}
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {history.target}
                </Typography>
                <CopyButton targetSelector={`#history-${index}`} />
              </TableCell>
              <TableCell sx={{ width: 140 }}>{history.cacheTag}</TableCell>
              <TableCell sx={{ width: 180 }}>
                {new Date(history.createdAt).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TranslationHistoryModal;
