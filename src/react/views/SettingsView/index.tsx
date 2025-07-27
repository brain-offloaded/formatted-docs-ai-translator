import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Divider,
  Collapse,
  Paper,
  Alert,
  Snackbar,
  SelectChangeEvent,
} from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import { Language, SourceLanguage } from '../../../utils/language';
import { useConfirmModal } from '../../components/common/ConfirmModal';
import { CopyButton } from '../../components/common/CopyButton';
import { useSettings } from '../../contexts/SettingsContext';
import '../../styles/ConfigPanel.css';
import { AiModelName, getDefaultModelConfig, ModelConfig } from '../../../ai/model';
import APIKeyManager from './components/APIKeyManager';
import ModelSettingsPanel from './components/ModelSettingsPanel';
import AIProviderSelector from './components/AIProviderSelector';

const MODEL_DEFAULT_CONFIGS: Record<AiModelName, ModelConfig> = {
  [AiModelName.FLASH_EXP]: getDefaultModelConfig({
    modelName: AiModelName.FLASH_EXP,
  }),
  [AiModelName.FLASH_THINKING_EXP]: getDefaultModelConfig({
    modelName: AiModelName.FLASH_THINKING_EXP,
  }),
  [AiModelName.GEMINI_PRO_2_POINT_5_EXP]: getDefaultModelConfig({
    modelName: AiModelName.GEMINI_PRO_2_POINT_5_EXP,
  }),
};

const DEFAULT_CUSTOM_INPUT_CONFIG: ModelConfig = getDefaultModelConfig({
  modelName: AiModelName.GEMINI_PRO_2_POINT_5_EXP,
  requestsPerMinute: 25,
});

export const SettingsView: React.FC = () => {
  const { config, updateConfig } = useSettings();
  const [expanded, setExpanded] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [apiKeyError] = useState('');
  const [lastCustomInputConfig, setLastCustomInputConfig] = useState<ModelConfig | null>(null);
  const [isCustomInputMode, setIsCustomInputMode] = useState<boolean>(false);
  const [customModelConfig, setCustomModelConfig] = useState<ModelConfig>(config.customModelConfig);
  const { openConfirmModal } = useConfirmModal();

  useEffect(() => {
    if (config) {
      setIsCustomInputMode(config.isCustomInputMode);
      setCustomModelConfig(config.customModelConfig);
    }
  }, [config]);

  useEffect(() => {
    if (isCustomInputMode) {
      const isValid = Boolean(
        customModelConfig.modelName &&
          customModelConfig.requestsPerMinute &&
          customModelConfig.maxOutputTokenCount
      );
      window.dispatchEvent(
        new CustomEvent('configValidityChanged', {
          detail: { isValid, apiKeyError: Boolean(apiKeyError) },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('configValidityChanged', {
          detail: { isValid: true, apiKeyError: Boolean(apiKeyError) },
        })
      );
    }
  }, [isCustomInputMode, customModelConfig, apiKeyError]);

  const handleSourceLanguageChange = (e: SelectChangeEvent<Language>) => {
    updateConfig({
      sourceLanguage: e.target.value as SourceLanguage,
    });
  };

  const handleModelNameChange = (e: SelectChangeEvent<string>) => {
    const selectedValue = e.target.value;

    if (selectedValue === 'custom_input_mode') {
      setIsCustomInputMode(true);
      if (!isCustomInputMode) {
        const newCustomConfig = lastCustomInputConfig || {
          ...DEFAULT_CUSTOM_INPUT_CONFIG,
        };
        setCustomModelConfig(newCustomConfig as ModelConfig);
        updateConfig({
          customModelConfig: newCustomConfig as ModelConfig,
          isCustomInputMode: true,
        });
      }
      return;
    }

    if (isCustomInputMode) {
      setLastCustomInputConfig(customModelConfig);
    }

    setIsCustomInputMode(false);
    const newModelName = selectedValue as AiModelName;
    const newModelConfig = MODEL_DEFAULT_CONFIGS[newModelName];

    setCustomModelConfig(newModelConfig);
    updateConfig({
      customModelConfig: newModelConfig,
      isCustomInputMode: false,
    });
  };

  const handleCustomModelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newModelName = e.target.value;
    const newCustomModelConfig = {
      ...customModelConfig,
      modelName: newModelName as AiModelName,
    };
    setCustomModelConfig(newCustomModelConfig);
    updateConfig({
      customModelConfig: newCustomModelConfig,
    });
  };

  const handleRequestsPerMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const rpm = inputValue === '' ? 0 : parseInt(inputValue, 10);
    const newCustomModelConfig = {
      ...customModelConfig,
      requestsPerMinute: rpm,
    };
    setCustomModelConfig(newCustomModelConfig);
    updateConfig({
      customModelConfig: newCustomModelConfig,
    });
  };

  const handleMaxOutputTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const tokens = inputValue === '' ? 0 : parseInt(inputValue, 10);
    const newCustomModelConfig = {
      ...customModelConfig,
      maxOutputTokenCount: tokens,
    };
    setCustomModelConfig(newCustomModelConfig);
    updateConfig({
      customModelConfig: newCustomModelConfig,
    });
  };

  const handleSaveConfig = () => {
    if (apiKeyError) {
      showSnackbar('유효하지 않은 API 키가 입력되었습니다.');
      return;
    }

    if (!config.apiKey || config.apiKey.trim() === '') {
      openConfirmModal({
        message: 'API 키가 입력되지 않았습니다. API 키 없이 계속하시겠습니까?',
        variant: 'warning',
        onConfirm: () => {
          saveConfigAfterConfirmation();
        },
      });
    } else {
      saveConfigAfterConfirmation();
    }
  };

  const saveConfigAfterConfirmation = () => {
    if (isCustomInputMode) {
      if (!customModelConfig.modelName) {
        showSnackbar('모델 이름이 설정되지 않았습니다.');
        return;
      }
      if (!customModelConfig.requestsPerMinute || customModelConfig.requestsPerMinute <= 0) {
        showSnackbar('유효한 분당 요청 수(RPM)를 입력해주세요.');
        return;
      }
      if (!customModelConfig.maxOutputTokenCount || customModelConfig.maxOutputTokenCount <= 0) {
        showSnackbar('유효한 최대 출력 토큰 수를 입력해주세요.');
        return;
      }
    }

    const savedModelConfig = {
      ...customModelConfig,
    };

    updateConfig({
      sourceLanguage: config.sourceLanguage,
      apiKey: config.apiKey,
      customModelConfig: savedModelConfig,
      isCustomInputMode: isCustomInputMode,
    });

    showSnackbar('설정이 저장되었으며 브라우저 localStorage에 유지됩니다.');

    if (!config.apiKey || config.apiKey.trim() === '') {
      setTimeout(() => {
        showSnackbar('알림: API 키 없이는 번역 기능이 작동하지 않습니다.');
      }, 3000);
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="medium">
              번역 설정
            </Typography>
          </Box>
        }
        action={
          <Button
            onClick={toggleExpanded}
            endIcon={expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            sx={{ textTransform: 'none' }}
          >
            {expanded ? '접기' : '설정 더보기'}
          </Button>
        }
      />
      <Divider />
      <CardContent sx={{ pt: 2, pb: expanded ? 2 : '16px' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="source-language-label">원본 언어</InputLabel>
              <Select
                labelId="source-language-label"
                id="source-language"
                value={config.sourceLanguage}
                onChange={handleSourceLanguageChange}
                label="원본 언어"
              >
                <MenuItem value={Language.ENGLISH}>영어</MenuItem>
                <MenuItem value={Language.JAPANESE}>일본어</MenuItem>
                <MenuItem value={Language.CHINESE}>중국어</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <AIProviderSelector
              isCustomInputMode={isCustomInputMode}
              modelName={customModelConfig.modelName}
              handleModelNameChange={handleModelNameChange}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <APIKeyManager />
          </Grid>

          <ModelSettingsPanel
            isCustomInputMode={isCustomInputMode}
            customModelConfig={customModelConfig}
            handleCustomModelNameChange={handleCustomModelNameChange}
            handleRequestsPerMinuteChange={handleRequestsPerMinuteChange}
            handleMaxOutputTokensChange={handleMaxOutputTokensChange}
          />
        </Grid>

        <Collapse in={expanded} timeout="auto">
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" gutterBottom fontWeight="medium">
              고급 설정
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                현재 설정 정보
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    원본 언어:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {config.sourceLanguage}
                    </Typography>
                    <CopyButton targetValue={config.sourceLanguage} size="small" />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    AI 모델:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {config.customModelConfig.modelName}
                    </Typography>
                    <CopyButton targetValue={config.customModelConfig.modelName} size="small" />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    입력 모드:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {config.isCustomInputMode ? '직접 입력 모드' : '기본 모델 선택 모드'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    API 키 (마스킹됨):
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {/* APIKeyManager will handle visibility */}
                      {'••••••••••••••••'}
                    </Typography>
                    <CopyButton targetValue={config.apiKey} size="small" />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    모델 이름:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {customModelConfig.modelName}
                    </Typography>
                    <CopyButton targetValue={customModelConfig.modelName} size="small" />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    분당 요청 수(RPM):
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {customModelConfig.requestsPerMinute}
                    </Typography>
                    <CopyButton
                      targetValue={customModelConfig.requestsPerMinute.toString()}
                      size="small"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    최대 출력 토큰 수:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {customModelConfig.maxOutputTokenCount}
                    </Typography>
                    <CopyButton
                      targetValue={customModelConfig.maxOutputTokenCount.toString()}
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Alert
                  severity="info"
                  icon={<HelpIcon />}
                  sx={{
                    borderRadius: '6px',
                    '& .MuiAlert-message': { display: 'flex', alignItems: 'center' },
                  }}
                >
                  <Typography variant="body2">
                    Gemini API 키는{' '}
                    <a
                      href="https://ai.google.dev/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'inherit', fontWeight: 'bold' }}
                    >
                      Google AI Studio
                    </a>
                    에서 발급받을 수 있습니다.
                  </Typography>
                </Alert>
              </Box>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveConfig}
                disabled={!!apiKeyError}
              >
                설정 저장
              </Button>
            </Box>
          </Box>
        </Collapse>
      </CardContent>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Card>
  );
};

export default SettingsView;
