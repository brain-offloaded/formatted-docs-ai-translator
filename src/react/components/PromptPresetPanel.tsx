import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Divider,
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
  Snackbar, // Snackbar 컴포넌트 import 추가
  Alert, // Alert 컴포넌트 import 추가 (선택적이지만 스낵바 모양 개선)
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

import { IpcChannel } from '../../nest/common/ipc.channel';
import { useSnackbar } from '../hooks/useSnackbar'; // 스낵바 훅 사용
import {
  PromptPresetDto,
  PromptPresetDetailDto,
  CreatePromptPresetRequestDto,
  UpdatePromptPresetRequestDto,
  DeletePromptPresetRequestDto,
  GetPromptPresetDetailRequestDto,
} from '../../nest/translation/prompt/dto'; // 백엔드 DTO import

const PromptPresetPanel: React.FC = () => {
  const [presets, setPresets] = useState<PromptPresetDto[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<number | ''>('');
  const [selectedPresetDetail, setSelectedPresetDetail] = useState<PromptPresetDetailDto | null>(
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
  const [editPrompt, setEditPrompt] = useState('');

  // useSnackbar 수정: SnackbarComponent 제거, isOpen, message, closeSnackbar 추가
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
      const response = await window.electron.ipcRenderer.invoke(IpcChannel.GetPromptPresets);
      if (response.success) {
        setPresets(response.presets || []);
        // 목록 로드 후 첫 번째 프리셋 또는 이전에 선택된 프리셋 선택 (선택적)
        if (response.presets && response.presets.length > 0) {
          // 이전에 선택된 ID가 있으면 유지, 없으면 첫번째 선택
          const currentSelectedIdExists = response.presets.some((p) => p.id === selectedPresetId);
          if (!currentSelectedIdExists) {
            setSelectedPresetId(response.presets[0].id);
          }
        } else {
          setSelectedPresetId('');
          setSelectedPresetDetail(null);
        }
      } else {
        showSnackbar(`프리셋 목록 로드 실패: ${response.message}`); // severity 제거
        setPresets([]);
        setSelectedPresetId('');
        setSelectedPresetDetail(null);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
      showSnackbar('프리셋 목록 로드 중 오류 발생'); // severity 제거
      setPresets([]);
      setSelectedPresetId('');
      setSelectedPresetDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [showSnackbar, selectedPresetId]); // selectedPresetId 의존성 추가

  // 프리셋 상세 정보 로드
  const loadPresetDetail = useCallback(
    async (id: number) => {
      if (!id) return;
      setIsDetailLoading(true);
      setSelectedPresetDetail(null); // 상세 로드 시작 시 초기화
      try {
        const request: GetPromptPresetDetailRequestDto = { id };
        const response = await window.electron.ipcRenderer.invoke(
          IpcChannel.GetPromptPresetDetail,
          request
        );
        if (response.success && response.preset) {
          setSelectedPresetDetail(response.preset);
        } else {
          showSnackbar(`프리셋 상세 로드 실패: ${response.message}`); // severity 제거
          setSelectedPresetDetail(null);
          // 목록에서 해당 ID가 사라졌을 수 있으므로 목록 다시 로드 고려
          // loadPresets();
        }
      } catch (error) {
        console.error('Error loading preset detail:', error);
        showSnackbar('프리셋 상세 로드 중 오류 발생'); // severity 제거
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
      setSelectedPresetDetail(null); // 선택 해제 시 상세 정보 초기화
    }
  }, [selectedPresetId, loadPresetDetail]);

  // --- 핸들러 함수들 ---
  const handlePresetChange = (event: SelectChangeEvent<number | ''>) => {
    setSelectedPresetId(event.target.value as number | '');
  };

  const handleOpenCreateDialog = () => {
    setEditName('');
    setEditPrompt('');
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };

  const handleCreatePreset = async () => {
    if (!editName.trim() || !editPrompt.trim()) {
      showSnackbar('프리셋 이름과 프롬프트를 모두 입력해주세요.'); // severity 제거
      return;
    }
    setIsSaving(true);
    try {
      const request: CreatePromptPresetRequestDto = { name: editName, prompt: editPrompt };
      const response = await window.electron.ipcRenderer.invoke(
        IpcChannel.CreatePromptPreset,
        request
      );
      if (response.success && response.preset) {
        showSnackbar('프리셋이 성공적으로 생성되었습니다.'); // severity 제거
        handleCloseCreateDialog();
        await loadPresets(); // 목록 새로고침
        setSelectedPresetId(response.preset.id); // 새로 생성된 프리셋 선택
      } else {
        showSnackbar(`프리셋 생성 실패: ${response.message}`); // severity 제거
      }
    } catch (error) {
      console.error('Error creating preset:', error);
      showSnackbar('프리셋 생성 중 오류 발생'); // severity 제거
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditDialog = () => {
    if (!selectedPresetDetail) return;
    setEditName(selectedPresetDetail.name);
    setEditPrompt(selectedPresetDetail.prompt);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleUpdatePreset = async () => {
    if (!selectedPresetDetail || !editName.trim() || !editPrompt.trim()) {
      showSnackbar('프리셋 이름과 프롬프트를 모두 입력해주세요.'); // severity 제거
      return;
    }
    setIsSaving(true);
    try {
      const request: UpdatePromptPresetRequestDto = {
        id: selectedPresetDetail.id,
        name: editName,
        prompt: editPrompt,
      };
      const response = await window.electron.ipcRenderer.invoke(
        IpcChannel.UpdatePromptPreset,
        request
      );
      if (response.success) {
        showSnackbar('프리셋이 성공적으로 수정되었습니다.'); // severity 제거
        handleCloseEditDialog();
        await loadPresets(); // 목록 새로고침
        // 상세 정보도 다시 로드 (이름이 변경되었을 수 있으므로)
        loadPresetDetail(selectedPresetDetail.id);
      } else {
        showSnackbar(`프리셋 수정 실패: ${response.message}`); // severity 제거
      }
    } catch (error) {
      console.error('Error updating preset:', error);
      showSnackbar('프리셋 수정 중 오류 발생'); // severity 제거
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
      const request: DeletePromptPresetRequestDto = { id: selectedPresetDetail.id };
      const response = await window.electron.ipcRenderer.invoke(
        IpcChannel.DeletePromptPreset,
        request
      );
      if (response.success) {
        showSnackbar('프리셋이 성공적으로 삭제되었습니다.'); // severity 제거
        handleCloseDeleteConfirm();
        setSelectedPresetId(''); // 선택 해제
        setSelectedPresetDetail(null);
        await loadPresets(); // 목록 새로고침
      } else {
        showSnackbar(`프리셋 삭제 실패: ${response.message}`); // severity 제거
      }
    } catch (error) {
      console.error('Error deleting preset:', error);
      showSnackbar('프리셋 삭제 중 오류 발생'); // severity 제거
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        프롬프트 프리셋 관리
      </Typography>
      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FormControl fullWidth sx={{ minWidth: 200 }}>
          <InputLabel id="preset-select-label">프리셋 선택</InputLabel>
          <Select
            labelId="preset-select-label"
            value={selectedPresetId}
            label="프리셋 선택"
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
            <TextField
              label="프롬프트 내용"
              multiline
              rows={10} // 필요에 따라 조절
              value={selectedPresetDetail.prompt}
              fullWidth
              variant="outlined"
              InputProps={{
                readOnly: true, // 상세 보기에서는 읽기 전용
              }}
            />
          ) : (
            <Typography>프리셋 상세 정보를 불러올 수 없습니다.</Typography>
          )}
        </Box>
      )}

      {!isLoading && selectedPresetId === '' && presets.length > 0 && (
        <Typography sx={{ mt: 2, textAlign: 'center' }}>프리셋을 선택해주세요.</Typography>
      )}

      {!isLoading && presets.length === 0 && (
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          생성된 프리셋이 없습니다. '새 프리셋' 버튼을 눌러 추가하세요.
        </Typography>
      )}

      {/* 생성 다이얼로그 */}
      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>새 프롬프트 프리셋 생성</DialogTitle>
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
          />
          <TextField
            margin="dense"
            label="프롬프트 내용"
            type="text"
            fullWidth
            multiline
            rows={8}
            variant="standard"
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            disabled={isSaving}
          />
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

      {/* 수정 다이얼로그 */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>프롬프트 프리셋 수정</DialogTitle>
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
          />
          <TextField
            margin="dense"
            label="프롬프트 내용"
            type="text"
            fullWidth
            multiline
            rows={8}
            variant="standard"
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            disabled={isSaving}
          />
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

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={openDeleteConfirm} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>프리셋 삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            '{selectedPresetDetail?.name}' 프리셋을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수
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

      {/* 스낵바 컴포넌트 추가 */}
      <Snackbar
        open={isSnackbarOpen}
        autoHideDuration={3000} // useSnackbar의 기본값과 맞춤
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {/* Alert를 사용하면 스낵바 모양이 더 보기 좋음 (선택 사항) */}
        <Alert onClose={closeSnackbar} severity="info" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PromptPresetPanel;
