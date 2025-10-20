// ProgressBarHUD.js

class ProgressBarHUD {
    /**
     * @param {string} containerId - El ID del elemento HTML donde se insertará el HUD de barras.
     * @param {string} csvUrl - La URL pública del CSV de Google Sheets.
     * @param {string} startWeek12DateString - La fecha de inicio de la Semana 12 en formato ISO string (ej. '2025-05-05T00:00:00Z').
     */
    constructor(containerId, csvUrl, startWeek12DateString) {
        this.containerElement = document.getElementById(containerId);
        if (!this.containerElement) {
            console.error(`Contenedor HTML con ID "${containerId}" no encontrado.`);
            return;
        }

        this.csvUrl = csvUrl;
        this.projectData = [];
        this.startDateW12 = this._parseDate(startWeek12DateString); // Usar una función interna para parsear
        this.totalWeeks = 0;
        this.maxAccumulatedPercentage = 100.0; // Valor por defecto, se ajustará si los datos sugieren otro máximo

        this._createHudElements(); // Crea la estructura HTML del HUD
    }

    /**
     * Función interna para parsear fechas. Si Cesium.JulianDate no está disponible, usar Date.
     * @param {string} dateString
     * @returns {any} Cesium.JulianDate o Date
     */
    _parseDate(dateString) {
        if (typeof Cesium !== 'undefined' && Cesium.JulianDate) {
            return Cesium.JulianDate.fromIso8601(dateString);
        }
        return new Date(dateString);
    }

    /**
     * Función interna para añadir semanas a una fecha.
     * @param {any} date - Cesium.JulianDate o Date
     * @param {number} weeks - Número de semanas a añadir.
     * @returns {any} Nueva fecha
     */
    _addWeeks(date, weeks) {
        if (typeof Cesium !== 'undefined' && Cesium.JulianDate) {
            return Cesium.JulianDate.addWeeks(date, weeks, new Cesium.JulianDate());
        }
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + (weeks * 7));
        return newDate;
    }

    /**
     * Función interna para añadir días a una fecha.
     * @param {any} date - Cesium.JulianDate o Date
     * @param {number} days - Número de días a añadir.
     * @returns {any} Nueva fecha
     */
    _addDays(date, days) {
        if (typeof Cesium !== 'undefined' && Cesium.JulianDate) {
            const newDate = Cesium.JulianDate.addDays(date, days, new Cesium.JulianDate());
            // Para asegurar el final del día en Cesium.JulianDate
            Cesium.JulianDate.addHours(newDate, 23, newDate);
            Cesium.JulianDate.addMinutes(newDate, 59, newDate);
            Cesium.JulianDate.addSeconds(newDate, 59, newDate);
            return newDate;
        }
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        newDate.setHours(23, 59, 59, 999); // Fin del día
        return newDate;
    }


    /**
     * Crea la estructura HTML del HUD y la inserta en el contenedor.
     */
    _createHudElements() {
        this.containerElement.innerHTML = `
            <style>
                #${this.containerElement.id} {
                    position: absolute;
                    bottom: 100px; /* Ajusta la posición vertical */
                    left: 0;
                    width: 100%;
                    height: 150px;
                    /* background-color: rgba(0, 0, 0, 0.7); /* Descomenta si quieres un fondo */
                    padding: 10px 50px; /* Ajusta este padding para que coincida con el timeline */
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-around;
                    align-items: flex-start;
                    pointer-events: none;
                    z-index: 100;
                }
                #${this.containerElement.id} .bar-row {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    margin-bottom: 5px;
                    position: relative;
                }
                #${this.containerElement.id} .bar-label {
                    color: white;
                    font-family: sans-serif;
                    font-size: 14px;
                    width: 100px;
                    text-align: right;
                    padding-right: 10px;
                    flex-shrink: 0;
                }
                #${this.containerElement.id} .progress-bar {
                    flex-grow: 1;
                    height: 25px;
                    border-radius: 5px;
                    position: relative;
                    overflow: hidden;
                    transition: width 0.1s linear;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    padding-right: 5px;
                    box-sizing: border-box;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    background-color: rgba(50, 50, 50, 0.5); /* Fondo de la barra vacía */
                }
                #${this.containerElement.id} .progress-bar-fill {
                    height: 100%;
                    border-radius: 5px;
                    position: absolute;
                    left: 0;
                    top: 0;
                    transition: width 0.1s linear;
                }
                #${this.containerElement.id} .progress-bar-fill.plan { background: linear-gradient(to right, #000000, #444444); }
                #${this.containerElement.id} .progress-bar-fill.real { background: linear-gradient(to right, #0000FF, #3333FF); }
                #${this.containerElement.id} .progress-bar-fill.diff-pos { background: linear-gradient(to right, #00CC00, #33FF33); }
                #${this.containerElement.id} .progress-bar-fill.diff-neg { background: linear-gradient(to right, #FF0000, #FF3333); }
                #${this.containerElement.id} .progress-bar-fill.forecast-only { background: linear-gradient(to right, #CCCC00, #FFFF00); } /* Un color distintivo para forecast si es solo forecast */


                #${this.containerElement.id} .bar-text {
                    color: white;
                    font-family: sans-serif;
                    font-size: 14px;
                    font-weight: bold;
                    white-space: nowrap;
                    position: absolute;
                    right: 5px;
                    padding-left: 5px;
                    pointer-events: none;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                    z-index: 1;
                }
                #${this.containerElement.id} .bar-text.hidden {
                    display: none;
                }
            </style>
            <div class="bar-row">
                <div class="bar-label">Plan:</div>
                <div class="progress-bar">
                    <div id="planFill" class="progress-bar-fill plan"></div>
                    <span id="planText" class="bar-text">0.00%</span>
                </div>
            </div>
            <div class="bar-row">
                <div class="bar-label">Real:</div>
                <div class="progress-bar">
                    <div id="realFill" class="progress-bar-fill real"></div>
                    <span id="realText" class="bar-text">0.00%</span>
                </div>
            </div>
            <div class="bar-row">
                <div class="bar-label">Diferencia:</div>
                <div class="progress-bar">
                    <div id="diffFill" class="progress-bar-fill"></div>
                    <span id="diffText" class="bar-text">0.00%</span>
                </div>
            </div>
            <div class="bar-row">
                <div class="bar-label">Pronóstico:</div>
                <div class="progress-bar">
                    <div id="forecastFill" class="progress-bar-fill forecast-only"></div>
                    <span id="forecastText" class="bar-text">0.00%</span>
                </div>
            </div>
        `;
        // Referencias a los elementos internos una vez creados
        this.planFill = this.containerElement.querySelector('#planFill');
        this.realFill = this.containerElement.querySelector('#realFill');
        this.diffFill = this.containerElement.querySelector('#diffFill');
        this.forecastFill = this.containerElement.querySelector('#forecastFill');

        this.planText = this.containerElement.querySelector('#planText');
        this.realText = this.containerElement.querySelector('#realText');
        this.diffText = this.containerElement.querySelector('#diffText');
        this.forecastText = this.containerElement.querySelector('#forecastText');
    }

    /**
     * Limpia un valor de porcentaje (ej. "12.34%") a un float (12.34).
     * @param {string} valueString - La cadena de porcentaje.
     * @returns {number} El valor flotante.
     */
    _parsePercentage(valueString) {
        if (typeof valueString !== 'string') {
            return parseFloat(valueString) || 0.0;
        }
        return parseFloat(valueString.replace('%', '')) || 0.0;
    }

    /**
     * Obtiene las fechas de inicio y fin para una semana dada.
     * Retorna objetos Date para que la clase sea independiente de Cesium.
     * @param {number} weekNumber - El número de semana (ej. 12, 13, ...).
     * @returns {{startDate: Date, endDate: Date}} Las fechas en formato Date.
     */
    _getWeekDates(weekNumber) {
        const weeksOffset = weekNumber - 12;
        
        let startDate = this._addWeeks(this.startDateW12, weeksOffset);
        let endDate = this._addDays(startDate, 6); // Fin del 6to día

        // Si se usa Cesium.JulianDate, convertimos a ISO string para guardar
        if (typeof Cesium !== 'undefined' && Cesium.JulianDate && startDate instanceof Cesium.JulianDate) {
            startDate = startDate.toISOString();
            endDate = endDate.toISOString();
        } else {
            startDate = startDate.toISOString();
            endDate = endDate.toISOString();
        }
        
        return { startDate, endDate };
    }

    /**
     * Carga y procesa los datos del CSV desde la URL de Google Sheets.
     * @returns {Promise<{startTime: any, stopTime: any}>} Resuelve con el rango de tiempo del proyecto para que Cesium pueda configurarlo.
     */
    async loadData() {
        try {
            const response = await fetch(this.csvUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            this._processCsvData(csvText);

            // Devolvemos el rango de tiempo para que la app principal (Cesium) lo configure
            const firstDataWeek = this.projectData[0] ? this.projectData[0].startDate : null;
            const lastDataWeek = this.projectData[this.projectData.length - 1] ? this.projectData[this.projectData.length - 1].endDate : null;

            return {
                startTime: firstDataWeek ? this._parseDate(firstDataWeek) : null,
                stopTime: lastDataWeek ? this._parseDate(lastDataWeek) : null
            };

        } catch (error) {
            console.error('Error al cargar o procesar el CSV:', error);
            return { startTime: null, stopTime: null };
        }
    }

    /**
     * Procesa la cadena CSV para extraer los datos de las barras.
     * @param {string} csvText - El contenido del archivo CSV.
     */
    _processCsvData(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) {
            console.warn("CSV vacío.");
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const dataRows = lines.slice(1);

        this.projectData = [];
        let maxWeek = 0;
        let tempMaxAccumulated = 0;

        // Mapeo de índices de columnas basado en tu CSV adjunto:
        // Columna A (Semana) -> index 0
        // Columna C (Avance Acumulado [Plan]) -> index 2
        // Columna F (Avance Acumulado.1 [Real]) -> index 5
        // Columna I (Avance Acumulado.2 [Forecast]) -> index 8
        const WEEK_NUM_COL_IDX = 0;
        const PLAN_ACCUM_COL_IDX = 2;
        const REAL_ACCUM_COL_IDX = 5;
        const FORECAST_ACCUM_COL_IDX = 8;
        
        dataRows.forEach(row => {
            const values = row.split(',');
            // Asegurarse de que la fila tenga suficientes columnas
            if (values.length < Math.max(PLAN_ACCUM_COL_IDX, REAL_ACCUM_COL_IDX, FORECAST_ACCUM_COL_IDX) + 1) {
                // console.warn(`Fila incompleta o mal formada, saltando: ${row}`);
                return;
            }

            try {
                const weekStr = values[WEEK_NUM_COL_IDX].trim();
                const weekNumMatch = weekStr.match(/\d+/);
                if (!weekNumMatch) return;

                const weekNum = parseInt(weekNumMatch[0], 10);
                if (isNaN(weekNum)) return;

                const planAcumulado = this._parsePercentage(values[PLAN_ACCUM_COL_IDX]);
                const realAcumulado = this._parsePercentage(values[REAL_ACCUM_COL_IDX]);
                const forecastAcumulado = this._parsePercentage(values[FORECAST_ACCUM_COL_IDX]);

                const { startDate, endDate } = this._getWeekDates(weekNum);
                const diferenciaAcumulada = realAcumulado - planAcumulado;

                this.projectData.push({
                    week: weekNum,
                    startDate: startDate, // Ya son ISO strings o Date objects
                    endDate: endDate,
                    plan_acumulado: planAcumulado,
                    real_acumulado: realAcumulado,
                    forecast_acumulado: forecastAcumulado,
                    diferencia_acumulada: diferenciaAcumulada
                });

                if (weekNum > maxWeek) {
                    maxWeek = weekNum;
                }
                // El máximo porcentaje acumulado planificado para escalar las barras.
                // Es importante que este valor represente el "100%" de la barra visual.
                if (planAcumulado > tempMaxAccumulated) {
                    tempMaxAccumulated = planAcumulado;
                }

            } catch (e) {
                console.error(`Error procesando fila CSV: "${row}". Error: ${e}`);
            }
        });

        this.projectData.sort((a, b) => a.week - b.week);
        this.totalWeeks = maxWeek;
        // Si el valor máximo planificado es 0 (ej. antes de que haya cualquier plan), default a 100 para evitar divisiones por cero.
        this.maxAccumulatedPercentage = tempMaxAccumulated > 0 ? tempMaxAccumulated : 100.0;
        
        // console.log("Datos CSV procesados:", this.projectData);
        // console.log("Máximo porcentaje acumulado planificado para escala:", this.maxAccumulatedPercentage);
    }

    /**
     * Obtiene los datos acumulados para un tiempo dado (Cesium.JulianDate o Date).
     * @param {any} currentTime - El tiempo actual del reloj (Cesium.JulianDate o Date).
     * @returns {{plan_acumulado: number, real_acumulado: number, forecast_acumulado: number, diferencia_acumulada: number, isForecast: boolean}}
     */
    getDataForTimeline(currentTime) {
        let currentWeekData = null;
        let latestPastData = null;
        
        // Función para comparar fechas de forma abstracta
        const isGreaterThanOrEquals = (date1, date2) => {
            if (typeof Cesium !== 'undefined' && Cesium.JulianDate && date1 instanceof Cesium.JulianDate) {
                return Cesium.JulianDate.greaterThanOrEquals(date1, date2);
            }
            return new Date(date1).getTime() >= new Date(date2).getTime();
        };

        const isLessThanOrEquals = (date1, date2) => {
            if (typeof Cesium !== 'undefined' && Cesium.JulianDate && date1 instanceof Cesium.JulianDate) {
                return Cesium.JulianDate.lessThanOrEquals(date1, date2);
            }
            return new Date(date1).getTime() <= new Date(date2).getTime();
        };
        
        const isLessThan = (date1, date2) => {
            if (typeof Cesium !== 'undefined' && Cesium.JulianDate && date1 instanceof Cesium.JulianDate) {
                return Cesium.JulianDate.lessThan(date1, date2);
            }
            return new Date(date1).getTime() < new Date(date2).getTime();
        };

        const now = typeof Cesium !== 'undefined' && Cesium.JulianDate ? Cesium.JulianDate.now() : new Date();


        for (const data of this.projectData) {
            const startDate = this._parseDate(data.startDate);
            const endDate = this._parseDate(data.endDate);

            if (isGreaterThanOrEquals(currentTime, startDate)) {
                currentWeekData = data;
                latestPastData = data;
                if (isLessThanOrEquals(currentTime, endDate)) {
                    break;
                }
            } else {
                // Si el tiempo actual es ANTES de esta semana, y ya hemos pasado todas las semanas anteriores,
                // significa que estamos en el futuro de los datos.
                break; 
            }
        }

        if (!currentWeekData) {
            // Si no hay datos para el currentTime (ej. antes de la primera semana con datos)
            return {
                plan_acumulado: 0.0,
                real_acumulado: 0.0,
                forecast_acumulado: 0.0,
                diferencia_acumulada: 0.0,
                isForecast: true
            };
        }

        let plan_val = currentWeekData.plan_acumulado;
        let real_val = currentWeekData.real_acumulado;
        let forecast_val = currentWeekData.forecast_acumulado;
        let diff_val = currentWeekData.diferencia_acumulada;
        let isForecast = false;
        
        // Lógica para determinar si se muestra Real o Forecast en la barra "Real":
        // Si el tiempo actual está en el pasado Y hay un valor real para esa semana (no 0)
        // O si el tiempo actual es HOY y hay un valor real (no 0) para la semana actual
        // Entonces usamos el valor real.
        // De lo contrario (si estamos en el futuro, o en el presente sin datos reales), usamos el pronóstico.

        const dataEndDate = this._parseDate(currentWeekData.endDate); // Convertir a tipo comparable
        
        if (real_val > 0.0 && isLessThanOrEquals(currentTime, dataEndDate)) {
             // Si hay datos reales y estamos en el rango de tiempo de esos datos
             // Los valores ya son correctos.
        } else if (real_val === 0.0 && isGreaterThanOrEquals(currentTime, dataEndDate) && latestPastData && latestPastData.real_acumulado > 0) {
            // Si el real de la semana actual es 0, pero ya hemos pasado esa semana
            // Y hay datos reales de una semana ANTERIOR, mostramos ese último real conocido
            real_val = latestPastData.real_acumulado;
            forecast_val = latestPastData.real_acumulado; // Forecast también es el real pasado
            diff_val = real_val - plan_val;
            isForecast = false;
        } else {
            // Si real_val es 0 (para la semana actual o futura) o estamos en el futuro
            real_val = forecast_val;
            diff_val = real_val - plan_val;
            isForecast = true;
        }


        return {
            plan_acumulado: plan_val,
            real_acumulado: real_val, // Este es el valor que se usará para la barra 'real'
            forecast_acumulado: forecast_val, // Este es el valor original de forecast
            diferencia_acumulada: diff_val,
            isForecast: isForecast // Indica si la barra 'real' está mostrando un pronóstico
        };
    }

    /**
     * Actualiza la visualización de las barras y textos.
     * @param {any} currentTime - El tiempo actual del reloj (Cesium.JulianDate o Date).
     */
    update(currentTime) {
        const dataForTime = this.getDataForTimeline(currentTime);
        // console.log('[ProgressBarHUD] update() dataForTime:', dataForTime);
        // console.log('[ProgressBarHUD] projectData:', this.projectData);
        const planPercent = dataForTime.plan_acumulado;
        const realPercent = dataForTime.real_acumulado;
        const forecastPercent = dataForTime.forecast_acumulado;
        const diffPercent = dataForTime.diferencia_acumulada;

        // Escalar los porcentajes al ancho de la barra
        // MAX_SCALE_PERCENT es el 100% visual de la barra completa
        const MAX_SCALE_PERCENT = this.maxAccumulatedPercentage;
        
        const planWidth = (planPercent / MAX_SCALE_PERCENT) * 100;
        const realWidth = (realPercent / MAX_SCALE_PERCENT) * 100;
        const forecastWidth = (forecastPercent / MAX_SCALE_PERCENT) * 100;
        // La diferencia puede ser negativa, pero el ancho es siempre positivo
        const diffWidth = (Math.abs(diffPercent) / MAX_SCALE_PERCENT) * 100;


        // Actualizar el ancho de las barras de "fill"
        this.planFill.style.width = `${planWidth}%`;
        this.realFill.style.width = `${realWidth}%`;
        this.forecastFill.style.width = `${forecastWidth}%`;
        
        // Actualizar la barra de diferencia y su color
        this.diffFill.style.width = `${diffWidth}%`;
        if (diffPercent >= 0) {
            this.diffFill.className = 'progress-bar-fill diff-pos'; // Verde si Real >= Plan
        } else {
            this.diffFill.className = 'progress-bar-fill diff-neg'; // Rojo si Real < Plan
        }
        
        // Actualizar los textos dentro de las barras
        this.planText.textContent = `${planPercent.toFixed(2)}%`;
        this.realText.textContent = `${realPercent.toFixed(2)}%`;
        this.forecastText.textContent = `${forecastPercent.toFixed(2)}%`;
        this.diffText.textContent = `${diffPercent.toFixed(2)}%`;

        // Ocultar texto si la barra es demasiado corta para contenerlo
        const MIN_TEXT_WIDTH_PX = 60; // Ancho mínimo en píxeles para que el texto sea legible
        // Usamos offsetWidth del elemento *padre* (.progress-bar) para saber el ancho disponible
        const progressBarParentWidth = this.planFill.parentElement.offsetWidth; // Cualquier parent debería servir
        
        this.planText.classList.toggle('hidden', (planWidth / 100) * progressBarParentWidth < MIN_TEXT_WIDTH_PX);
        this.realText.classList.toggle('hidden', (realWidth / 100) * progressBarParentWidth < MIN_TEXT_WIDTH_PX);
        this.forecastText.classList.toggle('hidden', (forecastWidth / 100) * progressBarParentWidth < MIN_TEXT_WIDTH_PX);
        this.diffText.classList.toggle('hidden', (diffWidth / 100) * progressBarParentWidth < MIN_TEXT_WIDTH_PX);
    }
}

// --- Agregar export para uso como módulo ES ---
export { ProgressBarHUD };