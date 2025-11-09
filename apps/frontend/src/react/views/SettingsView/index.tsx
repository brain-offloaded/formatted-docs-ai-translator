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
  Switch,
  FormControlLabel,
  Slider,
} from '@mui/material';
import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { CopyButton } from '../../components/common/CopyButton';
import { useSettingsForm } from './hooks/useSettingsForm';
import { TranslatorAiSettingsDto } from '@/react/api/generated/models/TranslatorAiSettingsDto';

const ModelProvider = TranslatorAiSettingsDto.modelProvider;

const SettingsView: React.FC = () => {
  const { t } = useTranslation();
  const {
    config,
    isApiKeyVisible,
    expanded,
    apiKeyError,
    toggleApiKeyVisibility,
    toggleExpanded,
    handleProviderChange,
    handleApiKeyChange,
    updateCustomModelConfig,
    updateConfig,
  } = useSettingsForm();

  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="medium">
              {t('settings.translationSettings')}
            </Typography>
          </Box>
        }
        action={
          <Button
            onClick={toggleExpanded}
            endIcon={expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            sx={{ textTransform: 'none' }}
          >
            {expanded ? t('settings.hide') : t('settings.showMore')}
          </Button>
        }
      />
      <Divider />
      <CardContent sx={{ pt: 2, pb: expanded ? 2 : '16px' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="ai-provider-label">{t('settings.aiProvider')}</InputLabel>
              <Select
                labelId="ai-provider-label"
                id="ai-provider"
                value={config.modelProvider}
                onChange={handleProviderChange}
                label={t('settings.aiProvider')}
              >
                <MenuItem value={ModelProvider.GOOGLE}>Google</MenuItem>
                <MenuItem value={ModelProvider.VERTEX_AI}>Vertex AI</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('settings.allSettingsManual')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="api-key"
              label={t('settings.apiKey')}
              variant="outlined"
              type={isApiKeyVisible ? 'text' : 'password'}
              value={config.apiKey}
              onChange={handleApiKeyChange}
              error={!!apiKeyError}
              helperText={apiKeyError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip
                      title={isApiKeyVisible ? t('settings.hideKey') : t('settings.showKey')}
                    >
                      <IconButton
                        onClick={toggleApiKeyVisibility}
                        edge="end"
                        aria-label={
                          isApiKeyVisible ? t('settings.hidePassword') : t('settings.showPassword')
                        }
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
              label={t('settings.modelName')}
              variant="outlined"
              value={config.customModelConfig.modelName}
              onChange={(e) =>
                updateCustomModelConfig({
                  modelName: e.target.value,
                })
              }
              helperText={t('settings.modelId')}
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="requests-per-minute"
              label={t('settings.requestsPerMinute')}
              variant="outlined"
              type="number"
              value={config.customModelConfig.requestsPerMinute || ''}
              onChange={(e) =>
                updateCustomModelConfig({
                  requestsPerMinute: e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                })
              }
              InputProps={{
                inputProps: { min: 0 },
              }}
              helperText={
                !config.customModelConfig.requestsPerMinute
                  ? t('settings.fieldRequired')
                  : t('settings.requestsPerMinuteHelpText')
              }
              error={!config.customModelConfig.requestsPerMinute}
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="max-output-tokens"
              label={t('settings.maxOutputTokens')}
              variant="outlined"
              type="number"
              value={config.customModelConfig.maxOutputTokenCount || ''}
              onChange={(e) =>
                updateCustomModelConfig({
                  maxOutputTokenCount: e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                })
              }
              InputProps={{
                inputProps: { min: 0 },
              }}
              helperText={
                !config.customModelConfig.maxOutputTokenCount
                  ? t('settings.fieldRequired')
                  : t('settings.maxOutputTokensHelpText')
              }
              error={!config.customModelConfig.maxOutputTokenCount}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                {t('settings.thinking')}
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
                    label={t('settings.thinkingMode')}
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
                    label={t('settings.setThinkingBudget')}
                  />
                </Grid>
              </Grid>
              <Collapse in={config.useThinking && config.setThinkingBudget}>
                <Box sx={{ mt: 2 }}>
                  <Typography id="thinking-budget-slider" gutterBottom>
                    {t('settings.thinkingBudgetTokens', { budget: config.thinkingBudget })}
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
                    label={t('settings.thinkingBudget')}
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
              {t('settings.advancedSettings')}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                {t('settings.currentSettings')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    {t('settings.aiModel')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {config.customModelConfig.modelName || t('settings.notSet')}
                    </Typography>
                    <CopyButton targetValue={config.customModelConfig.modelName} size="small" />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    {t('settings.apiKeyMasked')}
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
                    {t('settings.requestsPerMinuteLabel')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {config.customModelConfig.requestsPerMinute || 0}
                    </Typography>
                    <CopyButton
                      targetValue={String(config.customModelConfig.requestsPerMinute ?? '')}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    {t('settings.maxOutputTokensLabel')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {config.customModelConfig.maxOutputTokenCount}
                    </Typography>
                    <CopyButton
                      targetValue={String(config.customModelConfig.maxOutputTokenCount ?? '')}
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
                    <Trans i18nKey="settings.apiKeyInfo">
                      API 키는
                      <a
                        href="https://ai.google.dev/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', fontWeight: 'bold' }}
                      >
                        Google AI Studio
                      </a>
                      에서 발급받을 수 있습니다.
                    </Trans>
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
