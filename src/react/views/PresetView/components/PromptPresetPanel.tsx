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
import { PromptPresetDto } from '../../../../nest/translation/prompt/dto/prompt-preset.dto';
import { PromptPresetDetailDto } from '../../../../nest/translation/prompt/dto/prompt-preset-detail.dto';
import { CreatePromptPresetRequestDto } from '../../../../nest/translation/prompt/dto/request/create-prompt-preset.dto';
import { UpdatePromptPresetRequestDto } from '../../../../nest/translation/prompt/dto/request/update-prompt-preset.dto';
import { DeletePromptPresetRequestDto } from '../../../../nest/translation/prompt/dto/request/delete-prompt-preset.dto';

const PromptPresetPanel: React.FC = () => {
  const [presets, setPresets] = useState<PromptPresetDto[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<PromptPresetDetailDto | null>(null);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const fetchPresets = useCallback(async () => {
    const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetPromptPresets);
    if (result.success) {
      setPresets(result.presets);
    } else {
      console.error('Failed to fetch prompt presets:', result.message);
    }
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const handleSelectPreset = async (preset: PromptPresetDto) => {
    const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetPromptPresetDetail, {
      id: preset.id,
    });

    if (result.success && result.preset) {
      setSelectedPreset(result.preset);
      setName(result.preset.name);
      setPrompt(result.preset.prompt);
      setIsEditing(true);
    } else {
      console.error('Failed to fetch prompt preset detail:', result.message);
    }
  };

  const handleClearSelection = () => {
    setSelectedPreset(null);
    setName('');
    setPrompt('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!name || !prompt) {
      alert('프리셋 이름과 내용을 모두 입력해주세요.');
      return;
    }

    if (isEditing && selectedPreset) {
      const payload: UpdatePromptPresetRequestDto = {
        id: selectedPreset.id,
        name,
        prompt,
      };
      await window.electron.ipcRenderer.invoke(IpcChannel.UpdatePromptPreset, payload);
    } else {
      const payload: CreatePromptPresetRequestDto = { name, prompt };
      await window.electron.ipcRenderer.invoke(IpcChannel.CreatePromptPreset, payload);
    }

    handleClearSelection();
    fetchPresets();
  };

  const handleDelete = async (presetId: number) => {
    if (window.confirm('정말로 이 프리셋을 삭제하시겠습니까?')) {
      const payload: DeletePromptPresetRequestDto = { id: presetId };
      await window.electron.ipcRenderer.invoke(IpcChannel.DeletePromptPreset, payload);
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
          <Typography variant="h6">프롬프트 프리셋 목록</Typography>
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
          label="프리셋 내용 (프롬프트)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
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

export default PromptPresetPanel;
