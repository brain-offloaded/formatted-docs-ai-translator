import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select'; // SelectChangeEvent import 수정
import { IpcChannel } from '../../../nest/common/ipc.channel';
import { ExamplePresetDto } from '@/nest/translation/example/dto/example-preset.dto';
import { useTranslation } from '../../contexts/TranslationContext'; // showSnackbar 가져오기

interface ExamplePresetSelectorMinimalProps {
  currentPresetName: string;
  onPresetChange: (event: SelectChangeEvent<string>) => void;
  isTranslating: boolean;
  isPresetLoading: boolean;
}

const ExamplePresetSelectorMinimal: React.FC<ExamplePresetSelectorMinimalProps> = ({
  currentPresetName,
  onPresetChange,
  isTranslating,
  isPresetLoading,
}) => {
  const [examplePresets, setExamplePresets] = useState<ExamplePresetDto[]>([]);
  const { showSnackbar } = useTranslation(); // 스낵바 사용

  // 예제 프리셋 목록 가져오기
  const fetchExamplePresets = useCallback(async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetExamplePresets);
      if (result.success) {
        setExamplePresets(result.presets);
      } else {
        showSnackbar(`프리셋 목록 불러오기 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('프리셋 불러오기 중 오류 발생:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      showSnackbar(`프리셋 목록 불러오기 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }, [showSnackbar]);

  // 컴포넌트 마운트 시 예제 프리셋 목록 가져오기
  useEffect(() => {
    fetchExamplePresets();
  }, [fetchExamplePresets]);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        번역 예제 프리셋
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="example-preset-minimal-label">예제 프리셋 선택</InputLabel>
          <Select
            labelId="example-preset-minimal-label"
            id="example-preset-minimal"
            value={currentPresetName}
            onChange={onPresetChange}
            label="예제 프리셋 선택"
            disabled={isTranslating || isPresetLoading || examplePresets.length === 0} // 프리셋 없거나 로딩 중일 때 비활성화
          >
            {/* 로딩 중이 아닐 때만 메뉴 아이템 표시 */}
            {!isPresetLoading && examplePresets.length === 0 && (
              <MenuItem value="" disabled>
                사용 가능한 프리셋 없음
              </MenuItem>
            )}
            {!isPresetLoading &&
              examplePresets.map((preset) => (
                <MenuItem key={preset.id} value={preset.name}>
                  <Tooltip title={preset.description || ''} placement="right">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography>{preset.name}</Typography>
                    </Box>
                  </Tooltip>
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

export default ExamplePresetSelectorMinimal;
