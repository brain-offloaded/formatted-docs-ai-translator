import React, { useState, Suspense, lazy } from 'react';
import { Box, Tabs, Tab, CircularProgress, Paper } from '@mui/material';

const ExamplePresetEditor = lazy(() => import('./components/ExamplePresetEditor'));
const PromptPresetPanel = lazy(() => import('./components/PromptPresetPanel'));

const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
    <CircularProgress />
  </Box>
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`preset-tabpanel-${index}`}
      aria-labelledby={`preset-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `preset-tab-${index}`,
    'aria-controls': `preset-tabpanel-${index}`,
  };
}

const PresetView: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="preset management tabs">
          <Tab label="예제 프리셋" {...a11yProps(0)} />
          <Tab label="프롬프트 프리셋" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={currentTab} index={0}>
        <Suspense fallback={<LoadingFallback />}>
          <ExamplePresetEditor />
        </Suspense>
      </TabPanel>
      <TabPanel value={currentTab} index={1}>
        <Suspense fallback={<LoadingFallback />}>
          <PromptPresetPanel />
        </Suspense>
      </TabPanel>
    </Paper>
  );
};

export default PresetView;
