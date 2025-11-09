import React, { useRef, useCallback } from 'react';
import { Box, Typography, Paper, Stack, IconButton, Tooltip, Chip } from '@mui/material';
import {
  Upload as UploadIcon,
  FilePresent as FileIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface FileUploaderProps {
  isDisabled: boolean;
  selectedFiles: File[] | null;
  onFileChange: (files: File[] | null) => void;
  onClearFiles: () => void;
  fileExtension?: string;
  label?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  isDisabled,
  selectedFiles,
  onFileChange,
  onClearFiles,
  fileExtension = '*',
  label,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 핸들러
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isDisabled) return;

      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        onFileChange(files);
      } else {
        onFileChange(null);
      }
    },
    [isDisabled, onFileChange]
  );

  // 파일 선택 버튼 클릭 핸들러
  const handleClickFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={fileExtension}
        disabled={isDisabled}
        multiple
        style={{ display: 'none' }}
      />

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          bgcolor: 'transparent',
          borderStyle: 'solid',
          borderColor: 'divider',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: isDisabled ? undefined : 'rgba(0, 0, 0, 0.02)',
          },
        }}
        onClick={isDisabled ? undefined : handleClickFileInput}
      >
        <UploadIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="body1" gutterBottom>
          {t('fileUploader.clickToSelect', { label })}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          {t('fileUploader.multipleFiles')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('fileUploader.supportedFiles', { fileExtension })}
        </Typography>
      </Paper>

      {selectedFiles && selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant="subtitle2" gutterBottom={false}>
              {t('fileUploader.selectedFiles')}
            </Typography>
            <Chip
              label={t('fileUploader.fileCount', { count: selectedFiles.length })}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          <Paper variant="outlined" sx={{ p: 1, maxHeight: '200px', overflow: 'auto' }}>
            <Stack spacing={1}>
              {selectedFiles.map((file, index) => (
                <Box
                  key={`${file.name}-${index}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <FileIcon color="info" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mx: 1 }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {t('fileUploader.totalSize', {
                size:
                  selectedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 > 1024
                    ? `${(selectedFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(2)} MB`
                    : `${(selectedFiles.reduce((sum, file) => sum + file.size, 0) / 1024).toFixed(2)} KB`,
              })}
            </Typography>
            <Tooltip title={t('fileUploader.deleteFiles')}>
              <IconButton size="small" color="error" onClick={onClearFiles} disabled={isDisabled}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </>
  );
};

export default FileUploader;
