import { Part } from '@google/generative-ai';
import { Injectable } from '@nestjs/common';
import { SourceLanguage, targetLanguage } from '@/utils/language';
import { isNullish } from '@/utils/is-nullish';
import { ExampleManagerService } from '@/nest/translation/example/services/example-manager.service';

// Enum 및 Interface 정의 추가
enum PromptRole {
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
  USER = 'user',
}

enum ChatBlockRole {
  SYSTEM = 'system',
  ASSISTANT = 'MODEL',
  USER = 'USER',
}

export interface IChatBlock {
  contents: IChatContent[];
  systemInstruction: string;
}

interface IChatContent {
  role: ChatBlockRole;
  parts: Part[];
}

@Injectable()
export class AiPromptConverterService {
  constructor(protected readonly exampleManager: ExampleManagerService) {}

  // 기존 PromptConverter 클래스의 멤버 변수 및 메서드 추가
  protected readonly DEFAULT_PREFILL =
    'I understood. I have translated all sentences without omission. I must response all senteces without aborting. Pure translation result without any extra information(only prefix included):';
  protected readonly DEFAULT_PROMPT = `<|role_start:system|>
You are translator who translate the {{language::source}} text given by user to {{language::target}}. You are just a translator. If it's already in {{language::target}}, you have to output it as it is. Keep prefix format. Response only translation text and prefix, without any extra information.
No sentence should be left untranslated, or you should not respond with a blank sentence without translating.<|role_end|>
{{example::source}}
<|role_start:assistant|>
I understood. I have translated all sentences without omission. I must response all senteces without aborting. Pure translation result without any extra information(only prefix included):<|role_end|>
{{example::result}}
<|role_start:user|>
{{content}}<|role_end|>
<|role_start:assistant|>
I understood. I have translated all sentences without omission. I must response all senteces without aborting. Pure translation result without any extra information(only prefix included):<|role_end|>
`;

  protected getPrompt(prompt?: string) {
    return isNullish(prompt) ? this.DEFAULT_PROMPT : prompt;
  }

  protected getPrefill(prefill?: string) {
    return isNullish(prefill) ? this.DEFAULT_PREFILL : prefill;
  }

  protected async replacePrompt({
    promptPresetContent,
    sourceLanguage,
    content,
    // prefill,
  }: {
    promptPresetContent?: string;
    sourceLanguage: SourceLanguage;
    content?: string;
    // prefill?: string;
  }) {
    const example = await this.exampleManager.getExample(sourceLanguage);
    let currentPrompt = this.getPrompt(promptPresetContent);
    // const currentPrefill = this.getPrefill(prefill);

    // currentPrompt = currentPrompt.replaceAll(
    //   '{{example}}',
    //   '{{example::source}}\n{{prefill}}\n{{example::result}}'
    // );

    if (example?.source) {
      currentPrompt = currentPrompt.replaceAll(
        '{{example::source}}',
        `<|role_start:user|>\n${example?.source}<|role_end|>`
      );
    } else {
      currentPrompt = currentPrompt.replaceAll('{{example::source}}', '');
    }

    if (example?.result) {
      currentPrompt = currentPrompt.replaceAll(
        '{{example::result}}',
        `<|role_start:assistant|>\n${example?.result}<|role_end|>`
      );
    } else {
      currentPrompt = currentPrompt.replaceAll('{{example::result}}', '');
    }

    // if (currentPrefill) {
    //   currentPrompt = currentPrompt.replaceAll(
    //     '{{prefill}}',
    //     `<|role_start:assistant|>\n${currentPrefill}<|role_end|>`
    //   );
    // } else {
    //   currentPrompt = currentPrompt.replaceAll('{{prefill}}', '');
    // }

    if (content) {
      currentPrompt = currentPrompt.replaceAll('{{content}}', content);
    } else {
      throw new Error('Content is required');
    }

    if (sourceLanguage) {
      currentPrompt = currentPrompt.replaceAll('{{language::source}}', sourceLanguage);
    } else {
      throw new Error('Source language is required');
    }

    if (targetLanguage) {
      currentPrompt = currentPrompt.replaceAll('{{language::target}}', targetLanguage);
    }

    return currentPrompt;
  }

  public async getChatBlock({
    content,
    image,
    sourceLanguage,
    promptPresetContent, // promptPresetContent 매개변수 추가
    // prefill,
  }: {
    content?: string;
    image?: string; // Base64 인코딩된 이미지 데이터
    sourceLanguage: SourceLanguage;
    promptPresetContent?: string; // 타입 정의에 추가
    // prefill?: string;
  }): Promise<IChatBlock> {
    const currentPrompt = await this.replacePrompt({
      promptPresetContent,
      sourceLanguage,
      content,
      // prefill,
    });

    return this.parsePromptToChatBlock({
      image,
      currentPrompt,
      promptPresetContent, // parsePromptToChatBlock 호출 시 전달
    });
  }

  protected isPromptSystemRole(role: string) {
    return role.startsWith(PromptRole.SYSTEM);
  }

  protected isPromptAssistantRole(role: string) {
    return role.startsWith(PromptRole.ASSISTANT);
  }

  protected isPromptUserRole(role: string) {
    return role.startsWith(PromptRole.USER);
  }

  protected parsePromptToChatBlock({
    image,
    currentPrompt,
    promptPresetContent,
  }: {
    image?: string; // Base64 인코딩된 이미지 데이터
    currentPrompt: string;
    promptPresetContent?: string;
  }): IChatBlock {
    {
      // 프롬프트 프리셋 내용을 기존 프롬프트 앞에 추가
      const fullPrompt = promptPresetContent
        ? `${promptPresetContent}\n\n${currentPrompt}`
        : currentPrompt;
      const blocks = fullPrompt.match(/<\|role_start:(.*?)\|>(.*?)<\|role_end\|>/gs) || [];
      const tempContents: IChatContent[] = [];
      const result: IChatBlock = {
        contents: [],
        systemInstruction: '',
      };

      blocks.forEach((block) => {
        const roleMatch = block.match(/<\|role_start:(.*?)\|>/);
        const role = roleMatch ? roleMatch[1] : '';
        const cleanBlock = block.replace(/<\|role_start:.*?\|>|\n?<\|role_end\|>/g, '');
        const text = cleanBlock.trim();

        if (this.isPromptSystemRole(role)) {
          result.systemInstruction = text;
        } else if (this.isPromptAssistantRole(role)) {
          tempContents.push({
            role: ChatBlockRole.ASSISTANT,
            parts: [{ text }],
          });
        } else if (this.isPromptUserRole(role)) {
          if (image && text.includes('{{slot::image}}')) {
            const [beforeImage, afterImage] = text.split('{{slot::image}}');
            const parts: Part[] = [];
            if (beforeImage.trim()) {
              parts.push({ text: beforeImage.trim() });
            }
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg', // 이미지 타입은 고정되어 있으므로 필요시 수정
                data: image,
              },
            });
            if (afterImage.trim()) {
              parts.push({ text: afterImage.trim() });
            }
            tempContents.push({
              role: ChatBlockRole.USER,
              parts: parts,
            });
          } else {
            tempContents.push({
              role: ChatBlockRole.USER,
              parts: [{ text }],
            });
          }
        }
      });

      // Merge consecutive same roles
      for (let i = 0; i < tempContents.length; i++) {
        const current = tempContents[i];
        if (i === 0 || current.role !== tempContents[i - 1].role) {
          result.contents.push({
            role: current.role,
            parts: [...current.parts],
          });
        } else {
          result.contents[result.contents.length - 1].parts.push(...current.parts);
        }
      }

      return result;
    }
  }
}
