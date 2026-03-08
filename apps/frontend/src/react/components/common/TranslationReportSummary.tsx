import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import StorageIcon from '@mui/icons-material/Storage';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { TranslationResultState } from '@/react/contexts/TranslationContext';

type TranslationReport = NonNullable<TranslationResultState['report']>;

interface TranslationReportSummaryProps {
  report: TranslationReport;
  isError?: boolean;
  /**
   * 헤더 우측에 표시할 액션 버튼 영역
   */
  headerActions?: React.ReactNode;
  /**
   * 실패 항목에도 추가적인 액션을 노출해야 할 때 사용
   */
  renderFailureAction?: (item: TranslationReport['items'][number]) => React.ReactNode;
}

const TranslationReportSummary: React.FC<TranslationReportSummaryProps> = ({
  report,
  isError = false,
  headerActions,
  renderFailureAction,
}) => {
  const { t } = useTranslation();
  const sortedItems = React.useMemo(() => {
    return [...report.items].sort((a, b) => {
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [report.items]);

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium">
          {t('translationReport.title')}
        </Typography>
        {headerActions && <Box sx={{ display: 'flex', gap: 1 }}>{headerActions}</Box>}
      </Box>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mr: 2 }}>
                {isError ? t('translationReport.fail') : t('translationReport.completed')}
              </Typography>
              <Chip
                label={t('translationReport.successRate', { rate: report.successRate })}
                color={isError ? 'error' : report.successRate >= 80 ? 'success' : 'warning'}
                variant="filled"
                size="small"
              />
            </Box>

            {isError && report.errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {report.errorMessage}
              </Alert>
            )}

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InsertDriveFileIcon color="primary" fontSize="small" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t('translationReport.totalFiles')}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {t('translationReport.filesWithUnit', { count: report.total })}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t('translationReport.success')}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {t('translationReport.filesWithUnit', { count: report.success })}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorIcon color="error" fontSize="small" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t('translationReport.fail')}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="error.main">
                      {t('translationReport.filesWithUnit', { count: report.fail })}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {typeof report.processingTime === 'number' && (
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon color="primary" fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('translationReport.processingTime')}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {t('translationReport.processingTimeWithUnit', {
                          seconds: (report.processingTime / 1000).toFixed(1),
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {typeof report.totalSize === 'number' && (
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon color="primary" fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('translationReport.totalSize')}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {t('translationReport.sizeInMB', {
                          size: (report.totalSize / 1024 / 1024).toFixed(1),
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>

            <Grid container spacing={2}>
              {/* {report.items.map((item) => ( */}
              {sortedItems.map((item) => (
                <Grid item xs={12} md={6} key={item.name}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderColor: item.success ? 'success.main' : 'error.main',
                      borderWidth: 2,
                      bgcolor: item.success
                        ? 'rgba(102, 187, 106, 0.08)'
                        : 'rgba(255, 82, 82, 0.08)',
                      '&:hover': {
                        boxShadow: 2,
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {item.success ? (
                          <CheckCircleIcon color="success" fontSize="medium" sx={{ mr: 1 }} />
                        ) : (
                          <ErrorIcon color="error" fontSize="medium" sx={{ mr: 1 }} />
                        )}
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            color: item.success ? 'success.dark' : 'error.dark',
                          }}
                        >
                          {item.name}
                        </Typography>
                      </Box>
                      {!item.success && item.errorMessage && (
                        <Box
                          sx={{
                            mt: 1,
                            p: 1,
                            bgcolor: 'rgba(255, 82, 82, 0.12)',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'error.light',
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="error.dark"
                            sx={{ whiteSpace: 'pre-wrap' }}
                          >
                            {item.errorMessage}
                          </Typography>
                          {renderFailureAction && (
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {renderFailureAction(item)}
                            </Box>
                          )}
                        </Box>
                      )}
                      {item.success && (
                        <Typography variant="body2" color="success.dark" sx={{ fontWeight: 500 }}>
                          {t('translationReport.translationSuccess')}
                        </Typography>
                      )}
                      {item.fileSize && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {t('translationReport.sizeInKB', {
                            size: (item.fileSize / 1024).toFixed(1),
                          })}
                        </Typography>
                      )}
                      {item.processingTime && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          {t('translationReport.itemProcessingTimeWithUnit', {
                            seconds: (item.processingTime / 1000).toFixed(1),
                          })}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TranslationReportSummary;
