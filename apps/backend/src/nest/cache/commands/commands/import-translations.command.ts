import { TranslationExportImport } from '@apps/common/dist/types/cache';

import { CacheCommand } from '../cache-command.types';

export class ImportTranslationsCommand implements CacheCommand<number> {
  public static readonly type = 'CACHE_IMPORT_TRANSLATIONS';

  public readonly type = ImportTranslationsCommand.type;

  constructor(public readonly translations: TranslationExportImport[]) {}
}
