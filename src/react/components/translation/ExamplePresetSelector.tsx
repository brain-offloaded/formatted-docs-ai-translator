import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  SelectChangeEvent,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Add as AddIcon,
  BookmarkBorder as BookmarkIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { ConfigStore } from '../../config/config-store';
import { IpcChannel } from '../../../nest/common/ipc.channel';
import { Language, SourceLanguage } from '../../../utils/language';
import { useTranslation } from '../../contexts/TranslationContext';
import { ExamplePresetDto } from '@/nest/translation/example/dto/example-preset.dto';
import { ExamplePresetDetailDto } from '@/nest/translation/example/dto/example-preset-detail.dto';

// 삭제 버튼 컴포넌트를 별도로 분리
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
    // 클릭 핸들러를 컴포넌트 내부에 정의하여 이벤트 버블링 제한
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

const ExamplePresetSelector: React.FC = () => {
  const configStore = ConfigStore.getInstance();
  const { isTranslating, showSnackbar } = useTranslation();

  // 예제 프리셋 관련 상태
  const [examplePresets, setExamplePresets] = useState<ExamplePresetDto[]>([]);
  const [currentPresetName, setCurrentPresetName] = useState<string>('');
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

  // 예제 프리셋 목록 가져오기
  const fetchExamplePresets = useCallback(async () => {
    try {
      setIsPresetLoading(true);
      const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetExamplePresets);
      if (result.success) {
        setExamplePresets(result.presets);

        // 저장된 설정에서 마지막으로 선택한 프리셋 이름 가져오기
        const config = configStore.getConfig();
        const savedPresetName = config.lastPresetName || result.currentPreset;

        // 현재 선택된 프리셋이 없거나 빈 문자열인 경우에도 프리셋 설정
        if (!currentPresetName && result.presets.length > 0) {
          // 가져온 프리셋 목록에 저장된 프리셋이 존재하는지 확인
          const presetExists = result.presets.some((preset) => preset.name === savedPresetName);

          // 저장된 프리셋이 존재하면 해당 프리셋 로드, 아니면 첫 번째 프리셋 사용
          if (presetExists) {
            setCurrentPresetName(savedPresetName);
            // 백엔드에서 현재 설정된 프리셋과 다르면 로드
            if (savedPresetName !== result.currentPreset) {
              const loadResult = await window.electron.ipcRenderer.invoke(
                IpcChannel.LoadExamplePreset,
                {
                  name: savedPresetName,
                }
              );
              if (!loadResult.success) {
                console.warn(`저장된 프리셋(${savedPresetName}) 로드 실패:`, loadResult.message);
              }
            }
          } else if (result.presets.length > 0) {
            // 존재하지 않으면 첫 번째 프리셋 사용
            setCurrentPresetName(result.presets[0].name);
            // 첫 번째 프리셋 로드
            const loadResult = await window.electron.ipcRenderer.invoke(
              IpcChannel.LoadExamplePreset,
              {
                name: result.presets[0].name,
              }
            );
            if (!loadResult.success) {
              console.warn(`첫 번째 프리셋 로드 실패:`, loadResult.message);
            }
          }
        }
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
  }, [showSnackbar, configStore, currentPresetName]);

  // 컴포넌트 마운트 시 예제 프리셋 목록 가져오기
  useEffect(() => {
    fetchExamplePresets();
  }, [fetchExamplePresets]);

  // 예제 프리셋 변경 핸들러
  const handlePresetChange = useCallback(
    async (event: SelectChangeEvent<string>) => {
      const newPresetName = event.target.value;
      try {
        setIsPresetLoading(true);
        const result = await window.electron.ipcRenderer.invoke(IpcChannel.LoadExamplePreset, {
          name: newPresetName,
        });

        if (result.success) {
          setCurrentPresetName(newPresetName);
          // 마지막으로 선택한 프리셋 이름을 설정에 저장
          configStore.updateConfig({ lastPresetName: newPresetName });
          showSnackbar(`'${newPresetName}' 프리셋을 로드했습니다.`);
        } else {
          showSnackbar(`프리셋 로드 실패: ${result.message}`);
        }
      } catch (error) {
        console.error('프리셋 로드 중 오류 발생:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        showSnackbar(`프리셋 로드 중 오류가 발생했습니다: ${errorMessage}`);
      } finally {
        setIsPresetLoading(false);
      }
    },
    [showSnackbar, configStore]
  );

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
        fetchExamplePresets();
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
    async (presetName: string) => {
      try {
        setIsPresetLoading(true);
        const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetExamplePresetDetail, {
          name: presetName,
        });

        if (result.success && result.preset) {
          setSelectedPreset(result.preset);
          setEditingExamples(result.preset.examples);
        } else {
          showSnackbar(`프리셋 정보를 불러오지 못했습니다: ${result.message}`);
        }
      } catch (error) {
        console.error('프리셋 상세 정보 가져오기 오류:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        showSnackbar(`프리셋 정보를 불러오는데 실패했습니다: ${errorMessage}`);
      } finally {
        setIsPresetLoading(false);
      }
    },
    [showSnackbar]
  );

  // 상세 보기 열기
  const handleOpenDetail = useCallback(async () => {
    await fetchPresetDetail(currentPresetName);
    setIsDetailModalOpen(true);
  }, [currentPresetName, fetchPresetDetail]);

  // 편집 모드 열기
  const handleOpenEdit = useCallback(() => {
    if (selectedPreset) {
      setEditingExamples({ ...selectedPreset.examples });
      setEditingName(selectedPreset.name);
      setEditingDescription(selectedPreset.description || '');
      setIsDetailModalOpen(false);
      setIsEditModalOpen(true);
    }
  }, [selectedPreset]);

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

  // 프리셋 복제
  const handleClonePreset = useCallback(async () => {
    if (!selectedPreset) return;

    try {
      setIsPresetLoading(true);
      const result = await window.electron.ipcRenderer.invoke(IpcChannel.CreateExamplePreset, {
        name: `${selectedPreset.name}_복제본`,
        description: selectedPreset.description,
        examples: selectedPreset.examples,
      });

      if (result.success) {
        setIsDetailModalOpen(false);
        showSnackbar('프리셋이 성공적으로 복제되었습니다.');
        fetchExamplePresets();

        // 새로 생성된 프리셋으로 전환
        if (result.preset) {
          await window.electron.ipcRenderer.invoke(IpcChannel.LoadExamplePreset, {
            name: result.preset.name,
          });
          setCurrentPresetName(result.preset.name);
        }
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
  }, [selectedPreset, fetchExamplePresets, showSnackbar]);

  // 수정된 예제 저장
  const handleSaveExamples = useCallback(async () => {
    if (!selectedPreset) return;

    // 이름이 비어있는지 확인
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

        // 프리셋 객체 업데이트
        setSelectedPreset((prev) =>
          prev
            ? {
                ...prev,
                name: editingName.trim(),
                examples: editingExamples,
                description: editingDescription,
              }
            : null
        );

        // 현재 선택된 프리셋이 수정한 프리셋이라면 다시 로드
        if (currentPresetName === selectedPreset.name) {
          await window.electron.ipcRenderer.invoke(IpcChannel.LoadExamplePreset, {
            name: editingName.trim(),
          });
          setCurrentPresetName(editingName.trim());
        }

        // 프리셋 목록 다시 불러오기 (이름이 변경되었을 수 있으므로)
        fetchExamplePresets();

        showSnackbar('프리셋이 성공적으로 저장되었습니다.');
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
    currentPresetName,
    editingExamples,
    editingDescription,
    editingName,
    fetchExamplePresets,
    selectedPreset,
    showSnackbar,
  ]);

  // 프리셋 삭제
  const handleDeletePreset = useCallback(async () => {
    if (!selectedPreset) return;

    try {
      setIsPresetLoading(true);
      const result = await window.electron.ipcRenderer.invoke(IpcChannel.DeleteExamplePreset, {
        id: selectedPreset.id,
      });

      if (result.success) {
        setIsDeleteConfirmOpen(false);
        setIsDetailModalOpen(false);
        showSnackbar('프리셋이 성공적으로 삭제되었습니다.');

        // 현재 선택된 프리셋이 삭제한 프리셋이라면 프리셋 목록에서 첫 번째 프리셋으로 변경
        if (currentPresetName === selectedPreset.name) {
          // 프리셋 목록 가져오기
          const presetsResult = await window.electron.ipcRenderer.invoke(
            IpcChannel.GetExamplePresets
          );
          if (presetsResult.success && presetsResult.presets.length > 0) {
            // 남아있는 프리셋 중 첫 번째 프리셋 선택
            setCurrentPresetName(presetsResult.presets[0].name);
            // 선택한 프리셋 로드
            await window.electron.ipcRenderer.invoke(IpcChannel.LoadExamplePreset, {
              name: presetsResult.presets[0].name,
            });
          }
        }

        // 프리셋 목록 다시 불러오기
        fetchExamplePresets();
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
  }, [currentPresetName, fetchExamplePresets, selectedPreset, showSnackbar]);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        번역 예제 프리셋
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="example-preset-label">예제 프리셋 선택</InputLabel>
          <Select
            labelId="example-preset-label"
            id="example-preset"
            value={currentPresetName}
            onChange={handlePresetChange}
            label="예제 프리셋 선택"
            disabled={isTranslating || isPresetLoading}
          >
            {examplePresets.map((preset) => (
              <MenuItem key={preset.id} value={preset.name}>
                <Tooltip title={preset.description || ''} placement="right">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography>{preset.name}</Typography>
                  </Box>
                </Tooltip>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title="프리셋 상세 보기">
          <span>
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={handleOpenDetail}
              disabled={isTranslating || isPresetLoading}
            >
              상세
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="새 프리셋 생성">
          <span>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setIsPresetModalOpen(true)}
              disabled={isTranslating || isPresetLoading}
            >
              생성
            </Button>
          </span>
        </Tooltip>
      </Box>

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
            onChange={(e) => setNewPresetName(e.target.value)}
            required
          />
          <TextField
            margin="dense"
            id="preset-description"
            label="설명 (선택사항)"
            type="text"
            fullWidth
            value={newPresetDescription}
            onChange={(e) => setNewPresetDescription(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPresetModalOpen(false)}>취소</Button>
          <Button
            onClick={handleSaveNewPreset}
            variant="contained"
            disabled={!newPresetName.trim()}
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
                onClick={handleOpenEdit}
                disabled={isPresetLoading}
              >
                편집
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={isPresetLoading}
              >
                삭제
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPreset && (
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

                {selectedPreset.examples[activeLanguageTab].sourceLines.map((source, index) => (
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
                ))}

                {selectedPreset.examples[activeLanguageTab].sourceLines.length === 0 && (
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
            예제 프리셋 편집
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPreset && (
            <>
              {/* 이름 편집 필드 추가 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  이름
                </Typography>
                <TextField
                  fullWidth
                  placeholder="프리셋 이름"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  variant="outlined"
                  required
                  error={!editingName.trim()}
                  helperText={!editingName.trim() ? '프리셋 이름은 필수입니다' : ''}
                />
              </Box>

              {/* 설명 편집 필드 */}
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
                  onChange={(e) => setEditingDescription(e.target.value)}
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
                      onChange={(e) =>
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
                      onChange={(e) =>
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
            &quot;{selectedPreset?.name}&quot; 프리셋을 삭제하시겠습니까? 이 작업은 되돌릴 수
            없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteConfirmOpen(false)}>취소</Button>
          <Button onClick={handleDeletePreset} color="error">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamplePresetSelector;
