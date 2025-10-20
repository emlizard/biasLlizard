// --- START: Calculation Logic (Interpolation/Extrapolation) ---
class CubicSpline {
    constructor(x, y) { this.x = [...x]; this.y = [...y]; this.n = x.length; this.calculateCoefficients(); }
    calculateCoefficients() { const n = this.n; const h = new Array(n - 1); for (let i = 0; i < n - 1; i++) h[i] = this.x[i + 1] - this.x[i]; const alpha = new Array(n - 1); for (let i = 1; i < n - 1; i++) alpha[i] = (3 / h[i]) * (this.y[i + 1] - this.y[i]) - (3 / h[i - 1]) * (this.y[i] - this.y[i - 1]); const l = new Array(n); const mu = new Array(n); const z = new Array(n); l[0] = 1; mu[0] = 0; z[0] = 0; for (let i = 1; i < n - 1; i++) { l[i] = 2 * (this.x[i + 1] - this.x[i - 1]) - h[i - 1] * mu[i - 1]; mu[i] = h[i] / l[i]; z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i]; } l[n - 1] = 1; z[n - 1] = 0; this.c = new Array(n); this.b = new Array(n - 1); this.d = new Array(n - 1); this.c[n - 1] = 0; for (let j = n - 2; j >= 0; j--) { this.c[j] = z[j] - mu[j] * this.c[j + 1]; this.b[j] = (this.y[j + 1] - this.y[j]) / h[j] - h[j] * (this.c[j + 1] + 2 * this.c[j]) / 3; this.d[j] = (this.c[j + 1] - this.c[j]) / (3 * h[j]); } }
    interpolate(x) { if (x < this.x[0] || x > this.x[this.n-1]) return null; let i = 0; for (i = 0; i < this.n - 1; i++) if (x <= this.x[i + 1]) break; const dx = x - this.x[i]; return this.y[i] + this.b[i] * dx + this.c[i] * dx * dx + this.d[i] * dx * dx * dx; }
    findX(targetY, tolerance = 0.001) { let left = this.x[0], right = this.x[this.n - 1]; let iterations = 0; const maxIterations = 200; while (right - left > tolerance && iterations < maxIterations) { const mid = (left + right) / 2; const midY = this.interpolate(mid); if (midY === null) return { value: null }; if (midY > targetY) left = mid; else right = mid; iterations++; } const finalValue = (left + right) / 2; return { value: finalValue, isExtrapolated: false }; }
}
function polynomialRegression(x, y) { const n = x.length; let sumX = 0, sumY = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0, sumXY = 0, sumX2Y = 0; for (let i = 0; i < n; i++) { sumX += x[i]; sumY += y[i]; sumX2 += x[i] * x[i]; sumX3 += x[i] * x[i] * x[i]; sumX4 += x[i] * x[i] * x[i] * x[i]; sumXY += x[i] * y[i]; sumX2Y += x[i] * x[i] * y[i]; } const SXX = sumX2 - sumX * sumX / n; const SXY = sumXY - sumX * sumY / n; const SXX2 = sumX3 - sumX * sumX2 / n; const SX2Y = sumX2Y - sumX2 * sumY / n; const SX2X2 = sumX4 - sumX2 * sumX2 / n; const denominator = (SX2X2 * SXX - SXX2 * SXX2); if (Math.abs(denominator) < 1e-10) return null; const a = (SX2Y * SXX - SXY * SXX2) / denominator; const b = (SXY * SX2X2 - SX2Y * SXX2) / denominator; const c = sumY / n - b * sumX / n - a * sumX2 / n; const yMean = sumY / n; let sst = 0, sse = 0; for (let i = 0; i < n; i++) { sst += (y[i] - yMean) * (y[i] - yMean); const predictedY = a * x[i] * x[i] + b * x[i] + c; sse += (y[i] - predictedY) * (y[i] - predictedY); } const r2 = 1 - (sse / sst); return { coefficients: [a, b, c], r2 }; }
function solveQuadratic(a, b, c, context, range) { const discriminant = b * b - 4 * a * c; if (discriminant < 0) return null; const root1 = (-b + Math.sqrt(discriminant)) / (2 * a); const root2 = (-b - Math.sqrt(discriminant)) / (2 * a); if (context === 'upper') { return root1 > range[1] ? root1 : (root2 > range[1] ? root2 : null); } if (context === 'lower') { return root1 < range[0] ? root1 : (root2 < range[0] ? root2 : null); } return null; }
function findIdcForTarget(idcValues, inductanceValues, targetPercentage) {
    if (!idcValues || idcValues.length === 0 || !inductanceValues || inductanceValues.length === 0) {
        return null;
    }
    const initialInductance = inductanceValues[0];
    if (initialInductance === 0) return null;
    const normalizedInductance = inductanceValues.map(val => (val / initialInductance) * 100);
    const minInductance = Math.min(...normalizedInductance);
    const maxInductance = Math.max(...normalizedInductance);
    let resultIdc = null;
    if (targetPercentage >= minInductance && targetPercentage <= maxInductance) {
        try {
            const spline = new CubicSpline(idcValues, normalizedInductance);
            const splineResult = spline.findX(targetPercentage);
            resultIdc = splineResult.value;
        } catch (e) {
            console.error("Spline interpolation failed:", e);
            resultIdc = null;
        }
    } else {
        try {
            const regression = polynomialRegression(idcValues, normalizedInductance);
            if (regression && regression.r2 >= 0.95) {
                const [a, b, c] = regression.coefficients;
                const c_prime = c - targetPercentage;
                const context = targetPercentage < minInductance ? 'upper' : 'lower';
                const idcRange = [Math.min(...idcValues), Math.max(...idcValues)];
                resultIdc = solveQuadratic(a, b, c_prime, context, idcRange);
            }
        } catch (e) {
            console.error("Polynomial regression failed:", e);
            resultIdc = null;
        }
    }
    return resultIdc;
}
// --- END: Calculation Logic ---


// --- START: Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {

    // --- START: Integration & Data Transformation Logic ---
    
    function parseRawData(text) {
        const blocks = text.trim().split(/\n\s*\n/);
        const allSeries = [];
        const errors = [];
        const metaRegex = /^BLOCK:\s*(.+?)(?:,?\s*N:\s*(\d+).*?)?$/i;

        blocks.forEach((block, blockIndex) => {
            if (!block.trim()) return;

            const lines = block.trim().split('\n');
            const metaLine = lines[0];
            const match = metaLine.match(metaRegex);

            if (!match) {
                errors.push(`Block ${blockIndex + 1}: Invalid BLOCK format.`);
                return;
            }

            const centerLegName = match[1].trim();
            const nValue = match[2] ? parseInt(match[2], 10) : 0;

            const headerLineIndex = lines.findIndex(l => l.toLowerCase().startsWith('idc(a)'));
            if (headerLineIndex === -1) {
                errors.push(`Block ${blockIndex + 1} (${centerLegName}): Could not find 'Idc(A)' header.`);
                return;
            }
            
            const headers = lines[headerLineIndex].trim().split(/\s+/).filter(h => h); // Remove empty strings
            let idcValues = [];
            let inductanceData = Array.from({ length: headers.length - 1 }, () => []);
            let tableEndIndex = headerLineIndex + 1;

            for (let i = headerLineIndex + 1; i < lines.length; i++) {
                const parts = lines[i].trim().split(/\s+/).filter(p => p);
                if (parts.length === 0) continue; // Skip empty lines

                if (parts.length < 2 || isNaN(parseFloat(parts[0]))) {
                    tableEndIndex = i;
                    break;
                }
                idcValues.push(parseFloat(parts[0]));
                for (let j = 1; j < headers.length; j++) {
                    if (parts[j] !== undefined && parts[j] !== '') {
                        inductanceData[j - 1].push(parseFloat(parts[j]));
                    }
                }
                tableEndIndex = i + 1;
            }

            let lInitialOverrideValues = [];
            let gapValues = [];
            const dataLinesAfterTable = lines.slice(tableEndIndex);
            
            const lInitialLine = dataLinesAfterTable.find(l => l.toLowerCase().startsWith('l_initial'));
            const gapLine = dataLinesAfterTable.find(l => l.toLowerCase().startsWith('gap(mm)'));

            if (gapLine) {
                gapValues = gapLine.trim().split(/\s+/).filter(p => p).slice(1).map(parseFloat);
            }
            
            if (lInitialLine) {
                lInitialOverrideValues = lInitialLine.trim().split(/\s+/).filter(p => p).slice(1).map(parseFloat);
            } else {
                errors.push(`Block ${blockIndex + 1} (${centerLegName}): WARNING - 'L_initial' row not found. Using Idc=0 value.`);
            }
            
            if (idcValues.length < 2) {
                 errors.push(`Block ${blockIndex + 1} (${centerLegName}): Not enough data rows.`);
                 return;
            }

            for (let i = 1; i < headers.length; i++) {
                // Ensure all data arrays have matching lengths for this column
                const currentInductanceData = inductanceData[i-1];
                if (idcValues.length !== currentInductanceData.length) {
                    // Mismatch, likely due to sparse data. Try to align.
                    // This is a simple fix; a more robust parser might be needed.
                    if (currentInductanceData.length < idcValues.length) {
                        // Pad inductance data with NaN
                        while(currentInductanceData.length < idcValues.length) {
                            currentInductanceData.push(NaN);
                        }
                    } else if (currentInductanceData.length > idcValues.length) {
                        // Truncate inductance data
                        currentInductanceData.length = idcValues.length;
                    }
                }

                // Filter out NaN pairs
                const validIdc = [];
                const validInductance = [];
                for (let k = 0; k < idcValues.length; k++) {
                    if (!isNaN(idcValues[k]) && !isNaN(currentInductanceData[k])) {
                        validIdc.push(idcValues[k]);
                        validInductance.push(currentInductanceData[k]);
                    }
                }

                if(validIdc.length < 2) {
                    errors.push(`Block ${blockIndex + 1} (${centerLegName}), Model ${headers[i]}: Not enough valid data points.`);
                    continue;
                }

                allSeries.push({
                    centerLegCoreName: centerLegName,
                    nValue: nValue,
                    model: headers[i],
                    idc: validIdc,
                    inductance: validInductance,
                    lInitialOverride: lInitialOverrideValues[i-1],
                    gap: gapValues[i-1]
                });
            }
        });
        
        document.getElementById('processingErrors').innerHTML = errors.join('<br>');
        return allSeries;
    }

    function calculateAndBuildFinalData(series) {
        return series.map(s => {
            const idc_70 = findIdcForTarget(s.idc, s.inductance, 70);
            const idc_80 = findIdcForTarget(s.idc, s.inductance, 80);

            const final_L_initial = s.lInitialOverride !== undefined && !isNaN(s.lInitialOverride) 
                ? s.lInitialOverride 
                : (s.inductance[0] || 0);

            return {
                centerLegCore: `${s.centerLegCoreName}${s.nValue > 0 ? `_N${s.nValue}` : ''}`,
                outerCoreShell: s.model,
                L_initial: final_L_initial,
                Idc_70: idc_70,
                Idc_80: idc_80,
                N: s.nValue,
                FoM: idc_80 ? final_L_initial * idc_80 : 0,
                Gap: s.gap,
                raw_idc: s.idc,
                raw_inductance: s.inductance
            };
        }).filter(d => d.L_initial > 0); // Loosened filter to allow data with failed Idc_70/80 calc
    }
    
    function formatForAnalysisTool(data) {
        const grouped = data.reduce((acc, item) => {
            if (!acc[item.centerLegCore]) { acc[item.centerLegCore] = []; }
            acc[item.centerLegCore].push(item);
            return acc;
        }, {});

        let output = '';
        for (const groupName in grouped) {
            const items = grouped[groupName];
            const shells = items.map(d => d.outerCoreShell).join('\t');
            const l_initials = items.map(d => d.L_initial.toFixed(2)).join('\t');
            const idc_70s = items.map(d => (d.Idc_70 !== null ? d.Idc_70.toFixed(2) : 'N/A')).join('\t');
            const idc_80s = items.map(d => (d.Idc_80 !== null ? d.Idc_80.toFixed(2) : 'N/A')).join('\t');
            const gaps = items.map(d => (d.Gap !== undefined ? d.Gap : 0).toFixed(1)).join('\t');
            const ns = items.map(d => d.N).join('\t');
            
            output += `${groupName}\t${shells}\n`;
            output += `L_initial(uH)\t${l_initials}\n`;
            output += `Idc_70%(A)\t${idc_70s}\n`;
            output += `Idc_80%(A)\t${idc_80s}\n`;
            output += `Gap(mm)\t${gaps}\n`;
            output += `N\t${ns}\n\n`;
        }
        return output;
    }

    let rawChartInstance = null;
    const defaultColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5', '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5'];

    function createRawCurveChart(data) {
        if (rawChartInstance) {
            rawChartInstance.destroy();
        }

        const ctx = document.getElementById('rawCurveChart').getContext('2d');
        if (!data || data.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '20px Arial';
            ctx.fillStyle = '#888';
            ctx.textAlign = 'center';
            ctx.fillText('No raw data to display.', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }
        
        const datasets = data.map((series, index) => {
            const color = defaultColors[index % defaultColors.length];
            const seriesData = series.raw_idc.map((idc, i) => ({
                x: idc,
                y: series.raw_inductance[i]
            }));

            return {
                label: `${series.centerLegCore} / ${series.outerCoreShell}`,
                data: seriesData,
                borderColor: color,
                backgroundColor: color + '33', // 20% opacity
                fill: false,
                borderWidth: 2,
                pointRadius: 3,
                showLine: true
            };
        });

        rawChartInstance = new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                color: document.body.getAttribute('data-theme') === 'dark' ? '#f1f5f9' : '#0f172a',
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { 
                            padding: 10,
                            color: document.body.getAttribute('data-theme') === 'dark' ? '#f1f5f9' : '#0f172a'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const item = context.dataset.label || '';
                                const xVal = context.parsed.x;
                                const yVal = context.parsed.y;
                                return `${item}: (Idc: ${xVal} A, L: ${yVal.toFixed(2)} μH)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Idc (A)',
                            color: document.body.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#64748b'
                        },
                        ticks: { color: document.body.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#64748b' },
                        grid: { color: document.body.getAttribute('data-theme') === 'dark' ? '#475569' : '#e2e8f0' }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Inductance (μH)',
                            color: document.body.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#64748b'
                        },
                        ticks: { color: document.body.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#64748b' },
                        grid: { color: document.body.getAttribute('data-theme') === 'dark' ? '#475569' : '#e2e8f0' }
                    }
                }
            }
        });
    }
    
    document.getElementById('processBtn').addEventListener('click', () => {
        const rawText = document.getElementById('rawInput').value;
        if (!rawText.trim()) { alert('Please paste raw data first.'); return; }
        const parsedSeries = parseRawData(rawText);
        if(parsedSeries.length === 0) { alert('Could not parse any valid data. Please check the format and error messages.'); return; }
        const finalData = calculateAndBuildFinalData(parsedSeries);
        if(finalData.length === 0) { alert('Data was parsed, but calculations failed for all entries.'); return; }
        const formattedText = formatForAnalysisTool(finalData);
        document.getElementById('dataInput').value = formattedText;
        document.getElementById('analysisContainer').classList.remove('hidden');

        createRawCurveChart(finalData);
        document.getElementById('rawCurveChartContainer').classList.remove('hidden');

        app.updateAll(finalData); // Pass finalData to app
    });

    // --- END: Integration Logic ---


    // --- START: Analysis App Logic (Summary Scatter Plot) ---
    const app = {
        elements: {}, chartInstance: null, parsedData: [],
        defaultColors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
        pointStyles: ['circle', 'rect', 'triangle', 'rectRot', 'star', 'cross', 'rectRounded'],
        init() { this.cacheElements(); this.addEventListeners(); },
        cacheElements() { const ids = [ 'dataInput', 'xAxis', 'yAxis', 'centerLegFilterControls', 'outerCoreFilterControls', 'mainChart', 'statsTableBody', 'dataCount', 'chartStatus', 'btnExportCSV', 'btnExportPNG', 'parsedDataTableBody', 'selectAllCenterLegs', 'deselectAllCenterLegs', 'selectAllOuterCores', 'deselectAllOuterCores' ]; ids.forEach(id => this.elements[id] = document.getElementById(id)); },
        addEventListeners() { 
            const controlsToRedrawChart = ['xAxis', 'yAxis', 'centerLegFilterControls', 'outerCoreFilterControls']; 
            controlsToRedrawChart.forEach(id => this.elements[id].addEventListener('change', () => this.updateUI())); 
            this.elements.btnExportCSV.addEventListener('click', () => this.exportCSV()); 
            this.elements.btnExportPNG.addEventListener('click', () => this.exportPNG()); 
            this.elements.selectAllCenterLegs.addEventListener('click', () => { this.setAllCheckboxes(this.elements.centerLegFilterControls, true); this.updateUI(); }); 
            this.elements.deselectAllCenterLegs.addEventListener('click', () => { this.setAllCheckboxes(this.elements.centerLegFilterControls, false); this.updateUI(); }); 
            this.elements.selectAllOuterCores.addEventListener('click', () => { this.setAllCheckboxes(this.elements.outerCoreFilterControls, true); this.updateUI(); }); 
            this.elements.deselectAllOuterCores.addEventListener('click', () => { this.setAllCheckboxes(this.elements.outerCoreFilterControls, false); this.updateUI(); }); 
            // Update charts on theme toggle
            document.getElementById('themeToggle').addEventListener('click', () => {
                // Wait for CSS transition
                setTimeout(() => {
                    this.createChart();
                    // We need to access finalData again to redraw the raw chart
                    const finalData = calculateAndBuildFinalData(parseRawData(document.getElementById('rawInput').value));
                    createRawCurveChart(finalData);
                }, 100);
            });
        },
        setAllCheckboxes(container, isChecked) { container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = isChecked); },
        // Modify parseData to accept data instead of reading from textarea
        parseData(data) { 
            // The data is already in the correct format from calculateAndBuildFinalData
            return data.map(d => ({
                ...d,
                // Ensure values for filtering are valid numbers
                Idc_70: d.Idc_70 === null ? NaN : d.Idc_70,
                Idc_80: d.Idc_80 === null ? NaN : d.Idc_80,
                FoM: d.FoM === null ? NaN : d.FoM,
            }));
        },
        getFilteredData() { const selectedCenterLegs = new Set(Array.from(this.elements.centerLegFilterControls.querySelectorAll('input:checked')).map(chk => chk.dataset.value)); const selectedOuterShells = new Set(Array.from(this.elements.outerCoreFilterControls.querySelectorAll('input:checked')).map(chk => chk.dataset.value)); if (selectedCenterLegs.size === 0 || selectedOuterShells.size === 0) return []; return this.parsedData.filter(d => selectedCenterLegs.has(d.centerLegCore) && selectedOuterShells.has(d.outerCoreShell)); },
        groupData: (data, groupBy) => data.reduce((groups, item) => { const key = item[groupBy]; if (!groups[key]) groups[key] = []; groups[key].push(item); return groups; }, {}),
        updateAll(finalData) { // Accept finalData as argument
            this.parsedData = this.parseData(finalData); // Use the passed data
            const allCenterLegs = [...new Set(this.parsedData.map(d => d.centerLegCore))].sort();
            const allOuterShells = [...new Set(this.parsedData.map(d => d.outerCoreShell))].sort((a, b) => a - b);
            this.updateFilterControls(this.elements.centerLegFilterControls, allCenterLegs, true);
            this.updateFilterControls(this.elements.outerCoreFilterControls, allOuterShells, true);
            this.updateParsedDataTable();
            this.updateUI();
        },
        updateUI() { const baseData = this.getFilteredData(); const groupedData = this.groupData(baseData, 'centerLegCore'); this.updateStatsTable(groupedData); this.createChart(); },
        updateParsedDataTable() { 
            const { parsedDataTableBody, dataCount } = this.elements; 
            parsedDataTableBody.innerHTML = ''; 
            dataCount.textContent = `Total of ${this.parsedData.length} data points recognized`; 
            if (this.parsedData.length === 0) { 
                parsedDataTableBody.innerHTML = `<tr><td colspan="8">No data recognized.</td></tr>`; return; 
            } 
            let rows = ''; 
            this.parsedData.forEach(d => { 
                rows += `<tr>
                    <td>${d.centerLegCore}</td>
                    <td>${d.outerCoreShell}</td>
                    <td>${d.L_initial.toFixed(2)}</td>
                    <td>${!isNaN(d.Idc_70) ? d.Idc_70.toFixed(2) : 'N/A'}</td>
                    <td>${!isNaN(d.Idc_80) ? d.Idc_80.toFixed(2) : 'N/A'}</td>
                    <td>${d.Gap !== undefined ? d.Gap.toFixed(2) : 'N/A'}</td>
                    <td>${d.N}</td>
                    <td>${!isNaN(d.FoM) ? d.FoM.toFixed(1) : 'N/A'}</td>
                </tr>`; 
            }); 
            parsedDataTableBody.innerHTML = rows; 
        },
        updateFilterControls(container, values, checkAll = false) { const checkedState = new Map(); container.querySelectorAll('input[type="checkbox"]').forEach(chk => { checkedState.set(chk.dataset.value, chk.checked); }); container.innerHTML = ''; if (!values || values.length === 0) return; values.forEach(value => { const isChecked = checkAll ? 'checked' : (checkedState.has(value) ? (checkedState.get(value) ? 'checked' : '') : 'checked'); container.innerHTML += `<div class="filter-item"><input type="checkbox" id="chk-${container.id}-${value}" data-value="${value}" ${isChecked}><label for="chk-${container.id}-${value}">${value}</label></div>`; }); },
        updateStatsTable(groupedData) { const { statsTableBody } = this.elements; statsTableBody.innerHTML = ''; if (Object.keys(groupedData).length === 0) { statsTableBody.innerHTML = '<tr><td colspan="7">No data selected. Check filters.</td></tr>'; return; } for (const group in groupedData) { const items = groupedData[group]; const calcStats = (arr) => { const filteredArr = arr.filter(v => !isNaN(v)); return filteredArr.length ? filteredArr.reduce((a, b) => a + b, 0) / filteredArr.length : 0; }; const l_avg = calcStats(items.map(d => d.L_initial)); const i70_avg = calcStats(items.map(d => d.Idc_70)); const i80_avg = calcStats(items.map(d => d.Idc_80)); const fom_avg = calcStats(items.map(d => d.FoM)); const gap_avg = calcStats(items.map(d => d.Gap)); statsTableBody.innerHTML += `<tr><td><strong>${group}</strong></td><td>${items.length}</td><td>${l_avg.toFixed(2)}</td><td>${i70_avg > 0 ? i70_avg.toFixed(2) : 'N/A'}</td><td>${i80_avg > 0 ? i80_avg.toFixed(2) : 'N/A'}</td><td>${fom_avg > 0 ? fom_avg.toFixed(1) : 'N/A'}</td><td>${gap_avg > 0 ? gap_avg.toFixed(2) : 'N/A'}</td></tr>`; } },
        showStatus(msg, isError = false) { const { chartStatus } = this.elements; chartStatus.textContent = msg; chartStatus.style.display = 'block'; chartStatus.style.background = isError ? 'rgba(239, 68, 68, 0.7)' : 'rgba(0, 0, 0, 0.7)'; },
        createChart() {
            const baseData = this.getFilteredData();
            const groupedData = this.groupData(baseData, 'centerLegCore');
            const allCenterLegs = [...new Set(this.parsedData.map(d => d.centerLegCore))].sort();
            
            if (this.chartInstance) {
                this.chartInstance.destroy();
            }

            this.chartAnnotations = [];

            const ctx = this.elements.mainChart.getContext('2d');
            ctx.clearRect(0, 0, this.elements.mainChart.width, this.elements.mainChart.height);
            
            if (!baseData.length) {
                this.showStatus('No data to display.', true);
                return;
            }
            this.showStatus('Generating summary chart...');

            const { xAxis, yAxis } = this.elements;

            const getLabelText = (item) => {
                if (!item) return '';
                return [
                    `${item.centerLegCore} / Shell ${item.outerCoreShell}`,
                    `L=${item.L_initial.toFixed(1)} μH`,
                    `Idc_70=${!isNaN(item.Idc_70) ? item.Idc_70.toFixed(1) : 'N/A'} A, Idc_80=${!isNaN(item.Idc_80) ? item.Idc_80.toFixed(1) : 'N/A'} A`,
s                  `Gap=${item.Gap !== undefined ? item.Gap.toFixed(1) : 'N/A'} mm, N=${item.N}`
                    
                ];
            };

            const datasets = Object.keys(groupedData).map(group => {
                const coreIndex = allCenterLegs.indexOf(group);
                const color = this.defaultColors[coreIndex % this.defaultColors.length];
                const pointStyle = this.pointStyles[coreIndex % this.pointStyles.length];
                const data = groupedData[group].map(item => ({
                    x: item[xAxis.value],
                    y: item[yAxis.value],
                    raw: item
                })).filter(d => !isNaN(d.x) && !isNaN(d.y)); // Filter out NaN data
                return {
                    label: group,
                    data,
                    backgroundColor: color,
                    borderColor: color,
                    pointStyle: pointStyle,
                    radius: 6,
                    hoverRadius: 9
                };
            });

            const annotationPlugin = {
                id: 'clickAnnotations',
                afterDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.font = '15px Arial';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'bottom';

                    this.chartAnnotations.forEach(annotation => {
                        const model = chart.getDatasetMeta(annotation.datasetIndex).data[annotation.index];
                        if (!model) return;

                        const x = model.x + 10;
                        const y = model.y;
                        const textLines = annotation.text;
                        const lineHeight = 14;
                        const textWidth = Math.max(...textLines.map(line => ctx.measureText(line).width));
                        
                        ctx.fillStyle = document.body.getAttribute('data-theme') === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)';
                        ctx.fillRect(x - 3, y - (lineHeight * textLines.length) - 3, textWidth + 6, (lineHeight * textLines.length) + 6);
                        ctx.strokeStyle = document.body.getAttribute('data-theme') === 'dark' ? '#475569' : '#e2e8f0';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x - 3, y - (lineHeight * textLines.length) - 3, textWidth + 6, (lineHeight * textLines.length) + 6);

                        ctx.fillStyle = document.body.getAttribute('data-theme') === 'dark' ? '#f1f5f9' : '#0f172a';
                        textLines.forEach((line, i) => {
                            ctx.fillText(line, x, y - (lineHeight * (textLines.length - 1 - i)));
                        });
                    });
                    ctx.restore();
                }
            };

            const currentTheme = document.body.getAttribute('data-theme');
            const textColor = currentTheme === 'dark' ? '#f1f5f9' : '#0f172a';
            const axisColor = currentTheme === 'dark' ? '#94a3b8' : '#64748b';
            const gridColor = currentTheme === 'dark' ? '#475569' : '#e2e8f0';

            this.chartInstance = new Chart(this.elements.mainChart, {
                type: 'scatter',
                data: { datasets },
                plugins: [annotationPlugin],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    color: textColor,
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const { datasetIndex, index } = elements[0];
                            const item = this.chartInstance.data.datasets[datasetIndex].data[index].raw;

                            const existingAnnotationIndex = this.chartAnnotations.findIndex(
                                a => a.datasetIndex === datasetIndex && a.index === index
                            );

                            if (existingAnnotationIndex > -1) {
                                this.chartAnnotations.splice(existingAnnotationIndex, 1);
                            } else {
                                this.chartAnnotations.push({
                                    datasetIndex,
                                    index,
                                    text: getLabelText(item)
          _                   });
                            }
                            this.chartInstance.update('none');
                        }
                    },
                    plugins: {
                        legend: {
                s           position: 'top',
                            labels: { usePointStyle: true, padding: 20, color: textColor }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const item = context.raw?.raw;
s                                 return getLabelText(item);
                                }
                            }
                        }
                    },
                    scales: {
                        x: { 
                            title: { display: true, text: xAxis.options[xAxis.selectedIndex].text, color: axisColor },
                            ticks: { color: axisColor },
                            grid: { color: gridColor }
                        },
                        y: { 
                            title: { display: true, text: yAxis.options[yAxis.selectedIndex].text, color: axisColor },
                            ticks: { color: axisColor },
                            grid: { color: gridColor }
                        }
                    }
                }
            });
            setTimeout(() => this.elements.chartStatus.style.display = 'none', 1000);
        },
        exportCSV() { const data = this.getFilteredData(); if (data.length === 0) { alert('No data selected to export.'); return; } const headers = "CenterLegCore,OuterCoreShell,L_initial(uH),Idc_70%(A),Idc_80%(A),Gap(mm),N,FoM"; const rows = data.map(d => `${d.centerLegCore},${d.outerCoreShell},${d.L_initial.toFixed(2)},${!isNaN(d.Idc_70) ? d.Idc_70.toFixed(2) : 'N/A'},${!isNaN(d.Idc_80) ? d.Idc_80.toFixed(2) : 'N/A'},${d.Gap !== undefined ? d.Gap.toFixed(2) : 'N/A'},${d.N},${!isNaN(d.FoM) ? d.FoM.toFixed(1) : 'N/A'}`); const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n"); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "inductance_data_export.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link); },
        exportPNG() { if (!this.chartInstance || !this.getFilteredData().length) { alert('No chart available to export.'); return; } const url = this.chartInstance.toBase64Image(); const link = document.createElement('a'); link.download = 'inductance_chart.png'; link.href = url; link.click(); }
    };
    app.init();
    // --- END: Analysis App Logic ---
});
