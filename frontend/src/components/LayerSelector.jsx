import React, { useMemo, useState } from 'react';
import { FormGroup, FormControlLabel, Checkbox, Typography, Box, Divider, IconButton, Paper, Button, Collapse, Slider } from '@mui/material';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import ArchitectureOutlinedIcon from '@mui/icons-material/ArchitectureOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import './LayerSelector.css';

const PHOTO_ICON_SRC = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26' fill='none'%3e%3cg stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M22 21H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3.4l1.4-2h8.4l1.4 2H22a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z'/%3e%3ccircle cx='13' cy='14' r='4'/%3e%3c/g%3e%3c/svg%3e";
const PHOTO_360_ICON_SRC = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28' fill='none'%3e%3cg stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3ccircle cx='14' cy='14' r='4'/%3e%3cpath d='M5 9.5c2.2-2.3 5.4-3.5 9-3.5s6.8 1.2 9 3.5'/%3e%3cpath d='M23 18.5c-2.2 2.3-5.4 3.5-9 3.5s-6.8-1.2-9-3.5'/%3e%3cpath d='M6.5 11.5L4 9'/%3e%3cpath d='M6.5 16.5 4 19'/%3e%3cpath d='M21.5 11.5 24 9'/%3e%3cpath d='M21.5 16.5 24 19'/%3e%3cpath d='M10.5 14h7'/%3e%3c/g%3e%3c/svg%3e";

const LayerSelector = ({
  layerVisibility,
  onLayerVisibilityChange,
  open,
  onToggle,
  availableCaptureDates = [],
  selectedCaptureDate,
  onCaptureDateChange,
  datesLoading = false,
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleLayerChange = (event) => {
    onLayerVisibilityChange({
      ...layerVisibility,
      [event.target.name]: event.target.checked,
    });
  };

  const availableSet = useMemo(() => new Set(availableCaptureDates), [availableCaptureDates]);
  const selectedDay = selectedCaptureDate ? dayjs(selectedCaptureDate, 'YYYY-MM-DD') : null;
  const disableAllDates = availableSet.size === 0 && !datesLoading;
  
  let selectedLabel;
  if (datesLoading) {
    selectedLabel = 'Cargando fechas...';
  } else if (availableSet.size === 0) {
    selectedLabel = 'Sin fechas disponibles';
  } else if (selectedDay) {
    selectedLabel = selectedDay.format('DD MMM YYYY');
  } else {
    selectedLabel = 'Sin selección';
  }

  return (
    <Box className={`layer-panel ${open ? 'open' : 'collapsed'}`}>
      {!open && (
        <IconButton className="layer-panel-toggle-collapsed" size="small" onClick={onToggle}>
          <MenuOpenIcon fontSize="small" />
        </IconButton>
      )}

      {open && (
        <Paper elevation={6} className="layer-selector-surface">
          <Box className="layer-selector-container">
            {/* Header con botón de colapso interno */}
            <Box className="layer-selector-header">
              <IconButton className="layer-panel-toggle-internal" size="small" onClick={onToggle}>
                <CloseFullscreenIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Calendario primero */}
            <Box className="calendar-mini">
              <Button
                variant="contained"
                size="small"
                className="calendar-toggle"
                onClick={() => setCalendarOpen((prev) => !prev)}
                disabled={disableAllDates}
                startIcon={<CalendarTodayIcon fontSize="small" />}
              >
                {calendarOpen ? 'Cerrar calendario' : 'Fechas de captura'}
              </Button>
              <Typography variant="caption" className="calendar-selected-label">
                {selectedLabel}
              </Typography>
              <Collapse in={calendarOpen} timeout="auto" unmountOnExit>
                <Box className="calendar-wrapper">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateCalendar
                      value={selectedDay}
                      onChange={(value) => {
                        if (!onCaptureDateChange) {
                          return;
                        }
                        if (!value || !value.isValid()) {
                          onCaptureDateChange(null);
                          return;
                        }
                        onCaptureDateChange(value.startOf('day').format('YYYY-MM-DD'));
                      }}
                      disabled={disableAllDates}
                      shouldDisableDate={(date) => {
                        if (disableAllDates) {
                          return true;
                        }
                        return !availableSet.has(date.startOf('day').format('YYYY-MM-DD'));
                      }}
                      views={['day']}
                      showDaysOutsideCurrentMonth
                      sx={{
                        '& .MuiPickersDay-root': {
                          fontSize: '0.65rem',
                          width: 22,
                          height: 22,
                          margin: '0 0.5px',
                        },
                        '& .MuiPickersCalendarHeader-root': {
                          paddingLeft: 0.5,
                          paddingRight: 0.5,
                          minHeight: 32,
                        },
                        '& .MuiDayCalendar-weekDayLabel': {
                          width: 22,
                          height: 22,
                          margin: '0 0.5px',
                          fontSize: '0.6rem',
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Box>
              </Collapse>
            </Box>

            {/* Título CAPAS después del calendario */}
            <Typography variant="subtitle2" className="layer-selector-title">
              CAPAS
            </Typography>

            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={layerVisibility.layout}
                    onChange={handleLayerChange}
                    name="layout"
                    size="small"
                  />
                }
                label={(
                  <span className="layer-label">
                    <MapOutlinedIcon fontSize="small" className="layer-label-icon" />
                    Layout
                  </span>
                )}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={layerVisibility.realidad3D}
                    onChange={handleLayerChange}
                    name="realidad3D"
                    size="small"
                  />
                }
                label={(
                  <span className="layer-label">
                    <ViewInArOutlinedIcon fontSize="small" className="layer-label-icon" />
                    Realidad 3D
                  </span>
                )}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={layerVisibility.proyecto3D}
                    onChange={handleLayerChange}
                    name="proyecto3D"
                    size="small"
                  />
                }
                label={(
                  <span className="layer-label">
                    <ArchitectureOutlinedIcon fontSize="small" className="layer-label-icon" />
                    Proyecto 3D
                  </span>
                )}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={layerVisibility.fotos}
                    onChange={handleLayerChange}
                    name="fotos"
                    size="small"
                  />
                }
                label={(
                  <span className="layer-label">
                    <img src={PHOTO_ICON_SRC} alt="Icono fotos" className="layer-label-icon-img" />
                    Fotos
                  </span>
                )}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={layerVisibility.fotos360}
                    onChange={handleLayerChange}
                    name="fotos360"
                    size="small"
                  />
                }
                label={(
                  <span className="layer-label">
                    <img src={PHOTO_360_ICON_SRC} alt="Icono fotos 360" className="layer-label-icon-img" />
                    Fotos 360
                  </span>
                )}
              />
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ px: 1.5, py: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontSize: '0.7rem',
                    color: '#ffffff',
                    fontWeight: 500,
                    letterSpacing: '0.02em'
                  }}
                >
                  🏔️ Terreno {layerVisibility.terreno}%
                </Typography>
                <Slider
                  value={layerVisibility.terreno}
                  onChange={(event, newValue) => {
                    onLayerVisibilityChange({
                      ...layerVisibility,
                      terreno: newValue,
                    });
                  }}
                  min={0}
                  max={100}
                  step={5}
                  size="small"
                  sx={{
                    color: '#ffffff',
                    height: 3,
                    '& .MuiSlider-thumb': {
                      width: 12,
                      height: 12,
                      backgroundColor: '#ffffff',
                      border: '2px solid rgba(255, 255, 255, 0.8)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                        transform: 'scale(1.1)',
                      },
                      '&.Mui-focusVisible': {
                        boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.16)',
                      },
                    },
                    '& .MuiSlider-track': {
                      height: 3,
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: 1.5,
                    },
                    '& .MuiSlider-rail': {
                      height: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: 1.5,
                    },
                  }}
                />
              </Box>
            </FormGroup>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default LayerSelector;
