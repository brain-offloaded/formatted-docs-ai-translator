import React, { useState, useEffect } from 'react';
import { Box, Button, IconButton, Typography, Paper, Divider } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { ExamplePresetDetailDto } from '../../../../nest/translation/example/dto/example-preset-detail.dto';
import { Language } from '@/utils/language';
import { FormField } from '../../../components/common/FormField';

interface ExamplePair {
  before: string;
  after: string;
}

interface ExamplePresetEditorFormProps {
  selectedPreset: ExamplePresetDetailDto | null;
  onSave: (values: { name: string; description: string; examples: ExamplePair[] }) => void;
  onCancel: () => void;
}

const ExamplePresetEditorForm: React.FC<ExamplePresetEditorFormProps> = ({
  selectedPreset,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [examples, setExamples] = useState<ExamplePair[]>([]);
  const isEditing = !!selectedPreset;

  useEffect(() => {
    if (selectedPreset) {
      setName(selectedPreset.name);
      setDescription(selectedPreset.description || '');
      const presetExamples = selectedPreset.examples[Language.ENGLISH];
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
      setName('');
      setDescription('');
      setExamples([]);
    }
  }, [selectedPreset]);

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

  const handleSaveClick = () => {
    if (!name) {
      alert('프리셋 이름을 입력해주세요.');
      return;
    }
    onSave({ name, description, examples });
  };

  return (
    <Paper sx={{ flex: 2, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {isEditing ? '프리셋 수정' : '새 프리셋 생성'}
      </Typography>
      <FormField label="프리셋 이름" value={name} onChange={(e) => setName(e.target.value)} />
      <FormField
        label="프리셋 내용 (설명)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={4}
      />

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        번역 예시
      </Typography>

      {examples.map((example, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <FormField
            label={`Before #${index + 1}`}
            value={example.before}
            onChange={(e) => handleExampleChange(index, 'before', e.target.value)}
            multiline
            size="small"
          />
          <FormField
            label={`After #${index + 1}`}
            value={example.after}
            onChange={(e) => handleExampleChange(index, 'after', e.target.value)}
            multiline
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

export default ExamplePresetEditorForm;
