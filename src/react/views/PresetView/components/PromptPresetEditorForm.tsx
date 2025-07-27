import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { PromptPresetDetailDto } from '../../../../nest/translation/prompt/dto/prompt-preset-detail.dto';
import { FormField } from '../../../components/common/FormField';

interface PromptPresetEditorFormProps {
  selectedPreset: PromptPresetDetailDto | null;
  onSave: (values: { name: string; prompt: string }) => void;
  onCancel: () => void;
}

const PromptPresetEditorForm: React.FC<PromptPresetEditorFormProps> = ({
  selectedPreset,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const isEditing = !!selectedPreset;

  useEffect(() => {
    if (selectedPreset) {
      setName(selectedPreset.name);
      setPrompt(selectedPreset.prompt);
    } else {
      setName('');
      setPrompt('');
    }
  }, [selectedPreset]);

  const handleSaveClick = () => {
    if (!name || !prompt) {
      alert('프리셋 이름과 내용을 모두 입력해주세요.');
      return;
    }
    onSave({ name, prompt });
  };

  return (
    <Paper sx={{ flex: 2, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {isEditing ? '프리셋 수정' : '새 프리셋 생성'}
      </Typography>
      <FormField label="프리셋 이름" value={name} onChange={(e) => setName(e.target.value)} />
      <FormField
        label="프리셋 내용 (프롬프트)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        multiline
        rows={10}
      />
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button onClick={onCancel} variant="outlined">
          취소
        </Button>
        <Button onClick={handleSaveClick} variant="contained">
          {isEditing ? '수정 완료' : '저장'}
        </Button>
      </Box>
    </Paper>
  );
};

export default PromptPresetEditorForm;
