import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import { Box, IconButton, Menu, MenuItem, Avatar, Typography, ListItemIcon } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import LogoutIcon from '@mui/icons-material/Logout';
import TerminalIcon from '@mui/icons-material/Terminal';
import EventsMonitorModal from './EventsMonitorModal';

const UserMenu = () => {
  const { user, hasRole } = useUser();
  const { logout } = useAuth0();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [anchorEl, setAnchorEl] = useState(null);
  const [eventsModalOpen, setEventsModalOpen] = useState(false);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAdminPanel = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    window.open(`${apiBase}/admin/admin.html`, '_blank');
    handleClose();
  };

  const handleEventsMonitor = () => {
    setEventsModalOpen(true);
    handleClose();
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
    handleClose();
  };

  // Verificar roles según especificación final:
  // Monitor de Eventos: Solo rol=6 (Superadmin)
  // Consola Admin: rol=5 (Admin) o rol=6 (Superadmin)
  const isAdmin = user?.roleIds?.includes(5) || user?.roles?.includes('Admin');
  const isSuperAdmin = user?.roleIds?.includes(6) || user?.roles?.includes('Superadmin');
  const hasMonitorAccess = isSuperAdmin;           // Solo Superadmin puede ver Monitor
  const hasAdminAccess = isAdmin || isSuperAdmin;  // Admin O Superadmin pueden ver Consola
  
  // Debug para verificar roles
  console.log('[UserMenu] User roleIds:', user?.roleIds, 'roles:', user?.roles);
  console.log('[UserMenu] isSuperAdmin:', isSuperAdmin, 'hasAdminAccess:', hasAdminAccess);

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="account of current user"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleMenu}
        color="inherit"
      >
        <Avatar src={user?.picture} alt={user?.name}>
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </Avatar>
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem disabled>
          <Typography variant="subtitle1">{user?.name}</Typography>
        </MenuItem>
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Cerrar Sesión
        </MenuItem>
        
        {hasAdminAccess && (
          <MenuItem onClick={handleAdminPanel}>
            <ListItemIcon>
              <TerminalIcon fontSize="small" />
            </ListItemIcon>
            Consola Admin
          </MenuItem>
        )}
        
        {hasMonitorAccess && (
          <MenuItem onClick={handleEventsMonitor}>
            <ListItemIcon>
              <AnalyticsIcon fontSize="small" />
            </ListItemIcon>
            Monitor de Eventos
          </MenuItem>
        )}
      </Menu>
      
      {/* Modal de Monitor de Eventos */}
      <EventsMonitorModal
        open={eventsModalOpen}
        onClose={() => setEventsModalOpen(false)}
      />
    </Box>
  );
};

export default UserMenu;
