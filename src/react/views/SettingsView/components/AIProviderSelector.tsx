import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import { AiModelName, getModelDescription } from '../../../../ai/model';

interface AIProviderSelectorProps {
  isCustomInputMode: boolean;
  modelName: AiModelName;
  handleModelNameChange: (e: SelectChangeEvent<string>) => void;
}

const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  isCustomInputMode,
  modelName,
  handleModelNameChange,
}) => {
  return (
    <FormControl fullWidth variant="outlined">
      <InputLabel id="model-name-label">AI 모델</InputLabel>
      <Select
        labelId="model-name-label"
        id="model-name"
        value={isCustomInputMode ? 'custom_input_mode' : modelName}
        onChange={handleModelNameChange}
        label="AI 모델"
      >
        <MenuItem value={AiModelName.FLASH_EXP}>
          <Box>
            <Typography>Gemini Flash</Typography>
            <Typography variant="caption" color="text.secondary">
              {getModelDescription(AiModelName.FLASH_EXP)}
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem value={AiModelName.GEMINI_PRO_2_POINT_5_EXP}>
          <Box>
            <Typography>Gemini Pro</Typography>
            <Typography variant="caption" color="text.secondary">
              {getModelDescription(AiModelName.GEMINI_PRO_2_POINT_5_EXP)}
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem value={AiModelName.FLASH_THINKING_EXP}>
          <Box>
            <Typography>Gemini Flash Thinking</Typography>
            <Typography variant="caption" color="text.secondary">
              {getModelDescription(AiModelName.FLASH_THINKING_EXP)}
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem value="custom_input_mode">
          <Box>
            <Typography>직접 입력</Typography>
            <Typography variant="caption" color="text.secondary">
              모델명과 분당 요청 수(RPM)를 직접 지정
            </Typography>
          </Box>
        </MenuItem>
      </Select>
    </FormControl>
  );
};

export default AIProviderSelector;
