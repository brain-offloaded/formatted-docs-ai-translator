import LanguageIcon from '@mui/icons-material/Language';
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
  Grid,
  Divider,
  SelectChangeEvent,
} from '@mui/material';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { uiLanguages, getLanguageLabelByCode } from '@apps/common/dist/language';
import { SettingsService as SettingsApiService } from '@/react/api/generated/services/SettingsService';
import { UpdateSettingRequestDto } from '@/react/api/generated/models/UpdateSettingRequestDto';

const AppSettingsView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [uiLanguage, setUiLanguage] = useState<string>(i18n.language);

  const getDisplayLabel = useCallback((languageCode: string): string => {
    try {
      const displayNames = new Intl.DisplayNames([languageCode], { type: 'language' });
      const nativeName = displayNames.of(languageCode);
      if (nativeName) {
        return nativeName;
      }
    } catch {
      // ignore - fallback below
    }
    return getLanguageLabelByCode(languageCode, languageCode === 'ko' ? 'ko' : 'en');
  }, []);

  const languageOptions = useMemo(
    () =>
      uiLanguages.map((languageCode) => ({
        code: languageCode,
        label: getDisplayLabel(languageCode),
      })),
    [getDisplayLabel]
  );

  useEffect(() => {
    const fetchUiLanguage = async () => {
      try {
        const response = await SettingsApiService.settingsControllerGetSetting({
          key: 'uiLanguage',
        });
        if (response.success && typeof response.result === 'string' && response.result) {
          setUiLanguage(response.result);
        }
      } catch {
        // 오류 발생 시 무시
      }
    };

    void fetchUiLanguage();
  }, []);

  const handleLanguageChange = async (event: SelectChangeEvent<string>) => {
    const newLanguage = event.target.value as string;
    const previousLanguage = uiLanguage;
    setUiLanguage(newLanguage);

    try {
      // DB에 언어 설정 저장
      const payload: UpdateSettingRequestDto = { value: newLanguage };
      const response = await SettingsApiService.settingsControllerUpdateSetting({
        key: 'uiLanguage',
        requestBody: payload,
      });

      if (!response.success) {
        throw new Error(response.message ?? 'Failed to update language setting');
      }

      // i18n 언어 변경
      await i18n.changeLanguage(newLanguage);
    } catch (error) {
      setUiLanguage(previousLanguage);
      console.error('Failed to update language setting:', error);
    }
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LanguageIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="medium">
              {t('settings.uiLanguage')}
            </Typography>
          </Box>
        }
      />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="ui-language-label">{t('settings.selectLanguage')}</InputLabel>
              <Select
                labelId="ui-language-label"
                id="ui-language"
                value={uiLanguage}
                onChange={handleLanguageChange}
                label={t('settings.selectLanguage')}
              >
                {languageOptions.map(({ code, label }) => (
                  <MenuItem key={code} value={code}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" sx={{ pt: 2 }}>
              {t('settings.languageChanged')}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AppSettingsView;
