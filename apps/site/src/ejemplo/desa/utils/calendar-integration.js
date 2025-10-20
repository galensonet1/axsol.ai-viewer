/**
 * Integración de calendario con timeline de Cesium
 * Sincroniza la selección de fechas con el reloj y timeline de Cesium
 */

class CalendarIntegration {
  constructor(viewer, config, deliveryDates = []) {
    this.viewer = viewer;
    this.config = config;
    this.deliveryDates = deliveryDates.length > 0 ? deliveryDates : [];
    this.calendarInput = null;
    this.flatpickrInstance = null;
    
    this.init();
  }

  async init() {
    try {
      // Si no hay fechas de entrega, cargar desde la API como fallback
      if (this.deliveryDates.length === 0) {
        await this.loadDeliveryDates();
      } else {
        console.log(`📅 Usando ${this.deliveryDates.length} fechas de entregas proporcionadas`);
      }
      
      // Inicializar el calendario
      this.initializeCalendar();
      
      // Configurar sincronización con timeline
      this.setupTimelineSync();
      
      console.log('✅ Calendar Integration inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando Calendar Integration:', error);
    }
  }

  async loadDeliveryDates() {
    try {
      // Obtener fechas de entregas desde la API
      const response = await fetch(`${this.config.rutas.api_base_url}/deliveries/${this.config.proyecto.id_proyecto}`);
      
      if (response.ok) {
        const deliveries = await response.json();
        this.deliveryDates = deliveries.map(delivery => new Date(delivery.fecha_entrega));
      } else {
        // Fallback: usar fechas de ejemplo basadas en el proyecto
        this.generateSampleDeliveryDates();
      }
      
      console.log(`📅 Cargadas ${this.deliveryDates.length} fechas de entregas`);
    } catch (error) {
      console.warn('⚠️ Error cargando fechas de entregas, usando fechas de ejemplo:', error);
      this.generateSampleDeliveryDates();
    }
  }

  generateSampleDeliveryDates() {
    // Generar fechas de entregas de ejemplo basadas en el proyecto
    const startDate = new Date(this.config.proyecto.fecha_inicio);
    const endDate = new Date(this.config.proyecto.fecha_fin);
    
    this.deliveryDates = [];
    
    // Generar entregas cada 15 días aproximadamente
    const current = new Date(startDate);
    while (current <= endDate) {
      this.deliveryDates.push(new Date(current));
      current.setDate(current.getDate() + 15);
    }
    
    console.log(`📅 Generadas ${this.deliveryDates.length} fechas de entregas de ejemplo`);
  }

  initializeCalendar() {
    this.calendarInput = document.getElementById('calendarUX');
    
    if (!this.calendarInput) {
      console.error('❌ No se encontró el elemento calendarUX');
      return;
    }

    // Cargar Flatpickr si no está disponible
    if (typeof flatpickr === 'undefined') {
      this.loadFlatpickr().then(() => {
        this.createFlatpickrInstance();
      });
    } else {
      this.createFlatpickrInstance();
    }
  }

  async loadFlatpickr() {
    return new Promise((resolve, reject) => {
      // Cargar CSS de Flatpickr
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
      document.head.appendChild(cssLink);

      // Cargar JS de Flatpickr
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  createFlatpickrInstance() {
    // Configurar fechas habilitadas (solo fechas de entregas)
    const enabledDates = this.deliveryDates.map(date => {
      if (typeof date === 'string') return date.split('T')[0];
      if (date instanceof Date) return date.toISOString().split('T')[0];
      return '';
    });
    console.log('🟦 Flatpickr enabledDates:', enabledDates);

    this.flatpickrInstance = flatpickr(this.calendarInput, {
      dateFormat: 'Y-m-d',
      locale: {
        firstDayOfWeek: 1, // Lunes
        weekdays: {
          shorthand: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
          longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        },
        months: {
          shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        }
      },
      enable: enabledDates,
      defaultDate: this.deliveryDates[0] || new Date(),
      inline: false,
      allowInput: false,
      clickOpens: true,
      onChange: (selectedDates, dateStr, instance) => {
        console.log('🟢 Flatpickr onChange', { selectedDates, dateStr, instance });
        if (selectedDates.length > 0) {
          this.syncWithCesiumTimeline(selectedDates[0]);
          instance.close(); // cerrar el calendario al seleccionar
        }
      },
      onReady: (selectedDates, dateStr, instance) => {
        console.log('🟡 Flatpickr onReady', { selectedDates, dateStr, instance });
        this.customizeCalendarAppearance();
        this.highlightActiveDates();
        // Forzar z-index y pointer-events
        const cal = document.querySelector('.flatpickr-calendar');
        if (cal) {
          cal.style.zIndex = '99999';
          cal.style.pointerEvents = 'auto';
        }
      },
      onMonthChange: (selectedDates, dateStr, instance) => {
        setTimeout(() => this.highlightActiveDates(), 10);
      },
      onYearChange: (selectedDates, dateStr, instance) => {
        setTimeout(() => this.highlightActiveDates(), 10);
      },
      onOpen: (selectedDates, dateStr, instance) => {
        setTimeout(() => this.highlightActiveDates(), 10);
      },
      onValueUpdate: (selectedDates, dateStr, instance) => {
        setTimeout(() => this.highlightActiveDates(), 10);
      }
    });

    // Forzar z-index y pointer-events en el popup del calendario
    setTimeout(() => {
      const cal = document.querySelector('.flatpickr-calendar');
      if (cal) {
        cal.style.zIndex = '99999';
        cal.style.pointerEvents = 'auto';
      }
    }, 400);

    console.log(`📅 Calendario Flatpickr inicializado con ${enabledDates.length} fechas de entregas`);
  }

  customizeCalendarAppearance() {
    // Personalizar la apariencia del calendario para que coincida con el tema
    const style = document.createElement('style');
    style.textContent = `
      .flatpickr-calendar {
        background: rgba(42, 42, 42, 0.95) !important;
        border: 1px solid #555 !important;
        border-radius: 8px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
      }
      
      .flatpickr-day {
        color: #ccc !important;
        border-radius: 4px !important;
      }
      
      .flatpickr-day.available, .flatpickr-day.selected {
        background: #e0e0e0 !important;  /* gris claro */
        color: #222 !important;
        font-weight: bold !important;
        border: 2px solid #e0e0e0 !important; /* contorno gris claro */
        box-sizing: border-box;
      }
      
      .flatpickr-day.available:hover, .flatpickr-day.selected:hover {
        background: #bdbdbd !important; /* gris oscuro */
        color: #111 !important;
        transform: scale(1.05);
        transition: all 0.2s ease;
      }
      
      .flatpickr-day.selected {
        background: #e53935 !important; /* rojo intenso */
        color: white !important;
        border: 2px solid #c62828 !important;
      }
      
      .flatpickr-day:not(.available) {
        color: #666 !important;
        cursor: not-allowed !important;
        opacity: 0.4;
      }
      
      .flatpickr-months {
        background: rgba(42, 42, 42, 0.95) !important;
      }
      
      .flatpickr-month {
        color: white !important;
      }
      
      .flatpickr-weekday {
        color: #aaa !important;
        font-weight: bold !important;
      }
      
      .flatpickr-prev-month, .flatpickr-next-month {
        color: #e53935 !important; /* rojo intenso */
        background: rgba(255,255,255,0.10) !important;
        border-radius: 50% !important;
        font-size: 1.2em !important;
        width: 24px !important;
        height: 24px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin: 0 2px !important;
        padding: 0 !important;
        transition: background 0.2s;
        z-index: 1;
      }
      .flatpickr-prev-month:hover, .flatpickr-next-month:hover {
        background: #e53935 !important;
        color: white !important;
      }
    `;
    document.head.appendChild(style);
  }

  highlightActiveDates() {
    // Resaltar fechas activas después de que el calendario se renderice
    if (!this.flatpickrInstance || !this.deliveryDates.length) return;
    
    const enabledDates = this.deliveryDates.map(date => {
  if (typeof date === 'string') return date.split('T')[0];
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return '';
});
    
    // Usar requestAnimationFrame para evitar bloqueos de UI
    requestAnimationFrame(() => {
      const calendarDays = document.querySelectorAll('.flatpickr-day');
      
      calendarDays.forEach(day => {
        const dayDate = day.dateObj;
        if (dayDate) {
          const dayStr = dayDate.toISOString().split('T')[0];
          if (enabledDates.includes(dayStr)) {
            day.classList.add('available');
            day.title = 'Fecha de entrega disponible';
          } else {
            day.classList.remove('available');
            day.title = 'Sin datos disponibles';
          }
        }
      });
    });
  }

  syncWithCesiumTimeline(selectedDate) {
    if (!this.viewer || !this.viewer.clock) {
      console.warn('⚠️ Viewer o clock no disponible para sincronización');
      return;
    }

    try {
      // Convertir fecha seleccionada a JulianDate
      const julianDate = Cesium.JulianDate.fromDate(selectedDate);
      
      // Sincronizar con el clock de Cesium
      this.viewer.clock.currentTime = julianDate.clone();
      
      // Si hay timeline, hacer zoom a la fecha seleccionada
      if (this.viewer.timeline) {
        // Crear un rango de ±1 día alrededor de la fecha seleccionada
        const startRange = Cesium.JulianDate.addDays(julianDate, -1, new Cesium.JulianDate());
        const endRange = Cesium.JulianDate.addDays(julianDate, 1, new Cesium.JulianDate());
        
        this.viewer.timeline.zoomTo(startRange, endRange);
      }
      
      // Actualizar overlay de fecha si existe
      this.updateDateOverlay(selectedDate);
      
      console.log(`📅 Timeline sincronizado con fecha: ${selectedDate.toLocaleDateString()}`);
      
      // Disparar evento personalizado para otros componentes
      window.dispatchEvent(new CustomEvent('cesium-date-changed', {
        detail: {
          date: selectedDate,
          julianDate: julianDate
        }
      }));
      
    } catch (error) {
      console.error('❌ Error sincronizando con timeline de Cesium:', error);
    }
  }

  updateDateOverlay(date) {
    // Buscar y actualizar el overlay de fecha si existe
    const dateOverlay = document.querySelector('.fecha-overlay, #fecha-header');
    if (dateOverlay) {
      const formattedDate = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      dateOverlay.textContent = formattedDate;
    }
  }

  // Método para sincronizar desde el timeline hacia el calendario
  setupTimelineSync() {
    if (!this.viewer || !this.viewer.clock) return;

    // Escuchar cambios en el clock de Cesium
    this.viewer.clock.onTick.addEventListener((clock) => {
      const currentDate = Cesium.JulianDate.toDate(clock.currentTime);
      
      // Verificar si la fecha actual está cerca de alguna fecha de entrega
      const nearestDelivery = this.findNearestDeliveryDate(currentDate);
      
      if (nearestDelivery && this.flatpickrInstance) {
        // Actualizar el calendario si es necesario
        const currentCalendarDate = this.flatpickrInstance.selectedDates[0];
        
        if (!currentCalendarDate || 
            Math.abs(currentCalendarDate.getTime() - nearestDelivery.getTime()) > 24 * 60 * 60 * 1000) {
          this.flatpickrInstance.setDate(nearestDelivery, false); // false = no trigger onChange
        }
      }
    });
  }

  findNearestDeliveryDate(targetDate) {
    if (this.deliveryDates.length === 0) return null;

    // Normaliza todas las fechas a Date
    const deliveryDatesAsDate = this.deliveryDates.map(d =>
      typeof d === 'string' ? new Date(d) : d
    );

    let nearest = deliveryDatesAsDate[0];
    let minDiff = Math.abs(targetDate.getTime() - nearest.getTime());

    for (const deliveryDate of deliveryDatesAsDate) {
      const diff = Math.abs(targetDate.getTime() - deliveryDate.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        nearest = deliveryDate;
      }
    }

    // Solo considerar "cercano" si está dentro de 3 días
    return minDiff <= 3 * 24 * 60 * 60 * 1000 ? nearest : null;
  }

  // Método público para agregar nuevas fechas de entrega
  addDeliveryDate(date) {
    const newDate = new Date(date);
    if (!this.deliveryDates.some(d => d.getTime() === newDate.getTime())) {
      this.deliveryDates.push(newDate);
      this.deliveryDates.sort((a, b) => a.getTime() - b.getTime());
      
      // Actualizar calendario si está inicializado
      if (this.flatpickrInstance) {
        const enabledDates = this.deliveryDates.map(date => 
          date.toISOString().split('T')[0]
        );
        this.flatpickrInstance.set('enable', enabledDates);
      }
    }
  }

  // Método público para obtener fechas de entrega
  getDeliveryDates() {
    return [...this.deliveryDates];
  }

  // Método para destruir la instancia
  destroy() {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }
  }
}

// Exportar para uso global
window.CalendarIntegration = CalendarIntegration;

export { CalendarIntegration };
