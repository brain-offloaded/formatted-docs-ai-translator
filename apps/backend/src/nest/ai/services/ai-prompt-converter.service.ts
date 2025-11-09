import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';
import {
  defaultTargetLanguage,
  getLanguageLabel,
  SourceLanguage,
  TargetLanguage,
} from '@apps/common/dist/language';
import { tagTexts } from '@/nest/utils/string';
import { isNullish } from '@/nest/utils/is-nullish';
import { ExampleManagerService } from '@/nest/translation/example/services/example-manager.service';

// Enum 및 Interface 정의 추가
enum PromptRole {
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
  USER = 'user',
}

@Injectable()
export class AiPromptConverterService {
  constructor(protected readonly exampleManager: ExampleManagerService) {}

  // 기존 PromptConverter 클래스의 멤버 변수 및 메서드 추가
  protected readonly DEFAULT_PREFILL =
    'I understood. I have translated all sentences without omission. I must response all senteces without aborting. Pure translation result without any extra information(only prefix included):';
  protected readonly DEFAULT_PROMPT = `<|role_start:system|>
You are translator who translate the {{language::source}} text given by user to {{language::target}}. You are just a translator. If it''s already in {{language::target}}, you have to output it as it is. Keep xml format. Response only translation text and xml, without any extra information.
No sentence should be left untranslated, or you should not respond with a blank sentence without translating.<|role_end|>
{{example::source}}
<|role_start:assistant|>
I understood. I have translated all sentences without omission. I must response all senteces without aborting. Pure translation result without any extra information(only xml included):<|role_end|>
{{example::result}}
<|role_start:user|>
{{content}}<|role_end|>
<|role_start:assistant|>
I understood. I have translated all sentences without omission. I must response all senteces without aborting. Pure translation result without any extra information(only xml included):<|role_end|>
`;

  protected getPrompt(prompt?: string) {
    return isNullish(prompt) ? this.DEFAULT_PROMPT : prompt;
  }

  protected getPrefill(prefill?: string) {
    return isNullish(prefill) ? this.DEFAULT_PREFILL : prefill;
  }

  private _replaceRolePlaceholder(
    prompt: string,
    placeholder: string,
    role: string,
    value: string | undefined
  ): string {
    const replacement = value ? `<|role_start:${role}|>\n${value}<|role_end|>` : '';
    return prompt.replaceAll(placeholder, replacement);
  }

  private _replaceRequiredPlaceholder(
    prompt: string,
    placeholder: string,
    value: string | undefined,
    errorMessage: string
  ): string {
    if (!value) {
      throw new Error(errorMessage);
    }
    return prompt.replaceAll(placeholder, value);
  }

  protected async replacePrompt({
    requestId,
    promptPresetContent,
    sourceLanguage,
    targetLanguage,
    content,
  }: {
    requestId: string;
    promptPresetContent?: string;
    sourceLanguage: SourceLanguage;
    targetLanguage: TargetLanguage;
    content: string | string[];
  }): Promise<string> {
    let currentPrompt = this.getPrompt(promptPresetContent);

    const example = await this.exampleManager.getExample(requestId, sourceLanguage, targetLanguage);
    const startIndex = example?.lineCount ? example.lineCount + 1 : 1;
    const contentText = Array.isArray(content)
      ? tagTexts(content, startIndex).taggedTexts
      : content;
    currentPrompt = this._replaceRolePlaceholder(
      currentPrompt,
      '{{example::source}}',
      'user',
      example?.source
    );
    currentPrompt = this._replaceRolePlaceholder(
      currentPrompt,
      '{{example::result}}',
      'assistant',
      example?.result
    );
    currentPrompt = this._replaceRequiredPlaceholder(
      currentPrompt,
      '{{content}}',
      contentText,
      'Content is required'
    );
    const sourceLabel = getLanguageLabel(sourceLanguage);
    const targetLabel = getLanguageLabel(targetLanguage);
    currentPrompt = this._replaceRequiredPlaceholder(
      currentPrompt,
      '{{language::source}}',
      sourceLabel,
      'Source language is required'
    );
    currentPrompt = this._replaceRequiredPlaceholder(
      currentPrompt,
      '{{language::target}}',
      targetLabel,
      'Target language is required'
    );

    return currentPrompt;
  }

  public async getChatBlock({
    requestId,
    content,
    sourceLanguage,
    targetLanguage,
    promptPresetContent,
    imageDataUrl,
  }: {
    requestId: string;
    content: string | string[];
    sourceLanguage?: SourceLanguage;
    targetLanguage?: TargetLanguage;
    promptPresetContent?: string;
    imageDataUrl?: string;
  }): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
    const finalSourceLanguage = sourceLanguage ?? SourceLanguage.ENGLISH;
    const finalTargetLanguage = targetLanguage || defaultTargetLanguage;

    // 이미지인 경우
    if (imageDataUrl) {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        await this.getChatBlock({
          requestId,
          content: '{{content}}',
          sourceLanguage: finalSourceLanguage,
          targetLanguage: finalTargetLanguage,
          promptPresetContent,
        });

      // user 메시지를 찾아서 content를 멀티파트로 교체
      const finalMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      for (const message of messages) {
        if (
          message.role === 'user' &&
          typeof message.content === 'string' &&
          message.content.includes('{{content}}')
        ) {
          const [beforeText, afterText] = message.content.split('{{content}}');
          const imageUserContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
          if (beforeText.trim()) {
            imageUserContent.push({ type: 'text', text: beforeText.trim() });
          }
          imageUserContent.push({ type: 'image_url', image_url: { url: imageDataUrl } });
          if (afterText.trim()) {
            imageUserContent.push({ type: 'text', text: afterText.trim() });
          }
          finalMessages.push({ role: 'user', content: imageUserContent });
        } else {
          finalMessages.push(message);
        }
      }
      return finalMessages;
    }

    // 텍스트인 경우
    const replacedPrompt = await this.replacePrompt({
      requestId,
      promptPresetContent,
      sourceLanguage: finalSourceLanguage,
      targetLanguage: finalTargetLanguage,
      content,
    });

    return this.parsePromptToChatBlock({
      currentPrompt: replacedPrompt,
    });
  }

  protected isPromptSystemRole(role: string) {
    return role.toLowerCase().startsWith(PromptRole.SYSTEM);
  }

  protected isPromptAssistantRole(role: string) {
    return role.toLowerCase().startsWith(PromptRole.ASSISTANT);
  }

  protected isPromptUserRole(role: string) {
    return role.toLowerCase().startsWith(PromptRole.USER);
  }

  private _parseBlocksToMessages(blocks: string[]): {
    systemInstruction: string;
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  } {
    let systemInstruction = '';
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    for (const block of blocks) {
      const roleMatch = block.match(/<\|role_start:(.*?)\|>/);
      const role = roleMatch ? roleMatch[1] : '';
      const cleanBlock = block.replace(/<\|role_start:.*?\|>|\n?<\|role_end\|>/g, '');
      const text = cleanBlock.trim();

      if (this.isPromptSystemRole(role)) {
        if (systemInstruction) {
          throw new Error('Prompt template can only contain one system role block.');
        }
        systemInstruction = text;
      } else if (this.isPromptAssistantRole(role)) {
        messages.push({ role: 'assistant', content: text });
      } else if (this.isPromptUserRole(role)) {
        messages.push({ role: 'user', content: text });
      } else {
        throw new Error(`Unknown role: ${role}`);
      }
    }

    return { systemInstruction, messages };
  }

  private _mergeMessages(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    systemInstruction: string
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const mergedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (systemInstruction) {
      mergedMessages.push({ role: 'system', content: systemInstruction });
    }

    for (const current of messages) {
      const last = mergedMessages[mergedMessages.length - 1];

      if (
        last &&
        last.role === current.role &&
        typeof last.content === 'string' &&
        typeof current.content === 'string'
      ) {
        last.content += `\n${current.content}`;
      } else if (
        last &&
        last.role === current.role &&
        last.role === 'user' && // user role content can be an array
        Array.isArray(last.content) &&
        Array.isArray(current.content)
      ) {
        const parts = current.content.filter(
          (part): part is OpenAI.Chat.Completions.ChatCompletionContentPart => 'type' in part
        );
        last.content.push(...parts);
      } else {
        mergedMessages.push(current);
      }
    }

    return mergedMessages;
  }

  protected parsePromptToChatBlock({
    currentPrompt,
  }: {
    currentPrompt: string;
  }): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const blocks = currentPrompt.match(/<\|role_start:(.*?)\|>(.*?)<\|role_end\|>/gs) || [];
    const { systemInstruction, messages } = this._parseBlocksToMessages(blocks);
    return this._mergeMessages(messages, systemInstruction);
  }
}
