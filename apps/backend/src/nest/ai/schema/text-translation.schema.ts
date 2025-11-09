import { ResponseFormatJSONSchema } from 'openai/resources/index';

export const textTranslationJsonSchema: ResponseFormatJSONSchema.JSONSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['segments'],
  properties: {
    segments: {
      type: 'array',
      description: 'Ordered list of translated segments that mirrors the source input ids.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'translated_text'],
        properties: {
          id: {
            type: 'integer',
            description: 'The identifier provided with the source segment. Must remain unchanged.',
          },
          translated_text: {
            type: 'string',
            description: 'The translated text corresponding to the source segment.',
          },
        },
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
