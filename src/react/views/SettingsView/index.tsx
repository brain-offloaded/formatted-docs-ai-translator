import HelpIcon from '@mui/icons-material/Help';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Button,
  Grid,
  Divider,
  Tooltip,
  Collapse,
  Paper,
  Alert,
  SelectChangeEvent,
  Switch,
  FormControlLabel,
  Slider,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import { useConfigStore } from '../../config/config-store';
import { CopyButton } from '../../components/common/CopyButton';
import '../../styles/ConfigPanel.css';
import { getDefaultModelConfig } from '../../../ai/model';
import { ModelProvider } from '@/ai/provider';

const SettingsView: React.FC = () => {
  const config = useConfigStore((state) => state);
  const updateConfig = useConfigStore((state) => state.updateConfig);

  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');

  useEffect(() => {
    // 직접 입력 모드에서 필수 값이 비어있는지 체크
    const isValid = Boolean(
      config.customModelConfig.modelName &&
        config.customModelConfig.requestsPerMinute &&
        config.customModelConfig.maxOutputTokenCount
    );

    // 번역 버튼 활성화/비활성화 상태를 전역 이벤트로 발행
    window.dispatchEvent(
      new CustomEvent('configValidityChanged', {
        detail: { isValid, apiKeyError: Boolean(apiKeyError) },
      })
    );
  }, [config.customModelConfig, apiKeyError]);

  const handleProviderChange = (e: SelectChangeEvent<string>) => {
    const newProvider = e.target.value as ModelProvider;

    // 제공자 변경 시 모델을 기본값으로 리셋
    const newModelConfig = getDefaultModelConfig();
    updateConfig({
      modelProvider: newProvider,
      customModelConfig: newModelConfig,
    });
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const apiKey = e.target.value;

    // API 키 유효성 검사
    if (apiKey && apiKey.length < 3) {
      setApiKeyError('API 키가 너무 짧습니다. 유효한 키인지 확인해주세요.');
    } else {
      setApiKeyError('');
    }

    updateConfig({ apiKey });
  };

  const toggleApiKeyVisibility = () => {
    setIsApiKeyVisible(!isApiKeyVisible);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
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
              <InputLabel id="ai-provider-label">AI 제공사</InputLabel>
              <Select
                labelId="ai-provider-label"
                id="ai-provider"
                value={config.modelProvider}
                onChange={handleProviderChange}
                label="AI 제공사"
              >
                <MenuItem value={ModelProvider.GOOGLE}>Google</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              모든 설정은 직접 입력해야 합니다. 아래 필드들을 모두 입력해주세요.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="api-key"
              label="API 키"
              variant="outlined"
              type={isApiKeyVisible ? 'text' : 'password'}
              value={config.apiKey}
              onChange={handleApiKeyChange}
              error={!!apiKeyError}
              helperText={apiKeyError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={isApiKeyVisible ? '숨기기' : '표시'}>
                      <IconButton
                        onClick={toggleApiKeyVisibility}
                        edge="end"
                        aria-label={isApiKeyVisible ? '비밀번호 숨기기' : '비밀번호 표시'}
                      >
                        {isApiKeyVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="custom-model-name"
              label="모델 이름"
              variant="outlined"
              value={config.customModelConfig.modelName}
              onChange={(e) =>
                updateConfig({
                  customModelConfig: {
                    ...config.customModelConfig,
                    modelName: e.target.value,
                  },
                })
              }
              helperText="Gemini 모델 ID"
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
              value={config.customModelConfig.requestsPerMinute || ''}
              onChange={(e) =>
                updateConfig({
                  customModelConfig: {
                    ...config.customModelConfig,
                    requestsPerMinute: e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                  },
                })
              }
              InputProps={{
                inputProps: { min: 0 },
              }}
              helperText={
                !config.customModelConfig.requestsPerMinute
                  ? '이 필드는 번역 실행 시 필수입니다'
                  : 'API 속도 제한에 맞는 분당 요청 수'
              }
              error={!config.customModelConfig.requestsPerMinute}
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
              value={config.customModelConfig.maxOutputTokenCount || ''}
              onChange={(e) =>
                updateConfig({
                  customModelConfig: {
                    ...config.customModelConfig,
                    maxOutputTokenCount: e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                  },
                })
              }
              InputProps={{
                inputProps: { min: 0 },
              }}
              helperText={
                !config.customModelConfig.maxOutputTokenCount
                  ? '이 필드는 번역 실행 시 필수입니다'
                  : '모델이 생성할 최대 토큰 수'
              }
              error={!config.customModelConfig.maxOutputTokenCount}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Thinking
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.useThinking}
                        onChange={(e) => updateConfig({ useThinking: e.target.checked })}
                        name="thinking-toggle"
                      />
                    }
                    label="Thinking mode"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.setThinkingBudget}
                        onChange={(e) => updateConfig({ setThinkingBudget: e.target.checked })}
                        name="set-thinking-budget-toggle"
                        disabled={!config.useThinking}
                      />
                    }
                    label="Set thinking budget"
                  />
                </Grid>
              </Grid>
              <Collapse in={config.useThinking && config.setThinkingBudget}>
                <Box sx={{ mt: 2 }}>
                  <Typography id="thinking-budget-slider" gutterBottom>
                    Thinking Budget (Tokens): {config.thinkingBudget}
                  </Typography>
                  <Slider
                    aria-labelledby="thinking-budget-slider"
                    value={config.thinkingBudget || 0}
                    onChange={(_, newValue) => updateConfig({ thinkingBudget: newValue as number })}
                    min={0}
                    max={10000}
                    step={100}
                    valueLabelDisplay="auto"
                  />
                  <TextField
                    fullWidth
                    label="Thinking Budget"
                    type="number"
                    value={config.thinkingBudget}
                    onChange={(e) => updateConfig({ thinkingBudget: Number(e.target.value) })}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Collapse>
            </Paper>
          </Grid>
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
                    AI 모델:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {config.customModelConfig.modelName || '미설정'}
                    </Typography>
                    <CopyButton targetValue={config.customModelConfig.modelName} size="small" />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    API 키 (마스킹됨):
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {isApiKeyVisible ? config.apiKey : '••••••••••••••••'}
                    </Typography>
                    <CopyButton targetValue={config.apiKey} size="small" />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    분당 요청 수(RPM):
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {config.customModelConfig.requestsPerMinute || 0}
                    </Typography>
                    <CopyButton
                      targetValue={config.customModelConfig.requestsPerMinute.toString()}
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
                      {config.customModelConfig.maxOutputTokenCount}
                    </Typography>
                    <CopyButton
                      targetValue={config.customModelConfig.maxOutputTokenCount.toString()}
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
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default SettingsView;
