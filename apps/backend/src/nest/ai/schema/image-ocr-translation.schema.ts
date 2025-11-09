import { ResponseFormatJSONSchema } from 'openai/resources/index';

export const imageOcrTranslationJsonSchema: ResponseFormatJSONSchema.JSONSchema = {
  type: 'object',
  required: ['ocr_result', 'translated_result'],
  properties: {
    ocr_result: {
      type: 'array',
      items: {
        type: 'object',
        required: ['text', 'box_2d'],
        properties: {
          text: {
            type: 'string',
          },
          box_2d: {
            type: 'array',
            description: 'Bounding box in the format [y1(y_min), x1(x_min), y2(y_max), x2(x_max)].',
            items: {
              type: 'number',
            },
          },
        },
      },
    },
    translated_result: {
      type: 'array',
      items: {
        type: 'object',
        required: ['text', 'box_2d'],
        properties: {
          text: {
            type: 'string',
          },
          box_2d: {
            type: 'array',
            description: 'Bounding box in the format [y1(y_min), x1(x_min), y2(y_max), x2(x_max)].',
            items: {
              type: 'number',
            },
          },
        },
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
