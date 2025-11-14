import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Paper,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Snackbar,
} from '@mui/material';
import { Edit, Delete, Add, Article, Image } from '@mui/icons-material';

import { PromptPresetDto } from '@/react/api/generated/models/PromptPresetDto';
import { PromptPresetDetailDto } from '@/react/api/generated/models/PromptPresetDetailDto';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from '@/react/hooks/useSnackbar';
import { useConfirmModal } from '@/react/components/common/ConfirmModal';
import { PromptPresetsService } from '@/react/api/generated/services/PromptPresetsService';
import { InfoTooltip } from '@/react/components/common/InfoTooltip';
import { getWikiUrl } from '@/react/utils/wiki';

const PromptPresetPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [presets, setPresets] = useState<PromptPresetDto[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<PromptPresetDetailDto | null>(null);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<PromptPresetDto.type>(PromptPresetDto.type.TEXT);
  const [isEditing, setIsEditing] = useState(false);
  const {
    isOpen: isSnackbarOpen,
    message: snackbarMessage,
    showSnackbar,
    closeSnackbar,
  } = useSnackbar();
  const { openConfirmModal } = useConfirmModal();

  const fetchPresets = useCallback(async (): Promise<PromptPresetDto[]> => {
    const result = await PromptPresetsService.promptPresetControllerGetPromptPresets({});
    if (result.success) {
      setPresets(result.presets);
      return result.presets;
    } else {
      console.error('Failed to fetch prompt presets:', result.message);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchPresets().catch(console.error);
  }, [fetchPresets]);

  const handleSelectPreset = async (preset: PromptPresetDto) => {
    const result = await PromptPresetsService.promptPresetControllerGetPromptPresetDetail({
      id: preset.id,
    });

    if (result.success && result.preset) {
      setSelectedPreset(result.preset);
      setName(result.preset.name);
      setPrompt(result.preset.prompt);
      setType(result.preset.type);
      setIsEditing(true);
    } else {
      console.error('Failed to fetch prompt preset detail:', result.message);
    }
  };

  const handleClearSelection = useCallback(() => {
    setSelectedPreset(null);
    setName('');
    setPrompt('');
    setType(PromptPresetDto.type.TEXT);
    setIsEditing(false);
  }, []);

  const handleSave = async () => {
    if (!name || !prompt) {
      alert(t('preset.nameAndContentRequired'));
      return;
    }

    let savedPresetId: number | null = null;

    if (isEditing && selectedPreset) {
      const response = await PromptPresetsService.promptPresetControllerUpdatePromptPreset({
        id: selectedPreset.id,
        requestBody: {
          name,
          prompt,
          type: type,
        },
      });
      if (!response?.success) {
        showSnackbar(response?.message ?? t('preset.saveFailed'));
        return;
      }
      savedPresetId = selectedPreset.id;
      showSnackbar(t('preset.saveSuccess'));
    } else {
      const response = await PromptPresetsService.promptPresetControllerCreatePromptPreset({
        requestBody: { name, prompt, type: type },
      });
      if (!response?.success || !response.preset) {
        showSnackbar(response?.message ?? t('preset.saveFailed'));
        return;
      }
      savedPresetId = response.preset.id;
      showSnackbar(t('preset.saveSuccess'));
    }

    const updatedPresets = await fetchPresets();
    if (!savedPresetId) return;

    if (isEditing) {
      setSelectedPreset((prev) =>
        prev && prev.id === savedPresetId ? { ...prev, name, prompt, type: type } : prev
      );
    } else {
      const targetPreset = updatedPresets.find((preset) => preset.id === savedPresetId);
      if (targetPreset) {
        await handleSelectPreset(targetPreset);
      }
    }
  };

  const handleDelete = useCallback(
    (presetId: number) => {
      openConfirmModal({
        title: t('preset.deleteConfirmTitle'),
        message: t('preset.deleteConfirm'),
        confirmText: t('common.delete'),
        cancelText: t('common.cancel'),
        variant: 'danger',
        onConfirm: () => {
          void (async () => {
            try {
              const response = await PromptPresetsService.promptPresetControllerDeletePromptPreset({
                id: presetId,
              });
              if (!response?.success) {
                showSnackbar(response?.message ?? t('preset.deleteFailed'));
                return;
              }

              if (selectedPreset?.id === presetId) {
                handleClearSelection();
              }

              await fetchPresets();
              showSnackbar(t('preset.deleteSuccess'));
            } catch (error) {
              console.error('프롬프트 프리셋 삭제 실패:', error);
              showSnackbar(t('preset.deleteFailed'));
            }
          })();
        },
      });
    },
    [fetchPresets, handleClearSelection, openConfirmModal, selectedPreset, showSnackbar, t]
  );

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 2, position: 'relative' }}>
      <Paper sx={{ flex: 1, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">{t('preset.promptPresetList')}</Typography>
          <Button variant="outlined" startIcon={<Add />} onClick={handleClearSelection}>
            {t('preset.newPreset')}
          </Button>
        </Box>
        <List>
          {presets.map((preset) => (
            <ListItem
              key={preset.id}
              disablePadding
              secondaryAction={
                <>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleSelectPreset(preset)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(preset.id)}
                  >
                    <Delete />
                  </IconButton>
                </>
              }
            >
              <ListItemButton
                onClick={() => handleSelectPreset(preset)}
                selected={selectedPreset?.id === preset.id}
              >
                {preset.type === PromptPresetDto.type.IMAGE ? (
                  <Image sx={{ mr: 1 }} />
                ) : (
                  <Article sx={{ mr: 1 }} />
                )}
                <ListItemText primary={preset.name} secondary={preset.type} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>
      <Divider orientation="vertical" flexItem />
      <Paper sx={{ flex: 2, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {isEditing ? t('preset.editPreset') : t('preset.newPresetCreate')}
        </Typography>
        <TextField
          label={t('preset.presetName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <FormControl component="fieldset" margin="normal">
          <FormLabel
            component="legend"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, columnGap: 0.5 }}
          >
            {t('preset.type')}
            <InfoTooltip
              title={t('tooltips.promptPresetType')}
              infoAriaLabel={t('tooltips.aria.info', { subject: t('preset.type') })}
              wikiUrl={getWikiUrl('presetGuide', i18n.language)}
              wikiAriaLabel={t('tooltips.links.presetGuide')}
            />
          </FormLabel>
          <RadioGroup
            row
            value={type}
            onChange={(e) => setType(e.target.value as PromptPresetDto.type)}
          >
            <FormControlLabel
              value={PromptPresetDto.type.TEXT}
              control={<Radio />}
              label={t('preset.text')}
            />
            <FormControlLabel
              value={PromptPresetDto.type.IMAGE}
              control={<Radio />}
              label={t('preset.image')}
            />
          </RadioGroup>
        </FormControl>
        <TextField
          label={
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              {t('preset.presetContent')}
              <InfoTooltip
                title={t('tooltips.promptPresetContent')}
                infoAriaLabel={t('tooltips.aria.info', { subject: t('preset.presetContent') })}
                wikiUrl={getWikiUrl('presetGuide', i18n.language)}
                wikiAriaLabel={t('tooltips.links.presetGuide')}
              />
            </Box>
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={10}
          InputLabelProps={{ shrink: true }}
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={handleClearSelection} variant="outlined">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained">
            {isEditing ? t('preset.saveComplete') : t('common.save')}
          </Button>
        </Box>
      </Paper>
      <Snackbar open={isSnackbarOpen} message={snackbarMessage} onClose={closeSnackbar} />
    </Box>
  );
};

export default PromptPresetPanel;
