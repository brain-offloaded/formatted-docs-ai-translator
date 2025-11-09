import { CacheSearchType } from '@apps/common/dist/types/common';
import type {
  CacheTagSummaryDto,
  CacheTranslationDto,
  TranslationHistoryDto,
} from '@/react/api/generated';
import { getDefaultEndDate, getDefaultStartDate } from '../../../utils/dateUtils';

export type CacheSearchParams = {
  searchType: CacheSearchType;
  searchValue: string;
  startDate: string;
  endDate: string;
};

export interface CacheState {
  currentPage: number;
  itemsPerPage: number;
  itemsPerPageOptions: number[];
  customItemsPerPage: string;
  isCustomPerPageMode: boolean;
  totalItems: number;
  translations: CacheTranslationDto[];
  searchParams: CacheSearchParams;
  selectedTranslationId: number | null;
  translationHistory: TranslationHistoryDto[] | null;
  isLoading: boolean;
  cacheTags: CacheTagSummaryDto[];
}

export const createInitialCacheState = (): CacheState => ({
  currentPage: 1,
  itemsPerPage: 10,
  itemsPerPageOptions: [10, 20, 50, 100],
  customItemsPerPage: '',
  isCustomPerPageMode: false,
  totalItems: 0,
  translations: [],
  searchParams: {
    searchType: CacheSearchType.SOURCE,
    searchValue: '',
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
  },
  selectedTranslationId: null,
  translationHistory: null,
  isLoading: false,
  cacheTags: [],
});
