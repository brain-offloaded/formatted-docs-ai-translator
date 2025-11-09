export interface LogListItem {
  id: number;
  level: string;
  message: string;
  context: string | null;
  metadataPreview: string | null;
  hasMetadata: boolean;
  timestamp: string;
}

export interface LogDetail extends LogListItem {
  metadata: string | null;
  stack: string | null;
  meta: Record<string, unknown> | null;
  module?: string | null;
}
