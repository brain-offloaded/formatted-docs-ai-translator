import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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
import React, { useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { CopyButton } from '../../components/common/CopyButton';
import { InfoTooltip } from '../../components/common/InfoTooltip';
import { useSettingsForm } from './hooks/useSettingsForm';
import { TranslatorAiSettingsDto } from '@/react/api/generated/models/TranslatorAiSettingsDto';
import { getWikiUrl, type WikiPageKey } from '../../utils/wiki';
import { useConfigStore } from '@/react/config/config-store';

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

  const addOpenAiCompatibleSlot = useConfigStore((state) => state.addOpenAiCompatibleSlot);
  const deleteOpenAiCompatibleSlot = useConfigStore((state) => state.deleteOpenAiCompatibleSlot);
  const selectOpenAiCompatibleSlot = useConfigStore((state) => state.selectOpenAiCompatibleSlot);

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
  const openAiProviderSettings = config.providerSettings[ModelProvider.OPENAI_COMPATIBLE];
  const openAiSlots = Array.isArray(openAiProviderSettings?.slots)
    ? openAiProviderSettings.slots
    : [];
  const openAiActiveSlotId =
    typeof openAiProviderSettings?.activeSlotId === 'string' &&
    openAiSlots.some((s) => s.id === openAiProviderSettings.activeSlotId)
      ? openAiProviderSettings.activeSlotId
      : (openAiSlots[0]?.id ?? 'slot-1');

  const handleOpenAiSlotSelect = useCallback(
    (event: SelectChangeEvent<string>) => {
      selectOpenAiCompatibleSlot(event.target.value);
    },
    [selectOpenAiCompatibleSlot]
  );

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
          {isOpenAiCompatible && (
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="openai-slot-label">{t('settings.providerSlot')}</InputLabel>
                  <Select
                    labelId="openai-slot-label"
                    id="openai-slot"
                    value={openAiActiveSlotId}
                    onChange={handleOpenAiSlotSelect}
                    label={t('settings.providerSlot')}
                  >
                    {openAiSlots.map((slot) => (
                      <MenuItem key={slot.id} value={slot.id}>
                        {slot.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title={t('settings.providerSlotAdd')}>
                  <IconButton
                    aria-label={t('settings.providerSlotAdd')}
                    onClick={addOpenAiCompatibleSlot}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {openAiSlots.length > 1 && (
                  <Tooltip title={t('settings.providerSlotDelete')}>
                    <IconButton
                      aria-label={t('settings.providerSlotDelete')}
                      onClick={() => deleteOpenAiCompatibleSlot(openAiActiveSlotId)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
          )}
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
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default SettingsView;
