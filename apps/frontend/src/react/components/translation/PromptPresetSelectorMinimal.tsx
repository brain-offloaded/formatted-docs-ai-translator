import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useTranslation } from 'react-i18next';

import { PromptPresetDto } from '@/react/api/generated/models/PromptPresetDto';
import { useTranslation as useTranslationContext } from '../../contexts/TranslationContext';
import { PromptPresetsService } from '@/react/api/generated/services/PromptPresetsService';
import { InfoTooltip } from '@/react/components/common/InfoTooltip';
import { getWikiUrl } from '@/react/utils/wiki';

interface PromptPresetSelectorMinimalProps {
  currentPresetName: string;
  onPresetChange: (presetName: string, presetContent: string | undefined) => void;
  isTranslating: boolean;
  isPresetLoading: boolean;
  setIsPresetLoading: (loading: boolean) => void;
  type?: PromptPresetDto.type;
}

const PromptPresetSelectorMinimal: React.FC<PromptPresetSelectorMinimalProps> = ({
  currentPresetName,
  onPresetChange,
  isTranslating,
  isPresetLoading,
  setIsPresetLoading,
  type,
}) => {
  const [promptPresets, setPromptPresets] = useState<PromptPresetDto[]>([]);
  const { showSnackbar } = useTranslationContext();
  const { t, i18n } = useTranslation();

  // 프롬프트 프리셋 목록 가져오기
  const fetchPromptPresets = useCallback(async () => {
    try {
      setIsPresetLoading(true);
      const response = await PromptPresetsService.promptPresetControllerGetPromptPresets({
        type,
      });

      if (response?.success && Array.isArray(response.presets)) {
        setPromptPresets(response.presets);
      } else {
        showSnackbar(response?.message || t('promptPreset.loadFailed'));
        setPromptPresets([]);
      }
    } catch (error) {
      console.error('프롬프트 프리셋 불러오기 중 오류 발생:', error);
      const message = error instanceof Error ? error.message : t('errors.unknown');
      showSnackbar(t('promptPreset.loadError', { message }));
    } finally {
      setIsPresetLoading(false);
    }
  }, [setIsPresetLoading, showSnackbar, type, t]);

  // 컴포넌트 마운트 시 프롬프트 프리셋 목록 가져오기
  useEffect(() => {
    fetchPromptPresets();
  }, [fetchPromptPresets]);

  // 프리셋 변경 핸들러
  const handlePresetSelectChange = useCallback(
    async (event: SelectChangeEvent<string>) => {
      const newPresetName = event.target.value;
      if (newPresetName === currentPresetName) return;

      // "프리셋 선택 안 함" 옵션 처리
      if (newPresetName === '') {
        onPresetChange('', undefined); // 이름과 내용 모두 초기화
        return;
      }

      try {
        setIsPresetLoading(true);

        const selectedPreset = promptPresets.find((p) => p.name === newPresetName);
        if (!selectedPreset) {
          showSnackbar(t('promptPreset.notFound', { name: newPresetName }));
          onPresetChange('', undefined);
          setIsPresetLoading(false);
          return;
        }

        const response = await PromptPresetsService.promptPresetControllerGetPromptPresetDetail({
          id: selectedPreset.id,
        });

        if (response?.success && response.preset) {
          onPresetChange(newPresetName, response.preset.prompt);
          showSnackbar(t('promptPreset.loaded', { name: newPresetName }));
        } else {
          showSnackbar(response?.message || t('promptPreset.detailLoadFailed'));
        }
      } catch (error) {
        console.error('프롬프트 프리셋 상세 정보 로드 중 오류 발생:', error);
        const message = error instanceof Error ? error.message : t('errors.unknown');
        showSnackbar(t('promptPreset.detailLoadError', { message }));
      } finally {
        setIsPresetLoading(false);
      }
    },
    [currentPresetName, onPresetChange, promptPresets, showSnackbar, setIsPresetLoading, t]
  );

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom component="div">
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          {t('promptPreset.title')}
          <InfoTooltip
            title={t('tooltips.promptPresetSelector')}
            infoAriaLabel={t('tooltips.aria.info', { subject: t('promptPreset.title') })}
            wikiUrl={getWikiUrl('presetGuide', i18n.language)}
            wikiAriaLabel={t('tooltips.links.presetGuide')}
          />
        </Box>
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="prompt-preset-minimal-label">{t('promptPreset.selectLabel')}</InputLabel>
          <Select
            labelId="prompt-preset-minimal-label"
            id="prompt-preset-minimal"
            value={currentPresetName}
            onChange={handlePresetSelectChange}
            label={t('promptPreset.selectLabel')}
            disabled={isTranslating || isPresetLoading} // 로딩 중일 때 비활성화
          >
            <MenuItem value="">{t('promptPreset.noSelection')}</MenuItem>
            {/* 로딩 중이 아닐 때만 메뉴 아이템 표시 */}
            {!isPresetLoading &&
              promptPresets.map((preset) => (
                <MenuItem key={preset.id} value={preset.name}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography>{preset.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        {/* 로딩 인디케이터 */}
        {isPresetLoading && <CircularProgress size={24} />}
      </Box>
    </Box>
  );
};

export default PromptPresetSelectorMinimal;
