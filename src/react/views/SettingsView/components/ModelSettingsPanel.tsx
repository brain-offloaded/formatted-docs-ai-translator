import React from 'react';
import { TextField, Grid } from '@mui/material';
import { ModelConfig } from '../../../../ai/model';

interface ModelSettingsPanelProps {
  isCustomInputMode: boolean;
  customModelConfig: ModelConfig;
  handleCustomModelNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRequestsPerMinuteChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMaxOutputTokensChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ModelSettingsPanel: React.FC<ModelSettingsPanelProps> = ({
  isCustomInputMode,
  customModelConfig,
  handleCustomModelNameChange,
  handleRequestsPerMinuteChange,
  handleMaxOutputTokensChange,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          id="custom-model-name"
          label="모델 이름"
          variant="outlined"
          value={customModelConfig.modelName}
          onChange={handleCustomModelNameChange}
          helperText="Gemini 모델 ID"
          disabled={!isCustomInputMode}
          required
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          id="requests-per-minute"
          label="분당 요청 수(RPM)"
          variant="outlined"
          type="number"
          value={customModelConfig.requestsPerMinute || ''}
          onChange={handleRequestsPerMinuteChange}
          InputProps={{
            inputProps: { min: 0 },
          }}
          helperText={
            isCustomInputMode && !customModelConfig.requestsPerMinute
              ? '이 필드는 번역 실행 시 필수입니다'
              : 'API 속도 제한에 맞는 분당 요청 수'
          }
          error={isCustomInputMode && !customModelConfig.requestsPerMinute}
          disabled={!isCustomInputMode}
          required
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          id="max-output-tokens"
          label="최대 출력 토큰 수"
          variant="outlined"
          type="number"
          value={customModelConfig.maxOutputTokenCount || ''}
          onChange={handleMaxOutputTokensChange}
          InputProps={{
            inputProps: { min: 0 },
          }}
          helperText={
            isCustomInputMode && !customModelConfig.maxOutputTokenCount
              ? '이 필드는 번역 실행 시 필수입니다'
              : '모델이 생성할 최대 토큰 수'
          }
          error={isCustomInputMode && !customModelConfig.maxOutputTokenCount}
          disabled={!isCustomInputMode}
          required
        />
      </Grid>
    </Grid>
  );
};

export default ModelSettingsPanel;
