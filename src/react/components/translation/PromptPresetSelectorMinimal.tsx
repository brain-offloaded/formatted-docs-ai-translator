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
import { SelectChangeEvent } from '@mui/material/Select';
import { IpcChannel } from '../../../nest/common/ipc.channel';
import { PromptPresetDto } from '@/nest/translation/prompt/dto/prompt-preset.dto'; // PromptPresetDto import
import { PromptPresetDetailDto } from '@/nest/translation/prompt/dto/prompt-preset-detail.dto'; // PromptPresetDetailDto import
import { useTranslation } from '../../contexts/TranslationContext';

interface PromptPresetSelectorMinimalProps {
  currentPresetName: string;
  onPresetChange: (presetName: string, presetContent: string | undefined) => void; // 변경된 핸들러 시그니처
  isTranslating: boolean;
  isPresetLoading: boolean;
  setIsPresetLoading: (loading: boolean) => void;
}

const PromptPresetSelectorMinimal: React.FC<PromptPresetSelectorMinimalProps> = ({
  currentPresetName,
  onPresetChange,
  isTranslating,
  isPresetLoading,
  setIsPresetLoading,
}) => {
  const [promptPresets, setPromptPresets] = useState<PromptPresetDto[]>([]);
  const { showSnackbar } = useTranslation();

  // 프롬프트 프리셋 목록 가져오기
  const fetchPromptPresets = useCallback(async () => {
    try {
      setIsPresetLoading(true);
      const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetPromptPresets);
      if (result.success) {
        setPromptPresets(result.presets);
        // 초기 프리셋 설정 로직은 상위 컴포넌트(TranslationPanel)에서 처리
      } else {
        showSnackbar(`프롬프트 프리셋 목록 불러오기 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('프롬프트 프리셋 불러오기 중 오류 발생:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      showSnackbar(`프롬프트 프리셋 목록 불러오기 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setIsPresetLoading(false);
    }
  }, [setIsPresetLoading, showSnackbar]);

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
          // 프리셋을 찾지 못한 경우 오류 처리
          showSnackbar(`프리셋 '${newPresetName}'을(를) 찾을 수 없습니다.`);
          onPresetChange('', undefined); // 상태 초기화
          setIsPresetLoading(false);
          return;
        }

        // 선택된 프리셋의 상세 정보 가져오기
        const result = await window.electron.ipcRenderer.invoke(
          IpcChannel.GetPromptPresetDetail,
          { id: selectedPreset.id } // 찾은 프리셋의 ID 사용
        );

        if (result.success && result.preset) {
          onPresetChange(newPresetName, result.preset.prompt); // 부모 컴포넌트로 이름과 내용 전달
          showSnackbar(`'${newPresetName}' 프롬프트 프리셋을 로드했습니다.`);
        } else {
          showSnackbar(`프롬프트 프리셋 상세 정보 로드 실패: ${result.message}`);
          // 실패 시 이전 값으로 되돌릴 수 있음 (선택적)
          // onPresetChange(currentPresetName, undefined); // 이전 상태 유지 또는 초기화
        }
      } catch (error) {
        console.error('프롬프트 프리셋 상세 정보 로드 중 오류 발생:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        showSnackbar(`프롬프트 프리셋 상세 정보 로드 중 오류가 발생했습니다: ${errorMessage}`);
      } finally {
        setIsPresetLoading(false);
      }
    },
    [currentPresetName, onPresetChange, promptPresets, showSnackbar, setIsPresetLoading]
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
