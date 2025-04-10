import { TranslationResult } from '../../../../types/translators';

export abstract class AiResponseService<ResponseType> {
  public async parseTranslationResponse(
    response: ResponseType,
    remainingTexts: Map<string, number[]>
  ): Promise<Map<string, TranslationResult>> {
    const responseText = await this.getResponseText(response);
    const translations = new Map<string, TranslationResult>();
    const regex = /<\|(\d+)\|>(.*?)(?=(<\|\d+\|>|$))/gm;
    const remainingTextArray = Array.from(remainingTexts.keys());

    let match;
    while ((match = regex.exec(responseText)) !== null) {
      const [, idStr, translatedText] = match;
      const id = parseInt(idStr);
      if (id < 1 || id > remainingTextArray.length) continue;

      const originalText = remainingTextArray[id - 1];
      const indices = remainingTexts.get(originalText) || [];
      if (translatedText.trim()) {
        translations.set(originalText, {
          text: translatedText.trim(),
          indices,
        });
      }
    }

    await this.logResponse({
      response,
      translations,
      remainingTexts,
      responseText,
      remainingTextArray,
    });

    return translations;
  }

  protected abstract logResponse(param: {
    response: ResponseType;
    translations: Map<string, TranslationResult>;
    remainingTexts: Map<string, number[]>;
    responseText: string;
    remainingTextArray: string[];
  }): Promise<void>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract logResponse(param: any): any;

  protected abstract getResponseText(response: ResponseType): Promise<string>;
}
