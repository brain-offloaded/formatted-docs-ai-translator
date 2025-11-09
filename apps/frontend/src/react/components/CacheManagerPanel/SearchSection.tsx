import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateForInput } from '../../utils/dateUtils';
import {
  Autocomplete,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  SelectChangeEvent,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { CacheSearchType } from '@apps/common/dist/types/common';
import type { CacheSearchParams } from '@/react/views/CacheView/hooks/cacheManager.types';
import type { CacheTagSummaryDto } from '@/react/api/generated';

interface SearchSectionProps {
  searchParams: CacheSearchParams;
  onSearchParamChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>, dateType: 'startDate' | 'endDate') => void;
  onSearch: () => void;
  searchButtonRef: React.RefObject<HTMLButtonElement | null>;
  cacheTags: CacheTagSummaryDto[];
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  searchParams,
  onSearchParamChange,
  onDateChange,
  onSearch,
  searchButtonRef,
  cacheTags,
}) => {
  const { t } = useTranslation();

  const handleSelectChange = (event: SelectChangeEvent) => {
    const syntheticEvent = {
      target: {
        name: event.target.name,
        value: event.target.value,
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    onSearchParamChange(syntheticEvent);
  };

  const getPlaceholder = () => {
    switch (searchParams.searchType) {
      case CacheSearchType.CACHE_TAG:
        return t('cacheManager.search.placeholder.cacheTag');
      case CacheSearchType.SOURCE:
        return t('cacheManager.search.placeholder.source');
      case CacheSearchType.TARGET:
        return t('cacheManager.search.placeholder.target');
      case CacheSearchType.FILE_NAME:
        return t('cacheManager.search.placeholder.fileName');
      case CacheSearchType.FILE_PATH:
        return t('cacheManager.search.placeholder.filePath');
      default:
        return t('cacheManager.search.placeholder.default');
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'flex-end' }}
      >
        <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }} size="small">
          <InputLabel id="search-type-label">{t('cacheManager.search.searchType')}</InputLabel>
          <Select
            labelId="search-type-label"
            id="searchType"
            name="searchType"
            value={searchParams.searchType}
            onChange={handleSelectChange}
            label={t('cacheManager.search.searchType')}
          >
            <MenuItem value={CacheSearchType.SOURCE}>{t('cacheManager.search.source')}</MenuItem>
            <MenuItem value={CacheSearchType.TARGET}>{t('cacheManager.search.target')}</MenuItem>
            <MenuItem value={CacheSearchType.FILE_NAME}>
              {t('cacheManager.search.fileName')}
            </MenuItem>
            <MenuItem value={CacheSearchType.FILE_PATH}>
              {t('cacheManager.search.filePath')}
            </MenuItem>
            <MenuItem value={CacheSearchType.DATE}>{t('cacheManager.search.date')}</MenuItem>
            <MenuItem value={CacheSearchType.CACHE_TAG}>
              {t('cacheManager.search.cacheTag')}
            </MenuItem>
          </Select>
        </FormControl>

        {searchParams.searchType !== CacheSearchType.DATE ? (
          searchParams.searchType === CacheSearchType.CACHE_TAG ? (
            <Autocomplete
              options={cacheTags}
              getOptionLabel={(option) => option.name}
              value={cacheTags.find((tag) => String(tag.id) === searchParams.searchValue) ?? null}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) => {
                const syntheticEvent = {
                  target: {
                    name: 'searchValue',
                    value: value ? String(value.id) : '',
                  },
                } as React.ChangeEvent<HTMLInputElement>;
                onSearchParamChange(syntheticEvent);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={getPlaceholder()}
                  size="small"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      onSearch();
                    }
                  }}
                />
              )}
              noOptionsText={t('cacheManager.search.noCacheTagOptions')}
              fullWidth
            />
          ) : (
            <TextField
              id="searchValue"
              name="searchValue"
              value={searchParams.searchValue}
              onChange={(event) => {
                const syntheticEvent = {
                  target: {
                    name: event.target.name,
                    value: event.target.value,
                  },
                } as React.ChangeEvent<HTMLInputElement>;

                onSearchParamChange(syntheticEvent);
              }}
              placeholder={getPlaceholder()}
              fullWidth
              size="small"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onSearch();
                }
              }}
            />
          )
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flex: 1 }}>
            <TextField
              id="startDate"
              type="date"
              label={t('cacheManager.search.startDate')}
              value={formatDateForInput(searchParams.startDate)}
              onChange={(event) =>
                onDateChange(event as React.ChangeEvent<HTMLInputElement>, 'startDate')
              }
              onClick={(event) => event.stopPropagation()}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 180 } }}
            />
            <TextField
              id="endDate"
              type="date"
              label={t('cacheManager.search.endDate')}
              value={formatDateForInput(searchParams.endDate)}
              onChange={(event) =>
                onDateChange(event as React.ChangeEvent<HTMLInputElement>, 'endDate')
              }
              onClick={(event) => event.stopPropagation()}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 180 } }}
            />
          </Stack>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={onSearch}
          startIcon={<SearchIcon />}
          ref={searchButtonRef}
          sx={{ minWidth: { xs: '100%', md: 120 }, height: { md: 40 } }}
        >
          {t('cacheManager.search.search')}
        </Button>
      </Stack>
    </Paper>
  );
};

export default SearchSection;
