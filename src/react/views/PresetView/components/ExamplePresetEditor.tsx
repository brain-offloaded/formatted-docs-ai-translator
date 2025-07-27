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

const ExamplePresetEditor: React.FC = () => {
  const [presets, setPresets] = useState<ExamplePresetDto[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ExamplePresetDetailDto | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
      setIsEditing(true);
    } else {
      console.error('Failed to fetch preset detail:', result.message);
    }
  };

  const handleClearSelection = () => {
    setSelectedPreset(null);
    setName('');
    setDescription('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!name) {
      alert('프리셋 이름을 입력해주세요.');
      return;
    }

    if (isEditing && selectedPreset) {
      const payload: UpdateExamplePresetRequestDto = {
        id: selectedPreset.id,
        name,
        description,
        examples: selectedPreset.examples,
      };
      await window.electron.ipcRenderer.invoke(IpcChannel.UpdateExamplePreset, payload);
    } else {
      const payload: CreateExamplePresetRequestDto = {
        name,
        description,
        examples: {
          // 기본적으로 빈 구조를 생성
          English: { sourceLines: [], resultLines: [] },
          Japanese: { sourceLines: [], resultLines: [] },
          Chinese: { sourceLines: [], resultLines: [] },
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
          rows={10}
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
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
