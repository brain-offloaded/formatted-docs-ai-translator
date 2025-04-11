import { CsvParserOptionsDto } from '@/nest/parser/dto/options/csv-parser-options.dto';
import { BaseApplyRequestDto } from '@/nest/parser/dto/request/base-apply-request.dto';

export class ApplyTranslationToCsvRequestDto extends BaseApplyRequestDto<CsvParserOptionsDto> {}
