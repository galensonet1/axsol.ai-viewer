import React from 'react';
import {
  Box,
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
  ListItemIcon
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import TodayIcon from '@mui/icons-material/Today';
import MenuIcon from '@mui/icons-material/Menu';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { useLocation, Outlet, useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useUser } from '../context/UserContext.jsx';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import UserMenu from './UserMenu';

// Drawer eliminado: el menú principal ahora es un Menu anclado al botón hamburguesa

const adminPanelUrl = import.meta.env.VITE_ADMIN_PANEL_URL || `${API_BASE_URL}/admin/admin.html`;

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
  // Menú principal anclado al botón hamburguesa
  const [mainMenuAnchor, setMainMenuAnchor] = React.useState(null);
  const { hasRole, user } = useUser();
  const navigate = useNavigate();

  // No hay Drawer persistente; el menú principal es un Menu anclado

  const handleHomeClick = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    navigate('/', { replace: true });
  };

  const menuItems = [
    {
      text: 'Inicio',
      icon: <HomeOutlinedIcon fontSize="small" />,
      path: '/',
    },
    {
      text: 'Dashboard (próx.)',
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
      text: 'Plan (próx.)',
      path: `/projects/${projectId}/plan`,
      disabled: true,
      icon: <TodayIcon fontSize="small" />,
    },
    {
      text: 'Certificaciones (próx.)',
      path: `/projects/${projectId}/certifications`,
      disabled: true,
      icon: <TodayIcon fontSize="small" />,
    },
  ];

  const handleMainMenuOpen = (event) => setMainMenuAnchor(event.currentTarget);
  const handleMainMenuClose = () => setMainMenuAnchor(null);

  const isViewerRoute = location.pathname.includes('/viewer');

  React.useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent('axsol:main-drawer', { detail: { open: Boolean(mainMenuAnchor), isViewerRoute } }));
    } catch {}
  }, [mainMenuAnchor, isViewerRoute]);

  if (projectLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }
  
  if (projectError) {
    const isPermissionError = projectError.includes('403') || projectError.includes('permisos');
    
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: 2,
        p: 3,
        textAlign: 'center'
      }}>
        {isPermissionError ? (
          <>
            <Typography variant="h5" color="error" gutterBottom>
              Acceso Denegado
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              No tienes permisos para acceder a este proyecto.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/')}
              startIcon={<HomeOutlinedIcon />}
            >
              Volver al Inicio
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h5" color="error" gutterBottom>
              Error al cargar el proyecto
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {projectError}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
          </>
        )}
      </Box>
    );
  }

  const normalizeLogoUrl = (url) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/imagenes/')) return `${API_BASE_URL}${url}`;
    const idx1 = url.indexOf('/public/imagenes/');
    if (idx1 !== -1) {
      const file = url.substring(idx1 + '/public/imagenes/'.length);
      return `${API_BASE_URL}/imagenes/${file}`;
    }
    const idx2 = url.indexOf('/imagenes/');
    if (idx2 !== -1) {
      const file = url.substring(idx2 + '/imagenes/'.length);
      return `${API_BASE_URL}/imagenes/${file}`;
    }
    return url;
  };

  const primaryLogoUrlRaw = projectData?.opcions?.branding?.primaryLogoUrl || projectData?.client?.logo_url || null;
  const secondaryLogoUrlRaw = projectData?.opcions?.branding?.secondaryLogoUrl || null;
  const primaryLogoUrl = normalizeLogoUrl(primaryLogoUrlRaw);
  const secondaryLogoUrl = normalizeLogoUrl(secondaryLogoUrlRaw);
  const paletteRaw = projectData?.opcions?.branding?.colorPalette || {};
  const brand = {
    primary: paletteRaw.primary || '#0d6efd',
    secondary: paletteRaw.secondary || '#6c757d',
    accent: paletteRaw.accent || '#0dcaf0',
    background: paletteRaw.background || '#ffffff',
    surface: paletteRaw.surface || '#f8f9fa',
    text: paletteRaw.text || '#212529',
  };
  const addAlpha = (hex, alpha) => {
    try {
      const a = Math.max(0, Math.min(1, alpha));
      const toHex = (v) => v.toString(16).padStart(2, '0');
      let h = hex.startsWith('#') ? hex.slice(1) : hex;
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      if (h.length >= 6) return `#${h.slice(0,6)}${toHex(Math.round(a * 255))}`;
    } catch {}
    return hex;
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden', 
      backgroundColor: brand.background,
      // CSS variables for branding and panels
      '--ax-brand-primary': brand.primary,
      '--ax-brand-secondary': brand.secondary,
      '--ax-brand-accent': brand.accent,
      '--ax-brand-text': brand.text,
      '--ax-brand-surface': brand.surface,
      '--ax-brand-background': brand.background,
      '--ax-appbar-height': 'min(72px, 10vh)',
      '--ax-appbar-inner-height': 'calc(var(--ax-appbar-height) - 4px)',
      // Overlay panel defaults (dark glass) but accents from brand
      '--ax-panel-bg': 'rgba(0, 0, 0, 0.75)',
      '--ax-panel-text': 'rgba(255, 255, 255, 0.92)',
      '--ax-panel-border': 'rgba(255, 255, 255, 0.10)',
      '--ax-panel-button-bg': 'rgba(255, 255, 255, 0.08)',
      '--ax-panel-button-bg-hover': 'rgba(255, 255, 255, 0.15)',
      '--ax-panel-rail': 'rgba(255, 255, 255, 0.20)',
      '--ax-panel-contrast': '#ffffff',
    }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          px: 3,
          py: 0,
          backgroundColor: addAlpha(brand.surface, 0.92),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${addAlpha(brand.text, 0.08)}`,
          zIndex: theme.zIndex.drawer + 1,
          color: brand.text,
          height: 'calc(var(--ax-appbar-height) - 1px)',
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: 'var(--ax-appbar-height)',
            height: 'var(--ax-appbar-height)',
            maxHeight: 'var(--ax-appbar-height)',
            '& > *': { maxHeight: 'var(--ax-appbar-inner-height)' },
            '& .MuiIconButton-root': {
              height: 'min(44px, var(--ax-appbar-inner-height))',
              width: 'min(44px, var(--ax-appbar-inner-height))',
              paddingTop: '2px',
              paddingBottom: '2px',
            },
            '& img': {
              maxHeight: 'min(32px, var(--ax-appbar-inner-height))',
            },
            '& .MuiAvatar-root': {
              width: 'min(28px, var(--ax-appbar-inner-height))',
              height: 'min(28px, var(--ax-appbar-inner-height))',
            },
            '& .MuiButton-root': {
              maxHeight: 'var(--ax-appbar-inner-height)',
              paddingTop: '2px',
              paddingBottom: '2px',
            },
            '& .MuiChip-root': {
              maxHeight: 'calc(var(--ax-appbar-inner-height) - 4px)',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton onClick={handleMainMenuOpen} edge="start" size="large" aria-haspopup="true" aria-controls={Boolean(mainMenuAnchor) ? 'ax-main-menu' : undefined}>
              <MenuIcon />
            </IconButton>
            {primaryLogoUrl ? (
              <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: 180, flex: '0 1 180px' }}>
                <Box
                  component="img"
                  src={primaryLogoUrl}
                  alt="Logo Principal"
                  sx={{ maxHeight: 'min(32px, var(--ax-appbar-inner-height))', maxWidth: '100%', height: 'auto', width: '100%', objectFit: 'contain', display: 'block' }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }} noWrap>
                  {projectData?.client?.name || projectData?.client_name || 'Cliente'}
                </Typography>
                <Typography variant="h6" noWrap component="div">
                  {projectData ? projectData.name : 'Proyecto'}
                </Typography>
              </Box>
            )}
          </Box>
          {/* Center separator between primary and secondary logos (invisible spacer) */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: 4, height: { xs: 28, md: 32 }, borderRadius: 2, backgroundColor: 'transparent' }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {projectData?.status && (
              <Chip
                size="small"
                label={projectData.status}
                sx={{
                  backgroundColor: addAlpha(brand.secondary, 0.15),
                  color: brand.text,
                }}
              />
            )}
            {projectData?.progress != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 160, height: 6, borderRadius: 3, backgroundColor: addAlpha(brand.secondary, 0.25), overflow: 'hidden' }}>
                  <Box sx={{ width: `${Math.min(projectData.progress, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${brand.primary} 0%, ${brand.accent} 100%)` }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {projectData.progress}%
                </Typography>
              </Box>
            )}
            {secondaryLogoUrl ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', maxWidth: 180, flex: '0 1 180px' }}>
                <Box
                  component="img"
                  src={secondaryLogoUrl}
                  alt="Logo Secundario"
                  sx={{ maxHeight: 'min(32px, var(--ax-appbar-inner-height))', maxWidth: '100%', height: 'auto', width: '100%', objectFit: 'contain', display: 'block' }}
                />
              </Box>
            ) : (
              hasRole('Admin') && (
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
              )
            )}

            <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: addAlpha(brand.text, 0.1) }} />

            <UserMenu />
          </Box>
        </Toolbar>
      </AppBar>
      {/* Menú principal anclado al botón hamburguesa */}
      <Menu
        id="ax-main-menu"
        anchorEl={mainMenuAnchor}
        open={Boolean(mainMenuAnchor)}
        onClose={handleMainMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {menuItems.map((item) => {
          const selected = item.path ? location.pathname === item.path : false;
          return (
            <MenuItem
              key={item.text}
              onClick={() => {
                handleMainMenuClose();
                if (!item.disabled && item.path) navigate(item.path);
              }}
              disabled={item.disabled}
              selected={selected}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              {item.text}
            </MenuItem>
          );
        })}
      </Menu>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - var(--ax-appbar-height))',
          marginTop: 'var(--ax-appbar-height)',
          marginLeft: '0px',
          padding: isViewerRoute ? 0 : 3,
          overflow: isViewerRoute ? 'visible' : 'hidden',
          transition: theme.transitions.create(['margin-left', 'padding'], {
            duration: theme.transitions.duration.shorter,
          }),
        }}
      >
        <Box sx={{ flex: 1, position: 'relative', display: 'flex', overflow: isViewerRoute ? 'visible' : 'hidden', borderRadius: isViewerRoute ? 0 : 3, boxShadow: isViewerRoute ? 'none' : '0 12px 32px rgba(15,15,15,0.12)', background: isViewerRoute ? 'transparent' : `radial-gradient(circle at top, ${addAlpha(brand.surface, 0.4)}, ${addAlpha(brand.background, 0.9)})` }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectLayout;
