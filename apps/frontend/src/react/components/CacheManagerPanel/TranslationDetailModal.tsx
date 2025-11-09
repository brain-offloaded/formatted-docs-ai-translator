import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Autocomplete, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { CopyButton } from '../common/CopyButton';
import type { CacheTagSummaryDto, CacheTranslationDto } from '@/react/api/generated';

interface TranslationDetailModalProps {
  translation: CacheTranslationDto | null;
  onHistoryClick: (translationId: number) => void;
  onSave: (newTarget: string) => void;
  cacheTags: CacheTagSummaryDto[];
  onChangeCacheTag: (cacheTagId: number) => void;
  isProcessing: boolean;
}

/**
 * 번역 상세 정보를 보여주는 모달 콘텐츠 컴포넌트
 * 새로운 모달 시스템에서는 콘텐츠만 제공하고 상태는 부모 컴포넌트에서 관리
 */
export const TranslationDetailModal: React.FC<TranslationDetailModalProps> = ({
  translation,
  onHistoryClick,
  onSave,
  cacheTags,
  onChangeCacheTag,
  isProcessing,
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editingTarget, setEditingTarget] = useState('');
  // props 변경 없이 화면 표시용으로만 사용하는 값
  const [displayedTarget, setDisplayedTarget] = useState('');
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [selectedCacheTagId, setSelectedCacheTagId] = useState<number | null>(null);

  // translation이 변경될 때 편집 상태 초기화
  useEffect(() => {
    if (!translation) {
      setIsEditing(false);
      return;
    }

    // translation이 변경되면 편집 상태 초기화 및 표시 텍스트 동기화
    setIsEditing(false);
    setEditingTarget(translation.target);
    setDisplayedTarget(translation.target);
    setSelectedCacheTagId(translation.cacheTagId ?? null);
  }, [translation]);

  // 편집 모드 시작
  const startEditing = () => {
    if (translation) {
      setEditingTarget(displayedTarget);
      setIsEditing(true);
    }
  };

  // 편집 취소
  const cancelEditing = () => {
    setIsEditing(false);
    setEditingTarget(displayedTarget);
  };

  // 편집 내용 저장
  const saveEditing = () => {
    if (translation) {
      onSave(editingTarget);
      // 저장 후 즉시 모달 표시 텍스트 업데이트(부모 state 반영 전까지 임시 표시)
      setDisplayedTarget(editingTarget);
      setIsEditing(false);
    }
  };

  // 입력 내용 변경 처리
  const handleEditingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditingTarget(e.target.value);
  };

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.focus();
    }
  }, [isEditing]);

  if (!translation) return null;

  return (
    <Stack spacing={3} sx={{ minWidth: 360 }}>
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" fontWeight={600}>
            {t('translationDetailModal.source')}
          </Typography>
          <CopyButton targetValue={translation.source} />
        </Stack>
        <Box
          sx={{
            bgcolor: 'grey.100',
            borderRadius: 1,
            p: 2,
            maxHeight: 160,
            overflowY: 'auto',
            typography: 'body2',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {translation.source}
        </Box>
      </Stack>

      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" fontWeight={600}>
            {t('translationDetailModal.target')}
          </Typography>
          {!isEditing && <CopyButton targetValue={displayedTarget} />}
        </Stack>

        {isEditing ? (
          <Stack spacing={2}>
            <TextField
              value={editingTarget}
              onChange={handleEditingChange}
              onClick={(e) => e.stopPropagation()}
              multiline
              minRows={5}
              inputRef={editorRef}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="contained" color="primary" onClick={saveEditing}>
                {t('translationDetailModal.save')}
              </Button>
              <Button variant="outlined" color="inherit" onClick={cancelEditing}>
                {t('translationDetailModal.cancel')}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Box
            sx={{
              position: 'relative',
              bgcolor: 'grey.100',
              borderRadius: 1,
              p: 2,
              minHeight: 120,
              typography: 'body2',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {displayedTarget}
            <Button
              size="small"
              variant="contained"
              color="secondary"
              onClick={startEditing}
              sx={{ position: 'absolute', top: 12, right: 12 }}
            >
              {t('translationDetailModal.edit')}
            </Button>
          </Box>
        )}
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle1" fontWeight={600}>
          {t('translationDetailModal.cacheTag')}
        </Typography>
        <Autocomplete
          options={cacheTags}
          value={cacheTags.find((tag) => tag.id === selectedCacheTagId) ?? null}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, value) => setSelectedCacheTagId(value?.id ?? null)}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder={t('translationDetailModal.cacheTagPlaceholder')}
            />
          )}
          noOptionsText={t('translationDetailModal.noCacheTagOptions')}
          fullWidth
        />
        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="contained"
            disabled={
              isProcessing ||
              selectedCacheTagId == null ||
              selectedCacheTagId === (translation.cacheTagId ?? null) ||
              cacheTags.length === 0
            }
            onClick={() => {
              if (selectedCacheTagId != null) {
                onChangeCacheTag(selectedCacheTagId);
              }
            }}
          >
            {t('translationDetailModal.applyCacheTag')}
          </Button>
        </Stack>
      </Stack>
      <DetailRow
        label={t('translationDetailModal.createdAt')}
        value={new Date(translation.createdAt).toLocaleString()}
      />
      <DetailRow
        label={t('translationDetailModal.lastUsedAt')}
        value={new Date(translation.lastAccessedAt).toLocaleString()}
      />

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="outlined" onClick={() => onHistoryClick(translation.id)}>
          {t('translationDetailModal.viewHistory')}
        </Button>
      </Stack>
    </Stack>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <Stack spacing={1}>
    <Typography variant="subtitle1" fontWeight={600}>
      {label}
    </Typography>
    <Box
      sx={{
        bgcolor: 'grey.100',
        borderRadius: 1,
        p: 2,
        typography: 'body2',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {value}
    </Box>
  </Stack>
);

export default TranslationDetailModal;
