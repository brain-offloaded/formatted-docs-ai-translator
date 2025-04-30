import React, { useRef, useCallback } from 'react';
import { Box, Typography, Paper, Stack, IconButton, Tooltip, Chip } from '@mui/material';
import {
  Upload as UploadIcon,
  FilePresent as FileIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';

interface FileUploaderProps {
  isDisabled: boolean;
  selectedFiles: File[] | null;
  onFileChange: (files: File[] | null) => void;
  onClearFiles: () => void;
  fileExtension?: string;
  label?: string;
  dragActive?: boolean;
  setDragActive?: (active: boolean) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  isDisabled,
  selectedFiles,
  onFileChange,
  onClearFiles,
  fileExtension = '*',
  label,
  dragActive = false,
  setDragActive = () => {},
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 드래그 앤 드롭 핸들러
  const handleDrag = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (isDisabled) return;

      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    },
    [isDisabled, setDragActive]
  );

  // 파일 드롭 핸들러
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (isDisabled) return;

      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter((file) =>
          file.name.endsWith(fileExtension)
        );

        if (files.length === 0) {
          alert(`${fileExtension} 파일만 지원합니다.`);
          return;
        }

        onFileChange(files);
      }
    },
    [isDisabled, setDragActive, onFileChange, fileExtension]
  );

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
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        variant="outlined"
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          bgcolor: dragActive ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
          borderStyle: dragActive ? 'dashed' : 'solid',
          borderColor: dragActive ? 'primary.main' : 'divider',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: isDisabled ? undefined : 'rgba(0, 0, 0, 0.02)',
          },
        }}
        onClick={isDisabled ? undefined : handleClickFileInput}
      >
        <UploadIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="body1" gutterBottom>
          {`${label}을 드래그하거나 클릭하여 선택하세요.`}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          {`여러 파일을 동시에 선택할 수 있습니다.`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {`지원 파일: ${fileExtension}`}
        </Typography>
      </Paper>

      {selectedFiles && selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant="subtitle2" gutterBottom={false}>
              선택된 파일
            </Typography>
            <Chip
              label={`${selectedFiles.length}개`}
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
              {`총 ${
                selectedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 > 1024
                  ? (
                      selectedFiles.reduce((sum, file) => sum + file.size, 0) /
                      (1024 * 1024)
                    ).toFixed(2) + ' MB'
                  : (selectedFiles.reduce((sum, file) => sum + file.size, 0) / 1024).toFixed(2) +
                    ' KB'
              }`}
            </Typography>
            <Tooltip title="파일 삭제">
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
