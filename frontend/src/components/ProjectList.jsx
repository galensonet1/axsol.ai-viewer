import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Box,
  LinearProgress,
  Stack,
  Tooltip,
} from '@mui/material';
import { API_BASE_URL } from '../config/api';

const normalizeLogoUrl = (rawUrl) => {
  if (!rawUrl) return null;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  if (rawUrl.startsWith('/imagenes/')) return `${API_BASE_URL}${rawUrl}`;
  const idx1 = rawUrl.indexOf('/public/imagenes/');
  if (idx1 !== -1) {
    const file = rawUrl.substring(idx1 + '/public/imagenes/'.length);
    return `${API_BASE_URL}/imagenes/${file}`;
  }
  const idx2 = rawUrl.indexOf('/imagenes/');
  if (idx2 !== -1) {
    const file = rawUrl.substring(idx2 + '/imagenes/'.length);
    return `${API_BASE_URL}/imagenes/${file}`;
  }
  return `${API_BASE_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
};

const calculateProgressPercentage = (project) => {
  const { start_date: startDateIso, end_date: endDateIso } = project;
  if (!startDateIso || !endDateIso) {
    return Number.isFinite(project.progress_percentage) ? project.progress_percentage : 0;
  }

  const start = new Date(startDateIso);
  const end = new Date(endDateIso);
  const now = new Date();

  if (Number.isNaN(start) || Number.isNaN(end) || start >= end) {
    return Number.isFinite(project.progress_percentage) ? project.progress_percentage : 0;
  }

  if (now <= start) return 0;
  if (now >= end) return 100;

  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.round((elapsed / total) * 100);
};

const ProjectList = ({ projects }) => {
  // Validar que projects sea un array
  const projectList = Array.isArray(projects) ? projects : [];
  
  return (
    <Box
      sx={{
        maxHeight: '80vh',
        maxWidth: '50vw',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
        color: '#fff',
        alignSelf: 'center',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          p: 1.5,
          display: 'grid',
          gap: 1,
          gridTemplateColumns: (theme) => {
            const count = projectList.length;
            if (count <= 5) return 'repeat(1, 1fr)';
            if (count <= 12) return 'repeat(2, 1fr)';
            return 'repeat(3, 1fr)';
          },
          gridAutoRows: '1fr',
          alignContent: 'start',
          justifyContent: 'center',
          overflow: 'auto',
          maxHeight: '100%',
        }}
      >
        {projectList.length === 0 ? (
          <Typography
            variant="body2"
            color="rgba(255,255,255,0.7)"
            sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 3 }}
          >
            No hay proyectos disponibles
          </Typography>
        ) : (
          projectList.map((project) => {
            const palette = project?.opcions?.branding?.colorPalette || {};
            const accentColor = palette.accent || palette.primary || palette.secondary || '#FF6B00';
            const logoUrl = normalizeLogoUrl(project?.opcions?.branding?.primaryLogoUrl || project?.client?.logo_url || null);
            const progress = calculateProgressPercentage(project);
            const progressGradient = 'linear-gradient(90deg, #D32F2F 0%, #FBC02D 50%, #388E3C 100%)';
            const accentOverlay = `${accentColor}30`;

            return (
              <Box
                key={project.id}
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.8) !important',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.15)',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  aspectRatio: '1',
                  display: 'flex',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                  ':hover': {
                    borderColor: accentColor,
                    boxShadow: `0 6px 12px rgba(0,0,0,0.4), 0 0 0 1px ${accentOverlay}`,
                    backgroundColor: 'rgba(0,0,0,0.9) !important',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  component={RouterLink}
                  to={`/projects/${project.id}/viewer`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    justifyContent: 'space-between',
                    gap: 1,
                    p: 1,
                    textDecoration: 'none',
                    color: 'inherit',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      bgcolor: 'rgba(0,0,0,0.6)',
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 0.5,
                      px: 0.75,
                      border: '1px solid rgba(255,255,255,0.08)',
                      minHeight: 36,
                    }}
                  >
                    {logoUrl ? (
                      <Box
                        component="img"
                        src={logoUrl}
                        alt={project.name}
                        sx={{
                          maxWidth: '100%',
                          maxHeight: 28,
                          objectFit: 'contain',
                          filter: 'brightness(1.05)',
                        }}
                      />
                    ) : (
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff', textShadow: '0 1px 1px rgba(0,0,0,0.6)' }}>
                        {project.name}
                      </Typography>
                    )}
                  </Box>

                  <Stack spacing={0.5} sx={{ mt: 'auto' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: '0.75rem' }}>
                      Avance del proyecto
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title={`${progress}%`} placement="top">
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            flexGrow: 1,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(255,255,255,0.12)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundImage: progressGradient,
                            },
                          }}
                        />
                      </Tooltip>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff', fontSize: '0.75rem' }}>
                        {`${progress}%`}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default ProjectList;
