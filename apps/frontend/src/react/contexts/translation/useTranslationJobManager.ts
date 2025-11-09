import { useCallback, useRef } from 'react';
import { TranslationJobManager } from '@/react/services/job-manager/TranslationJobManager';

interface UseTranslationJobManagerParams {
  concurrencyLimit: number;
}

interface UseTranslationJobManagerResult<TJob> {
  getJobManager: () => TranslationJobManager<TJob>;
  cancelTranslation: () => void;
  isJobManagerActive: () => boolean;
  resetJobManager: () => void;
}

/**
 * Localises the TranslationJobManager lifecycle management so the context can stay declarative.
 */
export function useTranslationJobManager<TJob>({
  concurrencyLimit,
}: UseTranslationJobManagerParams): UseTranslationJobManagerResult<TJob> {
  const jobManagerRef = useRef<TranslationJobManager<TJob> | null>(null);

  const ensureManager = useCallback(() => {
    if (!jobManagerRef.current) {
      jobManagerRef.current = new TranslationJobManager<TJob>({ concurrency: concurrencyLimit });
    } else {
      jobManagerRef.current.updateConfig({ concurrency: concurrencyLimit });
    }
    return jobManagerRef.current;
  }, [concurrencyLimit]);

  const cancelTranslation = useCallback(() => {
    jobManagerRef.current?.cancel();
  }, []);

  const isJobManagerActive = useCallback(() => jobManagerRef.current?.hasActiveJobs() ?? false, []);

  const resetJobManager = useCallback(() => {
    jobManagerRef.current?.reset();
  }, []);

  return {
    getJobManager: ensureManager,
    cancelTranslation,
    isJobManagerActive,
    resetJobManager,
  };
}
