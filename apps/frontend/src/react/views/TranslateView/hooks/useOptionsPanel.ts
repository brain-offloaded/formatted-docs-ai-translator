import { useCallback, useState } from 'react';

export const useOptionsPanel = () => {
  const [showSettings, setShowSettings] = useState(false);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  const resetSettingsVisibility = useCallback(() => {
    setShowSettings(false);
  }, []);

  return { showSettings, toggleSettings, resetSettingsVisibility } as const;
};
