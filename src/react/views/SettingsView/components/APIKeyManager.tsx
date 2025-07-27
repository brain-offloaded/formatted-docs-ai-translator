import React, { useState } from 'react';
import { TextField, InputAdornment, IconButton, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useSettings } from '../../../contexts/SettingsContext';

const APIKeyManager: React.FC = () => {
  const { config, updateConfig } = useSettings();
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const apiKey = e.target.value;

    if (apiKey && apiKey.length < 3) {
      setApiKeyError('API 키가 너무 짧습니다. 유효한 키인지 확인해주세요.');
    } else {
      setApiKeyError('');
    }

    updateConfig({ apiKey });
  };

  const toggleApiKeyVisibility = () => {
    setIsApiKeyVisible(!isApiKeyVisible);
  };

  return (
    <TextField
      fullWidth
      id="api-key"
      label="API 키"
      variant="outlined"
      type={isApiKeyVisible ? 'text' : 'password'}
      value={config.apiKey}
      onChange={handleApiKeyChange}
      error={!!apiKeyError}
      helperText={apiKeyError}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <Tooltip title={isApiKeyVisible ? '숨기기' : '표시'}>
              <IconButton
                onClick={toggleApiKeyVisibility}
                edge="end"
                aria-label={isApiKeyVisible ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                {isApiKeyVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ),
      }}
    />
  );
};

export default APIKeyManager;
