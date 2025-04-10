import React from 'react';
import { formatDateForInput } from '../../utils/dateUtils';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  SelectChangeEvent,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { CacheSearchParams } from '@/types/common';

interface SearchSectionProps {
  searchParams: CacheSearchParams;
  onSearchParamChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>, dateType: 'startDate' | 'endDate') => void;
  onSearch: () => void;
}

/**
 * 번역 캐시 검색 섹션 컴포넌트
 */
export const SearchSection: React.FC<SearchSectionProps> = ({
  searchParams,
  onSearchParamChange,
  onDateChange,
  onSearch,
}) => {
  // Material-UI Select 컴포넌트를 위한 핸들러
  const handleSelectChange = (event: SelectChangeEvent) => {
    // SelectChangeEvent를 React.ChangeEvent<HTMLSelectElement>로 변환
    const syntheticEvent = {
      target: {
        name: event.target.name,
        value: event.target.value,
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    onSearchParamChange(syntheticEvent);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="search-type-label">검색 타입</InputLabel>
          <Select
            labelId="search-type-label"
            id="searchType"
            name="searchType"
            value={searchParams.searchType}
            onChange={handleSelectChange}
            label="검색 타입"
          >
            <MenuItem value="source">원문</MenuItem>
            <MenuItem value="target">번역</MenuItem>
            <MenuItem value="fileName">파일 이름</MenuItem>
            <MenuItem value="filePath">파일 경로</MenuItem>
            <MenuItem value="date">날짜</MenuItem>
          </Select>
        </FormControl>

        {searchParams.searchType !== 'date' ? (
          <TextField
            id="searchValue"
            name="searchValue"
            value={searchParams.searchValue}
            onChange={(e) => {
              // TextField의 onChange 이벤트를 HTMLInputElement로 변환
              const syntheticEvent = {
                target: {
                  name: e.target.name,
                  value: e.target.value,
                },
              } as React.ChangeEvent<HTMLInputElement>;

              onSearchParamChange(syntheticEvent);
            }}
            placeholder="검색어를 입력하세요"
            fullWidth
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              id="startDate"
              type="date"
              label="시작일"
              value={formatDateForInput(searchParams.startDate)}
              onChange={(e) => onDateChange(e as React.ChangeEvent<HTMLInputElement>, 'startDate')}
              onClick={(e) => e.stopPropagation()}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              id="endDate"
              type="date"
              label="종료일"
              value={formatDateForInput(searchParams.endDate)}
              onChange={(e) => onDateChange(e as React.ChangeEvent<HTMLInputElement>, 'endDate')}
              onClick={(e) => e.stopPropagation()}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={onSearch}
          startIcon={<SearchIcon />}
          sx={{ minWidth: 120 }}
        >
          검색
        </Button>
      </Box>
    </Box>
  );
};

export default SearchSection;
