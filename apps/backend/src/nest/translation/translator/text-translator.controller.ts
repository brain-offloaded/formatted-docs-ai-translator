import { Body, Controller, Post, SerializeOptions } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

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
}
