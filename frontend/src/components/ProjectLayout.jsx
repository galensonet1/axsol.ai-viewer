import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  Toolbar,
  AppBar,
  Typography,
  CircularProgress,
  IconButton,
  useTheme,
  Tooltip,
  Divider,
  Chip,
  Menu,
  MenuItem,
  Button,
  ListItemIcon,
  Avatar
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import TodayIcon from '@mui/icons-material/Today';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import TerminalIcon from '@mui/icons-material/Terminal';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { Link as RouterLink, useLocation, Outlet, useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useUser } from '../context/UserContext.jsx';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 200;
const collapsedDrawerWidth = 0;

const adminPanelPath = import.meta.env.VITE_ADMIN_PANEL_PATH || '/admin';

const ProjectLayout = () => {
  const location = useLocation();
  const { projectId } = useParams();
  const { projectData, projectLoading, projectError } = useProject();
  
  console.log('[ProjectLayout] Renderizando con:', {
    pathname: location.pathname,
    projectId,
    projectData: !!projectData
  });
  const theme = useTheme();
  // Inicializar drawer colapsado si estamos en el viewer
  const [drawerOpen, setDrawerOpen] = React.useState(
    !location.pathname.includes('/viewer')
  );
  const [adminAnchor, setAdminAnchor] = React.useState(null);
  const { hasRole } = useUser();
  const { logout } = useAuth0();
  const navigate = useNavigate();

  // Efecto para colapsar/expandir drawer según la ruta
  React.useEffect(() => {
    if (location.pathname.includes('/viewer')) {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(true);
    }
  }, [location.pathname]);

  const handleHomeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[ProjectLayout] Navegando a inicio...');
    console.log('[ProjectLayout] Ruta actual:', location.pathname);
    navigate('/', { replace: true });
  };

  const menuItems = [
    {
      text: 'Inicio',
      icon: <HomeOutlinedIcon fontSize="small" />,
      onClick: handleHomeClick,
    },
    {
      text: 'Dashboard (próximamente)',
      path: `/projects/${projectId}/dashboard`,
      icon: <DashboardIcon fontSize="small" />,
      disabled: true,
    },
    {
      text: 'Visualizador',
      path: `/projects/${projectId}/viewer`,
      icon: <ThreeDRotationIcon fontSize="small" />,
    },
    {
      text: 'Plan (próximamente)',
      path: `/projects/${projectId}/plan`,
      disabled: true,
      icon: <TodayIcon fontSize="small" />,
    },
  ];

  const toggleDrawer = () => {
    setDrawerOpen((prev) => !prev);
  };

  const handleAdminMenu = (event) => {
    setAdminAnchor(event.currentTarget);
  };

  const closeAdminMenu = () => {
    setAdminAnchor(null);
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
    closeAdminMenu();
  };

  const openAdminConsole = () => {
    closeAdminMenu();
    const targetUrl = adminPanelPath.startsWith('http')
      ? adminPanelPath
      : `${window.location.origin}${adminPanelPath}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const isViewerRoute = location.pathname.endsWith('/viewer');

  if (projectLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }
  if (projectError) {
    return <Typography color="error">Error al cargar el proyecto: {projectError.message}</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: theme.palette.background.default }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          px: 3,
          py: 1,
          backgroundColor: '#ffffffdd',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton onClick={toggleDrawer} edge="start" size="large">
              {drawerOpen ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>
            {projectData?.client?.logo_url && (
              <Avatar
                src={projectData.client.logo_url}
                alt={projectData?.client?.name}
                variant="rounded"
                sx={{ width: 40, height: 40, mr: 1 }}
              />
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }} noWrap>
                {projectData?.client?.name || projectData?.client_name || 'Cliente'}
              </Typography>
              <Typography variant="h6" noWrap component="div">
                {projectData ? projectData.name : 'Proyecto'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {projectData?.status && (
              <Chip
                size="small"
                label={projectData.status}
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.06)',
                  color: theme.palette.text.primary,
                }}
              />
            )}
            {projectData?.progress != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 160, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                  <Box sx={{ width: `${Math.min(projectData.progress, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #ff9800 0%, #ffb74d 100%)' }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {projectData.progress}%
                </Typography>
              </Box>
            )}
            <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'rgba(0,0,0,0.08)' }} />
            {hasRole('Admin') && (
              <Tooltip title="Panel Admin">
                <span>
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="small"
                    startIcon={<AdminPanelSettingsIcon fontSize="small" />}
                    onClick={handleAdminMenu}
                  >
                    Panel Admin
                  </Button>
                </span>
              </Tooltip>
            )}
            <Menu
              anchorEl={adminAnchor}
              open={Boolean(adminAnchor)}
              onClose={closeAdminMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Cerrar Sesión
              </MenuItem>
              {hasRole('Admin') && (
                <MenuItem onClick={openAdminConsole}>
                  <ListItemIcon>
                    <TerminalIcon fontSize="small" />
                  </ListItemIcon>
                  Consola Admin
                </MenuItem>
              )}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(16px)',
            borderRight: '1px solid rgba(0,0,0,0.05)',
            top: 72,
            height: 'calc(100vh - 72px)',
            paddingTop: '16px',
            paddingBottom: '16px',
            paddingLeft: '12px',
            paddingRight: '12px',
            overflowX: 'hidden',
            transform: drawerOpen ? 'translateX(0)' : `translateX(-${drawerWidth}px)`,
            transition: theme.transitions.create(['transform'], {
              duration: theme.transitions.duration.shorter,
            }),
          },
        }}
      >
        <List sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {menuItems.map((item) => {
            const selected = item.path ? location.pathname === item.path : false;
            const content = (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 1.5, backgroundColor: selected ? 'rgba(63, 81, 181, 0.15)' : 'transparent', color: selected ? '#3f51b5' : 'inherit' }}>
                  {item.icon}
                </Box>
                <Typography variant="body2" fontSize="0.85rem" fontWeight={selected ? 600 : 500} color={selected ? '#3f51b5' : 'inherit'}>
                  {item.text}
                </Typography>
              </Box>
            );

            return (
              <ListItemButton
                key={item.text}
                component={item.onClick ? 'button' : RouterLink}
                to={item.onClick ? undefined : item.path}
                onClick={item.onClick}
                disabled={item.disabled}
                selected={selected}
                sx={{
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 0.75,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(63,81,181,0.1)',
                  }
                }}
              >
                {content}
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 72px)',
          marginTop: '72px',
          marginLeft: drawerOpen ? `${drawerWidth}px` : '0px',
          padding: isViewerRoute ? 0 : 3,
          overflow: isViewerRoute ? 'visible' : 'hidden',
          transition: theme.transitions.create(['margin-left', 'padding'], {
            duration: theme.transitions.duration.shorter,
          }),
        }}
      >
        <Box sx={{ flex: 1, position: 'relative', display: 'flex', overflow: isViewerRoute ? 'visible' : 'hidden', borderRadius: isViewerRoute ? 0 : 3, boxShadow: isViewerRoute ? 'none' : '0 12px 32px rgba(15,15,15,0.12)', background: isViewerRoute ? 'transparent' : 'radial-gradient(circle at top, rgba(255,255,255,0.04), rgba(0,0,0,0.85))' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectLayout;
