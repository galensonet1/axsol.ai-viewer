import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  LinearProgress,
  Chip
} from '@mui/material';

const getStatusColor = (status) => {
  switch (status) {
    case 'Activo':
      return 'success';
    case 'Pausado':
      return 'warning';
    case 'Completado':
      return 'primary';
    case 'Planificado':
      return 'info';
    default:
      return 'default';
  }
};

const ProjectList = ({ projects }) => {
  // Validar que projects sea un array
  const projectList = Array.isArray(projects) ? projects : [];
  
  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #eee' }}>
        Lista de Proyectos
      </Typography>
      <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
        <List>
          {projectList.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="No hay proyectos disponibles"
                secondary="Los proyectos aparecerán aquí cuando estén disponibles"
              />
            </ListItem>
          ) : (
            projectList.map((project) => (
            <ListItem key={project.id} disablePadding divider>
              <ListItemButton component={RouterLink} to={`/projects/${project.id}/dashboard`}>
                <ListItemText
                  primary={project.name}
                  secondaryTypographyProps={{ component: 'div' }} // <-- CORRECCIÓN AQUÍ
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Chip label={project.status} color={getStatusColor(project.status)} size="small" />
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={project.progress_percentage || 0} 
                        sx={{ width: '80%', mr: 1, height: 8, borderRadius: 5 }}
                      />
                      <Typography variant="body2" color="text.secondary">{`${project.progress_percentage || 0}%`}</Typography>
                    </Box>
                  </Box>
                }
                />
              </ListItemButton>
            </ListItem>
          )))}
        </List>
      </Box>
    </Paper>
  );
};

export default ProjectList;
