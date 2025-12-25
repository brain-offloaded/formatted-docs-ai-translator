import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import JSZip from 'jszip';
import { useTranslation as useI18n } from 'react-i18next';
import {
  TranslationType,
  useTranslation as useTranslationContext,
} from '@/react/contexts/TranslationContext';
import FileUploader from '@/react/components/common/FileUploader';
import TranslationProgress from '@/react/components/common/TranslationProgress';
import TranslationError from '@/react/components/common/TranslationError';
import TranslationTypeSelector from '@/react/components/common/TranslationTypeSelector';
import { ParseOptionsFactory } from '@/react/factories/ParseOptionsFactory';
import { TranslatorFactory } from '@/react/factories/TranslatorFactory';
import { useOptionsPanel } from '@/react/views/TranslateView/hooks/useOptionsPanel';
import type { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';
import { translationStrategyFactory } from '@/react/factories/translation-strategy-factory';
import { TranslationInput } from '@/react/unified/domain/translation-input';
import { normalizeLineEndings } from '@/react/unified/parser/utils/normalize-line-endings';
import { useFileDownloader } from '@/react/hooks/translator/useFileDownloader';
import { useConfigStore } from '@/react/config/config-store';
import type { AiTranslatorConfig } from '@/react/types/config';
import type { TranslationUnit } from '@/react/unified/domain/translation-unit';

type ProgressState = {
  total: number;
  completed: number;
  failed: number;
  message?: string;
};

type ResultState = {
  message: string;
  isError: boolean;
  download?: {
    blob: Blob;
    fileName: string;
  };
};

type ExchangeMetadataUnit = {
  key: string;
  file: string;
  meta: Record<string, unknown>;
};

type ExchangeMetadata = {
  formatVersion: number;
  parserId: string;
  units: ExchangeMetadataUnit[];
};

const supportedTypes = [
  TranslationType.Text,
  TranslationType.Json,
  TranslationType.Csv,
  TranslationType.Subtitle,
];

const createEmptyProgress = (): ProgressState => ({
  total: 0,
  completed: 0,
  failed: 0,
});

const ParserApplierView: React.FC = () => {
  const { t } = useI18n();
  const { showSnackbar } = useTranslationContext();

  const modelProvider = useConfigStore((state) => state.modelProvider);
  const sourceLanguage = useConfigStore((state) => state.sourceLanguage);
  const targetLanguage = useConfigStore((state) => state.targetLanguage);
  const customModelConfig = useConfigStore((state) => state.customModelConfig);
  const apiKey = useConfigStore((state) => state.apiKey);
  const baseUrl = useConfigStore((state) => state.baseUrl);
  const cacheTag = useConfigStore((state) => state.cacheTag);
  const beginnerModeEnabled = useConfigStore((state) => state.beginnerModeEnabled);
  const lastPresetName = useConfigStore((state) => state.lastPresetName);
  const selectedModelPresetId = useConfigStore((state) => state.selectedModelPresetId);
  const useThinking = useConfigStore((state) => state.useThinking);
  const thinkingLevel = useConfigStore((state) => state.thinkingLevel);
  const thinkingBudget = useConfigStore((state) => state.thinkingBudget);
  const setThinkingBudget = useConfigStore((state) => state.setThinkingBudget);
  const providerSettings = useConfigStore((state) => state.providerSettings);

  const aiConfig = useMemo<AiTranslatorConfig>(
    () => ({
      modelProvider,
      sourceLanguage,
      targetLanguage,
      customModelConfig,
      apiKey,
      baseUrl,
      cacheTag,
      beginnerModeEnabled,
      lastPresetName,
      selectedModelPresetId,
      useThinking,
      thinkingLevel,
      thinkingBudget,
      setThinkingBudget,
      providerSettings,
    }),
    [
      apiKey,
      baseUrl,
      beginnerModeEnabled,
      cacheTag,
      customModelConfig,
      lastPresetName,
      modelProvider,
      providerSettings,
      selectedModelPresetId,
      setThinkingBudget,
      sourceLanguage,
      targetLanguage,
      thinkingBudget,
      thinkingLevel,
      useThinking,
    ]
  );

  const downloadFile = useFileDownloader(showSnackbar);

  const [parseType, setParseType] = useState<TranslationType>(TranslationType.Text);
  const [parseOptions, setParseOptions] = useState<BaseParseOptionsDto | null>(null);
  const [parseFiles, setParseFiles] = useState<File[] | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState<ProgressState>(createEmptyProgress());
  const [parseResult, setParseResult] = useState<ResultState | null>(null);

  const [applyType, setApplyType] = useState<TranslationType>(TranslationType.Text);
  const [applyOptions, setApplyOptions] = useState<BaseParseOptionsDto | null>(null);
  const [applyZipFiles, setApplyZipFiles] = useState<File[] | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyProgress, setApplyProgress] = useState<ProgressState>(createEmptyProgress());
  const [applyResult, setApplyResult] = useState<ResultState | null>(null);

  const parseOptionsPanel = useOptionsPanel();
  const applyOptionsPanel = useOptionsPanel();

  const ParseOptionComponent = useMemo(
    () => ParseOptionsFactory.createParseOptions(parseType),
    [parseType]
  );
  const ApplyOptionComponent = useMemo(
    () => ParseOptionsFactory.createParseOptions(applyType),
    [applyType]
  );

  const parseTranslatorConfig = useMemo(() => TranslatorFactory.getConfig(parseType), [parseType]);

  const handleParseTypeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setParseType(event.target.value as TranslationType);
      setParseOptions(null);
      setParseResult(null);
      parseOptionsPanel.resetSettingsVisibility();
    },
    [parseOptionsPanel]
  );

  const handleApplyTypeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setApplyType(event.target.value as TranslationType);
      setApplyOptions(null);
      setApplyResult(null);
      applyOptionsPanel.resetSettingsVisibility();
    },
    [applyOptionsPanel]
  );

  const handleParseOptionsChange = useCallback((options: BaseParseOptionsDto) => {
    setParseOptions({ ...options, isFile: true });
  }, []);

  const handleApplyOptionsChange = useCallback((options: BaseParseOptionsDto) => {
    setApplyOptions({ ...options, isFile: true });
  }, []);

  const handleParseFilesChange = useCallback((files: File[] | null) => {
    setParseFiles(files);
    setParseResult(null);
  }, []);

  const handleApplyZipChange = useCallback((files: File[] | null) => {
    setApplyZipFiles(files);
    setApplyResult(null);
  }, []);

  const handleDownload = useCallback(
    (result: ResultState | null) => {
      if (!result?.download) return;
      downloadFile(result.download.blob, result.download.fileName);
    },
    [downloadFile]
  );

  const handleParse = useCallback(async () => {
    if (isParsing) return;
    const files = parseFiles ?? [];

    if (!parseOptions) {
      setParseResult({ message: t('parserApplier.errors.missingOptions'), isError: true });
      return;
    }

    if (files.length === 0) {
      setParseResult({ message: t('parserApplier.errors.missingFiles'), isError: true });
      return;
    }

    setParseResult(null);
    setIsParsing(true);
    setParseProgress({
      total: files.length,
      completed: 0,
      failed: 0,
      message: t('parserApplier.parse.progress'),
    });

    try {
      const strategy = translationStrategyFactory.create(parseType);
      const zip = new JSZip();
      const metadataUnits: ExchangeMetadataUnit[] = [];
      const sourceLines: string[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const input = new TranslationInput(file, parseOptions, aiConfig);
        const parsed = await strategy.parser.parse(input);

        parsed.forEach((unit) => {
          metadataUnits.push({
            key: unit.key,
            file: file.name,
            meta: {},
          });
          sourceLines.push(unit.source ?? '');
        });

        zip.file(`original_files/${file.name}`, file);
        setParseProgress((prev) => ({
          ...prev,
          completed: index + 1,
        }));
      }

      const metadata: ExchangeMetadata = {
        formatVersion: 1,
        parserId: parseType,
        units: metadataUnits,
      };

      zip.file('source.txt', sourceLines.join('\n'));
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      setParseResult({
        message: t('parserApplier.parse.done', {
          fileCount: files.length,
          lineCount: sourceLines.length,
        }),
        isError: false,
        download: {
          blob,
          fileName: 'parser_exchange.zip',
        },
      });
    } catch (error) {
      setParseResult({
        message: t('parserApplier.errors.parseFailed', {
          message: (error as Error).message,
        }),
        isError: true,
      });
    } finally {
      setIsParsing(false);
      setParseProgress((prev) => ({ ...prev, message: t('parserApplier.parse.completed') }));
    }
  }, [aiConfig, isParsing, parseFiles, parseOptions, parseType, t]);

  const handleApply = useCallback(async () => {
    if (isApplying) return;

    const zipFile = applyZipFiles?.[0];
    if (!zipFile) {
      setApplyResult({ message: t('parserApplier.errors.missingZip'), isError: true });
      return;
    }

    if (!applyOptions) {
      setApplyResult({ message: t('parserApplier.errors.missingOptions'), isError: true });
      return;
    }

    setApplyResult(null);
    setIsApplying(true);
    setApplyProgress({
      total: 0,
      completed: 0,
      failed: 0,
      message: t('parserApplier.apply.progress'),
    });

    try {
      const zip = await JSZip.loadAsync(zipFile);
      const sourceEntry = zip.file('source.txt');
      const targetEntry = zip.file('target.txt');
      const metadataEntry = zip.file('metadata.json');

      if (!sourceEntry || !targetEntry || !metadataEntry) {
        throw new Error(t('parserApplier.errors.missingRequiredFiles'));
      }

      const [sourceText, targetText, metadataText] = await Promise.all([
        sourceEntry.async('text'),
        targetEntry.async('text'),
        metadataEntry.async('text'),
      ]);

      const metadata = JSON.parse(metadataText) as ExchangeMetadata;
      if (metadata.formatVersion !== 1 || !metadata.parserId || !Array.isArray(metadata.units)) {
        throw new Error(t('parserApplier.errors.invalidMetadata'));
      }

      if (metadata.parserId !== applyType) {
        throw new Error(
          t('parserApplier.errors.parserIdMismatch', {
            expected: applyType,
            actual: metadata.parserId,
          })
        );
      }

      const sourceLines = normalizeLineEndings(sourceText).split('\n');
      const targetLines = normalizeLineEndings(targetText).split('\n');

      if (sourceLines.length !== targetLines.length) {
        throw new Error(
          t('parserApplier.errors.lineCountMismatch', {
            sourceCount: sourceLines.length,
            targetCount: targetLines.length,
          })
        );
      }

      if (metadata.units.length !== sourceLines.length) {
        throw new Error(
          t('parserApplier.errors.metadataLineMismatch', {
            unitCount: metadata.units.length,
            sourceCount: sourceLines.length,
          })
        );
      }

      const unitsByFile = new Map<string, TranslationUnit[]>();
      metadata.units.forEach((unit, index) => {
        const list = unitsByFile.get(unit.file) ?? [];
        list.push({
          key: unit.key,
          source: sourceLines[index] ?? '',
          target: targetLines[index] ?? '',
        });
        unitsByFile.set(unit.file, list);
      });

      const originalEntries = Object.values(zip.files).filter(
        (entry) => entry.name.startsWith('original_files/') && !entry.dir
      );

      if (originalEntries.length === 0) {
        throw new Error(t('parserApplier.errors.missingOriginalFiles'));
      }

      setApplyProgress((prev) => ({ ...prev, total: originalEntries.length }));

      const strategy = translationStrategyFactory.create(applyType);
      const outputZip = new JSZip();
      let failureCount = 0;

      for (let index = 0; index < originalEntries.length; index += 1) {
        const entry = originalEntries[index];
        const relativePath = entry.name.replace(/^original_files\//, '');
        const blob = await entry.async('blob');
        const fileUnits = unitsByFile.get(relativePath) ?? [];

        if (fileUnits.length === 0) {
          outputZip.file(relativePath, blob);
        } else {
          const originalFile = new File([blob], relativePath);
          const input = new TranslationInput(originalFile, applyOptions, aiConfig);
          const output = await strategy.applier.apply(input, fileUnits);
          output.getResults().forEach((result) => {
            if (result.success && result.result) {
              const resultBlob =
                typeof result.result === 'string'
                  ? new Blob([result.result], { type: 'text/plain' })
                  : result.result;
              outputZip.file(result.name, resultBlob);
            } else {
              failureCount += 1;
            }
          });
        }

        setApplyProgress((prev) => ({
          ...prev,
          completed: index + 1,
          failed: failureCount,
        }));
      }

      const outputBlob = await outputZip.generateAsync({ type: 'blob' });
      const resultMessage =
        failureCount > 0
          ? t('parserApplier.apply.doneWithFailures', { failCount: failureCount })
          : t('parserApplier.apply.done');

      setApplyResult({
        message: resultMessage,
        isError: false,
        download: {
          blob: outputBlob,
          fileName: 'applied_files.zip',
        },
      });
    } catch (error) {
      setApplyResult({
        message: t('parserApplier.errors.applyFailed', {
          message: (error as Error).message,
        }),
        isError: true,
      });
    } finally {
      setIsApplying(false);
      setApplyProgress((prev) => ({ ...prev, message: t('parserApplier.apply.completed') }));
    }
  }, [aiConfig, applyOptions, applyType, applyZipFiles, isApplying, t]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card sx={{ borderRadius: '12px', p: 2 }}>
        <CardContent>
          <Typography variant="h6" mb={1} fontWeight="medium">
            {t('parserApplier.parse.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('parserApplier.parse.description')}
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" mb={1}>
                {t('parserApplier.common.formatLabel')}
              </Typography>
              <TranslationTypeSelector
                selectedType={parseType}
                onChange={handleParseTypeChange}
                availableTypes={supportedTypes}
              />
            </Box>

            {ParseOptionComponent && (
              <ParseOptionComponent
                isTranslating={isParsing}
                onOptionsChange={handleParseOptionsChange}
                initialOptions={parseOptions ?? undefined}
                translationType={parseType}
                showSettings={parseOptionsPanel.showSettings}
                onToggleSettings={parseOptionsPanel.toggleSettings}
                showFileToggle={false}
              />
            )}

            <FileUploader
              isDisabled={isParsing}
              selectedFiles={parseFiles}
              onFileChange={handleParseFilesChange}
              onClearFiles={() => handleParseFilesChange(null)}
              fileExtension={parseTranslatorConfig?.options.fileExtension}
              label={parseTranslatorConfig?.options.fileLabel || t('parserApplier.parse.fileLabel')}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleParse}
              disabled={isParsing}
              sx={{ alignSelf: 'center', minWidth: 200 }}
            >
              {t('parserApplier.parse.action')}
            </Button>

            {isParsing && (
              <TranslationProgress
                completed={parseProgress.completed}
                total={parseProgress.total}
                failed={parseProgress.failed}
                message={parseProgress.message}
              />
            )}

            {parseResult && parseResult.isError && <TranslationError error={parseResult.message} />}

            {parseResult && !parseResult.isError && (
              <Alert
                severity="success"
                action={
                  parseResult.download ? (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => handleDownload(parseResult)}
                    >
                      {t('parserApplier.common.download')}
                    </Button>
                  ) : undefined
                }
              >
                {parseResult.message}
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: '12px', p: 2 }}>
        <CardContent>
          <Typography variant="h6" mb={1} fontWeight="medium">
            {t('parserApplier.apply.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('parserApplier.apply.description')}
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" mb={1}>
                {t('parserApplier.common.formatLabel')}
              </Typography>
              <TranslationTypeSelector
                selectedType={applyType}
                onChange={handleApplyTypeChange}
                availableTypes={supportedTypes}
              />
            </Box>

            {ApplyOptionComponent && (
              <ApplyOptionComponent
                isTranslating={isApplying}
                onOptionsChange={handleApplyOptionsChange}
                initialOptions={applyOptions ?? undefined}
                translationType={applyType}
                showSettings={applyOptionsPanel.showSettings}
                onToggleSettings={applyOptionsPanel.toggleSettings}
                showFileToggle={false}
              />
            )}

            <FileUploader
              isDisabled={isApplying}
              selectedFiles={applyZipFiles}
              onFileChange={handleApplyZipChange}
              onClearFiles={() => handleApplyZipChange(null)}
              fileExtension=".zip"
              label={t('parserApplier.apply.zipLabel')}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleApply}
              disabled={isApplying}
              sx={{ alignSelf: 'center', minWidth: 200 }}
            >
              {t('parserApplier.apply.action')}
            </Button>

            {isApplying && (
              <TranslationProgress
                completed={applyProgress.completed}
                total={applyProgress.total}
                failed={applyProgress.failed}
                message={applyProgress.message}
              />
            )}

            {applyResult && applyResult.isError && <TranslationError error={applyResult.message} />}

            {applyResult && !applyResult.isError && (
              <Alert
                severity="success"
                action={
                  applyResult.download ? (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => handleDownload(applyResult)}
                    >
                      {t('parserApplier.common.download')}
                    </Button>
                  ) : undefined
                }
              >
                {applyResult.message}
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ParserApplierView;
