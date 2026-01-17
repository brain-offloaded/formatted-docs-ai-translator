import { Body, Controller, Post, Res, SerializeOptions } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { TranslatorService } from './services/translator.service';
import { TranslateTextArrayRequestDto } from './dto/request/translate-text-array-request.dto';
import { TranslateTextArrayResponseDto } from './dto/response/translate-text-array-response.dto';

@ApiTags('text-translator')
@Controller('translator/text')
export class TextTranslatorController {
  constructor(private readonly translatorService: TranslatorService) {}

  @Post('translate')
  @ApiOkResponse({
    description: '텍스트 배열을 번역합니다.',
    type: TranslateTextArrayResponseDto,
  })
  @SerializeOptions({ type: TranslateTextArrayResponseDto })
  async translateText(
    @Body() dto: TranslateTextArrayRequestDto
  ): Promise<TranslateTextArrayResponseDto> {
    const translatedTextPaths = await this.translatorService.translate(dto);
    return {
      success: true,
      message: '텍스트 배열 번역이 완료되었습니다.',
      translatedTextPaths,
    };
  }

  @Post('translate/stream')
  @ApiOkResponse({
    description: '텍스트 배열을 번역하며 진행률을 NDJSON 스트림으로 전송합니다.',
  })
  async streamTranslateText(
    @Body() dto: TranslateTextArrayRequestDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const translatedTextPaths = await this.translatorService.translate(dto, (event) => {
        const chunk = JSON.stringify({ type: 'progress', ...event }) + '\n';
        res.write(chunk);
      });

      const finalChunk =
        JSON.stringify({
          type: 'complete',
          success: true,
          message: '텍스트 배열 번역이 완료되었습니다.',
          translatedTextPaths,
        }) + '\n';
      res.write(finalChunk);
      res.end();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorChunk =
        JSON.stringify({
          type: 'error',
          success: false,
          message: errorMessage,
        }) + '\n';
      res.write(errorChunk);
      res.end();
    }
  }
}
