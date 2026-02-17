import AddIcon from '@mui/icons-material/Add';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Alert,
  Paper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfigStore } from '@/react/config/config-store';

const PrePostProcessingView: React.FC = () => {
  const { t } = useTranslation();
  const placeholderPreservationEnabled = useConfigStore(
    (state) => state.placeholderPreservationEnabled
  );
  const placeholderPreservationRules = useConfigStore(
    (state) => state.placeholderPreservationRules
  );
  const updateConfig = useConfigStore((state) => state.updateConfig);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSourceText, setPreviewSourceText] = useState('');
  const [previewTargetText, setPreviewTargetText] = useState('');
  const [previewPassed, setPreviewPassed] = useState<boolean | null>(null);
  const [previewResult, setPreviewResult] = useState<
    Array<{
      label: string;
      before: number | null;
      after: number | null;
      ok: boolean;
      valueMismatch: boolean;
    }>
  >([]);

  const defaultPlaceholderRules = useMemo(
    () => [
      { pattern: '\\r', flags: '', enabled: true },
      { pattern: '\\n', flags: '', enabled: true },
    ],
    []
  );

  const togglePlaceholderPreservation = (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    updateConfig({ placeholderPreservationEnabled: checked });
  };

  const updatePlaceholderRule = useCallback(
    (index: number, next: { pattern?: string; flags?: string; enabled?: boolean }) => {
      const nextRules = placeholderPreservationRules.map((rule, i) =>
        i === index ? { ...rule, ...next } : rule
      );
      updateConfig({ placeholderPreservationRules: nextRules });
    },
    [placeholderPreservationRules, updateConfig]
  );

  const addPlaceholderRule = useCallback(() => {
    updateConfig({
      placeholderPreservationRules: [
        ...placeholderPreservationRules,
        { pattern: '', flags: '', enabled: true },
      ],
    });
  }, [placeholderPreservationRules, updateConfig]);

  const deletePlaceholderRule = useCallback(
    (index: number) => {
      updateConfig({
        placeholderPreservationRules: placeholderPreservationRules.filter((_, i) => i !== index),
      });
    },
    [placeholderPreservationRules, updateConfig]
  );

  const resetPlaceholderRules = useCallback(() => {
    updateConfig({ placeholderPreservationRules: defaultPlaceholderRules });
  }, [defaultPlaceholderRules, updateConfig]);

  const normalizeFlagsForCompile = (flags: string): string => {
    const filtered = flags.replace(/[^dgimsuvy]/g, '');
    const unique = Array.from(new Set(filtered.split(''))).join('');
    return unique;
  };

  const tryCompileRegex = (pattern: string, flags: string): RegExp | null => {
    try {
      const normalizedFlags = normalizeFlagsForCompile(flags);
      const withoutGlobal = normalizedFlags.replace(/g/g, '');
      return new RegExp(pattern, withoutGlobal);
    } catch {
      return null;
    }
  };

  const isPotentiallyOvermatching = (pattern: string, flags: string): boolean => {
    const compiled = tryCompileRegex(pattern, flags);
    if (!compiled) return false;
    try {
      return compiled.test('');
    } catch {
      return false;
    }
  };

  const isSameMatchMultiset = (a: Map<string, number>, b: Map<string, number>): boolean => {
    if (a.size !== b.size) return false;
    for (const [value, count] of a) {
      if (b.get(value) !== count) return false;
    }
    return true;
  };

  const buildMatchMultiset = (
    text: string,
    pattern: string,
    flags: string
  ): Map<string, number> | null => {
    const normalizedFlags = normalizeFlagsForCompile(flags);
    const withGlobal = normalizedFlags.includes('g') ? normalizedFlags : `${normalizedFlags}g`;
    let regex: RegExp;
    try {
      regex = new RegExp(pattern, withGlobal);
    } catch {
      return null;
    }
    const maxMatches = 10000;
    let count = 0;
    const multiset = new Map<string, number>();
    regex.lastIndex = 0;
    while (true) {
      const match = regex.exec(text);
      if (!match) break;
      const value = match[0];
      multiset.set(value, (multiset.get(value) || 0) + 1);
      count++;
      if (count >= maxMatches) return null;
      if (value === '') {
        regex.lastIndex++;
        if (regex.lastIndex > text.length) break;
      }
    }
    return multiset;
  };

  const countMultiset = (multiset: Map<string, number>): number => {
    let total = 0;
    for (const count of multiset.values()) total += count;
    return total;
  };

  const runPreview = () => {
    const results = placeholderPreservationRules
      .filter((rule) => rule.enabled && rule.pattern.trim().length > 0)
      .map((rule) => {
        const label = `${rule.pattern} /${rule.flags || ''}/`;
        const beforeSet = buildMatchMultiset(previewSourceText, rule.pattern, rule.flags);
        const afterSet = buildMatchMultiset(previewTargetText, rule.pattern, rule.flags);
        const before = beforeSet ? countMultiset(beforeSet) : null;
        const after = afterSet ? countMultiset(afterSet) : null;
        const ok = !!beforeSet && !!afterSet && isSameMatchMultiset(beforeSet, afterSet);
        const valueMismatch = !ok && before !== null && after !== null && before === after;
        return { label, before, after, ok, valueMismatch };
      });
    setPreviewResult(results);
    setPreviewPassed(results.every((r) => r.ok));
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AutoFixHighIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="medium">
              {t('menu.prepostSettings')}
            </Typography>
          </Box>
        }
      />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="medium" sx={{ mt: 1 }}>
              {t('settings.translationValidation')}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {t('settings.placeholderPreservation.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('settings.placeholderPreservation.description')}
              </Typography>

              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Switch
                    color="primary"
                    checked={placeholderPreservationEnabled}
                    onChange={togglePlaceholderPreservation}
                  />
                }
                label={t('settings.placeholderPreservation.enabled')}
              />

              <Box sx={{ mt: 1 }}>
                {placeholderPreservationRules.map((rule, index) => {
                  const isEnabled = !!rule.enabled;
                  const regex = rule.pattern.trim()
                    ? tryCompileRegex(rule.pattern, rule.flags)
                    : null;
                  const isInvalid = isEnabled && rule.pattern.trim().length > 0 && !regex;
                  const shouldWarn =
                    isEnabled &&
                    rule.pattern.trim().length > 0 &&
                    isPotentiallyOvermatching(rule.pattern, rule.flags);

                  return (
                    <Grid
                      container
                      spacing={1}
                      key={`placeholder-rule-${index}`}
                      alignItems="center"
                      sx={{ mb: 1, opacity: isEnabled ? 1 : 0.6 }}
                    >
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label={t('settings.placeholderPreservation.patternLabel')}
                          value={rule.pattern}
                          onChange={(e) =>
                            updatePlaceholderRule(index, { pattern: e.target.value })
                          }
                          placeholder={'\\n, \\r, <br>, %s'}
                          error={isInvalid}
                          helperText={
                            isInvalid
                              ? t('settings.placeholderPreservation.error.invalidRegex')
                              : t('settings.placeholderPreservation.patternHelper')
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={8} md={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label={t('settings.placeholderPreservation.flagsLabel')}
                          value={rule.flags}
                          onChange={(e) => updatePlaceholderRule(index, { flags: e.target.value })}
                          placeholder="gimsuy"
                          helperText={t('settings.placeholderPreservation.flagsHelper')}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={4} md={4}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <FormControlLabel
                            sx={{ mr: 1 }}
                            control={
                              <Switch
                                size="small"
                                checked={isEnabled}
                                onChange={(_event, checked) =>
                                  updatePlaceholderRule(index, { enabled: checked })
                                }
                              />
                            }
                            label={t('settings.placeholderPreservation.ruleEnabled')}
                          />
                          {shouldWarn && (
                            <Tooltip
                              title={t('settings.placeholderPreservation.warning.emptyMatch')}
                            >
                              <WarningAmberIcon fontSize="small" color="warning" sx={{ mr: 1.5 }} />
                            </Tooltip>
                          )}
                          <Tooltip title={t('common.delete')}>
                            <IconButton size="small" onClick={() => deletePlaceholderRule(index)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Grid>
                    </Grid>
                  );
                })}

                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button size="small" startIcon={<AddIcon />} onClick={addPlaceholderRule}>
                    {t('settings.placeholderPreservation.addRule')}
                  </Button>
                  <Button size="small" color="inherit" onClick={resetPlaceholderRules}>
                    {t('settings.placeholderPreservation.resetDefaults')}
                  </Button>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => setPreviewOpen((prev) => !prev)}
                  >
                    {t('settings.placeholderPreservation.previewTitle')}
                  </Button>
                </Box>

                <Collapse in={previewOpen}>
                  <Box sx={{ mt: 2 }}>
                    {previewPassed !== null && (
                      <Alert severity={previewPassed ? 'success' : 'error'} sx={{ mb: 1 }}>
                        {previewPassed
                          ? t('settings.placeholderPreservation.previewPass')
                          : t('settings.placeholderPreservation.previewFail')}
                      </Alert>
                    )}
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label={t('settings.placeholderPreservation.previewSourceLabel')}
                      value={previewSourceText}
                      onChange={(e) => setPreviewSourceText(e.target.value)}
                      placeholder={t('settings.placeholderPreservation.previewSourcePlaceholder')}
                      InputLabelProps={{ shrink: true }}
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label={t('settings.placeholderPreservation.previewTargetLabel')}
                      value={previewTargetText}
                      onChange={(e) => setPreviewTargetText(e.target.value)}
                      placeholder={t('settings.placeholderPreservation.previewTargetPlaceholder')}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button size="small" variant="outlined" onClick={runPreview}>
                        {t('settings.placeholderPreservation.previewRun')}
                      </Button>
                    </Box>
                    {previewResult.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {previewResult.map((r) => (
                          <Typography
                            key={r.label}
                            variant="body2"
                            color={r.ok ? 'text.secondary' : 'error'}
                          >
                            {r.label}: {r.before === null ? '-' : r.before} →{' '}
                            {r.after === null ? '-' : r.after}
                            {r.valueMismatch &&
                              ` (${t('settings.placeholderPreservation.previewValueMismatch')})`}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PrePostProcessingView;
