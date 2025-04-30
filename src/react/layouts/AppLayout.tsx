import {
  Translate as TranslateIcon,
  Storage as StorageIcon,
  Article as ArticleIcon,
  Menu as MenuIcon,
  BugReport as BugReportIcon,
  ListAlt as ListAltIcon, // 아이콘 추가
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
import type { Page } from '../types';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const drawerWidth = 260;

const AppLayout: React.FC<AppLayoutProps> = ({ children, currentPage, onPageChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { id: 'translation', label: '번역', icon: <TranslateIcon /> },
    { id: 'cache', label: '캐시 관리', icon: <StorageIcon /> },
    { id: 'prompt-preset', label: '프롬프트 프리셋', icon: <ListAltIcon /> }, // 메뉴 항목 추가
    { id: 'log', label: '로그 보기', icon: <ArticleIcon /> },
    { id: 'bug-report', label: '버그 제보', icon: <BugReportIcon /> },
  ];

  const drawer = (
    <>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          AI 번역기
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={currentPage === (item.id as Page)}
              onClick={() => {
                onPageChange(item.id as Page);
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
                  color: currentPage === (item.id as Page) ? theme.palette.primary.main : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: currentPage === (item.id as Page) ? 'medium' : 'normal',
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
