import React from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, IconButton, Tooltip } from '@mui/material';
import type { TooltipProps } from '@mui/material/Tooltip';

interface InfoTooltipProps {
  title: React.ReactNode;
  infoAriaLabel?: string;
  wikiUrl?: string;
  wikiAriaLabel?: string;
  placement?: TooltipProps['placement'];
  size?: 'small' | 'medium';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  infoAriaLabel = 'Show information',
  wikiUrl,
  wikiAriaLabel = 'Open guide in browser',
  placement = 'top',
  size = 'small',
}) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      ml: 0.5,
      color: 'text.secondary',
      '& .MuiIconButton-root': {
        p: 0.25,
        color: 'inherit',
      },
      '& .MuiIconButton-root:hover': {
        color: 'text.primary',
      },
    }}
  >
    <Tooltip title={title} placement={placement} arrow disableInteractive>
      <span>
        <IconButton aria-label={infoAriaLabel} size={size} disableRipple disableFocusRipple>
          <InfoOutlinedIcon fontSize={size === 'small' ? 'inherit' : 'medium'} />
        </IconButton>
      </span>
    </Tooltip>
    {wikiUrl && (
      <Tooltip title={wikiAriaLabel} placement={placement} arrow disableInteractive>
        <IconButton
          component="a"
          href={wikiUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={wikiAriaLabel}
          size={size}
          disableRipple
          disableFocusRipple
        >
          <OpenInNewIcon fontSize={size === 'small' ? 'inherit' : 'medium'} />
        </IconButton>
      </Tooltip>
    )}
  </Box>
);

export default InfoTooltip;
