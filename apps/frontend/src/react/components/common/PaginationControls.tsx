import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, MenuItem, Pagination, Stack, TextField, Typography } from '@mui/material';

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  itemsPerPageOptions: number[];
  isCustomPerPageMode: boolean;
  customItemsPerPage: string;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: string) => void;
  onCustomItemsPerPageChange: (value: string) => void;
  onCustomItemsPerPageKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onApplyCustomItemsPerPage: () => void;
  itemsPerPageLabel?: string;
  goToPageLabel?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  itemsPerPageOptions,
  isCustomPerPageMode,
  customItemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onCustomItemsPerPageChange,
  onCustomItemsPerPageKeyDown,
  onApplyCustomItemsPerPage,
  itemsPerPageLabel,
  goToPageLabel,
}) => {
  const { t } = useTranslation();
  const totalPages = React.useMemo(() => {
    if (itemsPerPage <= 0) {
      return 1;
    }
    const pages = Math.ceil(totalItems / itemsPerPage);
    return pages > 0 ? pages : 1;
  }, [itemsPerPage, totalItems]);

  const [pageInput, setPageInput] = React.useState('');

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setPageInput(totalPages.toString());
    }
  }, [currentPage, totalPages]);

  const handleCustomInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onCustomItemsPerPageChange(event.target.value);
  };

  const handleGoToPage = React.useCallback(() => {
    if (!pageInput.trim()) {
      return;
    }

    const parsed = Number(pageInput);
    if (Number.isNaN(parsed)) {
      return;
    }

    const clamped = Math.min(Math.max(parsed, 1), totalPages);
    if (clamped !== currentPage) {
      onPageChange(clamped);
    }
    setPageInput('');
  }, [currentPage, onPageChange, pageInput, setPageInput, totalPages]);

  const handlePaginationChange = (_: React.ChangeEvent<unknown>, page: number) => {
    if (page !== currentPage) {
      onPageChange(page);
    }
    setPageInput('');
  };

  return (
    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      spacing={2}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', lg: 'center' }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <TextField
          select
          size="small"
          label={itemsPerPageLabel || t('pagination.itemsPerPage')}
          value={isCustomPerPageMode ? 'custom' : itemsPerPage.toString()}
          onChange={(event) => onItemsPerPageChange(event.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 220 } }}
        >
          {itemsPerPageOptions.map((option) => (
            <MenuItem key={option} value={option.toString()}>
              {option}
            </MenuItem>
          ))}
          <MenuItem value="custom">{t('pagination.custom')}</MenuItem>
        </TextField>

        {isCustomPerPageMode && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              type="number"
              label={t('pagination.enterItemsPerPage')}
              size="small"
              inputProps={{ min: 1 }}
              value={customItemsPerPage}
              onChange={handleCustomInputChange}
              onKeyDown={(event) => {
                if (onCustomItemsPerPageKeyDown) {
                  onCustomItemsPerPageKeyDown(
                    event as unknown as React.KeyboardEvent<HTMLInputElement>
                  );
                }
              }}
              sx={{ minWidth: { xs: '100%', sm: 160 } }}
            />
            <Button
              variant="contained"
              onClick={() => {
                onApplyCustomItemsPerPage();
              }}
            >
              {t('pagination.apply')}
            </Button>
          </Stack>
        )}
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="flex-end"
      >
        <Typography variant="body2" color="text.secondary">
          {t('pagination.totalItems', { totalItems: totalItems.toLocaleString() })}
        </Typography>
        <Pagination
          count={totalPages}
          page={Math.min(currentPage, totalPages)}
          onChange={handlePaginationChange}
          showFirstButton
          showLastButton
          color="primary"
          siblingCount={1}
          boundaryCount={1}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            type="number"
            size="small"
            label={goToPageLabel || t('pagination.goToPage')}
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleGoToPage();
              }
            }}
            inputProps={{ min: 1, max: totalPages }}
            sx={{ width: 120 }}
          />
          <Button variant="outlined" size="small" onClick={handleGoToPage}>
            {t('pagination.go')}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default PaginationControls;
