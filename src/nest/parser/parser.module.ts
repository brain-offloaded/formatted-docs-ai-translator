import { Module } from '@nestjs/common';

import { ParserIpcHandler } from './parser.ipc.handler';
import { JsonParserService } from './services/json-parser.service';
import { ParserService } from './services/parser.service';
import { PlainTextParserService } from './services/plain-text-parser.service';

@Module({
  providers: [ParserService, JsonParserService, ParserIpcHandler, PlainTextParserService],
  exports: [ParserService],
})
export class ParserModule {}
