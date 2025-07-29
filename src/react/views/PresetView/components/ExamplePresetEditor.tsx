import React, { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Tab,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { IpcChannel } from '../../../../nest/common/ipc.channel';
import { ExamplePresetDto } from '../../../../nest/translation/example/dto/example-preset.dto';
import { ExamplePresetDetailDto } from '../../../../nest/translation/example/dto/example-preset-detail.dto';
import { CreateExamplePresetRequestDto } from '../../../../nest/translation/example/dto/request/create-example-preset-request.dto';
import { UpdateExamplePresetRequestDto } from '../../../../nest/translation/example/dto/request/update-example-preset-request.dto';
import { DeleteExamplePresetRequestDto } from '../../../../nest/translation/example/dto/request/delete-example-preset-request.dto';
import { Language } from '@/utils/language';

interface ExamplePair {
  before: string;
  after: string;
}

const ExamplePresetEditor: React.FC = () => {
  const [allPresets, setAllPresets] = useState<ExamplePresetDto[]>([]);
  const [presets, setPresets] = useState<ExamplePresetDto[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ExamplePresetDetailDto | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [examples, setExamples] = useState<ExamplePair[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<string>(Language.ENGLISH);

  const fetchPresets = useCallback(async () => {
    const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetExamplePresets);
    if (result.success) {
      setAllPresets(result.presets);
      setPresets(result.presets);
      const allLangs = new Set<string>();
      result.presets.forEach((p: ExamplePresetDto) => {
        p.languages.forEach((lang) => allLangs.add(lang));
      });
      setAvailableLanguages(Array.from(allLangs));
    } else {
      console.error('Failed to fetch presets:', result.message);
    }
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  useEffect(() => {
    if (selectedLanguage === 'all') {
      setPresets(allPresets);
    } else {
      setPresets(allPresets.filter((p) => p.languages.includes(selectedLanguage)));
    }
  }, [selectedLanguage, allPresets]);

  const handleSelectPreset = async (preset: ExamplePresetDto) => {
    const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetExamplePresetDetail, {
      id: preset.id,
    });

    if (result.success && result.preset) {
      setSelectedPreset(result.preset);
      setName(result.preset.name);
      setDescription(result.preset.description || '');
      const firstLang = result.preset.languages[0] || Language.ENGLISH;
      setEditingLanguage(firstLang);
      setIsEditing(true);
    } else {
      console.error('Failed to fetch preset detail:', result.message);
    }
  };

  const handleClearSelection = () => {
    setSelectedPreset(null);
    setName('');
    setDescription('');
    setExamples([]);
    setIsEditing(false);
    setEditingLanguage(Language.ENGLISH);
  };

  const handleAddExample = () => {
    setExamples([...examples, { before: '', after: '' }]);
  };

  const handleRemoveExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  const handleExampleChange = (index: number, field: keyof ExamplePair, value: string) => {
    const newExamples = [...examples];
    newExamples[index][field] = value;
    setExamples(newExamples);
  };

  useEffect(() => {
    if (selectedPreset) {
      const presetExamples =
        selectedPreset.examples[editingLanguage as keyof typeof selectedPreset.examples];
      if (presetExamples) {
        const pairedExamples = presetExamples.sourceLines.map((source, index) => ({
          before: source,
          after: presetExamples.resultLines[index] || '',
        }));
        setExamples(pairedExamples);
      } else {
        setExamples([]);
      }
    } else {
      setExamples([]);
    }
  }, [selectedPreset, editingLanguage]);

  const handleSave = async () => {
    if (!name) {
      alert('프리셋 이름을 입력해주세요.');
      return;
    }

    if (isEditing && selectedPreset) {
      const updatedExamplesForLang = {
        sourceLines: examples.map((e) => e.before),
        resultLines: examples.map((e) => e.after),
      };

      const examplesToSave = {
        ...selectedPreset.examples,
        [editingLanguage as keyof typeof selectedPreset.examples]: updatedExamplesForLang,
      };

      const payload: UpdateExamplePresetRequestDto = {
        id: selectedPreset.id,
        name,
        description,
        examples: examplesToSave,
      };
      await window.electron.ipcRenderer.invoke(IpcChannel.UpdateExamplePreset, payload);
    } else {
      const payload: CreateExamplePresetRequestDto = {
        name,
        description,
        examples: {
          [Language.ENGLISH]: {
            sourceLines: examples.map((e) => e.before),
            resultLines: examples.map((e) => e.after),
          },
          [Language.JAPANESE]: { sourceLines: [], resultLines: [] },
          [Language.CHINESE]: { sourceLines: [], resultLines: [] },
        },
      };
      await window.electron.ipcRenderer.invoke(IpcChannel.CreateExamplePreset, payload);
    }

    handleClearSelection();
    fetchPresets();
  };

  const handleDelete = async (presetId: number) => {
    if (window.confirm('정말로 이 프리셋을 삭제하시겠습니까?')) {
      const payload: DeleteExamplePresetRequestDto = { id: presetId };
      await window.electron.ipcRenderer.invoke(IpcChannel.DeleteExamplePreset, payload);
      if (selectedPreset?.id === presetId) {
        handleClearSelection();
      }
      fetchPresets();
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 2 }}>
      <Paper sx={{ flex: 1, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">프리셋 목록</Typography>
          <Button variant="outlined" startIcon={<Add />} onClick={handleClearSelection}>
            새 프리셋
          </Button>
        </Box>
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel id="language-filter-label">언어 필터</InputLabel>
          <Select
            labelId="language-filter-label"
            value={selectedLanguage}
            label="언어 필터"
            onChange={(e) => setSelectedLanguage(e.target.value as string)}
          >
            <MenuItem value="all">
              <em>전체</em>
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
          {isEditing ? '프리셋 수정' : '새 프리셋 생성'}
        </Typography>
        <TextField
          label="프리셋 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="프리셋 내용 (설명)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={4}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          번역 예시
        </Typography>

        {isEditing && selectedPreset && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={editingLanguage}
              onChange={(_, newValue) => setEditingLanguage(newValue)}
              aria-label="language selection tabs"
            >
              {selectedPreset.languages.map((lang) => (
                <Tab key={lang} label={lang} value={lang} />
              ))}
            </Tabs>
          </Box>
        )}

        {examples.map((example, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              label={`Source #${index + 1}`}
              value={example.before}
              onChange={(e) => handleExampleChange(index, 'before', e.target.value)}
              fullWidth
              multiline
              variant="outlined"
              size="small"
            />
            <TextField
              label={`Target #${index + 1}`}
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
          예시 추가
        </Button>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={handleClearSelection} variant="outlined">
            취소
          </Button>
          <Button onClick={handleSave} variant="contained">
            {isEditing ? '수정 완료' : '저장'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ExamplePresetEditor;
