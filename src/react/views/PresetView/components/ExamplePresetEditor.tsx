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
  const [presets, setPresets] = useState<ExamplePresetDto[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ExamplePresetDetailDto | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [examples, setExamples] = useState<ExamplePair[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const fetchPresets = useCallback(async () => {
    const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetExamplePresets);
    if (result.success) {
      setPresets(result.presets);
    } else {
      console.error('Failed to fetch presets:', result.message);
    }
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const handleSelectPreset = async (preset: ExamplePresetDto) => {
    const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetExamplePresetDetail, {
      id: preset.id,
    });

    if (result.success && result.preset) {
      setSelectedPreset(result.preset);
      setName(result.preset.name);
      setDescription(result.preset.description || '');
      const presetExamples = result.preset.examples[Language.ENGLISH];
      if (presetExamples) {
        const pairedExamples = presetExamples.sourceLines.map((source, index) => ({
          before: source,
          after: presetExamples.resultLines[index] || '',
        }));
        setExamples(pairedExamples);
      } else {
        setExamples([]);
      }
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

  const handleSave = async () => {
    if (!name) {
      alert('프리셋 이름을 입력해주세요.');
      return;
    }

    if (isEditing && selectedPreset) {
      const examplesToSave = {
        ...selectedPreset?.examples,
        [Language.ENGLISH]: {
          sourceLines: examples.map((e) => e.before),
          resultLines: examples.map((e) => e.after),
        },
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
                <ListItemText primary={preset.name} />
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

        {examples.map((example, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              label={`Before #${index + 1}`}
              value={example.before}
              onChange={(e) => handleExampleChange(index, 'before', e.target.value)}
              fullWidth
              multiline
              variant="outlined"
              size="small"
            />
            <TextField
              label={`After #${index + 1}`}
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
