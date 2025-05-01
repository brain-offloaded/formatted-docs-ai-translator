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
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

import { IpcChannel } from '../../nest/common/ipc.channel';
import { useSnackbar } from '../hooks/useSnackbar';
import {
  PromptPresetDto,
  PromptPresetDetailDto,
  CreatePromptPresetRequestDto,
  UpdatePromptPresetRequestDto,
  DeletePromptPresetRequestDto,
  GetPromptPresetDetailRequestDto,
} from '../../nest/translation/prompt/dto';

const PromptPresetPanel: React.FC = () => {
  const [presets, setPresets] = useState<PromptPresetDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false); // 편집 시 상세 로딩
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 모달 상태
  const [openEditDialog, setOpenEditDialog] = useState(false); // 생성/편집 공용
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<PromptPresetDto | null>(null); // 삭제 대상 저장

  // 폼 상태 (생성/편집 공용)
  const [editId, setEditId] = useState<number | null>(null); // null이면 생성, number면 편집
  const [editName, setEditName] = useState('');
  const [editPrompt, setEditPrompt] = useState('');

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
      } else {
        showSnackbar(`프리셋 목록 로드 실패: ${response.message}`);
        setPresets([]);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
      showSnackbar('프리셋 목록 로드 중 오류 발생');
      setPresets([]);
    } finally {
      setIsLoading(false);
    }
  }, [showSnackbar]);

  // 프리셋 상세 정보 로드 (편집용)
  const loadPresetDetail = useCallback(
    async (id: number): Promise<PromptPresetDetailDto | null> => {
      if (!id) return null;
      setIsDetailLoading(true);
      try {
        const request: GetPromptPresetDetailRequestDto = { id };
        const response = await window.electron.ipcRenderer.invoke(
          IpcChannel.GetPromptPresetDetail,
          request
        );
        if (response.success && response.preset) {
          return response.preset;
        } else {
          showSnackbar(`프리셋 상세 로드 실패: ${response.message}`);
          return null;
        }
      } catch (error) {
        console.error('Error loading preset detail:', error);
        showSnackbar('프리셋 상세 로드 중 오류 발생');
        return null;
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

  // --- 핸들러 함수들 ---

  // 생성 다이얼로그 열기
  const handleOpenCreateDialog = () => {
    setEditId(null);
    setEditName('');
    setEditPrompt('');
    setOpenEditDialog(true);
  };

  // 편집 다이얼로그 열기 (리스트 아이템 클릭 시)
  const handleOpenEditDialog = async (id: number) => {
    const detail = await loadPresetDetail(id);
    if (detail) {
      setEditId(detail.id);
      setEditName(detail.name);
      setEditPrompt(detail.prompt);
      setOpenEditDialog(true);
    }
  };

  // 생성/편집 다이얼로그 닫기
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditId(null);
    setEditName('');
    setEditPrompt('');
  };

  // 생성 또는 수정 저장 (통합)
  const handleSavePreset = async () => {
    if (!editName.trim() || !editPrompt.trim()) {
      showSnackbar('프리셋 이름과 프롬프트를 모두 입력해주세요.');
      return;
    }
    setIsSaving(true);
    try {
      let response;
      if (editId === null) { // 생성
        const request: CreatePromptPresetRequestDto = { name: editName, prompt: editPrompt };
        response = await window.electron.ipcRenderer.invoke(
          IpcChannel.CreatePromptPreset,
          request
        );
        if (response.success) {
          showSnackbar('프리셋이 성공적으로 생성되었습니다.');
        } else {
          showSnackbar(`프리셋 생성 실패: ${response.message}`);
        }
      } else { // 수정
        const request: UpdatePromptPresetRequestDto = {
          id: editId,
          name: editName,
          prompt: editPrompt,
        };
        response = await window.electron.ipcRenderer.invoke(
          IpcChannel.UpdatePromptPreset,
          request
        );
        if (response.success) {
          showSnackbar('프리셋이 성공적으로 수정되었습니다.');
        } else {
          showSnackbar(`프리셋 수정 실패: ${response.message}`);
        }
      }

      if (response.success) {
        handleCloseEditDialog();
        await loadPresets();
      }
    } catch (error) {
      console.error('Error saving preset:', error);
      showSnackbar('프리셋 저장 중 오류 발생');
    } finally {
      setIsSaving(false);
    }
  };

  // 삭제 확인 다이얼로그 열기 (리스트 아이템 클릭 시)
  const handleOpenDeleteConfirm = (preset: PromptPresetDto) => {
    setPresetToDelete(preset);
    setOpenDeleteConfirm(true);
  };

  // 삭제 확인 다이얼로그 닫기
  const handleCloseDeleteConfirm = () => {
    setOpenDeleteConfirm(false);
    setPresetToDelete(null);
  };

  // 프리셋 삭제
  const handleDeletePreset = async () => {
    if (!presetToDelete) return;
    setIsDeleting(true);
    try {
      const request: DeletePromptPresetRequestDto = { id: presetToDelete.id };
      const response = await window.electron.ipcRenderer.invoke(
        IpcChannel.DeletePromptPreset,
        request
      );
      if (response.success) {
        showSnackbar('프리셋이 성공적으로 삭제되었습니다.');
        handleCloseDeleteConfirm();
        await loadPresets();
      } else {
        showSnackbar(`프리셋 삭제 실패: ${response.message}`);
      }
    } catch (error) {
      console.error('Error deleting preset:', error);
      showSnackbar('프리셋 삭제 중 오류 발생');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">프롬프트 프리셋 관리</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
          disabled={isLoading}
        >
          새 프리셋 생성
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {/* 프리셋 목록 */}
      <Paper variant="outlined">
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {!isLoading && presets.length === 0 && (
          <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
            생성된 프롬프트 프리셋이 없습니다.
          </Typography>
        )}
        {!isLoading && presets.length > 0 && (
          <List dense>
            {presets.map((preset) => (
              <React.Fragment key={preset.id}>
                <ListItem>
                  <ListItemText primary={preset.name} />
                  <ListItemSecondaryAction>
                    <Tooltip title="편집">
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleOpenEditDialog(preset.id)}
                        disabled={isLoading || isDetailLoading} // 상세 로딩 중에도 비활성화
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="삭제">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleOpenDeleteConfirm(preset)}
                        disabled={isLoading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* 생성/편집 다이얼로그 */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editId === null ? '새 프롬프트 프리셋 생성' : '프롬프트 프리셋 수정'}
        </DialogTitle>
        <DialogContent>
          <TextField
            // autoFocus // 접근성 문제로 제거
            margin="dense"
            label="프리셋 이름"
            type="text"
            fullWidth
            variant="standard"
            value={editName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
            disabled={isSaving || isDetailLoading} // 상세 로딩 중에도 비활성화
          />
          <TextField
            margin="dense"
            label="프롬프트 내용"
            type="text"
            fullWidth
            multiline
            rows={10} // 행 수 증가
            variant="standard"
            value={editPrompt}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditPrompt(e.target.value)}
            disabled={isSaving || isDetailLoading} // 상세 로딩 중에도 비활성화
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={isSaving || isDetailLoading}>
            취소
          </Button>
          <Button
            onClick={handleSavePreset}
            disabled={isSaving || isDetailLoading || !editName.trim() || !editPrompt.trim()}
          >
            {isSaving ? <CircularProgress size={20} /> : editId === null ? '생성' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={openDeleteConfirm} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>프리셋 삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            '{presetToDelete?.name}' 프리셋을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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

      {/* 스낵바 컴포넌트 */}
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

export default PromptPresetPanel;
