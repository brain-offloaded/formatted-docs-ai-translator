import { Body, Controller, Post, SerializeOptions } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { TranslateImageRequestDto } from './dto/request/translate-image-request.dto';
import { TranslateImageResponseDto } from './dto/response/translate-image-response.dto';
import { ImageTranslatorService } from './services/image-translator.service';

@ApiTags('image-translator')
@Controller('translator/image')
export class ImageTranslatorController {
  constructor(private readonly imageTranslatorService: ImageTranslatorService) {}

  @Post('translate')
  @ApiOkResponse({
    description: '이미지를 번역하고 OCR/번역 결과를 반환합니다.',
    type: TranslateImageResponseDto,
  })
  @SerializeOptions({ type: TranslateImageResponseDto })
  async translateImage(@Body() dto: TranslateImageRequestDto): Promise<TranslateImageResponseDto> {
    const result = await this.imageTranslatorService.translate(dto);

    return {
      success: true,
      message: '이미지 번역에 성공했습니다.',
      result,
    };
  }
}
