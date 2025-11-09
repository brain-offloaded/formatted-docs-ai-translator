export const PromptPresetType = {
  TEXT: 'text',
  IMAGE: 'image',
} as const;

export type PromptPresetType = (typeof PromptPresetType)[keyof typeof PromptPresetType];

export interface PromptPreset {
  id: number;
  name: string;
  prompt: string;
  type: PromptPresetType;
}

export interface PromptPresetDto {
  id: number;
  name: string;
  type: PromptPresetType;
}
