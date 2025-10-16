import React, { useMemo, useState, useEffect } from 'react';
import { FormGroup, FormControlLabel, Checkbox, Typography, Box, Divider, IconButton, Paper, Button, Collapse, Slider } from '@mui/material';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined';
import ArchitectureOutlinedIcon from '@mui/icons-material/ArchitectureOutlined';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import dayjs from 'dayjs';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import './LayerSelector.css';
import { useUser } from '../context/UserContext';
import { useProjectPermissions } from '../hooks/useProjectPermissions';

const PHOTO_ICON_SRC = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26' fill='none'%3e%3cg stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M22 21H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3.4l1.4-2h8.4l1.4 2H22a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z'/%3e%3ccircle cx='13' cy='14' r='4'/%3e%3c/g%3e%3c/svg%3e";
const PHOTO_360_ICON_SRC = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28' fill='none'%3e%3cg stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3ccircle cx='14' cy='14' r='4'/%3e%3cpath d='M5 9.5c2.2-2.3 5.4-3.5 9-3.5s6.8 1.2 9 3.5'/%3e%3cpath d='M23 18.5c-2.2 2.3-5.4 3.5-9 3.5s-6.8-1.2-9-3.5'/%3e%3cpath d='M6.5 11.5L4 9'/%3e%3cpath d='M6.5 16.5 4 19'/%3e%3cpath d='M21.5 11.5 24 9'/%3e%3cpath d='M21.5 16.5 24 19'/%3e%3cpath d='M10.5 14h7'/%3e%3c/g%3e%3c/svg%3e";

const LayerSelector = ({
  projectId,
  layerVisibility,
  onLayerVisibilityChange,
  open,
  onToggle,
  availableCaptureDates = [],
  selectedCaptureDate,
  onCaptureDateChange,
  datesLoading = false,
  comparisonSide = null, // 'left', 'right', or null for normal mode
  ifcList = [],
  ifcHeightOffset = 0,
  onIfcHeightOffsetChange,
  onIfcHeightOffsetChangeCommitted,
  hasActivityPlan = false,
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [fineOffset, setFineOffset] = useState(0);
  const { hasRole } = useUser() || { hasRole: () => false };
  const { canEditProject } = useProjectPermissions(projectId);
  const [openRealidad, setOpenRealidad] = useState(false);
  const [openProyecto, setOpenProyecto] = useState(false);

  // Al colapsar el panel principal, cerrar calendario y colapsar grupos
  useEffect(() => {
    if (!open) {
      setCalendarOpen(false);
      setOpenRealidad(false);
      setOpenProyecto(false);
    }
  }, [open]);

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

  // Cálculos para grupos
  const realidadChildren = ['realidad3D', 'fotos', 'fotos360'];
  const realidadAllOn = realidadChildren.every((k) => !!layerVisibility[k]);
  const realidadSomeOn = realidadChildren.some((k) => !!layerVisibility[k]) && !realidadAllOn;

  const ifcArray = Array.isArray(ifcList) ? ifcList : [];
  const ifcMap = layerVisibility.ifcs || {};
  const ifcAllOn = ifcArray.length > 0 && ifcArray.every((item) => !!ifcMap[item.asset_id]);
  const ifcSomeOn = ifcArray.some((item) => !!ifcMap[item.asset_id]) && !ifcAllOn;

  const toggleRealidadGroup = (checked) => {
    onLayerVisibilityChange({
      ...layerVisibility,
      realidad3D: checked,
      fotos: checked,
      fotos360: checked,
    });
  };

  const toggleIfcGroup = (checked) => {
    const newMap = { ...(layerVisibility.ifcs || {}) };
    for (const item of ifcArray) {
      if (item.asset_id) newMap[item.asset_id] = checked;
    }
    onLayerVisibilityChange({
      ...layerVisibility,
      proyecto3D: checked,
      ifcs: newMap,
    });
  };

  const toggleIfcChild = (assetId, checked) => {
    const newMap = { ...(layerVisibility.ifcs || {}) };
    newMap[assetId] = checked;
    const anySelected = ifcArray.some((it) => !!newMap[it.asset_id]);
    onLayerVisibilityChange({
      ...layerVisibility,
      proyecto3D: anySelected,
      ifcs: newMap,
    });
  };

  return (
    <Box className={`layer-panel ${open ? 'open' : 'collapsed'}`}>
      {!open && (
        <IconButton className="layer-panel-toggle-collapsed" size="small" onClick={onToggle}>
          <MenuOpenIcon fontSize="small" />
        </IconButton>
      )}

      {open && (
        <Paper className={`layer-selector ${comparisonSide ? 'layer-selector-' + comparisonSide : ''}`} elevation={3}>
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
                      disabled={false}
                      shouldDisableDate={(date) => {
                        // Si no hay fechas disponibles, no deshabilitar ninguna para que el calendario sea visible
                        if (availableSet.size === 0) {
                          return false;
                        }
                        // Deshabilitar solo las fechas que no estén en el set disponible
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
              {/* 3- Informes IA (placeholder) */}
              <FormControlLabel
                control={<Checkbox size="small" disabled />}
                label={(<span className="layer-label">Informes IA</span>)}
              />

              {/* Plan de Actividades (si existe) */}
              {hasActivityPlan && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!layerVisibility.plan}
                      onChange={handleLayerChange}
                      name="plan"
                      size="small"
                    />
                  }
                  label={(<span className="layer-label">Plan de Actividades</span>)}
                />
              )}

              <Divider sx={{ my: 1 }} />

              {/* 2- Realidad (grupo) */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={realidadAllOn}
                      indeterminate={realidadSomeOn}
                      onChange={(e) => toggleRealidadGroup(e.target.checked)}
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
                <IconButton size="small" onClick={() => setOpenRealidad((p) => !p)} sx={{ color: '#fff' }}>
                  {openRealidad ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>

              <Collapse in={openRealidad} timeout="auto" unmountOnExit>
                <Box sx={{ pl: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={layerVisibility.realidad3D}
                        onChange={handleLayerChange}
                        name="realidad3D"
                        size="small"
                      />
                    }
                    label={(<span className="layer-label">3D Tiles</span>)}
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
                  {/* Opacidad Realidad 3D (todos los usuarios) */}
                  <Box sx={{ mt: 1.5, pr: 2 }}>
                    <Typography variant="caption" color="#ddd" sx={{ display: 'block', mb: 0.5 }}>
                      Opacidad 3D: {layerVisibility.realidadOpacity ?? 100}%
                    </Typography>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={typeof layerVisibility.realidadOpacity === 'number' ? layerVisibility.realidadOpacity : 100}
                      onChange={(event, newValue) => {
                        onLayerVisibilityChange({
                          ...layerVisibility,
                          realidadOpacity: Array.isArray(newValue) ? newValue[0] : newValue,
                        });
                      }}
                      size="small"
                      sx={{
                        color: '#ffffff',
                        height: 3,
                        '& .MuiSlider-thumb': { width: 12, height: 12, backgroundColor: '#ffffff' },
                        '& .MuiSlider-track': { height: 3, backgroundColor: '#ffffff', border: 'none', borderRadius: 1.5 },
                        '& .MuiSlider-rail': { height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1.5 },
                      }}
                    />
                  </Box>
                </Box>
              </Collapse>

              <Divider sx={{ my: 1 }} />

              {/* 4- Proyecto 3D (grupo IFCs) */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={ifcArray.length > 0 && ifcAllOn}
                      indeterminate={ifcSomeOn}
                      onChange={(e) => toggleIfcGroup(e.target.checked)}
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
                <IconButton size="small" onClick={() => setOpenProyecto((p) => !p)} sx={{ color: '#fff' }}>
                  {openProyecto ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>
              <Collapse in={openProyecto} timeout="auto" unmountOnExit>
                {ifcArray.length > 0 ? (
                  <Box sx={{ pl: 3, pr: 1, display: 'flex', flexDirection: 'column', maxHeight: 220, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                    {/* Lista de IFCs como subcapas */}
                    {ifcArray.map((it) => (
                      <FormControlLabel
                        key={it.id || it.asset_id}
                        control={
                          <Checkbox
                            checked={!!ifcMap[it.asset_id]}
                            onChange={(e) => toggleIfcChild(it.asset_id, e.target.checked)}
                            size="small"
                          />
                        }
                        label={(<span className="layer-label">{it.file_name || `IFC ${it.asset_id}`}</span>)}
                      />
                    ))}
                    {/* Slider de altura IFC (solo Admin o con permisos de edición) */}
                    {(hasRole('Admin') || canEditProject()) && (
                      <Paper variant="outlined" sx={{ mt: 1.5, pr: 2, pl: 2, py: 1.25, background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="#fff" fontWeight={600}>
                            Altura IFC
                          </Typography>
                          <IconButton
                            size="small"
                            title="Guardar altura IFC"
                            onClick={() => {
                              if (onIfcHeightOffsetChangeCommitted) onIfcHeightOffsetChangeCommitted(ifcHeightOffset || 0);
                            }}
                            sx={{ color: '#fff' }}
                          >
                            <SaveOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography variant="caption" color="#ddd" sx={{ display: 'block', mb: 0.25 }}>
                          Total: {Number(ifcHeightOffset || 0).toFixed(2)} m
                        </Typography>
                        {(() => {
                          const maxOffset = 2000; // metros
                          const toSlider = (meters) => {
                            const t = Math.max(-1, Math.min(1, (Number(meters) || 0) / maxOffset));
                            return Math.cbrt(t) * 100;
                          };
                          const fromSlider = (sliderVal) => {
                            const x = (Array.isArray(sliderVal) ? sliderVal[0] : sliderVal) / 100;
                            return maxOffset * Math.pow(x, 3);
                          };
                          const baseMeters = (Number(ifcHeightOffset) || 0) - (Number(fineOffset) || 0);
                          const sliderValue = toSlider(baseMeters);
                          return (
                            <>
                              <Typography variant="caption" color="#bbb">Ajuste grueso</Typography>
                              <Slider
                                min={-100}
                                max={100}
                                step={1}
                                value={Number.isFinite(sliderValue) ? sliderValue : 0}
                                onChange={(e, val) => {
                                  const coarseMeters = fromSlider(val);
                                  const newTotal = coarseMeters + (Number(fineOffset) || 0);
                                  if (onIfcHeightOffsetChange) onIfcHeightOffsetChange(newTotal);
                                }}
                                size="small"
                                sx={{
                                  color: '#ffffff',
                                  height: 3,
                                  '& .MuiSlider-thumb': { width: 12, height: 12, backgroundColor: '#ffffff' },
                                  '& .MuiSlider-track': { height: 3, backgroundColor: '#ffffff', border: 'none', borderRadius: 1.5 },
                                  '& .MuiSlider-rail': { height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1.5 },
                                }}
                              />
                            </>
                          );
                        })()}
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="#bbb">Ajuste fino</Typography>
                          <Slider
                            min={-20}
                            max={20}
                            step={0.1}
                            value={Number.isFinite(fineOffset) ? fineOffset : 0}
                            onChange={(e, val) => {
                              const newFine = Array.isArray(val) ? val[0] : val;
                              const base = (Number(ifcHeightOffset) || 0) - (Number(fineOffset) || 0);
                              setFineOffset(newFine);
                              const newTotal = base + newFine;
                              if (onIfcHeightOffsetChange) onIfcHeightOffsetChange(newTotal);
                            }}
                            size="small"
                            sx={{
                              color: '#ffffff',
                              height: 3,
                              '& .MuiSlider-thumb': { width: 12, height: 12, backgroundColor: '#ffffff' },
                              '& .MuiSlider-track': { height: 3, backgroundColor: '#ffffff', border: 'none', borderRadius: 1.5 },
                              '& .MuiSlider-rail': { height: 3, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 1.5 },
                            }}
                          />
                        </Box>
                      </Paper>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ pl: 3 }}>
                    <Typography variant="caption" color="#ddd">No hay IFCs para este proyecto</Typography>
                  </Box>
                )}
              </Collapse>

              <Divider sx={{ my: 1 }} />

              {/* 1- Layout */}
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

              {/* Areas Nqn - Oil&Gas */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!layerVisibility.baseMap}
                    onChange={handleLayerChange}
                    name="baseMap"
                    size="small"
                  />
                }
                label={(
                  <span className="layer-label">
                    <MapOutlinedIcon fontSize="small" className="layer-label-icon" />
                    Areas Nqn - Oil&Gas
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
        </Paper>
      )}
    </Box>
  );
};

export default LayerSelector;
