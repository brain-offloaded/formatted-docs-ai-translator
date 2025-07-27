import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { TranslatorConfig, TranslatorConfigUpdate } from '../../types/config';
import { ConfigStore } from '../config/config-store';

interface SettingsContextType {
  config: TranslatorConfig;
  updateConfig: (update: TranslatorConfigUpdate) => void;
  isReady: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const configStore = useMemo(() => ConfigStore.getInstance(), []);
  const [config, setConfig] = useState<TranslatorConfig>(configStore.getConfig());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handleConfigChange = (event: CustomEvent<TranslatorConfig>) => {
      setConfig(event.detail);
    };

    configStore.addEventListener('configChanged', handleConfigChange);
    setConfig(configStore.getConfig());
    setIsReady(true);

    return () => {
      configStore.removeEventListener('configChanged', handleConfigChange);
    };
  }, [configStore]);

  const updateConfig = useCallback(
    (update: TranslatorConfigUpdate) => {
      configStore.updateConfig(update);
    },
    [configStore]
  );

  const value = useMemo(() => ({ config, updateConfig, isReady }), [config, updateConfig, isReady]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
