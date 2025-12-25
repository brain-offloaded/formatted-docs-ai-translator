import '../api/init-openapi';
import {
  Translate as TranslateIcon,
  SwapHoriz as SwapHorizIcon,
  Storage as StorageIcon,
  Article as ArticleIcon,
  Menu as MenuIcon,
  BugReport as BugReportIcon,
  Settings as SettingsIcon,
  // ListAlt as ListAltIcon, // 제거
  Style as StyleIcon, // 새로운 아이콘 추가
  Image as ImageIcon,
  LabelOutlined as LabelIcon,
} from '@mui/icons-material';
import {
  Box,
  Drawer,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  useTheme,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Page } from '../types';

interface AppLayoutProps {
  children: React.ReactNode;
  activeView: Page;
  onViewChange: (view: Page) => void;
}

const drawerWidth = 260;

const AppLayout: React.FC<AppLayoutProps> = ({ children, activeView, onViewChange }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { id: 'translation', label: t('menu.translation'), icon: <TranslateIcon /> },
    { id: 'parser-applier', label: t('menu.parserApplier'), icon: <SwapHorizIcon /> },
    { id: 'presets', label: t('menu.presets'), icon: <StyleIcon /> },
    { id: 'model-settings', label: t('menu.modelSettings'), icon: <SettingsIcon /> },
    { id: 'image-viewer', label: t('menu.imageViewer'), icon: <ImageIcon /> },
    { id: 'cache', label: t('menu.cache'), icon: <StorageIcon /> },
    { id: 'cache-tags', label: t('menu.cacheTags'), icon: <LabelIcon /> },
    { id: 'log', label: t('menu.log'), icon: <ArticleIcon /> },
    { id: 'app-settings', label: t('menu.appSettings'), icon: <MenuIcon /> },
    { id: 'bug-report', label: t('menu.bugReport'), icon: <BugReportIcon /> },
  ];

  const drawer = (
    <>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t('app.title')}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={activeView === (item.id as Page)}
              onClick={() => {
                onViewChange(item.id as Page);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                py: 1.5,
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}15`,
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}25`,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: activeView === (item.id as Page) ? theme.palette.primary.main : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: activeView === (item.id as Page) ? 'medium' : 'normal',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="menu items"
      >
        {/* 모바일용 메뉴 버튼 */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            mr: 2,
            display: { sm: 'none' },
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 1200,
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* 모바일 드로어 */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // 모바일 성능 향상을 위해
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* 데스크톱 드로어 */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
          overflow: 'auto',
        }}
      >
        <Container maxWidth="xl">{children}</Container>
      </Box>
    </Box>
  );
};

export default AppLayout;
