import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Add as AddIcon,
  BookmarkBorder as BookmarkIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { ConfigStore } from '../config/config-store';
import { IpcChannel } from '../../nest/common/ipc.channel';
import { Language, SourceLanguage } from '../../utils/language';
import { useTranslation } from '../contexts/TranslationContext';
import { ExamplePresetDto } from '@/nest/translation/example/dto/example-preset.dto';
import { ExamplePresetDetailDto } from '@/nest/translation/example/dto/example-preset-detail.dto';
import { GetExamplePresetDetailRequestDto } from '@/nest/translation/example/dto/request/get-example-preset-detail-request.dto';

// 삭제 버튼 컴포넌트 (ExamplePresetSelector에서 가져옴)
const DeleteButton = React.memo(
  ({
    language,
    index,
    onDelete,
  }: {
    language: SourceLanguage;
    index: number;
    onDelete: (language: SourceLanguage, index: number) => void;
  }) => {
    const handleClick = useCallback(() => {
      onDelete(language, index);
    }, [language, index, onDelete]);

    return (
      <Button color="error" size="small" variant="outlined" onClick={handleClick}>
        삭제
      </Button>
    );
  }
);
DeleteButton.displayName = 'DeleteButton';

const ExamplePresetEditor: React.FC = () => {
  const configStore = ConfigStore.getInstance();
  const { showSnackbar } = useTranslation();

  // 예제 프리셋 관련 상태
  const [examplePresets, setExamplePresets] = useState<ExamplePresetDto[]>([]);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [isPresetLoading, setIsPresetLoading] = useState(false);

  // 상세 보기 및 편집 관련 상태
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<ExamplePresetDetailDto | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [activeLanguageTab, setActiveLanguageTab] = useState<SourceLanguage>(Language.ENGLISH);
  const [editingExamples, setEditingExamples] = useState<
    Record<SourceLanguage, { sourceLines: string[]; resultLines: string[] }>
  >({
    [Language.CHINESE]: { sourceLines: [], resultLines: [] },
    [Language.ENGLISH]: { sourceLines: [], resultLines: [] },
    [Language.JAPANESE]: { sourceLines: [], resultLines: [] },
  });
  const [presetToDelete, setPresetToDelete] = useState<ExamplePresetDto | null>(null); // 삭제할 프리셋 정보 저장

  // 예제 프리셋 목록 가져오기
  const fetchExamplePresets = useCallback(async () => {
    try {
      setIsPresetLoading(true);
      const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetExamplePresets);
      if (result.success) {
        setExamplePresets(result.presets);
      } else {
        showSnackbar(`프리셋 목록 불러오기 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('프리셋 불러오기 중 오류 발생:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      showSnackbar(`프리셋 목록 불러오기 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setIsPresetLoading(false);
    }
  }, [showSnackbar]);

  // 컴포넌트 마운트 시 예제 프리셋 목록 가져오기
  useEffect(() => {
    fetchExamplePresets();
  }, [fetchExamplePresets]);

  // 새 프리셋 저장
  const handleSaveNewPreset = useCallback(async () => {
    if (!newPresetName.trim()) {
      showSnackbar('프리셋 이름은 필수입니다.');
      return;
    }

    try {
      setIsPresetLoading(true);
      const result = await window.electron.ipcRenderer.invoke(IpcChannel.CreateExamplePreset, {
        name: newPresetName,
        description: newPresetDescription.trim() || null,
      });

      if (result.success) {
        setIsPresetModalOpen(false);
        setNewPresetName('');
        setNewPresetDescription('');
        showSnackbar('새 프리셋이 성공적으로 생성되었습니다.');
        fetchExamplePresets(); // 목록 갱신
      } else {
        showSnackbar(`프리셋 생성 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('프리셋 생성 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      showSnackbar(`프리셋 생성 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setIsPresetLoading(false);
    }
  }, [newPresetName, newPresetDescription, fetchExamplePresets, showSnackbar]);

  // 프리셋 상세 정보 가져오기
  const fetchPresetDetail = useCallback(
    async (presetId: number) => {
      if (!presetId) return;
      try {
        setIsPresetLoading(true);
        const request: GetExamplePresetDetailRequestDto = { id: presetId };
        const result = await window.electron.ipcRenderer.invoke(
          IpcChannel.GetExamplePresetDetail,
          request
        );

        if (result.success && result.preset) {
          setSelectedPreset(result.preset);
          setEditingExamples(result.preset.examples); // 편집 상태 초기화
          setEditingName(result.preset.name); // 편집 이름 초기화
          setEditingDescription(result.preset.description || ''); // 편집 설명 초기화
          return result.preset; // 상세 정보 반환
        } else {
          showSnackbar(`프리셋 정보를 불러오지 못했습니다: ${result.message}`);
          return null;
        }
      } catch (error) {
        console.error('프리셋 상세 정보 가져오기 오류:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        showSnackbar(`프리셋 정보를 불러오는데 실패했습니다: ${errorMessage}`);
        return null;
      } finally {
        setIsPresetLoading(false);
      }
    },
    [showSnackbar]
  );

  // 상세 보기 열기
  const handleOpenDetail = useCallback(
    async (presetId: number) => {
      const detail = await fetchPresetDetail(presetId);
      if (detail) {
        setIsDetailModalOpen(true);
      }
    },
    [fetchPresetDetail]
  );

  // 편집 모드 열기 (상세 보기 모달에서 호출)
  const handleOpenEditFromDetail = useCallback(() => {
    if (selectedPreset) {
      // 이미 fetchPresetDetail에서 editing 상태가 설정되었으므로 바로 열기
      setIsDetailModalOpen(false);
      setIsEditModalOpen(true);
    }
  }, [selectedPreset]);

  // 편집 모드 직접 열기 (리스트에서 호출)
  const handleOpenEditDirectly = useCallback(
    async (presetId: number) => {
      const detail = await fetchPresetDetail(presetId);
      if (detail) {
        setIsEditModalOpen(true);
      }
    },
    [fetchPresetDetail]
  );

  // 탭 변경 핸들러
  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: SourceLanguage) => {
    setActiveLanguageTab(newValue);
  }, []);

  // 예제 추가
  const handleAddExample = useCallback((language: SourceLanguage) => {
    setEditingExamples((prev) => {
      const updated = { ...prev };
      updated[language] = {
        sourceLines: [...updated[language].sourceLines, ''],
        resultLines: [...updated[language].resultLines, ''],
      };
      return updated;
    });
  }, []);

  // 예제 제거
  const handleRemoveExample = useCallback((language: SourceLanguage, index: number) => {
    setEditingExamples((prev) => {
      const updated = { ...prev };
      updated[language] = {
        sourceLines: updated[language].sourceLines.filter((_, i) => i !== index),
        resultLines: updated[language].resultLines.filter((_, i) => i !== index),
      };
      return updated;
    });
  }, []);

  // 예제 내용 변경
  const handleExampleChange = useCallback(
    (
      language: SourceLanguage,
      index: number,
      field: 'sourceLines' | 'resultLines',
      value: string
    ) => {
      setEditingExamples((prev) => {
        const updated = { ...prev };
        updated[language][field] = [
          ...updated[language][field].slice(0, index),
          value,
          ...updated[language][field].slice(index + 1),
        ];
        return updated;
      });
    },
    []
  );

  // 예제 편집 핸들러 (UI 호출용 별칭)
  const handleExampleEdit = useCallback(
    (
      language: SourceLanguage,
      field: 'sourceLines' | 'resultLines',
      index: number,
      value: string
    ) => {
      handleExampleChange(language, index, field, value);
    },
    [handleExampleChange]
  );

  // 예제 제거 (UI 호출용 별칭)
  const removeExample = useCallback(
    (language: SourceLanguage, index: number) => {
      handleRemoveExample(language, index);
    },
    [handleRemoveExample]
  );

  // 프리셋 복제 (사용자 요청 반영)
  const handleClonePreset = useCallback(async () => {
    if (!selectedPreset) return;

    try {
      setIsPresetLoading(true);
      const result = await window.electron.ipcRenderer.invoke(IpcChannel.CreateExamplePreset, {
        name: `${selectedPreset.name}_복제본`, // 복제본 이름 규칙
        description: selectedPreset.description,
        examples: selectedPreset.examples, // 원본 예제 포함
      });

      if (result.success) {
        setIsDetailModalOpen(false); // 상세 모달 닫기
        showSnackbar('프리셋이 성공적으로 복제되었습니다.');
        fetchExamplePresets(); // 목록 갱신

        // 복제된 프리셋으로 현재 선택된 프리셋 변경 (선택 사항)
        // const config = configStore.getConfig();
        // if (config.lastPresetName === selectedPreset.name) {
        //   configStore.updateConfig({ lastPresetName: result.preset.name });
        // }
      } else {
        showSnackbar(`프리셋 복제 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('프리셋 복제 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      showSnackbar(`프리셋 복제 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setIsPresetLoading(false);
    }
  }, [selectedPreset, fetchExamplePresets, showSnackbar, configStore]);

  // 수정된 예제 저장
  const handleSaveExamples = useCallback(async () => {
    if (!selectedPreset) return;

    if (!editingName.trim()) {
      showSnackbar('프리셋 이름은 비워둘 수 없습니다.');
      return;
    }

    try {
      setIsPresetLoading(true);
      const result = await window.electron.ipcRenderer.invoke(IpcChannel.UpdateExamplePreset, {
        id: selectedPreset.id,
        examples: editingExamples,
        description: editingDescription,
        name: editingName.trim(),
      });

      if (result.success) {
        setIsEditModalOpen(false);
        fetchExamplePresets(); // 목록 갱신
        showSnackbar('프리셋이 성공적으로 저장되었습니다.');

        // 현재 로드된 프리셋이 수정된 경우, TranslationPanel에서 감지하여 다시 로드하도록 유도 필요
        // (예: context나 이벤트 버스 사용)
        // 여기서는 목록만 갱신
      } else {
        showSnackbar(`프리셋 저장 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('프리셋 저장 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      showSnackbar(`프리셋 저장 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setIsPresetLoading(false);
    }
  }, [
    editingExamples,
    editingDescription,
    editingName,
    fetchExamplePresets,
    selectedPreset,
    showSnackbar,
  ]);

  // 삭제 확인 대화상자 열기
  const openDeleteConfirm = (preset: ExamplePresetDto) => {
    setPresetToDelete(preset);
    setIsDeleteConfirmOpen(true);
  };

  // 프리셋 삭제
  const handleDeletePreset = useCallback(async () => {
    if (!presetToDelete) return;

    try {
      setIsPresetLoading(true);
      const result = await window.electron.ipcRenderer.invoke(IpcChannel.DeleteExamplePreset, {
        id: presetToDelete.id,
      });

      if (result.success) {
        setIsDeleteConfirmOpen(false);
        setPresetToDelete(null); // 삭제 대상 초기화
        showSnackbar('프리셋이 성공적으로 삭제되었습니다.');
        fetchExamplePresets(); // 목록 갱신

        // 현재 로드된 프리셋이 삭제된 경우 처리 (TranslationPanel에서 필요)
        // const config = configStore.getConfig();
        // if (config.lastPresetName === presetToDelete.name) {
        //   // 다른 프리셋 로드 또는 기본값 설정 로직 필요
        // }
      } else {
        showSnackbar(`프리셋 삭제 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('프리셋 삭제 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      showSnackbar(`프리셋 삭제 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setIsPresetLoading(false);
    }
  }, [presetToDelete, fetchExamplePresets, showSnackbar, configStore]);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">예제 프리셋 관리</Typography>
        <Tooltip title="새 프리셋 생성">
          <span>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsPresetModalOpen(true)}
              disabled={isPresetLoading}
            >
              생성
            </Button>
          </span>
        </Tooltip>
      </Box>

      <Paper variant="outlined">
        {isPresetLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {!isPresetLoading && examplePresets.length === 0 && (
          <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
            생성된 예제 프리셋이 없습니다.
          </Typography>
        )}
        {!isPresetLoading && examplePresets.length > 0 && (
          <List dense>
            {examplePresets.map((preset) => (
              <React.Fragment key={preset.id}>
                <ListItem onClick={() => handleOpenDetail(preset.id)}>
                  <ListItemText
                    primary={preset.name}
                    secondary={preset.description || '설명 없음'}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="상세 보기">
                      <IconButton
                        edge="end"
                        aria-label="view"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenDetail(preset.id);
                        }}
                        disabled={isPresetLoading}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="편집">
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenEditDirectly(preset.id);
                        }}
                        disabled={isPresetLoading}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="삭제">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDeleteConfirm(preset);
                        }}
                        disabled={isPresetLoading}
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

      {/* 새 프리셋 생성 모달 */}
      <Dialog
        open={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>새 예제 프리셋 생성</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            id="preset-name"
            label="프리셋 이름"
            type="text"
            fullWidth
            value={newPresetName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPresetName(e.target.value)}
            required
            error={!newPresetName.trim()}
            helperText={!newPresetName.trim() ? '프리셋 이름은 필수입니다' : ''}
          />
          <TextField
            margin="dense"
            id="preset-description"
            label="설명 (선택사항)"
            type="text"
            fullWidth
            value={newPresetDescription}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewPresetDescription(e.target.value)
            }
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPresetModalOpen(false)}>취소</Button>
          <Button
            onClick={handleSaveNewPreset}
            variant="contained"
            disabled={!newPresetName.trim() || isPresetLoading}
          >
            생성
          </Button>
        </DialogActions>
      </Dialog>

      {/* 프리셋 상세 보기 모달 */}
      <Dialog
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            예제 프리셋 상세 보기: {selectedPreset?.name}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* 복제 버튼 추가 */}
              <Button
                variant="contained"
                startIcon={<BookmarkIcon />}
                onClick={handleClonePreset}
                disabled={isPresetLoading || !selectedPreset}
              >
                복제
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleOpenEditFromDetail}
                disabled={isPresetLoading}
              >
                편집
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  if (selectedPreset) openDeleteConfirm(selectedPreset);
                  setIsDetailModalOpen(false); // 상세 모달 닫기
                }}
                disabled={isPresetLoading}
              >
                삭제
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {isPresetLoading && <CircularProgress />}
          {!isPresetLoading && selectedPreset && (
            <>
              {selectedPreset.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    설명
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">{selectedPreset.description}</Typography>
                  </Paper>
                </Box>
              )}

              <Tabs
                value={activeLanguageTab}
                onChange={handleTabChange}
                aria-label="language tabs"
                sx={{ mb: 2 }}
              >
                <Tab label="English" value={Language.ENGLISH} />
                <Tab label="日本語" value={Language.JAPANESE} />
                <Tab label="中文" value={Language.CHINESE} />
              </Tabs>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  예제 목록
                </Typography>

                {selectedPreset.examples[activeLanguageTab].sourceLines.map(
                  (source: string, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 2,
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle2">예제 {index + 1}</Typography>
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        소스
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          fontFamily: 'monospace',
                          mb: 1,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {source}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        번역 결과
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {selectedPreset.examples[activeLanguageTab].resultLines[index]}
                      </Typography>
                    </Box>
                  )
                )}

                {selectedPreset.examples[activeLanguageTab].sourceLines.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: 'center', py: 2 }}
                  >
                    이 언어에 등록된 예제가 없습니다.
                  </Typography>
                )}
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDetailModalOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 프리셋 예제 편집 모달 */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            예제 프리셋 편집: {selectedPreset?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {isPresetLoading && <CircularProgress />}
          {!isPresetLoading && selectedPreset && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  이름
                </Typography>
                <TextField
                  fullWidth
                  placeholder="프리셋 이름"
                  value={editingName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingName(e.target.value)
                  }
                  variant="outlined"
                  required
                  error={!editingName.trim()}
                  helperText={!editingName.trim() ? '프리셋 이름은 필수입니다' : ''}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  설명
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="프리셋에 대한 설명을 입력하세요"
                  value={editingDescription}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingDescription(e.target.value)
                  }
                  variant="outlined"
                />
              </Box>

              <Tabs
                value={activeLanguageTab}
                onChange={handleTabChange}
                aria-label="language tabs"
                sx={{ mb: 2 }}
              >
                <Tab label="English" value={Language.ENGLISH} />
                <Tab label="日本語" value={Language.JAPANESE} />
                <Tab label="中文" value={Language.CHINESE} />
              </Tabs>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddExample(activeLanguageTab)}
                >
                  예제 추가
                </Button>
              </Box>

              <Paper variant="outlined" sx={{ p: 2 }}>
                {editingExamples[activeLanguageTab].sourceLines.map((source, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      p: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle2">예제 {index + 1}</Typography>
                      <DeleteButton
                        language={activeLanguageTab}
                        index={index}
                        onDelete={removeExample}
                      />
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      소스
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      variant="outlined"
                      size="small"
                      value={source}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        handleExampleEdit(activeLanguageTab, 'sourceLines', index, e.target.value)
                      }
                      sx={{ mb: 1, fontFamily: 'monospace' }}
                    />

                    <Typography variant="caption" color="text.secondary">
                      번역 결과
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      variant="outlined"
                      size="small"
                      value={editingExamples[activeLanguageTab].resultLines[index]}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        handleExampleEdit(activeLanguageTab, 'resultLines', index, e.target.value)
                      }
                      sx={{ fontFamily: 'monospace' }}
                    />
                  </Box>
                ))}

                {editingExamples[activeLanguageTab].sourceLines.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: 'center', py: 2 }}
                  >
                    이 언어에 등록된 예제가 없습니다. 예제 추가 버튼을 눌러 추가해보세요.
                  </Typography>
                )}
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditModalOpen(false)}>취소</Button>
          <Button
            onClick={handleSaveExamples}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isPresetLoading || !editingName.trim()}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 프리셋 삭제 확인 대화상자 */}
      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">프리셋 삭제 확인</DialogTitle>
        <DialogContent>
          <Typography>
            "{presetToDelete?.name}" 프리셋을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteConfirmOpen(false)}>취소</Button>
          <Button onClick={handleDeletePreset} color="error" disabled={isPresetLoading}>
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamplePresetEditor;
