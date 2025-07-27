import React, { useState, useEffect, useCallback } from 'react';
import { Box, Divider } from '@mui/material';
import { IpcChannel } from '../../../../nest/common/ipc.channel';
import { ExamplePresetDto } from '../../../../nest/translation/example/dto/example-preset.dto';
import { ExamplePresetDetailDto } from '../../../../nest/translation/example/dto/example-preset-detail.dto';
import { CreateExamplePresetRequestDto } from '../../../../nest/translation/example/dto/request/create-example-preset-request.dto';
import { UpdateExamplePresetRequestDto } from '../../../../nest/translation/example/dto/request/update-example-preset-request.dto';
import { DeleteExamplePresetRequestDto } from '../../../../nest/translation/example/dto/request/delete-example-preset-request.dto';
import { Language } from '@/utils/language';
import PresetList from './PresetList';
import ExamplePresetEditorForm from './ExamplePresetEditorForm';

const ExamplePresetEditor: React.FC = () => {
  const [presets, setPresets] = useState<ExamplePresetDto[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ExamplePresetDetailDto | null>(null);

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
    } else {
      console.error('Failed to fetch preset detail:', result.message);
    }
  };

  const handleClearSelection = () => {
    setSelectedPreset(null);
  };

  const handleSave = async (values: {
    name: string;
    description: string;
    examples: { before: string; after: string }[];
  }) => {
    if (selectedPreset) {
      const examplesToSave = {
        ...selectedPreset?.examples,
        [Language.ENGLISH]: {
          sourceLines: values.examples.map((e) => e.before),
          resultLines: values.examples.map((e) => e.after),
        },
      };

      const payload: UpdateExamplePresetRequestDto = {
        id: selectedPreset.id,
        name: values.name,
        description: values.description,
        examples: examplesToSave,
      };
      await window.electron.ipcRenderer.invoke(IpcChannel.UpdateExamplePreset, payload);
    } else {
      const payload: CreateExamplePresetRequestDto = {
        name: values.name,
        description: values.description,
        examples: {
          [Language.ENGLISH]: {
            sourceLines: values.examples.map((e) => e.before),
            resultLines: values.examples.map((e) => e.after),
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
      <PresetList
        title="예제 프리셋 목록"
        presets={presets}
        selectedPreset={selectedPreset}
        onSelectPreset={handleSelectPreset}
        onDeletePreset={handleDelete}
        onClearSelection={handleClearSelection}
      />
      <Divider orientation="vertical" flexItem />
      <ExamplePresetEditorForm
        selectedPreset={selectedPreset}
        onSave={handleSave}
        onCancel={handleClearSelection}
      />
    </Box>
  );
};

export default ExamplePresetEditor;
