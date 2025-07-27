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
import { IpcChannel } from '../../../nest/common/ipc.channel';
import { PromptPresetDto } from '@/nest/translation/prompt/dto/prompt-preset.dto'; // PromptPresetDto import
import { useTranslation } from '../../contexts/TranslationContext';

interface PromptPresetSelectorMinimalProps {
  currentPresetName: string;
  onPresetChange: (presetName: string) => void;
  isTranslating: boolean;
  isPresetLoading: boolean;
}

const PromptPresetSelectorMinimal: React.FC<PromptPresetSelectorMinimalProps> = ({
  currentPresetName,
  onPresetChange,
  isTranslating,
  isPresetLoading,
}) => {
  const [promptPresets, setPromptPresets] = useState<PromptPresetDto[]>([]);
  const { showSnackbar } = useTranslation();

  // 프롬프트 프리셋 목록 가져오기
  const fetchPromptPresets = useCallback(async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetPromptPresets);
      if (result.success) {
        setPromptPresets(result.presets);
      } else {
        showSnackbar(`프롬프트 프리셋 목록 불러오기 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('프롬프트 프리셋 불러오기 중 오류 발생:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      showSnackbar(`프롬프트 프리셋 목록 불러오기 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }, [showSnackbar]);

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
        onPresetChange('');
        return;
      }
      onPresetChange(newPresetName);
    },
    [onPresetChange, currentPresetName]
  );

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        프롬프트 프리셋
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="prompt-preset-minimal-label">프롬프트 프리셋 선택</InputLabel>
          <Select
            labelId="prompt-preset-minimal-label"
            id="prompt-preset-minimal"
            value={currentPresetName}
            onChange={handlePresetSelectChange}
            label="프롬프트 프리셋 선택"
            disabled={isTranslating || isPresetLoading} // 로딩 중일 때 비활성화
          >
            <MenuItem value="">프리셋 선택 안 함</MenuItem>
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
