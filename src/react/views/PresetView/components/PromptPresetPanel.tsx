import React, { useState, useEffect, useCallback } from 'react';
import { Box, Divider } from '@mui/material';
import { IpcChannel } from '../../../../nest/common/ipc.channel';
import { PromptPresetDto } from '../../../../nest/translation/prompt/dto/prompt-preset.dto';
import { PromptPresetDetailDto } from '../../../../nest/translation/prompt/dto/prompt-preset-detail.dto';
import { CreatePromptPresetRequestDto } from '../../../../nest/translation/prompt/dto/request/create-prompt-preset.dto';
import { UpdatePromptPresetRequestDto } from '../../../../nest/translation/prompt/dto/request/update-prompt-preset.dto';
import { DeletePromptPresetRequestDto } from '../../../../nest/translation/prompt/dto/request/delete-prompt-preset.dto';
import PresetList from './PresetList';
import PromptPresetEditorForm from './PromptPresetEditorForm';

const PromptPresetPanel: React.FC = () => {
  const [presets, setPresets] = useState<PromptPresetDto[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<PromptPresetDetailDto | null>(null);

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
    } else {
      console.error('Failed to fetch prompt preset detail:', result.message);
    }
  };

  const handleClearSelection = () => {
    setSelectedPreset(null);
  };

  const handleSave = async (values: { name: string; prompt: string }) => {
    if (selectedPreset) {
      const payload: UpdatePromptPresetRequestDto = {
        id: selectedPreset.id,
        name: values.name,
        prompt: values.prompt,
      };
      await window.electron.ipcRenderer.invoke(IpcChannel.UpdatePromptPreset, payload);
    } else {
      const payload: CreatePromptPresetRequestDto = { name: values.name, prompt: values.prompt };
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
      <PresetList
        title="프롬프트 프리셋 목록"
        presets={presets}
        selectedPreset={selectedPreset}
        onSelectPreset={handleSelectPreset}
        onDeletePreset={handleDelete}
        onClearSelection={handleClearSelection}
      />
      <Divider orientation="vertical" flexItem />
      <PromptPresetEditorForm
        selectedPreset={selectedPreset}
        onSave={handleSave}
        onCancel={handleClearSelection}
      />
    </Box>
  );
};

export default PromptPresetPanel;
