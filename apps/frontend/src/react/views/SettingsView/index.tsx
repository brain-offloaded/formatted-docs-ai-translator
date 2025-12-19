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
  SelectChangeEvent,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { CopyButton } from '../../components/common/CopyButton';
import { InfoTooltip } from '../../components/common/InfoTooltip';
import { useSettingsForm } from './hooks/useSettingsForm';
import { TranslatorAiSettingsDto } from '@/react/api/generated/models/TranslatorAiSettingsDto';
import { getWikiUrl, type WikiPageKey } from '../../utils/wiki';
import { useTranslation as useTranslationContext } from '@/react/contexts/TranslationContext';
import { useConfirmModal } from '@/react/components/common/ConfirmModal';
import { ModelPresetsService } from '@/react/api/generated/services/ModelPresetsService';
import { ModelPresetDto } from '@/react/api/generated/models/ModelPresetDto';

const ModelProvider = TranslatorAiSettingsDto.modelProvider;

const SettingsView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    config,
    isApiKeyVisible,
    expanded,
    apiKeyError,
    toggleApiKeyVisibility,
    toggleExpanded,
    handleProviderChange,
    handleApiKeyChange,
    handleBaseUrlChange,
    updateCustomModelConfig,
    updateConfig,
  } = useSettingsForm();
  const { showSnackbar } = useTranslationContext();
  const { openConfirmModal } = useConfirmModal();

  const [modelPresets, setModelPresets] = useState<ModelPresetDto[]>([]);
  const [modelPresetName, setModelPresetName] = useState('');

  type TooltipTranslationKey =
    | 'tooltips.apiKey'
    | 'tooltips.modelName'
    | 'tooltips.requestsPerMinute'
    | 'tooltips.maxOutputTokens'
    | 'tooltips.maxConcurrentRequests'
    | 'tooltips.baseUrl'
    | 'tooltips.thinkingMode'
    | 'tooltips.setThinkingBudget'
    | 'tooltips.thinkingBudget';

  type WikiLabelKey = 'tooltips.links.gettingStarted';

  type WikiLinkOption = {
    page: WikiPageKey;
    wikiLabelKey: WikiLabelKey;
  };

  const labelWithTooltip = (
    labelText: string,
    tooltipKey: TooltipTranslationKey,
    wikiOption?: WikiLinkOption
  ) => (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {labelText}
      <InfoTooltip
        title={t(tooltipKey)}
        infoAriaLabel={t('tooltips.aria.info', { subject: labelText })}
        wikiUrl={wikiOption ? getWikiUrl(wikiOption.page, i18n.language) : undefined}
        wikiAriaLabel={wikiOption ? t(wikiOption.wikiLabelKey) : undefined}
      />
    </Box>
  );

  const isOpenAiCompatible = config.modelProvider === ModelProvider.OPENAI_COMPATIBLE;
  const selectedModelPresetId = config.selectedModelPresetId ?? '';
  const selectedModelPreset = useMemo(
    () => modelPresets.find((preset) => preset.id === selectedModelPresetId),
    [modelPresets, selectedModelPresetId]
  );

  const applyModelPreset = useCallback(
    (preset: ModelPresetDto) => {
      updateConfig({
        modelProvider: preset.modelProvider,
        apiKey: preset.apiKey,
        baseUrl: preset.baseUrl ?? '',
        customModelConfig: {
          modelName: preset.modelName,
          requestsPerMinute: preset.requestsPerMinute,
          maxOutputTokenCount: preset.maxOutputTokenCount,
          maxConcurrentRequests: preset.maxConcurrentRequests,
        },
        useThinking: preset.useThinking,
        setThinkingBudget: preset.setThinkingBudget,
        thinkingBudget: preset.thinkingBudget ?? 0,
        selectedModelPresetId: preset.id,
      });
    },
    [updateConfig]
  );

  const fetchModelPresets = useCallback(async () => {
    try {
      const response = await ModelPresetsService.modelPresetControllerGetModelPresets();
      if (response.success) {
        setModelPresets(response.presets);
      } else {
        showSnackbar(response.message || t('settings.modelPresetLoadFailed'));
      }
    } catch (error) {
      console.error('모델 프리셋 목록 조회 실패:', error);
      showSnackbar(t('settings.modelPresetLoadFailed'));
    }
  }, [showSnackbar, t]);

  useEffect(() => {
    void fetchModelPresets();
  }, [fetchModelPresets]);

  useEffect(() => {
    if (selectedModelPreset) {
      setModelPresetName(selectedModelPreset.name);
    } else if (!selectedModelPresetId) {
      setModelPresetName('');
    }
  }, [selectedModelPreset, selectedModelPresetId]);

  const handleModelPresetSelect = useCallback(
    (event: SelectChangeEvent<string>) => {
      const nextId = event.target.value ? Number(event.target.value) : undefined;
      if (!nextId) {
        updateConfig({ selectedModelPresetId: undefined });
        setModelPresetName('');
        return;
      }
      const preset = modelPresets.find((item) => item.id === nextId);
      if (!preset) {
        showSnackbar(t('settings.modelPresetLoadFailed'));
        return;
      }
      applyModelPreset(preset);
    },
    [applyModelPreset, modelPresets, showSnackbar, t, updateConfig]
  );

  const handleCreateModelPreset = useCallback(async () => {
    if (!modelPresetName.trim()) {
      showSnackbar(t('settings.modelPresetNameRequired'));
      return;
    }
    if (isOpenAiCompatible && !config.baseUrl.trim()) {
      showSnackbar(t('settings.baseUrlRequired'));
      return;
    }
    try {
      const response = await ModelPresetsService.modelPresetControllerCreateModelPreset({
        requestBody: {
          name: modelPresetName.trim(),
          modelProvider: config.modelProvider,
          baseUrl: config.baseUrl || undefined,
          apiKey: config.apiKey,
          modelName: config.customModelConfig.modelName,
          requestsPerMinute: config.customModelConfig.requestsPerMinute,
          maxOutputTokenCount: config.customModelConfig.maxOutputTokenCount,
          maxConcurrentRequests: config.customModelConfig.maxConcurrentRequests,
          useThinking: config.useThinking,
          setThinkingBudget: config.setThinkingBudget,
          thinkingBudget: config.thinkingBudget,
        },
      });
      if (!response.success || !response.preset) {
        showSnackbar(response.message || t('settings.modelPresetCreateFailed'));
        return;
      }
      await fetchModelPresets();
      applyModelPreset(response.preset);
      showSnackbar(t('settings.modelPresetCreateSuccess'));
    } catch (error) {
      console.error('모델 프리셋 생성 실패:', error);
      showSnackbar(t('settings.modelPresetCreateFailed'));
    }
  }, [
    applyModelPreset,
    config,
    fetchModelPresets,
    isOpenAiCompatible,
    modelPresetName,
    showSnackbar,
    t,
  ]);

  const handleUpdateModelPreset = useCallback(async () => {
    if (!selectedModelPresetId) {
      showSnackbar(t('settings.modelPresetSelectRequired'));
      return;
    }
    if (!modelPresetName.trim()) {
      showSnackbar(t('settings.modelPresetNameRequired'));
      return;
    }
    if (isOpenAiCompatible && !config.baseUrl.trim()) {
      showSnackbar(t('settings.baseUrlRequired'));
      return;
    }
    try {
      const response = await ModelPresetsService.modelPresetControllerUpdateModelPreset({
        id: Number(selectedModelPresetId),
        requestBody: {
          name: modelPresetName.trim(),
          modelProvider: config.modelProvider,
          baseUrl: config.baseUrl || undefined,
          apiKey: config.apiKey,
          modelName: config.customModelConfig.modelName,
          requestsPerMinute: config.customModelConfig.requestsPerMinute,
          maxOutputTokenCount: config.customModelConfig.maxOutputTokenCount,
          maxConcurrentRequests: config.customModelConfig.maxConcurrentRequests,
          useThinking: config.useThinking,
          setThinkingBudget: config.setThinkingBudget,
          thinkingBudget: config.thinkingBudget,
        },
      });
      if (!response.success || !response.preset) {
        showSnackbar(response.message || t('settings.modelPresetUpdateFailed'));
        return;
      }
      await fetchModelPresets();
      applyModelPreset(response.preset);
      showSnackbar(t('settings.modelPresetUpdateSuccess'));
    } catch (error) {
      console.error('모델 프리셋 업데이트 실패:', error);
      showSnackbar(t('settings.modelPresetUpdateFailed'));
    }
  }, [
    applyModelPreset,
    config,
    fetchModelPresets,
    isOpenAiCompatible,
    modelPresetName,
    selectedModelPresetId,
    showSnackbar,
    t,
  ]);

  const handleDeleteModelPreset = useCallback(() => {
    if (!selectedModelPresetId) {
      showSnackbar(t('settings.modelPresetSelectRequired'));
      return;
    }
    openConfirmModal({
      title: t('settings.modelPresetDeleteTitle'),
      message: t('settings.modelPresetDeleteConfirm'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger',
      onConfirm: () => {
        void (async () => {
          try {
            const response = await ModelPresetsService.modelPresetControllerDeleteModelPreset({
              id: Number(selectedModelPresetId),
            });
            if (!response.success) {
              showSnackbar(response.message || t('settings.modelPresetDeleteFailed'));
              return;
            }
            updateConfig({ selectedModelPresetId: undefined });
            setModelPresetName('');
            await fetchModelPresets();
            showSnackbar(t('settings.modelPresetDeleteSuccess'));
          } catch (error) {
            console.error('모델 프리셋 삭제 실패:', error);
            showSnackbar(t('settings.modelPresetDeleteFailed'));
          }
        })();
      },
    });
  }, [fetchModelPresets, openConfirmModal, selectedModelPresetId, showSnackbar, t, updateConfig]);

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
                <MenuItem value={ModelProvider.OPENAI_COMPATIBLE}>
                  {t('settings.openAiCompatible')}
                </MenuItem>
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
              label={labelWithTooltip(t('settings.apiKey'), 'tooltips.apiKey', {
                page: 'gettingStarted',
                wikiLabelKey: 'tooltips.links.gettingStarted',
              })}
              variant="outlined"
              type={isApiKeyVisible ? 'text' : 'password'}
              value={config.apiKey}
              onChange={handleApiKeyChange}
              error={!!apiKeyError}
              helperText={apiKeyError || t('settings.apiKeyRoundRobinHint')}
              InputLabelProps={{ shrink: true }}
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
          {isOpenAiCompatible && (
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="base-url"
                label={labelWithTooltip(t('settings.baseUrl'), 'tooltips.baseUrl')}
                variant="outlined"
                value={config.baseUrl}
                onChange={handleBaseUrlChange}
                helperText={
                  !config.baseUrl ? t('settings.baseUrlRequired') : t('settings.baseUrlHelpText')
                }
                error={!config.baseUrl}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          )}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="custom-model-name"
              label={labelWithTooltip(t('settings.modelName'), 'tooltips.modelName')}
              variant="outlined"
              value={config.customModelConfig.modelName}
              onChange={(e) =>
                updateCustomModelConfig({
                  modelName: e.target.value,
                })
              }
              helperText={t('settings.modelId')}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="requests-per-minute"
              label={labelWithTooltip(
                t('settings.requestsPerMinute'),
                'tooltips.requestsPerMinute'
              )}
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
              InputLabelProps={{ shrink: true }}
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
              label={labelWithTooltip(t('settings.maxOutputTokens'), 'tooltips.maxOutputTokens')}
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
              InputLabelProps={{ shrink: true }}
              helperText={
                !config.customModelConfig.maxOutputTokenCount
                  ? t('settings.fieldRequired')
                  : t('settings.maxOutputTokensHelpText')
              }
              error={!config.customModelConfig.maxOutputTokenCount}
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="max-concurrent-requests"
              label={labelWithTooltip(
                t('settings.maxConcurrentRequests'),
                'tooltips.maxConcurrentRequests'
              )}
              variant="outlined"
              type="number"
              value={config.customModelConfig.maxConcurrentRequests || ''}
              onChange={(e) =>
                updateCustomModelConfig({
                  maxConcurrentRequests: e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                })
              }
              InputProps={{
                inputProps: { min: 1 },
              }}
              InputLabelProps={{ shrink: true }}
              helperText={
                !config.customModelConfig.maxConcurrentRequests
                  ? t('settings.fieldRequired')
                  : t('settings.maxConcurrentRequestsHelpText')
              }
              error={!config.customModelConfig.maxConcurrentRequests}
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
                    label={labelWithTooltip(t('settings.thinkingMode'), 'tooltips.thinkingMode')}
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
                    label={labelWithTooltip(
                      t('settings.setThinkingBudget'),
                      'tooltips.setThinkingBudget'
                    )}
                  />
                </Grid>
              </Grid>
              <Collapse in={config.useThinking && config.setThinkingBudget}>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography id="thinking-budget-slider" gutterBottom component="span">
                      {t('settings.thinkingBudgetTokens', { budget: config.thinkingBudget })}
                    </Typography>
                    <InfoTooltip
                      title={t('tooltips.thinkingBudget')}
                      infoAriaLabel={t('tooltips.aria.info', {
                        subject: t('settings.thinkingBudget'),
                      })}
                    />
                  </Box>
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
                    label={labelWithTooltip(
                      t('settings.thinkingBudget'),
                      'tooltips.thinkingBudget'
                    )}
                    type="number"
                    value={config.thinkingBudget}
                    onChange={(e) => updateConfig({ thinkingBudget: Number(e.target.value) })}
                    sx={{ mt: 1 }}
                    InputLabelProps={{ shrink: true }}
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
                {isOpenAiCompatible && (
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      {t('settings.baseUrlLabel')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {config.baseUrl || t('settings.notSet')}
                      </Typography>
                      <CopyButton targetValue={config.baseUrl} size="small" />
                    </Box>
                  </Grid>
                )}
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
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    {t('settings.maxConcurrentRequestsLabel')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {config.customModelConfig.maxConcurrentRequests || 0}
                    </Typography>
                    <CopyButton
                      targetValue={String(config.customModelConfig.maxConcurrentRequests ?? '')}
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
                    {isOpenAiCompatible ? (
                      t('settings.openAiCompatibleInfo')
                    ) : (
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
                    )}
                  </Typography>
                </Alert>
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                {t('settings.modelPresetTitle')}
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="model-preset-label">
                      {t('settings.modelPresetSelect')}
                    </InputLabel>
                    <Select
                      labelId="model-preset-label"
                      id="model-preset"
                      value={selectedModelPresetId ? String(selectedModelPresetId) : ''}
                      onChange={handleModelPresetSelect}
                      label={t('settings.modelPresetSelect')}
                    >
                      <MenuItem value="">{t('settings.modelPresetNone')}</MenuItem>
                      {modelPresets.map((preset) => (
                        <MenuItem key={preset.id} value={String(preset.id)}>
                          {preset.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    id="model-preset-name"
                    label={t('settings.modelPresetName')}
                    variant="outlined"
                    value={modelPresetName}
                    onChange={(e) => setModelPresetName(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    {t('settings.modelPresetHint')}
                  </Typography>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={handleCreateModelPreset}>
                  {t('settings.modelPresetCreate')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleUpdateModelPreset}
                  disabled={!selectedModelPresetId}
                >
                  {t('settings.modelPresetUpdate')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDeleteModelPreset}
                  disabled={!selectedModelPresetId}
                >
                  {t('settings.modelPresetDelete')}
                </Button>
              </Box>
            </Paper>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default SettingsView;
