import { Module } from '@nestjs/common';

import { ParserIpcHandler } from './parser.ipc.handler';
import { JsonParserService } from './services/json-parser.service';
import { PARSER_MAP, ParserService } from './services/parser.service';
import { PlainTextParserService } from './services/plain-text-parser.service';
import { CsvParserService } from './services/csv-parser.service';
import { SubtitleParserService } from './services/subtitle-parser.service';
import { BaseParserService } from './services/base-parser-service';
import { BaseParseOptionsDto } from './dto/options/base-parse-options.dto';

@Module({
  providers: [
    ParserService,
    JsonParserService,
    ParserIpcHandler,
    PlainTextParserService,
    CsvParserService,
    SubtitleParserService,
    {
      provide: PARSER_MAP,
      useFactory: (...parsers: BaseParserService<unknown, BaseParseOptionsDto>[]) => {
        return new Map(parsers.map((parser) => [parser.type, parser]));
      },
      inject: [JsonParserService, CsvParserService, PlainTextParserService, SubtitleParserService],
    },
  ],
  exports: [ParserService],
})
export class ParserModule {}
