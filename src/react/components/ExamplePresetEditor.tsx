import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Snackbar,
  Alert,
  Grid, // Grid 추가
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

import { IpcChannel } from '../../nest/common/ipc.channel';
import { useSnackbar } from '../hooks/useSnackbar';
import { Language, SourceLanguage } from '../../utils/language'; // Language import 추가
// Example Preset 관련 DTO import 수정 (개별 파일 참조)
import { ExamplePresetDto } from '../../nest/translation/example/dto/example-preset.dto';
import { ExamplePresetDetailDto } from '../../nest/translation/example/dto/example-preset-detail.dto';
import { CreateExamplePresetRequestDto } from '../../nest/translation/example/dto/request/create-example-preset-request.dto';
import { UpdateExamplePresetRequestDto } from '../../nest/translation/example/dto/request/update-example-preset-request.dto';
import { DeleteExamplePresetRequestDto } from '../../nest/translation/example/dto/request/delete-example-preset-request.dto';
import { GetExamplePresetDetailRequestDto } from '../../nest/translation/example/dto/request/get-example-preset-detail-request.dto';
// 응답 DTO도 필요시 import (현재 코드에서는 직접 사용하지 않음)
// import { GetExamplePresetsResponseDto } from '../../nest/translation/example/dto/response/get-example-presets-response.dto';
// import { GetExamplePresetDetailResponseDto } from '../../nest/translation/example/dto/response/get-example-preset-detail-response.dto';
// import { CreateExamplePresetResponseDto } from '../../nest/translation/example/dto/response/create-example-preset-response.dto';
// import { UpdateExamplePresetResponseDto } from '../../nest/translation/example/dto/response/update-example-preset-response.dto';
// import { DeleteExamplePresetResponseDto } from '../../nest/translation/example/dto/response/delete-example-preset-response.dto';

// 예제 입력 필드를 위한 타입 (PromptPresetPanel과 유사하게)
interface ExampleInput {
  sourceLines: string;
  resultLines: string;
}

const ExamplePresetEditor: React.FC = () => {
  const [presets, setPresets] = useState<ExamplePresetDto[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<number | ''>('');
  const [selectedPresetDetail, setSelectedPresetDetail] = useState<ExamplePresetDetailDto | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 모달 상태
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  // 폼 상태
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  // 언어별 예제 입력 상태
  const [editExamples, setEditExamples] = useState<Record<SourceLanguage, ExampleInput>>({
    [Language.ENGLISH]: { sourceLines: '', resultLines: '' },
    [Language.JAPANESE]: { sourceLines: '', resultLines: '' },
    [Language.CHINESE]: { sourceLines: '', resultLines: '' },
  });

  const {
    isOpen: isSnackbarOpen,
    message: snackbarMessage,
    showSnackbar,
    closeSnackbar,
  } = useSnackbar();

  // 프리셋 목록 로드
  const loadPresets = useCallback(async () => {
    setIsLoading(true);
    try {
      // 백엔드 응답 타입 확인 필요 (GetExamplePresetsResponseDto 가정)
      const response = await window.electron.ipcRenderer.invoke(IpcChannel.GetExamplePresets);
      if (response.success) {
        setPresets(response.presets || []);
        if (response.presets && response.presets.length > 0) {
          const currentSelectedIdExists = response.presets.some((p) => p.id === selectedPresetId);
          if (!currentSelectedIdExists) {
            setSelectedPresetId(response.presets[0].id);
          }
        } else {
          setSelectedPresetId('');
          setSelectedPresetDetail(null);
        }
      } else {
        showSnackbar(`예제 프리셋 목록 로드 실패: ${response.message}`);
        setPresets([]);
        setSelectedPresetId('');
        setSelectedPresetDetail(null);
      }
    } catch (error) {
      console.error('Error loading example presets:', error);
      showSnackbar('예제 프리셋 목록 로드 중 오류 발생');
      setPresets([]);
      setSelectedPresetId('');
      setSelectedPresetDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [showSnackbar, selectedPresetId]);

  // 프리셋 상세 정보 로드
  const loadPresetDetail = useCallback(
    async (id: number) => {
      if (!id) return;
      setIsDetailLoading(true);
      setSelectedPresetDetail(null);
      try {
        const request: GetExamplePresetDetailRequestDto = { id }; // 요청 DTO 확인 필요
        // 백엔드 응답 타입 확인 필요 (GetExamplePresetDetailResponseDto 가정)
        const response = await window.electron.ipcRenderer.invoke(
          IpcChannel.GetExamplePresetDetail,
          request
        );
        if (response.success && response.preset) {
          setSelectedPresetDetail(response.preset);
          // 상세 정보 로드 시 예제 데이터도 상태에 반영
          const loadedExamples: Record<SourceLanguage, ExampleInput> = {
            [Language.ENGLISH]: { sourceLines: '', resultLines: '' },
            [Language.JAPANESE]: { sourceLines: '', resultLines: '' },
            [Language.CHINESE]: { sourceLines: '', resultLines: '' },
          };
          if (response.preset.examples) {
            const { examples } = response.preset;
            Object.keys(examples).forEach((lang) => {
              const key = lang as SourceLanguage;
              loadedExamples[key] = {
                sourceLines: examples[key]?.sourceLines?.join('\n') || '',
                resultLines: examples[key]?.resultLines?.join('\n') || '',
              };
            });
          }
          setEditExamples(loadedExamples); // 상세 보기 시 예제 상태 업데이트
        } else {
          showSnackbar(`예제 프리셋 상세 로드 실패: ${response.message}`);
          setSelectedPresetDetail(null);
        }
      } catch (error) {
        console.error('Error loading example preset detail:', error);
        showSnackbar('예제 프리셋 상세 로드 중 오류 발생');
        setSelectedPresetDetail(null);
      } finally {
        setIsDetailLoading(false);
      }
    },
    [showSnackbar]
  );

  // 첫 마운트 시 프리셋 목록 로드
  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  // 선택된 프리셋 ID 변경 시 상세 정보 로드
  useEffect(() => {
    if (selectedPresetId !== '') {
      loadPresetDetail(selectedPresetId);
    } else {
      setSelectedPresetDetail(null);
      // 선택 해제 시 예제 입력 필드 초기화
      setEditExamples({
        [Language.ENGLISH]: { sourceLines: '', resultLines: '' },
        [Language.JAPANESE]: { sourceLines: '', resultLines: '' },
        [Language.CHINESE]: { sourceLines: '', resultLines: '' },
      });
    }
  }, [selectedPresetId, loadPresetDetail]);

  // --- 핸들러 함수들 ---
  const handlePresetChange = (event: SelectChangeEvent<number | ''>) => {
    setSelectedPresetId(event.target.value as number | '');
  };

  const handleOpenCreateDialog = () => {
    setEditName('');
    setEditDescription('');
    setEditExamples({
      // 예제 초기화
      [Language.ENGLISH]: { sourceLines: '', resultLines: '' },
      [Language.JAPANESE]: { sourceLines: '', resultLines: '' },
      [Language.CHINESE]: { sourceLines: '', resultLines: '' },
    });
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };

  // 예제 입력 변경 핸들러
  const handleExampleChange = (
    lang: SourceLanguage,
    type: 'sourceLines' | 'resultLines',
    value: string
  ) => {
    setEditExamples((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [type]: value,
      },
    }));
  };

  // 문자열 배열을 줄바꿈 문자열로 변환하는 헬퍼 함수
  const formatExamplesForRequest = (examples: Record<SourceLanguage, ExampleInput>) => {
    const formatted: any = {};
    Object.keys(examples).forEach((lang) => {
      const key = lang as SourceLanguage;
      formatted[key] = {
        sourceLines: examples[key].sourceLines.split('\n').filter((line) => line.trim() !== ''),
        resultLines: examples[key].resultLines.split('\n').filter((line) => line.trim() !== ''),
      };
    });
    return formatted;
  };

  const handleCreatePreset = async () => {
    if (!editName.trim()) {
      showSnackbar('프리셋 이름을 입력해주세요.');
      return;
    }
    setIsSaving(true);
    try {
      const request: CreateExamplePresetRequestDto = {
        // 요청 DTO 확인 필요
        name: editName,
        description: editDescription || null,
        examples: formatExamplesForRequest(editExamples), // 예제 데이터 변환
      };
      // 백엔드 응답 타입 확인 필요 (CreateExamplePresetResponseDto 가정)
      const response = await window.electron.ipcRenderer.invoke(
        IpcChannel.CreateExamplePreset,
        request
      );
      if (response.success && response.preset) {
        showSnackbar('예제 프리셋이 성공적으로 생성되었습니다.');
        handleCloseCreateDialog();
        await loadPresets();
        setSelectedPresetId(response.preset.id);
      } else {
        showSnackbar(`예제 프리셋 생성 실패: ${response.message}`);
      }
    } catch (error) {
      console.error('Error creating example preset:', error);
      showSnackbar('예제 프리셋 생성 중 오류 발생');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditDialog = () => {
    if (!selectedPresetDetail) return;
    setEditName(selectedPresetDetail.name);
    setEditDescription(selectedPresetDetail.description || '');
    // 상세 정보의 예제를 편집 상태로 로드
    const loadedExamples: Record<SourceLanguage, ExampleInput> = {
      [Language.ENGLISH]: { sourceLines: '', resultLines: '' },
      [Language.JAPANESE]: { sourceLines: '', resultLines: '' },
      [Language.CHINESE]: { sourceLines: '', resultLines: '' },
    };
    if (selectedPresetDetail.examples) {
      Object.keys(selectedPresetDetail.examples).forEach((lang) => {
        const key = lang as SourceLanguage;
        loadedExamples[key] = {
          sourceLines: selectedPresetDetail.examples[key]?.sourceLines?.join('\n') || '',
          resultLines: selectedPresetDetail.examples[key]?.resultLines?.join('\n') || '',
        };
      });
    }
    setEditExamples(loadedExamples);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleUpdatePreset = async () => {
    if (!selectedPresetDetail || !editName.trim()) {
      showSnackbar('프리셋 이름을 입력해주세요.');
      return;
    }
    setIsSaving(true);
    try {
      const request: UpdateExamplePresetRequestDto = {
        // 요청 DTO 확인 필요
        id: selectedPresetDetail.id,
        name: editName,
        description: editDescription || null,
        examples: formatExamplesForRequest(editExamples), // 예제 데이터 변환
      };
      // 백엔드 응답 타입 확인 필요 (UpdateExamplePresetResponseDto 가정)
      const response = await window.electron.ipcRenderer.invoke(
        IpcChannel.UpdateExamplePreset,
        request
      );
      if (response.success) {
        showSnackbar('예제 프리셋이 성공적으로 수정되었습니다.');
        handleCloseEditDialog();
        await loadPresets();
        loadPresetDetail(selectedPresetDetail.id);
      } else {
        showSnackbar(`예제 프리셋 수정 실패: ${response.message}`);
      }
    } catch (error) {
      console.error('Error updating example preset:', error);
      showSnackbar('예제 프리셋 수정 중 오류 발생');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDeleteConfirm = () => {
    if (!selectedPresetDetail) return;
    setOpenDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setOpenDeleteConfirm(false);
  };

  const handleDeletePreset = async () => {
    if (!selectedPresetDetail) return;
    setIsDeleting(true);
    try {
      const request: DeleteExamplePresetRequestDto = { id: selectedPresetDetail.id }; // 요청 DTO 확인 필요
      // 백엔드 응답 타입 확인 필요 (DeleteExamplePresetResponseDto 가정)
      const response = await window.electron.ipcRenderer.invoke(
        IpcChannel.DeleteExamplePreset,
        request
      );
      if (response.success) {
        showSnackbar('예제 프리셋이 성공적으로 삭제되었습니다.');
        handleCloseDeleteConfirm();
        setSelectedPresetId('');
        setSelectedPresetDetail(null);
        await loadPresets();
      } else {
        showSnackbar(`예제 프리셋 삭제 실패: ${response.message}`);
      }
    } catch (error) {
      console.error('Error deleting example preset:', error);
      showSnackbar('예제 프리셋 삭제 중 오류 발생');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Title and Select Box */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FormControl fullWidth sx={{ minWidth: 200 }}>
          <InputLabel id="example-preset-select-label">예제 프리셋 선택</InputLabel>
          <Select
            labelId="example-preset-select-label"
            value={selectedPresetId}
            label="예제 프리셋 선택"
            onChange={handlePresetChange}
            disabled={isLoading}
            displayEmpty
          >
            <MenuItem value="" disabled>
              <em>프리셋을 선택하세요</em>
            </MenuItem>
            {presets.map((preset) => (
              <MenuItem key={preset.id} value={preset.id}>
                {preset.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
          disabled={isLoading}
        >
          새 프리셋
        </Button>
      </Box>

      {isLoading && <CircularProgress size={24} sx={{ display: 'block', margin: 'auto' }} />}

      {/* Preset Detail View */}
      {!isLoading && selectedPresetId !== '' && (
        <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant="h6">
              {selectedPresetDetail ? selectedPresetDetail.name : '프리셋 로딩 중...'}
            </Typography>
            <Box>
              <IconButton
                onClick={handleOpenEditDialog}
                disabled={!selectedPresetDetail || isDetailLoading}
                size="small"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                onClick={handleOpenDeleteConfirm}
                disabled={!selectedPresetDetail || isDetailLoading}
                size="small"
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
          {isDetailLoading ? (
            <CircularProgress size={20} />
          ) : selectedPresetDetail ? (
            <Box>
              <TextField
                label="설명"
                value={selectedPresetDetail.description || ''}
                fullWidth
                variant="outlined"
                margin="normal"
                InputProps={{ readOnly: true }}
              />
              {/* 언어별 예제 표시 */}
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {Object.keys(editExamples).map((lang) => (
                  <Grid item xs={12} md={4} key={lang}>
                    <Typography variant="subtitle1" gutterBottom>
                      {lang}
                    </Typography>
                    <TextField
                      label="원본 (Source)"
                      multiline
                      rows={5}
                      value={editExamples[lang as SourceLanguage].sourceLines}
                      fullWidth
                      variant="outlined"
                      margin="dense"
                      InputProps={{ readOnly: true }}
                    />
                    <TextField
                      label="결과 (Result)"
                      multiline
                      rows={5}
                      value={editExamples[lang as SourceLanguage].resultLines}
                      fullWidth
                      variant="outlined"
                      margin="dense"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Typography>예제 프리셋 상세 정보를 불러올 수 없습니다.</Typography>
          )}
        </Box>
      )}

      {!isLoading && selectedPresetId === '' && presets.length > 0 && (
        <Typography sx={{ mt: 2, textAlign: 'center' }}>프리셋을 선택해주세요.</Typography>
      )}

      {!isLoading && presets.length === 0 && (
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          생성된 예제 프리셋이 없습니다. '새 프리셋' 버튼을 눌러 추가하세요.
        </Typography>
      )}

      {/* Create Dialog */}
      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} maxWidth="md" fullWidth>
        <DialogTitle>새 예제 프리셋 생성</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="프리셋 이름"
            type="text"
            fullWidth
            variant="standard"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            disabled={isSaving}
            required
          />
          <TextField
            margin="dense"
            label="설명 (선택 사항)"
            type="text"
            fullWidth
            variant="standard"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            disabled={isSaving}
          />
          {/* 언어별 예제 입력 */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.keys(editExamples).map((lang) => (
              <Grid item xs={12} md={4} key={lang}>
                <Typography variant="subtitle1" gutterBottom>
                  {lang}
                </Typography>
                <TextField
                  label="원본 (Source) - 각 줄은 개행으로 구분"
                  multiline
                  rows={8}
                  value={editExamples[lang as SourceLanguage].sourceLines}
                  onChange={(e) =>
                    handleExampleChange(lang as SourceLanguage, 'sourceLines', e.target.value)
                  }
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  disabled={isSaving}
                />
                <TextField
                  label="결과 (Result) - 각 줄은 개행으로 구분"
                  multiline
                  rows={8}
                  value={editExamples[lang as SourceLanguage].resultLines}
                  onChange={(e) =>
                    handleExampleChange(lang as SourceLanguage, 'resultLines', e.target.value)
                  }
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  disabled={isSaving}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} disabled={isSaving}>
            취소
          </Button>
          <Button onClick={handleCreatePreset} disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} /> : '생성'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>예제 프리셋 수정</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="프리셋 이름"
            type="text"
            fullWidth
            variant="standard"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            disabled={isSaving}
            required
          />
          <TextField
            margin="dense"
            label="설명 (선택 사항)"
            type="text"
            fullWidth
            variant="standard"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            disabled={isSaving}
          />
          {/* 언어별 예제 입력 */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.keys(editExamples).map((lang) => (
              <Grid item xs={12} md={4} key={lang}>
                <Typography variant="subtitle1" gutterBottom>
                  {lang}
                </Typography>
                <TextField
                  label="원본 (Source) - 각 줄은 개행으로 구분"
                  multiline
                  rows={8}
                  value={editExamples[lang as SourceLanguage].sourceLines}
                  onChange={(e) =>
                    handleExampleChange(lang as SourceLanguage, 'sourceLines', e.target.value)
                  }
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  disabled={isSaving}
                />
                <TextField
                  label="결과 (Result) - 각 줄은 개행으로 구분"
                  multiline
                  rows={8}
                  value={editExamples[lang as SourceLanguage].resultLines}
                  onChange={(e) =>
                    handleExampleChange(lang as SourceLanguage, 'resultLines', e.target.value)
                  }
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  disabled={isSaving}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={isSaving}>
            취소
          </Button>
          <Button onClick={handleUpdatePreset} disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} /> : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={openDeleteConfirm} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>예제 프리셋 삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            '{selectedPresetDetail?.name}' 예제 프리셋을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수
            없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} disabled={isDeleting}>
            취소
          </Button>
          <Button onClick={handleDeletePreset} color="error" disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={20} /> : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={isSnackbarOpen}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity="info" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExamplePresetEditor;
