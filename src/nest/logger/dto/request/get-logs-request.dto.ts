export class GetLogsRequestDto {
  page: number;
  itemsPerPage: number;
  searchParams: {
    levels?: string[];
    startDate?: string;
    endDate?: string;
  };
}
