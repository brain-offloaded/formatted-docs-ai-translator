import React, { useCallback, useState, useMemo, useEffect } from 'react'; // 중복 제거 및 useEffect 유지
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Snackbar,
  // SelectChangeEvent, // 여기서 제거
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select'; // 올바른 경로에서 import
import { TranslationType, useTranslation } from '../contexts/TranslationContext';
import { ConfigStore } from '../config/config-store'; // ConfigStore 추가
import { IpcChannel } from '../../nest/common/ipc.channel'; // IpcChannel 추가
import {
  getTranslatorWithOptions,
  getTranslationTypeLabel,
} from '../constants/TranslationTypeMapping';
// import ExamplePresetSelector from './translation/ExamplePresetSelector'; // 기존 컴포넌트 주석 처리 또는 삭제
import ExamplePresetSelectorMinimal from './translation/ExamplePresetSelectorMinimal'; // 새 컴포넌트 import
import TranslationTypeSelector from './common/TranslationTypeSelector';
import { BaseParseOptionsDto } from '@/nest/parser/dto/options/base-parse-options.dto';
import { ExamplePresetDto } from '@/nest/translation/example/dto/example-preset.dto'; // ExamplePresetDto 추가

export default function TranslationPanel(): React.ReactElement {
  // Context에서 상태와 함수 가져오기 - 필요한 것만 선택적으로 가져옵니다
  const {
    translationType,
    setTranslationType,
    handleClearFiles,
    uiState,
    setResultState,
    isTranslating,
    showSnackbar, // showSnackbar 추가
  } = useTranslation();
  const configStore = ConfigStore.getInstance(); // ConfigStore 인스턴스
  // 예제 프리셋 상태 추가
  const [currentPresetName, setCurrentPresetName] = useState<string>('');
  const [isPresetLoading, setIsPresetLoading] = useState(false);

  // 옵션 상태 관리
  const [parserOptions, setParserOptions] = useState<BaseParseOptionsDto | null>(null);
  // 설정 패널 표시 여부 상태 관리
  const [showSettings, setShowSettings] = useState(false);

  // 초기 프리셋 로드 로직 (ExamplePresetSelector에서 이동)
  useEffect(() => {
    const loadInitialPreset = async () => {
      try {
        setIsPresetLoading(true);
        const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetExamplePresets);
        if (result.success && result.presets.length > 0) {
          const presets: ExamplePresetDto[] = result.presets;
          const config = configStore.getConfig();
          const savedPresetName = config.lastPresetName || result.currentPreset;
          const presetExists = presets.some((preset) => preset.name === savedPresetName);
          const targetPresetName = presetExists ? savedPresetName : presets[0].name;

          setCurrentPresetName(targetPresetName);

          // 백엔드의 현재 프리셋과 다르면 로드 요청
          if (targetPresetName !== result.currentPreset) {
            const loadResult = await window.electron.ipcRenderer.invoke(
              IpcChannel.LoadExamplePreset,
              { name: targetPresetName }
            );
            if (!loadResult.success) {
              console.warn(`초기 프리셋(${targetPresetName}) 로드 실패:`, loadResult.message);
              // 실패 시 사용자에게 알림 (선택적)
              // showSnackbar(`프리셋 '${targetPresetName}' 로드 실패: ${loadResult.message}`);
            } else {
              // 성공 시 설정 저장
              configStore.updateConfig({ lastPresetName: targetPresetName });
            }
          } else {
            // 이미 백엔드에 로드된 프리셋이면 설정만 업데이트
            configStore.updateConfig({ lastPresetName: targetPresetName });
          }
        } else if (!result.success) {
          showSnackbar(`초기 프리셋 목록 불러오기 실패: ${result.message}`);
        }
        // 프리셋이 없는 경우는 MinimalSelector 내부에서 처리
      } catch (error) {
        console.error('초기 프리셋 로드 중 오류 발생:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        showSnackbar(`초기 프리셋 로드 중 오류가 발생했습니다: ${errorMessage}`);
      } finally {
        setIsPresetLoading(false);
      }
    };

    // 컴포넌트 마운트 시 한 번만 실행
    if (!currentPresetName) {
      loadInitialPreset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 최초 마운트 시에만 실행

  // 옵션 변경 핸들러 - 메모이제이션
  const handleOptionsChange = useCallback((options: BaseParseOptionsDto) => {
    setParserOptions((prevOptions) => {
      // 이전 옵션과 새 옵션이 동일하면 상태 업데이트 방지
      if (JSON.stringify(prevOptions) === JSON.stringify(options)) {
        return prevOptions;
      }
      return options;
    });
  }, []);

  // 설정 토글 핸들러 - 메모이제이션
  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  // 번역 타입 변경 핸들러 - 메모이제이션
  const handleTranslationTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newType = e.target.value as TranslationType;
      if (newType === translationType) return; // 변경이 없으면 처리하지 않음

      setTranslationType(newType);
      // 파일 선택 초기화
      handleClearFiles();
      // 결과 초기화
      setResultState({
        translationResult: null,
        zipBlob: null,
        singleFileBlob: null,
        singleFileName: null,
      });
      // 옵션 초기화
      setParserOptions(null);
      // 설정 패널도 초기화
      setShowSettings(false);
    },
    [setTranslationType, handleClearFiles, setResultState, translationType]
  );

  // 예제 프리셋 변경 핸들러 (ExamplePresetSelector에서 이동)
  const handlePresetChange = useCallback(
    async (event: SelectChangeEvent<string>) => {
      const newPresetName = event.target.value;
      if (newPresetName === currentPresetName) return; // 변경 없으면 중단

      try {
        setIsPresetLoading(true);
        const result = await window.electron.ipcRenderer.invoke(IpcChannel.LoadExamplePreset, {
          name: newPresetName,
        });

        if (result.success) {
          setCurrentPresetName(newPresetName);
          configStore.updateConfig({ lastPresetName: newPresetName }); // 설정 저장
          showSnackbar(`'${newPresetName}' 프리셋을 로드했습니다.`);
        } else {
          showSnackbar(`프리셋 로드 실패: ${result.message}`);
          // 실패 시 이전 값으로 되돌릴 수 있음 (선택적)
          // setCurrentPresetName(currentPresetName);
        }
      } catch (error) {
        console.error('프리셋 로드 중 오류 발생:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        showSnackbar(`프리셋 로드 중 오류가 발생했습니다: ${errorMessage}`);
      } finally {
        setIsPresetLoading(false);
      }
    },
    [showSnackbar, configStore, currentPresetName] // currentPresetName 추가
  );

  // TranslationType에 따라 적절한 컴포넌트 가져오기 - 메모이제이션
  const { TranslatorComponent, OptionComponent } = useMemo(
    () => getTranslatorWithOptions<typeof translationType>(translationType),
    [translationType]
  );

  // 번역 타입 라벨 - 메모이제이션
  const translationTypeLabel = useMemo(
    () => getTranslationTypeLabel(translationType),
    [translationType]
  );

  return (
    <Box sx={{ position: 'relative' }}>
      <Card sx={{ borderRadius: '12px', p: 2 }}>
        <CardContent>
          <Typography variant="h6" mb={2} fontWeight="medium">
            {translationTypeLabel}
          </Typography>
          <Divider sx={{ my: 2 }} />

          {/* 프리셋 선택기 (새 컴포넌트로 교체 및 props 전달) */}
          <ExamplePresetSelectorMinimal
            currentPresetName={currentPresetName}
            onPresetChange={handlePresetChange}
            isTranslating={isTranslating}
            isPresetLoading={isPresetLoading}
            setIsPresetLoading={setIsPresetLoading} // 로딩 상태 설정 함수 전달
          />

          {/* 번역 유형 선택 */}
          <Box sx={{ mb: 2 }}>
            <TranslationTypeSelector
              selectedType={translationType}
              onChange={handleTranslationTypeChange}
            />

            {/* 옵션 컴포넌트 렌더링 */}
            {OptionComponent && (
              <OptionComponent
                isTranslating={isTranslating}
                onOptionsChange={handleOptionsChange}
                initialOptions={parserOptions || undefined}
                translationType={translationType}
                label={translationTypeLabel + ' 옵션'}
                showSettings={showSettings}
                onToggleSettings={toggleSettings}
              />
            )}

            {/* 번역기 컴포넌트 렌더링 - 옵션은 props로 전달 */}
            <TranslatorComponent key={translationType} parserOptions={parserOptions} />
          </Box>
        </CardContent>
      </Card>
      <Snackbar
        open={uiState.snackbarOpen}
        autoHideDuration={4000}
        message={uiState.snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
