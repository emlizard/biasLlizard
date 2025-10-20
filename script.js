// --- START: Theme Toggle Logic (NEW) ---
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    // data-theme 속성이 없으면 시스템 설정을 확인
    const currentTheme = body.dataset.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    if (currentTheme === 'dark') {
        body.dataset.theme = 'light';
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    } else {
        body.dataset.theme = 'dark';
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    }
    // 차트가 이미 그려져 있다면 테마에 맞게 다시 그림
    if (window.app && window.app.chartInstance) {
        window.app.createChart();
    }
}

// Set initial theme on page load
(function () {
    // DOM이 로드되기 전에 테마를 설정하여 깜박임 방지
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const targetTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    document.body.dataset.theme = targetTheme;

    // 아이콘은 DOM 로드 후에 설정
    document.addEventListener('DOMContentLoaded', () => {
        const themeIcon = document.getElementById('themeIcon');
        if (targetTheme === 'dark') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    });
})();
// --- END: Theme Toggle Logic ---


// --- START: Calculation Logic (Interpolation/Extrapolation) ---
class CubicSpline {
    constructor(x, y) { this.x = [...x]; this.y = [...y]; this.n = x.length; this.calculateCoefficients(); }
    calculateCoefficients() { const n = this.n; const h = new Array(n - 1); for (let i = 0; i < n - 1; i++) h[i] = this.x[i + 1] - this.x[i]; const alpha = new Array(n - 1); for (let i = 1; i < n - 1; i++) alpha[i] = (3 / h[i]) * (this.y[i + 1] - this.y[i]) - (3 / h[i - 1]) * (this.y[i] - this.y[i - 1]); const l = new Array(n); const mu = new Array(n); const z = new Array(n); l[0] = 1; mu[0] = 0; z[0] = 0; for (let i = 1; i < n - 1; i++) { l[i] = 2 * (this.x[i + 1] - this.x[i - 1]) - h[i - 1] * mu[i - 1]; mu[i] = h[i] / l[i]; z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i]; } l[n - 1] = 1; z[n - 1] = 0; this.c = new Array(n); this.b = new Array(n - 1); this.d = new Array(n - 1); this.c[n - 1] = 0; for (let j = n - 2; j >= 0; j--) { this.c[j] = z[j] - mu[j] * this.c[j + 1]; this.b[j] = (this.y[j + 1] - this.y[j]) / h[j] - h[j] * (this.c[j + 1] + 2 * this.c[j]) / 3; this.d[j] = (this.c[j + 1] - this.c[j]) / (3 * h[j]); } }
    interpolate(x) { if (x < this.x[0] || x > this.x[this.n-1]) return null; let i = 0; for (i = 0; i < this.n - 1; i++) if (x <= this.x[i + 1]) break; const dx = x - this.x[i]; return this.y[i] + this.b[i] * dx + this.c[i] * dx * dx + this.d[i] * dx * dx * dx; }
    findX(targetY, tolerance = 0.001) { let left = this.x[0], right = this.x[this.n - 1]; let iterations = 0; const maxIterations = 200; while (right - left > tolerance && iterations < maxIterations) { const mid = (left + right) / 2; const midY = this.interpolate(mid); if (midY === null) return { value: null }; if (midY > targetY) left = mid; else right = mid; iterations++; } const finalValue = (left + right) / 2; return { value: finalValue, isExtrapolated: false }; }
}
function polynomialRegression(x, y) { const n = x.length; let sumX = 0, sumY = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0, sumXY = 0, sumX2Y = 0; for (let i = 0; i < n; i++) { sumX += x[i]; sumY += y[i]; sumX2 += x[i] * x[i]; sumX3 += x[i] * x[i] * x[i]; sumX4 += x[i] * x[i] * x[i] * x[i]; sumXY += x[i] * y[i]; sumX2Y += x[i] * x[i] * y[i]; } const SXX = sumX2 - sumX * sumX / n; const SXY = sumXY - sumX * sumY / n; const SXX2 = sumX3 - sumX * sumX2 / n; const SX2Y = sumX2Y - sumX2 * sumY / n; const SX2X2 = sumX4 - sumX2 * sumX2 / n; const denominator = (SX2X2 * SXX - SXX2 * SXX2); if (Math.abs(denominator) < 1e-10) return null; const a = (SX2Y * SXX - SXY * SXX2) / denominator; const b = (SXY * SX2X2 - SX2Y * SXX2) / denominator; const c = sumY / n - b * sumX / n - a * sumX2 / n; const yMean = sumY / n; let sst = 0, sse = 0; for (let i = 0; i < n; i++) { sst += (y[i] - yMean) * (y[i] - yMean); const predictedY = a * x[i] * x[i] + b * x[i] + c; sse += (y[i] - predictedY) * (y[i] - predictedY); } const r2 = 1 - (sse / sst); return { coefficients: [a, b, c], r2 }; }
function solveQuadratic(a, b, c, context, range) { const discriminant = b * b - 4 * a * c; if (discriminant < 0) return null; const root1 = (-b + Math.sqrt(discriminant)) / (2 * a); const root2 = (-b - Math.sqrt(discriminant)) / (2 * a); if (context === 'upper') { return root1 > range[1] ? root1 : (root2 > range[1] ? root2 : null); } if (context === 'lower') { return root1 < range[0] ? root1 : (root2 < range[0] ? root2 : null); } return null; }
function findIdcForTarget(idcValues, inductanceValues, targetPercentage) { const initialInductance = inductanceValues[0]; if (initialInductance === 0) return null; const normalizedInductance = inductanceValues.map(val => (val / initialInductance) * 100); const minInductance = Math.min(...normalizedInductance); const maxInductance = Math.max(...normalizedInductance); let resultIdc = null; if (targetPercentage >= minInductance && targetPercentage <= maxInductance) { const spline = new CubicSpline(idcValues, normalizedInductance); const splineResult = spline.findX(targetPercentage); resultIdc = splineResult.value; } else { const regression = polynomialRegression(idcValues, normalizedInductance); if (regression && regression.r2 >= 0.95) { const [a, b, c] = regression.coefficients; const c_prime = c - targetPercentage; const context = targetPercentage < minInductance ? 'upper' : 'lower'; const idcRange = [Math.min(...idcValues), Math.max(...idcValues)]; resultIdc = solveQuadratic(a, b, c_prime, context, idcRange); } } return resultIdc; }
// --- END: Calculation Logic ---


// --- START: Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {

    // --- START: Integration & Data Transformation Logic ---
    
    /**
     * UPDATED: This function now scans for 'L_initial' and 'Gap(mm)' rows.
     */
    function parseRawData(text) {
        const blocks = text.trim().split(/\n\s*\n/);
        const allSeries = [];
        const errors = [];
        const metaRegex = /^BLOCK:\s*(.+?)(?:,?\s*N:\s*(\d+))/i;

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
            
            const headers = lines[headerLineIndex].trim().split(/\s+/);
            let idcValues = [];
            let inductanceData = Array.from({ length: headers.length - 1 }, () => []);
            let tableEndIndex = headerLineIndex;

            for (let i = headerLineIndex + 1; i < lines.length; i++) {
                const parts = lines[i].trim().split(/\s+/);
                if (parts.length < 2 || isNaN(parseFloat(parts[0]))) { // Check only first col for end
                    tableEndIndex = i;
                    break;
                }
                idcValues.push(parseFloat(parts[0]));
                for (let j = 1; j < headers.length; j++) {
                    // Handle empty/missing data points in the middle of a row
                    inductanceData[j - 1].push(parseFloat(parts[j])); // will be NaN if empty
                }
                tableEndIndex = i + 1;
            }

            // Clean up NaN values from incomplete rows
            inductanceData = inductanceData.map(series => {
                const validData = [];
                for(let i=0; i<idcValues.length; i++) {
                    if (!isNaN(series[i])) {
                        validData.push({ idc: idcValues[i], l: series[i] });
                    }
                }
                return validData;
            });

            // Separate idc and inductance back out
            const allIdcValues = inductanceData.map(series => series.map(d => d.idc));
            const allInductanceValues = inductanceData.map(series => series.map(d => d.l));


            // Look for L_initial row
            let lInitialOverrideValues = [];
            const lInitialLine = lines.slice(tableEndIndex).find(l => l.toLowerCase().startsWith('l_initial'));
            if (lInitialLine) {
                lInitialOverrideValues = lInitialLine.trim().split(/\s+/).slice(1).map(parseFloat);
            } else {
                errors.push(`Block ${blockIndex + 1} (${centerLegName}): WARNING - 'L_initial' row not found. Using Idc=0 value.`);
            }
            
            // NEW: Look for Gap(mm) row
            let gapValues = [];
            const gapLine = lines.slice(tableEndIndex).find(l => l.toLowerCase().startsWith('gap(mm)'));
            if (gapLine) {
                gapValues = gapLine.trim().split(/\s+/).slice(1).map(parseFloat);
            } else {
                errors.push(`Block ${blockIndex + 1} (${centerLegName}): WARNING - 'Gap(mm)' row not found. Using 0.`);
            }

            for (let i = 1; i < headers.length; i++) {
                const currentIdc = allIdcValues[i-1] || [];
                const currentL = allInductanceValues[i-1] || [];

                if(currentIdc.length < 2) {
                    errors.push(`Block ${blockIndex + 1} (${centerLegName}), Col ${headers[i]}: Not enough data rows.`);
                    continue; // Skip this series
                }

                allSeries.push({
                    centerLegCoreName: centerLegName,
                    nValue: nValue,
                    model: headers[i],
                    idc: currentIdc,
                    inductance: currentL,
                    lInitialOverride: lInitialOverrideValues[i-1], // Can be undefined
                    gap: gapValues[i-1] !== undefined && !isNaN(gapValues[i-1]) ? gapValues[i-1] : 0 // ADDED
                });
            }
        });
        
        document.getElementById('processingErrors').innerHTML = errors.join('<br>');
        return allSeries;
    }

    /**
     * UPDATED: Uses s.gap, removes FoM, and passes raw L-Idc data through.
     */
    function calculateAndBuildFinalData(series) {
        return series.map(s => {
            // Calculation uses the measured data table (s.inductance) where index 0 is Idc=0
            const idc_70 = findIdcForTarget(s.idc, s.inductance, 70);
            const idc_80 = findIdcForTarget(s.idc, s.inductance, 80);

            // The final L_initial value for display/graphing is the override value.
            const final_L_initial = s.lInitialOverride !== undefined && !isNaN(s.lInitialOverride) 
                ? s.lInitialOverride 
                : s.inductance[0];

            return {
                centerLegCore: `${s.centerLegCoreName}_N${s.nValue}`,
                outerCoreShell: s.model,
                L_initial: final_L_initial,
                Idc_70: idc_70,
                Idc_80: idc_80,
                Gap: s.gap, // UPDATED
                N: s.nValue,
                // FoM REMOVED
                // NEW: Pass raw data through for charting
                rawIdc: s.idc,
                rawInductance: s.inductance
            };
        }).filter(d => d.L_initial > 0 && d.Idc_70 !== null && d.Idc_80 !== null);
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
            const idc_70s = items.map(d => d.Idc_70.toFixed(2)).join('\t');
            const idc_80s = items.map(d => d.Idc_80.toFixed(2)).join('\t');
            const gaps = items.map(d => d.Gap.toFixed(1)).join('\t'); // UPDATED to use real gap
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
    
    document.getElementById('processBtn').addEventListener('click', () => {
        const rawText = document.getElementById('rawInput').value;
        if (!rawText.trim()) { alert('Please paste raw data first.'); return; }
        
        // Note: parsedSeries contains the raw L-Idc curves
        const parsedSeries = parseRawData(rawText);
        if(parsedSeries.length === 0) { alert('Could not parse any valid data. Please check the format and error messages.'); return; }
        
        // Note: finalData also contains the raw L-Idc curves
        const finalData = calculateAndBuildFinalData(parsedSeries);
        if(finalData.length === 0) { alert('Data was parsed, but calculations failed for all entries. Check if Idc=0 data is present.'); return; }
        
        const formattedText = formatForAnalysisTool(finalData);
        document.getElementById('dataInput').value = formattedText;
        document.getElementById('analysisContainer').classList.remove('hidden');
        
        // app.updateAll() parses the intermediate text, which LOSES the raw L-Idc curves
        app.updateAll();

        // --- NEW: Merge raw L-Idc curves back into the app's parsed data ---
        // This is necessary because app.parseData() only reads the simplified summary
        app.parsedData.forEach(dataPoint => {
            const matchingRawSeries = finalData.find(raw => 
                raw.centerLegCore === dataPoint.centerLegCore &&
                raw.outerCoreShell === dataPoint.outerCoreShell &&
                Math.abs(raw.L_initial - dataPoint.L_initial) < 0.01 // Add a check for robustness
            );
            if (matchingRawSeries) {
                dataPoint.rawIdc = matchingRawSeries.rawIdc;
                dataPoint.rawInductance = matchingRawSeries.rawInductance;
            }
        });
        // --- END NEW MERGE STEP ---

        // Re-draw the chart with the newly merged raw data
        app.createChart();
    });

    // --- START: Analysis App Logic (Changes below this line) ---
    const app = {
        elements: {}, chartInstance: null, parsedData: [],
        defaultColors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
        pointStyles: ['circle', 'rect', 'triangle', 'rectRot', 'star', 'cross', 'rectRounded'],
        init() { 
            this.cacheElements(); 
            this.addEventListeners(); 
            this.activeLineSeries = new Map(); // NEW: To track L-Idc lines
            this.chartAnnotations = []; // Moved from createChart
            window.app = this; // Expose app to global scope for theme toggle
        },
        cacheElements() { const ids = [ 'dataInput', 'xAxis', 'yAxis', 'centerLegFilterControls', 'outerCoreFilterControls', 'mainChart', 'statsTableBody', 'dataCount', 'chartStatus', 'btnExportCSV', 'btnExportPNG', 'parsedDataTableBody', 'selectAllCenterLegs', 'deselectAllCenterLegs', 'selectAllOuterCores', 'deselectAllOuterCores' ]; ids.forEach(id => this.elements[id] = document.getElementById(id)); },
        addEventListeners() { const controlsToRedrawChart = ['xAxis', 'yAxis', 'centerLegFilterControls', 'outerCoreFilterControls']; controlsToRedrawChart.forEach(id => this.elements[id].addEventListener('change', () => this.updateUI())); this.elements.btnExportCSV.addEventListener('click', () => this.exportCSV()); this.elements.btnExportPNG.addEventListener('click', () => this.exportPNG()); this.elements.selectAllCenterLegs.addEventListener('click', () => { this.setAllCheckboxes(this.elements.centerLegFilterControls, true); this.updateUI(); }); this.elements.deselectAllCenterLegs.addEventListener('click', () => { this.setAllCheckboxes(this.elements.centerLegFilterControls, false); this.updateUI(); }); this.elements.selectAllOuterCores.addEventListener('click', () => { this.setAllCheckboxes(this.elements.outerCoreFilterControls, true); this.updateUI(); }); this.elements.deselectAllOuterCores.addEventListener('click', () => { this.setAllCheckboxes(this.elements.outerCoreFilterControls, false); this.updateUI(); }); },
        setAllCheckboxes(container, isChecked) { container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = isChecked); },
        parseData() { 
            const lines = this.elements.dataInput.value.trim().split('\n'); 
            const result = []; 
            let currentBlock = this.createEmptyBlock(); 
            const flushBlock = () => { 
                if (!currentBlock.centerLegCore) return; 
                const { centerLegCore, outerCoreShells, lValues, idc70Values, idc80Values, gapValues, nValues } = currentBlock; 
                const n = Math.min(outerCoreShells.length, lValues.length, idc70Values.length, idc80Values.length, gapValues.length, nValues.length); 
                for (let i = 0; i < n; i++) { 
                    const L = lValues[i], I70 = idc70Values[i], I80 = idc80Values[i], G = gapValues[i], N = nValues[i]; 
                    if ([L, I70, I80, G, N].some(v => v === undefined || isNaN(v))) continue; 
                    result.push({ 
                        centerLegCore: centerLegCore,s 
                        outerCoreShell: String(outerCoreShells[i]), 
                        L_initial: L, 
                        Idc_70: I70, 
                        Idc_80: I80, 
                        Gap: G, 
                        N: N, 
                        // FoM REMOVED
                    }); 
                } 
                currentBlock = this.createEmptyBlock();
            }; 
            for (const line of lines) { 
                const trimmedLine = line.trim(); 
                if (!trimmedLine) continue;
                const parts = trimmedLine.split(/\s+/); 
                const label = parts[0].toLowerCase(); 
                if (label.startsWith('clc_')) { 
                    flushBlock(); currentBlock.centerLegCore = parts[0]; 
                    currentBlock.outerCoreShells = parts.slice(1); 
                } else if (label.startsWith('l_initial')) { 
                    currentBlock.lValues = parts.slice(1).map(parseFloat); 
                } else if (label.startsWith('idc_70%')) { 
                    currentBlock.idc70Values = parts.slice(1).map(parseFloat);
                } else if (label.startsWith('idc_80%')) { 
                    currentBlock.idc80Values = parts.slice(1).map(parseFloat); 
                } else if (label.startsWith('gap(mm)')) { 
                    currentBlock.gapValues = parts.slice(1).map(parseFloat);
                } else if (label.startsWith('n')) { 
                    currentBlock.nValues = parts.slice(1).map(parseFloat);
                } 
            } 
            flushBlock(); 
            return result; 
        },
        createEmptyBlock: () => ({ centerLegCore: null, outerCoreShells: [], lValues: [], idc70Values: [], idc80Values: [], gapValues: [], nValues: [] }),
        getFilteredData() { const selectedCenterLegs = new Set(Array.from(this.elements.centerLegFilterControls.querySelectorAll('input:checked')).map(chk => chk.dataset.value)); const selectedOuterShells = new Set(Array.from(this.elements.outerCoreFilterControls.querySelectorAll('input:checked')).map(chk => chk.dataset.value)); if (selectedCenterLegs.size === 0 || selectedOuterShells.size === 0) return []; return this.parsedData.filter(d => selectedCenterLegs.has(d.centerLegCore) && selectedOuterShells.has(d.outerCoreShell)); },
        groupData: (data, groupBy) => data.reduce((groups, item) => { const key = item[groupBy]; if (!groups[key]) groups[key] = []; groups[key].push(item); return groups; }, {}),
        updateAll() { 
            this.parsedData = this.parseData(); 
            // Clear dynamic series when data is fully re-parsed
            this.activeLineSeries.clear();
            this.chartAnnotations = [];

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
                parsedDataTableBody.innerHTML = `<tr><td colspan="7">No data recognized.</td></tr>`; // Colspan updated to 7
                return; 
            } 
            let rows = '';s 
            this.parsedData.forEach(d => { 
                // REMOVED FoM
                rows += `<tr><td>${d.centerLegCore}</td><td>${d.outerCoreShell}</td><td>${d.L_initial.toFixed(2)}</td><td>${d.Idc_70.toFixed(2)}</td><td>${d.Idc_80.toFixed(2)}</td><td>${d.Gap.toFixed(2)}</td><td>${d.N}</td></tr>`;
            }); 
            parsedDataTableBody.innerHTML = rows; 
        },
        // ===================================
        // ===== ✨ BUG FIXED HERE ✨ =====
        // ===================================
        updateFilterControls(container, values, checkAll = false) { 
            const checkedState = new Map(); 
            container.querySelectorAll('input[type="checkbox"]').forEach(chk => { 
                checkedState.set(chk.dataset.value, chk.checked); 
            }); 
            container.innerHTML = ''; 
            if (!values || values.length === 0) return; 
            values.forEach(value => { 
                const isChecked = checkAll ? 'checked' : (checkedState.has(value) ? (checkedState.get(value) ? 'checked' : '') : 'checked'); 
                // [오타 수정] <div class.filter-item">  -> <div class="filter-item">
                container.innerHTML += `<div class="filter-item"><input type="checkbox" id="chk-${container.id}-${value}" data-value="${value}" ${isChecked}><label for="chk-${container.id}-${value}">${value}</label></div>`; 
            }); 
        },
        updateStatsTable(groupedData) { 
            const { statsTableBody } = this.elements; 
            statsTableBody.innerHTML = ''; 
            if (Object.keys(groupedData).length === 0) {
                statsTableBody.innerHTML = '<tr><td colspan="6">No data selected. Check filters.</td></tr>'; // Colspan updated to 6
                return; 
            } 
            for (const group in groupedData) { 
                const items = groupedData[group]; 
                const calcStats = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; 
                // REMOVED FoM
                statsTableBody.innerHTML += `<tr><td><strong>${group}</strong></td><td>${items.length}</td><td>${calcStats(items.map(d => d.L_initial)).toFixed(2)}</td><td>${calcStats(items.map(d => d.Idc_70)).toFixed(2)}</td><td>${calcStats(items.map(d => d.Idc_80)).toFixed(2)}</td><td>${calcStats(items.map(d => d.Gap)).toFixed(2)}</td></tr>`; 
            } 
        },
        showStatus(msg, isError = false) { const { chartStatus } = this.elements; chartStatus.textContent = msg; chartStatus.style.display = 'block'; chartStatus.style.background = isError ? 'rgba(200, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)'; },
        
        // ==================================================================
        // ===== ✨ MODIFIED SECTION START (L-Idc Plotting) ✨ =====
        // ==================================================================
        createChart() {
            // --- NEW: Get theme colors ---
            const isDark = document.body.dataset.theme === 'dark';
            const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            const textColor = isDark ? '#f1f5f9' : '#0f172a';
            const tooltipBg = isDark ? '#334155' : '#ffffff';
            const tooltipColor = isDark ? '#f1f5f9' : '#0f172a';
            const annotationBg = isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)';
            const annotationColor = textColor;
            const annotationBorder = isDark ? '#475569' : '#999';

            const baseData = this.getFilteredData();
            const groupedData = this.groupData(baseData, 'centerLegCore');
            const allCenterLegs = [...new Set(this.parsedData.map(d => d.centerLegCore))].sort();
            
            if (this.chartInstance) {
                this.chartInstance.destroy();
            }

            // Note: this.chartAnnotations is now initialized in app.init()

            const ctx = this.elements.mainChart.getContext('2d');
            ctx.clearRect(0, 0, this.elements.mainChart.width, this.elements.mainChart.height);
            
            if (!baseData.length) {
                this.showStatus('No data to display.', true);
                return;
            }
            this.showStatus('Generating chart...');

            const { xAxis, yAxis } = this.elements;

            // 툴팁과 클릭 레이블에 사용될 텍스트를 생성하는 헬퍼 함수입니다. (FoM REMOVED)
            const getLabelText = (item) => {
                if (!item) return '';
                return [
                    `${item.centerLegCore} / Shell ${item.outerCoreShell}`,
                    `L=${item.L_initial.toFixed(1)} μH`,
                    `Idc_70=${item.Idc_70.toFixed(1)} A, Idc_80=${item.Idc_80.toFixed(1)} A`,
                    `Gap=${item.Gap.toFixed(1)} mm, N=${item.N}`
                    // FoM REMOVED
                ];
            };

            const datasets = Object.keys(groupedData).map(group => {
                const coreIndex = allCenterLegs.indexOf(group);
                const color = this.defaultColors[coreIndex % this.defaultColors.length];
                const pointStyle = this.pointStyles[coreIndex % this.pointStyles.length];
                const data = groupedData[group].map(item => ({
                    x: item[xAxis.value],
                    y: item[yAxis.value],
                    raw: item // 'raw' now contains rawIdc and rawInductance
                }));
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

            // NEW: Add any active L-Idc line series back to the datasets
            this.activeLineSeries.forEach(series => {
                datasets.push(series);
            });

            // --- NEW: 클릭된 레이블을 그리기 위한 커스텀 플러그인 ---
            const annotationPlugin = {
                id: 'clickAnnotations',
                afterDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'bottom';

                    this.chartAnnotations.forEach(annotation => {
                        const model = chart.getDatasetMeta(annotation.datasetIndex)?.data[annotation.index];
                        if (!model) return;

                        const x = model.x + 10;
                        const y = model.y;
                        const textLines = annotation.text;
                        const lineHeight = 14;
                        const textWidth = Math.max(...textLines.map(line => ctx.measureText(line).width));
                        
                        // 테마 적용
                        ctx.fillStyle = annotationBg; 
                        ctx.fillRect(x - 3, y - (lineHeight * textLines.length) - 3, textWidth + 6, (lineHeight * textLines.length) + 6);
                        ctx.strokeStyle = annotationBorder;
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x - 3, y - (lineHeight * textLines.length) - 3, textWidth + 6, (lineHeight * textLines.length) + 6);

                        ctx.fillStyle = annotationColor;
                        textLines.forEach((line, i) => {
                            ctx.fillText(line, x, y - (lineHeight * (textLines.length - 1 - i)));
                        });
                    });
                    ctx.restore();
                }
            };

            this.chartInstance = new Chart(this.elements.mainChart, {
                type: 'scatter',
                data: { datasets },
                plugins: [annotationPlugin], // 커스텀 플러그인을 등록합니다.
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    // --- NEW: onClick handles both annotations AND L-Idc lines ---
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const { datasetIndex, index } = elements[0];
                            // Avoid clicking on the line plot points
                            if (this.chartInstance.data.datasets[datasetIndex].type === 'line') return;

                            const item = this.chartInstance.data.datasets[datasetIndex].data[index].raw;
                            const seriesKey = `${datasetIndex}-${index}`;

                            const existingAnnotationIndex = this.chartAnnotations.findIndex(
                                a => a.datasetIndex === datasetIndex && a.index === index
                            );

                            if (existingAnnotationIndex > -1) {
                                // --- REMOVE Annotation and Line ---
                                this.chartAnnotations.splice(existingAnnotationIndex, 1);
                                
                                if (this.activeLineSeries.has(seriesKey)) {
                                    const lineLabelToRemove = this.activeLineSeries.get(seriesKey).label;
                                    const datasetIndexToRemove = this.chartInstance.data.datasets.findIndex(ds => ds.label === lineLabelToRemove);
                                    if (datasetIndexToRemove > -1) {
                                        this.chartInstance.data.datasets.splice(datasetIndexToRemove, 1);
                                    }
                                    this.activeLineSeries.delete(seriesKey);
                                }

                            } else {
                                // --- ADD Annotation and Line ---
                                this.chartAnnotations.push({
                                    datasetIndex,
                                    index,
                                    text: getLabelText(item)
                                });

                                if (item.rawIdc && item.rawInductance && !this.activeLineSeries.has(seriesKey)) {
                                    const lineLabel = `L-Idc: ${item.outerCoreShell}`;
                                    const lineData = item.rawIdc.map((idc, i) => ({ x: idc, y: item.rawInductance[i] }));
                                    const scatterColor = this.chartInstance.data.datasets[datasetIndex].backgroundColor;

                                    const newLineSeries = {
                                        label: lineLabel,
                                        data: lineData,
                                        type: 'line',
                                        borderColor: scatterColor,
                                        borderWidth: 2,
                                        borderDash: [5, 5],
                                        fill: false,
                                        pointRadius: 2,
                                        tension: 0.1,
                                        xAxisID: 'xLidc', // Bind to new X-axis
s                                     yAxisID: 'yLidc'  // Bind to new Y-axis
                                    };

                                    this.activeLineSeries.set(seriesKey, newLineSeries);
                                    this.chartInstance.data.datasets.push(newLineSeries);
                                }
                            }

                            // Update axis visibility
                            const showLidcAxes = this.activeLineSeries.size > 0;
                            this.chartInstance.options.scales.xLidc.display = showLidcAxes;
                            this.chartInstance.options.scales.yLidc.display = showLidcAxes; 

                            this.chartInstance.update('none');
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { 
                                usePointStyle: true, 
                                padding: 20,
                                color: textColor // 테마 적용
                            }
                        },
                        tooltip: {
                            backgroundColor: tooltipBg, // 테마 적용
                            titleColor: tooltipColor, // 테마 적용
                            bodyColor: tooltipColor, // 테마 적용
                            callbacks: {
                                label: (context) => {
                                // Don't show complex tooltip for the L-Idc line itself
                                if (context.dataset.type === 'line') {
                                    return `${context.dataset.label}: (Idc: ${context.parsed.x}, L: ${context.parsed.y.toFixed(1)})`;
                                }
                                    const item = context.raw?.raw;
                                    return getLabelText(item);
                                }
                            }
                        }
                    },
                    // --- NEW: Added secondary axes for L-Idc lines + Theme ---
                    scales: {
                        x: { // Main scatter X-axis (Bottom)
                            type: 'linear',
                            position: 'bottom',
                            title: { display: true, text: xAxis.options[xAxis.selectedIndex].text, color: textColor }, 
                            grid: { color: gridColor },
                            ticks: { color: textColor }
                        },
                        y: { // Main scatter Y-axis (Left)
                            type: 'linear',
                            position: 'left',
                            title: { display: true, text: yAxis.options[yAxis.selectedIndex].text, color: textColor }, 
                            grid: { color: gridColor },
                            ticks: { color: textColor }
                        },
                        xLidc: { // Secondary L-Idc X-axis (Top)
                            type: 'linear',
                            position: 'top',
                            display: this.activeLineSeries.size > 0, // Show only if lines are active
                            title: { display: true, text: 'Idc (A)', color: textColor },
                            grid: { drawOnChartArea: false }, // No grid lines
                            ticks: { color: textColor }
                        },
                        yLidc: { // Secondary L-Idc Y-axis (Right)
                            type: 'linear',
                            position: 'right',
                            display: this.activeLineSeries.size > 0, // Show only if lines are active
                            title: { display: true, text: 'Inductance (uH)', color: textColor },
                            grid: { drawOnChartArea: false }, // No grid lines
                            ticks: { color: textColor }
                        }
                    }
                }
            });
            setTimeout(() => this.elements.chartStatus.style.display = 'none', 1000);
        },
        // ==================================================================
        // ===== ✨ MODIFIED SECTION END ✨ =====
        // ==================================================================
        exportCSV() { 
            const data = this.getFilteredData(); 
            if (data.length === 0) { 
                alert('No data selected to export.'); 
                return; 
            } 
            // REMOVED FoM
            const headers = "CenterLegCore,OuterCoreShell,L_initial(uH),Idc_70%(A),Idc_80%(A),Gap(mm),N";s 
            // REMOVED FoM
            const rows = data.map(d => `${d.centerLegCore},${d.outerCoreShell},${d.L_initial},${d.Idc_70},${d.Idc_80},${d.Gap},${d.N}`); 
            const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n"); 
            const encodedUri = encodeURI(csvContent);s 
            const link = document.createElement("a"); 
            link.setAttribute("href", encodedUri); 
            link.setAttribute("download", "inductance_data_export.csv"); 
            document.body.appendChild(link); 
            link.click(); 
            document.body.removeChild(link);s 
        },
        exportPNG() { if (!this.chartInstance || !this.getFilteredData().length) { alert('No chart available to export.'); return; } const url = this.chartInstance.toBase64Image(); const link = document.createElement('a'); link.download = 'inductance_chart.png'; link.href = url; link.click(); }
    };
    app.init();
    // --- END: Analysis App Logic ---
});
