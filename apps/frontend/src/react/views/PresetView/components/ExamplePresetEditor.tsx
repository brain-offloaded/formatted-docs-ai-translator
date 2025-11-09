import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Paper,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Snackbar,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import {
  ExamplePresetDto,
  ExamplePresetDetailDto,
  CreateExamplePresetRequestDto,
  UpdateExamplePresetRequestDto,
  ExamplePresetsService,
} from '@/react/api/generated';
import {
  defaultSourceLanguage,
  defaultTargetLanguage,
  SourceLanguage,
  TargetLanguage,
  targetLanguages,
} from '@apps/common/dist/language';
import { useTranslation } from 'react-i18next';
import { TranslationExampleMatrix } from '@apps/common/dist/types/translation-example.types';
import { useSnackbar } from '@/react/hooks/useSnackbar';
import { useConfirmModal } from '@/react/components/common/ConfirmModal';

interface ExamplePair {
  before: string;
  after: string;
}

type ExampleMatrixState = Record<TargetLanguage, Record<TargetLanguage, ExamplePair[]>>;

const normalizePresetForComparison = (presets: ExamplePresetDto[]) =>
  presets.map((preset) => ({
    id: preset.id,
    name: preset.name,
    description: preset.description ?? null,
    languages: [...preset.languages].sort(),
  }));

const createEmptyExampleMatrixState = (): ExampleMatrixState => {
  const matrix = {} as ExampleMatrixState;
  targetLanguages.forEach((source) => {
    matrix[source] = {} as Record<TargetLanguage, ExamplePair[]>;
    targetLanguages.forEach((target) => {
      matrix[source][target] = [];
    });
  });
  return matrix;
};

const convertStateToBackendMatrix = (matrix: ExampleMatrixState): TranslationExampleMatrix => {
  const backend = {} as TranslationExampleMatrix;
  targetLanguages.forEach((source) => {
    backend[source] = {} as Record<
      TargetLanguage,
      { sourceLines: string[]; resultLines: string[] }
    >;
    targetLanguages.forEach((target) => {
      const entries = matrix[source][target] || [];
      backend[source][target] = {
        sourceLines: entries.map((entry) => entry.before),
        resultLines: entries.map((entry) => entry.after),
      };
    });
  });
  return backend;
};

const ExamplePresetEditor: React.FC = () => {
  const { t } = useTranslation();
  const [allPresets, setAllPresets] = useState<ExamplePresetDto[]>([]);
  const [presets, setPresets] = useState<ExamplePresetDto[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ExamplePresetDetailDto | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<TargetLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [exampleMatrix, setExampleMatrix] = useState<ExampleMatrixState>(
    createEmptyExampleMatrixState()
  );
  const coerceTargetLanguage = (
    value?: string | SourceLanguage | TargetLanguage,
    fallback: TargetLanguage = defaultTargetLanguage
  ): TargetLanguage =>
    value && value !== SourceLanguage.ANY && targetLanguages.includes(value as TargetLanguage)
      ? (value as TargetLanguage)
      : fallback;
  const [editingSourceLanguage, setEditingSourceLanguage] = useState<TargetLanguage>(
    coerceTargetLanguage(defaultSourceLanguage, defaultTargetLanguage)
  );
  const [editingTargetLanguage, setEditingTargetLanguage] =
    useState<TargetLanguage>(defaultTargetLanguage);
  const {
    isOpen: isSnackbarOpen,
    message: snackbarMessage,
    showSnackbar,
    closeSnackbar,
  } = useSnackbar();
  const { openConfirmModal } = useConfirmModal();
  const presetsSnapshotRef = useRef<string>('');
  const languagesSnapshotRef = useRef<string>('');
  const pendingPresetIdRef = useRef<number | null>(null);

  const currentExamples = useMemo(
    () => exampleMatrix[editingSourceLanguage][editingTargetLanguage] ?? [],
    [exampleMatrix, editingSourceLanguage, editingTargetLanguage]
  );

  const fetchPresets = useCallback(async (): Promise<ExamplePresetDto[]> => {
    const result = await ExamplePresetsService.examplePresetControllerGetExamplePresets();
    if (result.success) {
      const normalizedPresets = normalizePresetForComparison(result.presets);
      const serializedPresets = JSON.stringify(normalizedPresets);
      if (presetsSnapshotRef.current !== serializedPresets) {
        presetsSnapshotRef.current = serializedPresets;
        setAllPresets(result.presets);
      }

      const allLangs = new Set<TargetLanguage>();
      result.presets.forEach((p: ExamplePresetDto) => {
        p.languages.forEach((lang) => {
          if (targetLanguages.includes(lang as TargetLanguage)) {
            allLangs.add(lang as TargetLanguage);
          }
        });
      });
      const sortedLanguages = Array.from(allLangs).sort((a, b) => a.localeCompare(b));
      const serializedLanguages = sortedLanguages.join('|');
      if (languagesSnapshotRef.current !== serializedLanguages) {
        languagesSnapshotRef.current = serializedLanguages;
        setAvailableLanguages(sortedLanguages);
      }

      return result.presets;
    } else {
      console.error('Failed to fetch presets:', result.message);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchPresets().catch(console.error);
  }, [fetchPresets]);

  useEffect(() => {
    if (!selectedPreset || !editingSourceLanguage || !editingTargetLanguage) {
      return;
    }

    let isCancelled = false;

    const fetchExamples = async () => {
      try {
        const response =
          await ExamplePresetsService.examplePresetControllerGetExamplePresetExamples({
            id: selectedPreset.id,
            sourceLanguage: editingSourceLanguage,
            targetLanguage: editingTargetLanguage,
          });

        if (isCancelled) {
          return;
        }

        if (response.success) {
          const newExamples =
            response.examples?.map((item) => ({
              before: item.sourceText ?? '',
              after: item.resultText ?? '',
            })) ?? [];

          setExampleMatrix((prev) => ({
            ...prev,
            [editingSourceLanguage]: {
              ...prev[editingSourceLanguage],
              [editingTargetLanguage]: newExamples,
            },
          }));
        } else {
          console.error('프리셋 예제를 불러오지 못했습니다:', response.message);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('프리셋 예제 조회 중 오류가 발생했습니다:', error);
        }
      }
    };

    void fetchExamples();

    return () => {
      isCancelled = true;
    };
  }, [selectedPreset, editingSourceLanguage, editingTargetLanguage]);

  useEffect(() => {
    if (selectedLanguage === 'all') {
      setPresets(allPresets);
    } else {
      setPresets(allPresets.filter((p) => p.languages.includes(selectedLanguage)));
    }
  }, [selectedLanguage, allPresets]);

  const handleSelectPreset = async (preset: ExamplePresetDto) => {
    pendingPresetIdRef.current = preset.id;
    setExampleMatrix(createEmptyExampleMatrixState());

    try {
      const result = await ExamplePresetsService.examplePresetControllerGetExamplePresetDetail({
        id: preset.id,
      });

      if (!result.success || !result.preset) {
        console.error('Failed to fetch preset detail:', result.message);
        return;
      }

      const detail: ExamplePresetDetailDto = result.preset;

      if (pendingPresetIdRef.current !== detail.id) {
        return;
      }

      setSelectedPreset(detail);
      setName(detail.name);
      setDescription((detail.description as unknown as string) || '');
      const fallbackSource = coerceTargetLanguage(defaultSourceLanguage, defaultTargetLanguage);
      const initialSource = coerceTargetLanguage(detail.languages[0], fallbackSource);
      setEditingSourceLanguage(initialSource);
      setEditingTargetLanguage(defaultTargetLanguage);
      setIsEditing(true);
    } catch (error) {
      console.error('Failed to fetch preset detail:', error);
    } finally {
      if (pendingPresetIdRef.current === preset.id) {
        pendingPresetIdRef.current = null;
      }
    }
  };

  const handleClearSelection = useCallback(() => {
    setSelectedPreset(null);
    setName('');
    setDescription('');
    setExampleMatrix(createEmptyExampleMatrixState());
    setEditingSourceLanguage(coerceTargetLanguage(defaultSourceLanguage, defaultTargetLanguage));
    setEditingTargetLanguage(defaultTargetLanguage);
    setIsEditing(false);
    pendingPresetIdRef.current = null;
  }, []);

  const updateCurrentExamples = useCallback(
    (updater: (pairs: ExamplePair[]) => ExamplePair[]) => {
      setExampleMatrix((prev) => {
        const current = prev[editingSourceLanguage][editingTargetLanguage] || [];
        return {
          ...prev,
          [editingSourceLanguage]: {
            ...prev[editingSourceLanguage],
            [editingTargetLanguage]: updater(current),
          },
        };
      });
    },
    [editingSourceLanguage, editingTargetLanguage]
  );

  const handleAddExample = () => {
    updateCurrentExamples((pairs) => [...pairs, { before: '', after: '' }]);
  };

  const handleRemoveExample = (index: number) => {
    updateCurrentExamples((pairs) => pairs.filter((_, i) => i !== index));
  };

  const handleExampleChange = (index: number, field: keyof ExamplePair, value: string) => {
    updateCurrentExamples((pairs) => {
      const next = [...pairs];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert(t('preset.nameRequired'));
      return;
    }

    const examplesToPersist = convertStateToBackendMatrix(exampleMatrix);
    const normalizedDescription = description.trim() ? description : null;

    let savedPresetId: number | null = null;

    if (isEditing && selectedPreset) {
      const payload: UpdateExamplePresetRequestDto = {
        name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        description: normalizedDescription as any,
        examples: examplesToPersist,
      };
      const response = await ExamplePresetsService.examplePresetControllerUpdateExamplePreset({
        id: selectedPreset.id,
        requestBody: payload,
      });
      if (!response?.success) {
        showSnackbar(response?.message ?? t('preset.saveFailed'));
        return;
      }
      savedPresetId = selectedPreset.id;
      showSnackbar(t('preset.saveSuccess'));
    } else {
      const payload: CreateExamplePresetRequestDto = {
        name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        description: normalizedDescription as any,
        examples: examplesToPersist,
      };
      const response = await ExamplePresetsService.examplePresetControllerCreateExamplePreset({
        requestBody: payload,
      });
      if (!response?.success || !response.preset) {
        showSnackbar(response?.message ?? t('preset.saveFailed'));
        return;
      }
      savedPresetId = response.preset.id;
      showSnackbar(t('preset.saveSuccess'));
    }

    const updatedPresets = await fetchPresets();
    if (!savedPresetId) return;

    if (isEditing) {
      setSelectedPreset((prev) =>
        prev && prev.id === savedPresetId
          ? ({ ...prev, name, description: normalizedDescription } as ExamplePresetDetailDto)
          : prev
      );
    } else {
      const targetPreset = updatedPresets.find((preset) => preset.id === savedPresetId);
      if (targetPreset) {
        await handleSelectPreset(targetPreset);
      }
    }
  };

  const handleDelete = useCallback(
    (presetId: number) => {
      openConfirmModal({
        title: t('preset.deleteConfirmTitle'),
        message: t('preset.deleteConfirm'),
        confirmText: t('common.delete'),
        cancelText: t('common.cancel'),
        variant: 'danger',
        onConfirm: () => {
          void (async () => {
            try {
              const response =
                await ExamplePresetsService.examplePresetControllerDeleteExamplePreset({
                  id: presetId,
                });
              if (!response?.success) {
                showSnackbar(response?.message ?? t('preset.deleteFailed'));
                return;
              }

              if (selectedPreset?.id === presetId) {
                handleClearSelection();
              }

              await fetchPresets();
              showSnackbar(t('preset.deleteSuccess'));
            } catch (error) {
              console.error('예시 프리셋 삭제 실패:', error);
              showSnackbar(t('preset.deleteFailed'));
            }
          })();
        },
      });
    },
    [fetchPresets, handleClearSelection, openConfirmModal, selectedPreset, showSnackbar, t]
  );

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 2 }}>
      <Paper sx={{ flex: 1, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">{t('preset.presetList')}</Typography>
          <Button variant="outlined" startIcon={<Add />} onClick={handleClearSelection}>
            {t('preset.newPreset')}
          </Button>
        </Box>
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel id="language-filter-label">{t('preset.languageFilter')}</InputLabel>
          <Select
            labelId="language-filter-label"
            value={selectedLanguage}
            label={t('preset.languageFilter')}
            onChange={(e) => setSelectedLanguage(e.target.value as string)}
          >
            <MenuItem value="all">
              <em>{t('preset.all')}</em>
            </MenuItem>
            {availableLanguages.map((lang) => (
              <MenuItem key={lang} value={lang}>
                {lang}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <List>
          {presets.map((preset) => (
            <ListItem
              key={preset.id}
              disablePadding
              secondaryAction={
                <>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleSelectPreset(preset)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(preset.id)}
                  >
                    <Delete />
                  </IconButton>
                </>
              }
            >
              <ListItemButton
                onClick={() => handleSelectPreset(preset)}
                selected={selectedPreset?.id === preset.id}
              >
                <ListItemText
                  primary={preset.name}
                  secondary={
                    <Box component="span" sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      {preset.languages.map((lang) => (
                        <Chip key={lang} label={lang} size="small" variant="outlined" />
                      ))}
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>
      <Divider orientation="vertical" flexItem />
      <Paper sx={{ flex: 2, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {isEditing ? t('preset.editPreset') : t('preset.newPresetCreate')}
        </Typography>
        <TextField
          label={t('preset.presetName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t('preset.presetContentDescription')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={4}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          {t('preset.translationExamples')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200, flex: '1 1 200px' }}>
            <InputLabel id="example-source-language-label">
              {t('translation.sourceLanguageLabel')}
            </InputLabel>
            <Select
              labelId="example-source-language-label"
              value={editingSourceLanguage}
              label={t('translation.sourceLanguageLabel')}
              onChange={(event) =>
                setEditingSourceLanguage(
                  coerceTargetLanguage(event.target.value as string, editingSourceLanguage)
                )
              }
            >
              {targetLanguages.map((lang) => (
                <MenuItem key={`source-${lang}`} value={lang}>
                  {t(`language.${lang}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="h6" component="span" sx={{ mx: 1 }}>
            →
          </Typography>

          <FormControl size="small" sx={{ minWidth: 200, flex: '1 1 200px' }}>
            <InputLabel id="example-target-language-label">
              {t('translation.targetLanguage')}
            </InputLabel>
            <Select
              labelId="example-target-language-label"
              value={editingTargetLanguage}
              label={t('translation.targetLanguage')}
              onChange={(event) =>
                setEditingTargetLanguage(
                  coerceTargetLanguage(event.target.value as string, editingTargetLanguage)
                )
              }
            >
              {targetLanguages.map((lang) => (
                <MenuItem key={`target-${lang}`} value={lang}>
                  {t(`language.${lang}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {currentExamples.map((example, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              label={`${t('preset.source')} #${index + 1}`}
              value={example.before}
              onChange={(e) => handleExampleChange(index, 'before', e.target.value)}
              fullWidth
              multiline
              variant="outlined"
              size="small"
            />
            <TextField
              label={`${t('preset.target')} #${index + 1}`}
              value={example.after}
              onChange={(e) => handleExampleChange(index, 'after', e.target.value)}
              fullWidth
              multiline
              variant="outlined"
              size="small"
            />
            <IconButton onClick={() => handleRemoveExample(index)} color="error">
              <Delete />
            </IconButton>
          </Box>
        ))}

        <Button startIcon={<Add />} onClick={handleAddExample} variant="outlined">
          {t('preset.addExample')}
        </Button>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={handleClearSelection} variant="outlined">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained">
            {isEditing ? t('preset.saveComplete') : t('common.save')}
          </Button>
        </Box>
      </Paper>
      <Snackbar open={isSnackbarOpen} message={snackbarMessage} onClose={closeSnackbar} />
    </Box>
  );
};

export default ExamplePresetEditor;
