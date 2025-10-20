// --- START: Theme Toggle Logic ---
document.getElementById('themeToggle').addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
});

// --- START: Calculation Logic (Interpolation/Extrapolation) ---
class CubicSpline {
    constructor(x, y) { this.x = [...x]; this.y = [...y]; this.n = x.length; this.calculateCoefficients(); }
    calculateCoefficients() { 
        const n = this.n; const h = new Array(n - 1); 
        for (let i = 0; i < n - 1; i++) h[i] = this.x[i + 1] - this.x[i]; 
        const alpha = new Array(n - 1); 
        for (let i = 1; i < n - 1; i++) alpha[i] = (3 / h[i]) * (this.y[i + 1] - this.y[i]) - (3 / h[i - 1]) * (this.y[i] - this.y[i - 1]); 
        const l = new Array(n); const mu = new Array(n); const z = new Array(n); 
        l[0] = 1; mu[0] = 0; z[0] = 0; 
        for (let i = 1; i < n - 1; i++) { 
            l[i] = 2 * (this.x[i + 1] - this.x[i - 1]) - h[i - 1] * mu[i - 1]; 
            mu[i] = h[i] / l[i]; 
            z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i]; 
        } 
        l[n - 1] = 1; z[n - 1] = 0; 
        this.c = new Array(n); this.b = new Array(n - 1); this.d = new Array(n - 1); 
        this.c[n - 1] = 0; 
        for (let j = n - 2; j >= 0; j--) { 
            this.c[j] = z[j] - mu[j] * this.c[j + 1]; 
            this.b[j] = (this.y[j + 1] - this.y[j]) / h[j] - h[j] * (this.c[j + 1] + 2 * this.c[j]) / 3; 
            this.d[j] = (this.c[j + 1] - this.c[j]) / (3 * h[j]); 
        } 
    }
    interpolate(x) { 
        if (x < this.x[0] || x > this.x[this.n-1]) return null; 
        let i = 0; 
        for (i = 0; i < this.n - 1; i++) if (x <= this.x[i + 1]) break; 
        const dx = x - this.x[i]; 
        return this.y[i] + this.b[i] * dx + this.c[i] * dx * dx + this.d[i] * dx * dx * dx; 
    }
    findX(targetY, tolerance = 0.001) { 
        let left = this.x[0], right = this.x[this.n - 1]; 
        let iterations = 0; 
        const maxIterations = 200; 
        while (right - left > tolerance && iterations < maxIterations) { 
            const mid = (left + right) / 2; 
            const midY = this.interpolate(mid); 
            if (midY === null) return { value: null }; 
            if (midY > targetY) left = mid; else right = mid; 
            iterations++; 
        } 
        const finalValue = (left + right) / 2; 
        return { value: finalValue, isExtrapolated: false }; 
    }
}
function polynomialRegression(x, y) { 
    const n = x.length; 
    let sumX = 0, sumY = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0, sumXY = 0, sumX2Y = 0; 
    for (let i = 0; i < n; i++) { 
        sumX += x[i]; sumY += y[i]; 
        sumX2 += x[i] * x[i]; sumX3 += x[i] * x[i] * x[i]; 
        sumX4 += x[i] * x[i] * x[i] * x[i]; 
        sumXY += x[i] * y[i]; sumX2Y += x[i] * x[i] * y[i]; 
    } 
    const SXX = sumX2 - sumX * sumX / n; 
    const SXY = sumXY - sumX * sumY / n; 
    const SXX2 = sumX3 - sumX * sumX2 / n; 
    const SX2Y = sumX2Y - sumX2 * sumY / n; 
    const SX2X2 = sumX4 - sumX2 * sumX2 / n; 
    const denominator = (SX2X2 * SXX - SXX2 * SXX2); 
    if (Math.abs(denominator) < 1e-10) return null; 
    const a = (SX2Y * SXX - SXY * SXX2) / denominator; 
    const b = (SXY * SX2X2 - SX2Y * SXX2) / denominator; 
    const c = sumY / n - b * sumX / n - a * sumX2 / n; 
    const yMean = sumY / n; 
    let sst = 0, sse = 0; 
    for (let i = 0; i < n; i++) { 
        sst += (y[i] - yMean) * (y[i] - yMean); 
        const predictedY = a * x[i] * x[i] + b * x[i] + c; 
        sse += (y[i] - predictedY) * (y[i] - predictedY); 
    } 
    const r2 = 1 - (sse / sst); 
    return { coefficients: [a, b, c], r2 }; 
}
function solveQuadratic(a, b, c, context, range) { 
    const discriminant = b * b - 4 * a * c; 
    if (discriminant < 0) return null; 
    const root1 = (-b + Math.sqrt(discriminant)) / (2 * a); 
    const root2 = (-b - Math.sqrt(discriminant)) / (2 * a); 
    if (context === 'upper') { 
        return root1 > range[1] ? root1 : (root2 > range[1] ? root2 : null); 
    } 
    if (context === 'lower') { 
        return root1 < range[0] ? root1 : (root2 < range[0] ? root2 : null); 
    } 
    return null; 
}
function findIdcForTarget(idcValues, inductanceValues, targetPercentage) { 
    const initialInductance = inductanceValues[0]; 
    if (initialInductance === 0) return null; 
    const normalizedInductance = inductanceValues.map(val => (val / initialInductance) * 100); 
    const minInductance = Math.min(...normalizedInductance); 
    const maxInductance = Math.max(...normalizedInductance); 
    let resultIdc = null; 
    if (targetPercentage >= minInductance && targetPercentage <= maxInductance) { 
        const spline = new CubicSpline(idcValues, normalizedInductance); 
        const splineResult = spline.findX(targetPercentage); 
        resultIdc = splineResult.value; 
    } else { 
        const regression = polynomialRegression(idcValues, normalizedInductance); 
        if (regression && regression.r2 >= 0.95) { 
            const [a, b, c] = regression.coefficients; 
            const c_prime = c - targetPercentage; 
            const context = targetPercentage < minInductance ? 'upper' : 'lower'; 
            const idcRange = [Math.min(...idcValues), Math.max(...idcValues)]; 
            resultIdc = solveQuadratic(a, b, c_prime, context, idcRange); 
        } 
    } 
    return resultIdc; 
}
// --- END: Calculation Logic ---

// --- START: Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // [수정됨] parseRawData 함수: Gap(mm) 데이터를 읽도록 수정
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
                if (parts.length < headers.length || isNaN(parseFloat(parts[0]))) {
                    tableEndIndex = i;
                    break;
                }
                idcValues.push(parseFloat(parts[0]));
                for (let j = 1; j < headers.length; j++) {
                    inductanceData[j - 1].push(parseFloat(parts[j]));
                }
                tableEndIndex = i + 1;
            }

            let lInitialOverrideValues = [];
            const lInitialLine = lines.slice(tableEndIndex).find(l => l.toLowerCase().startsWith('l_initial'));
            if (lInitialLine) {
                lInitialOverrideValues = lInitialLine.trim().split(/\s+/).slice(1).map(parseFloat);
            } else {
                errors.push(`Block ${blockIndex + 1} (${centerLegName}): WARNING - 'L_initial' row not found. Using Idc=0 value.`);
            }

            // --- [수정 시작] Gap(mm) 데이터를 읽는 로직 추가 ---
            let gapValues = [];
            const gapLine = lines.slice(tableEndIndex).find(l => l.toLowerCase().startsWith('gap(mm)'));
            if (gapLine) {
                gapValues = gapLine.trim().split(/\s+/).slice(1).map(parseFloat);
            } else {
                errors.push(`Block ${blockIndex + 1} (${centerLegName}): WARNING - 'Gap(mm)' row not found. Defaulting to 0.`);
            }
            // --- [수정 끝] ---
            
            if (idcValues.length < 2) {
                errors.push(`Block ${blockIndex + 1} (${centerLegName}): Not enough data rows.`);
                return;
            }

            for (let i = 1; i < headers.length; i++) {
                allSeries.push({
                    centerLegCoreName: centerLegName,
                    nValue: nValue,
                    model: headers[i],
                    idc: idcValues,
                    inductance: inductanceData[i-1],
                    lInitialOverride: lInitialOverrideValues[i-1],
                    // --- [수정 시작] Gap 값을 객체에 추가 ---
                    gapValue: gapValues[i-1] !== undefined && !isNaN(gapValues[i-1]) ? gapValues[i-1] : 0
                    // --- [수정 끝] ---
                });
            }
        });
        
        document.getElementById('processingErrors').innerHTML = errors.join('<br>');
        return allSeries;
    }

    // [수정됨] calculateAndBuildFinalData 함수: 하드코딩된 Gap: 0 대신 실제 Gap 값 사용
    function calculateAndBuildFinalData(series) {
        return series.map(s => {
            const idc_70 = findIdcForTarget(s.idc, s.inductance, 70);
            const idc_80 = findIdcForTarget(s.idc, s.inductance, 80);

            const final_L_initial = s.lInitialOverride !== undefined && !isNaN(s.lInitialOverride) 
                ? s.lInitialOverride 
                : s.inductance[0];

            return {
                centerLegCore: `${s.centerLegCoreName}_N${s.nValue}`,
                outerCoreShell: s.model,
                L_initial: final_L_initial,
                Idc_70: idc_70,
                Idc_80: idc_80,
                // --- [수정 시작] 하드코딩된 'Gap: 0'을 's.gapValue'로 변경 ---
                Gap: s.gapValue,
                // --- [수정 끝] ---
                N: s.nValue,
                FoM: idc_80 ? final_L_initial * idc_80 : 0,
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
            const gaps = items.map(d => d.Gap.toFixed(1)).join('\t'); // Gap 값도 포맷팅
            const ns = items.map(d => d.N).join('\t');
            
            output += `${groupName}\t${shells}\n`;
            output += `L_initial(uH)\t${l_initials}\n`;
            output += `Idc_70%(A)\t${idc_70s}\n`;
            output += `Idc_80%(A)\t${idc_80s}\n`;
            output += `Gap(mm)\t${gaps}\n`; // "Gap(mm)"으로 생성
            output += `N\t${ns}\n\n`;
        }
        return output;
    }
    
    let rawSeriesData = [];

    document.getElementById('processBtn').addEventListener('click', () => {
        const rawText = document.getElementById('rawInput').value;
        if (!rawText.trim()) { alert('Please paste raw data first.'); return; }
        const parsedSeries = parseRawData(rawText);
        if(parsedSeries.length === 0) { alert('Could not parse any valid data. Please check the format and error messages.'); return; }
        rawSeriesData = parsedSeries;
        const finalData = calculateAndBuildFinalData(parsedSeries);
        if(finalData.length === 0) { alert('Data was parsed, but calculations failed for all entries. Check if Idc=0 data is present.'); return; }
        const formattedText = formatForAnalysisTool(finalData);
        document.getElementById('dataInput').value = formattedText;
        document.getElementById('analysisContainer').classList.remove('hidden');
        app.updateAll();
    });

    const app = {
        elements: {}, 
        chartInstance: null,
        idcInductanceChartInstance: null,
        parsedData: [],
        rawSeries: [], // rawSeries 데이터를 저장할 배열 추가
        defaultColors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
        pointStyles: ['circle', 'rect', 'triangle', 'rectRot', 'star', 'cross', 'rectRounded'],
        
        init() { 
            this.cacheElements(); 
            this.addEventListeners(); 
            this.rawSeries = rawSeriesData; // app 객체에 rawSeriesData 연결
        },
        cacheElements() { 
            const ids = [ 
                'dataInput', 'xAxis', 'yAxis', 'centerLegFilterControls', 'outerCoreFilterControls', 
                'mainChart', 'statsTableBody', 'dataCount', 'chartStatus', 'btnExportCSV', 'btnExportPNG', 
                'parsedDataTableBody', 'selectAllCenterLegs', 'deselectAllCenterLegs', 
                'selectAllOuterCores', 'deselectAllOuterCores',
                'idcInductanceChart', 'idcInductanceChartStatus' // 새 차트 ID 추가
            ]; 
            ids.forEach(id => this.elements[id] = document.getElementById(id)); 
        },
        addEventListeners() { 
            const controlsToRedrawChart = ['xAxis', 'yAxis', 'centerLegFilterControls', 'outerCoreFilterControls']; 
            controlsToRedrawChart.forEach(id => this.elements[id].addEventListener('change', () => this.updateUI())); 
            this.elements.btnExportCSV.addEventListener('click', () => this.exportCSV()); 
            this.elements.btnExportPNG.addEventListener('click', () => this.exportPNG()); 
            this.elements.selectAllCenterLegs.addEventListener('click', () => { 
                this.setAllCheckboxes(this.elements.centerLegFilterControls, true); 
                this.updateUI(); 
            }); 
            this.elements.deselectAllCenterLegs.addEventListener('click', () => { 
                this.setAllCheckboxes(this.elements.centerLegFilterControls, false); 
                this.updateUI(); 
            }); 
            this.elements.selectAllOuterCores.addEventListener('click', () => { 
                this.setAllCheckboxes(this.elements.outerCoreFilterControls, true); 
                this.updateUI(); 
            }); 
            this.elements.deselectAllOuterCores.addEventListener('click', () => { 
                this.setAllCheckboxes(this.elements.outerCoreFilterControls, false); 
                this.updateUI(); 
            }); 
        },
        setAllCheckboxes(container, isChecked) { 
            container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = isChecked); 
        },
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
                        centerLegCore: centerLegCore, 
                        outerCoreShell: String(outerCoreShells[i]), 
                        L_initial: L, 
                        Idc_70: I70, 
                        Idc_80: I80, 
                        Gap: G, 
                        N: N, 
                        FoM: L * I80, 
                    }); 
                } 
                currentBlock = this.createEmptyBlock(); 
            }; 
            for (const line of lines) { 
                const trimmedLine = line.trim(); 
                if (!trimmedLine) continue; 
                const parts = trimmedLine.split(/\s+/); 
                const label = parts[0].toLowerCase(); 
                if (label.startsWith('clc_') || label.startsWith('block:')) { // 'clc_' 또는 'block:'으로 시작하는 경우
                    flushBlock(); 
                    currentBlock.centerLegCore = parts[0]; 
                    currentBlock.outerCoreShells = parts.slice(1); 
                } else if (label.startsWith('l_initial')) { 
                    currentBlock.lValues = parts.slice(1).map(parseFloat); 
                } else if (label.startsWith('idc_70%')) { 
                    currentBlock.idc70Values = parts.slice(1).map(parseFloat); 
                } else if (label.startsWith('idc_80%')) { 
                    currentBlock.idc80Values = parts.slice(1).map(parseFloat); 
                } else if (label.startsWith('gap')) { // 'gap'으로 시작하는 경우 (예: 'gap(mm)')
                    currentBlock.gapValues = parts.slice(1).map(parseFloat); 
                } else if (label.startsWith('n')) { 
                    currentBlock.nValues = parts.slice(1).map(parseFloat); 
                } 
            } 
            flushBlock(); 
            return result; 
        },
        createEmptyBlock: () => ({ centerLegCore: null, outerCoreShells: [], lValues: [], idc70Values: [], idc80Values: [], gapValues: [], nValues: [] }),
        getFilteredData() { 
            const selectedCenterLegs = new Set(Array.from(this.elements.centerLegFilterControls.querySelectorAll('input:checked')).map(chk => chk.dataset.value)); 
            const selectedOuterShells = new Set(Array.from(this.elements.outerCoreFilterControls.querySelectorAll('input:checked')).map(chk => chk.dataset.value)); 
            if (selectedCenterLegs.size === 0 || selectedOuterShells.size === 0) return []; 
            return this.parsedData.filter(d => selectedCenterLegs.has(d.centerLegCore) && selectedOuterShells.has(d.outerCoreShell)); 
        },
        // rawSeries 데이터를 필터링하는 함수 추가
        getFilteredRawSeries() {
            const selectedCenterLegs = new Set(Array.from(this.elements.centerLegFilterControls.querySelectorAll('input:checked')).map(chk => chk.dataset.value));
            const selectedOuterShells = new Set(Array.from(this.elements.outerCoreFilterControls.querySelectorAll('input:checked')).map(chk => chk.dataset.value));
            if (selectedCenterLegs.size === 0 || selectedOuterShells.size === 0) return [];
            
            // app.rawSeries (전역 rawSeriesData에서 복사됨)를 필터링
            return this.rawSeries.filter(s => 
                selectedCenterLegs.has(`${s.centerLegCoreName}_N${s.nValue}`) && 
                selectedOuterShells.has(s.model)
            );
        },
        groupData: (data, groupBy) => data.reduce((groups, item) => { 
            const key = item[groupBy]; 
            if (!groups[key]) groups[key] = []; 
            groups[key].push(item); 
            return groups; 
        }, {}),
        updateAll() { 
            this.parsedData = this.parseData(); 
            this.rawSeries = rawSeriesData; // processBtn 클릭 시 rawSeriesData를 app.rawSeries에 동기화
            const allCenterLegs = [...new Set(this.parsedData.map(d => d.centerLegCore))].sort(); 
            const allOuterShells = [...new Set(this.parsedData.map(d => d.outerCoreShell))].sort((a, b) => a - b); 
            this.updateFilterControls(this.elements.centerLegFilterControls, allCenterLegs, true); 
            this.updateFilterControls(this.elements.outerCoreFilterControls, allOuterShells, true); 
            this.updateParsedDataTable(); 
            this.updateUI(); 
        },
        updateUI() { 
            const baseData = this.getFilteredData(); 
            const groupedData = this.groupData(baseData, 'centerLegCore'); 
            this.updateStatsTable(groupedData); 
            this.createChart(); 
            this.createIdcInductanceChart(); // 새 차트 업데이트 호출
        },
        updateParsedDataTable() { 
            const { parsedDataTableBody, dataCount } = this.elements; 
            parsedDataTableBody.innerHTML = ''; 
            dataCount.textContent = `Total of ${this.parsedData.length} data points recognized`; 
            if (this.parsedData.length === 0) { 
                parsedDataTableBody.innerHTML = `<tr><td colspan="8">No data recognized.</td></tr>`; 
                return; 
            } 
            let rows = ''; 
            this.parsedData.forEach(d => { 
                rows += `<tr><td>${d.centerLegCore}</td><td>${d.outerCoreShell}</td><td>${d.L_initial.toFixed(2)}</td><td>${d.Idc_70.toFixed(2)}</td><td>${d.Idc_80.toFixed(2)}</td><td>${d.Gap.toFixed(2)}</td><td>${d.N}</td><td>${d.FoM.toFixed(1)}</td></tr>`; 
            }); 
            parsedDataTableBody.innerHTML = rows; 
        },
        updateFilterControls(container, values, checkAll = false) { 
            const checkedState = new Map(); 
            container.querySelectorAll('input[type="checkbox"]').forEach(chk => { 
                checkedState.set(chk.dataset.value, chk.checked); 
            }); 
            container.innerHTML = ''; 
            if (!values || values.length === 0) return; 
            values.forEach(value => { 
                const isChecked = checkAll ? 'checked' : (checkedState.has(value) ? (checkedState.get(value) ? 'checked' : '') : 'checked'); 
                container.innerHTML += `<div class="filter-item"><input type="checkbox" id="chk-${container.id}-${value}" data-value="${value}" ${isChecked}><label for="chk-${container.id}-${value}">${value}</label></div>`; 
            }); 
        },
        updateStatsTable(groupedData) { 
            const { statsTableBody } = this.elements; 
            statsTableBody.innerHTML = ''; 
            if (Object.keys(groupedData).length === 0) { 
                statsTableBody.innerHTML = '<tr><td colspan="7">No data selected. Check filters.</td></tr>'; 
                return; 
            } 
            for (const group in groupedData) { 
                const items = groupedData[group]; 
                const calcStats = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; 
                statsTableBody.innerHTML += `<tr><td><strong>${group}</strong></td><td>${items.length}</td><td>${calcStats(items.map(d => d.L_initial)).toFixed(2)}</td><td>${calcStats(items.map(d => d.Idc_70)).toFixed(2)}</td><td>${calcStats(items.map(d => d.Idc_80)).toFixed(2)}</td><td>${calcStats(items.map(d => d.FoM)).toFixed(1)}</td><td>${calcStats(items.map(d => d.Gap)).toFixed(2)}</td></tr>`; 
            } 
        },
        showStatus(msg, isError = false, chartType = 'main') { 
            const statusElement = chartType === 'idcInductance' ? this.elements.idcInductanceChartStatus : this.elements.chartStatus; 
            statusElement.textContent = msg; 
            statusElement.style.display = 'block'; 
            statusElement.style.background = isError ? 'rgba(200, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)'; 
        },

        // [수정됨] createChart: 폰트 크기 2배 증가
        createChart() {
            const baseData = this.getFilteredData();
            const groupedData = this.groupData(baseData, 'centerLegCore');
            const allCenterLegs = [...new Set(this.parsedData.map(d => d.centerLegCore))].sort();
            
            // --- [수정 시작] 폰트 크기 변수 설정 ---
            const baseFontSize = 20;
            const titleFontSize = 22;
            // --- [수정 끝] ---

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
            this.showStatus('Generating chart...');

            const { xAxis, yAxis } = this.elements;

            const getLabelText = (item) => {
                if (!item) return '';
                return [
                    `${item.centerLegCore} / Shell ${item.outerCoreShell}`,
                    `L=${item.L_initial.toFixed(1)} μH`,
                    `Idc_70=${item.Idc_70.toFixed(1)} A, Idc_80=${item.Idc_80.toFixed(1)} A`,
                    `Gap=${item.Gap.toFixed(1)} mm, N=${item.N}`,
                    `FoM=${item.FoM.toFixed(1)}`
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

            const annotationPlugin = {
                id: 'clickAnnotations',
                afterDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.save();
                    // --- [수정 시작] 폰트 크기 2배 증가 ---
                    ctx.font = '40px Inter'; // 20px -> 40px
                    // --- [수정 끝] ---
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'bottom';

                    this.chartAnnotations.forEach(annotation => {
                        const model = chart.getDatasetMeta(annotation.datasetIndex).data[annotation.index];
                        if (!model) return;

                        const x = model.x + 10;
                        const y = model.y;
                        const textLines = annotation.text;
                        // --- [수정 시작] 폰트 크기 2배 증가 ---
                        const lineHeight = 28; // 14 -> 28
                        // --- [수정 끝] ---
                        const textWidth = Math.max(...textLines.map(line => ctx.measureText(line).width));
                        
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                        ctx.fillRect(x - 3, y - (lineHeight * textLines.length) - 3, textWidth + 6, (lineHeight * textLines.length) + 6);
                        ctx.strokeStyle = '#999';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x - 3, y - (lineHeight * textLines.length) - 3, textWidth + 6, (lineHeight * textLines.length) + 6);

                        ctx.fillStyle = '#333';
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
                plugins: [annotationPlugin],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
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
                                });
                            }
                            this.chartInstance.update('none');
                        }
                    },
                    // --- [수정 시작] 폰트 크기 2배 증가 ---
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { 
                                usePointStyle: true, 
                                padding: 20,
                                font: { size: baseFontSize } // 폰트 크기 적용
                            }
                        },
                        tooltip: {
                            titleFont: { size: titleFontSize }, // 폰트 크기 적용
                            bodyFont: { size: baseFontSize }, // 폰트 크기 적용
                            callbacks: {
                                label: (context) => {
                                    const item = context.raw?.raw;
                                    return getLabelText(item);
                                }
                            }
                        }
                    },
                    scales: {
                        x: { 
                            title: { display: true, text: xAxis.options[xAxis.selectedIndex].text, font: { size: titleFontSize } }, // 폰트 크기 적용
                            ticks: { font: { size: baseFontSize } } // 폰트 크기 적용
                        },
                        y: { 
                            title: { display: true, text: yAxis.options[yAxis.selectedIndex].text, font: { size: titleFontSize } }, // 폰트 크기 적용
                            ticks: { font: { size: baseFontSize } } // 폰트 크기 적용
                        }
                    }
                    // --- [수정 끝] ---
                }
            });
            setTimeout(() => this.elements.chartStatus.style.display = 'none', 1000);
        },

        // [수정됨] createIdcInductanceChart: 폰트 크기 2배 증가
        createIdcInductanceChart() {
            const filteredRawSeries = this.getFilteredRawSeries();
            const allCenterLegs = [...new Set(this.parsedData.map(d => d.centerLegCore))].sort();
            
            // --- [수정 시작] 폰트 크기 변수 설정 ---
            const baseFontSize = 20;
            const titleFontSize = 22;
            // --- [수정 끝] ---
            
            if (this.idcInductanceChartInstance) {
                this.idcInductanceChartInstance.destroy();
            }

            this.idcInductanceAnnotations = [];

            const ctx = this.elements.idcInductanceChart.getContext('2d');
            ctx.clearRect(0, 0, this.elements.idcInductanceChart.width, this.elements.idcInductanceChart.height);
            
            if (!filteredRawSeries.length) {
                this.showStatus('No raw data to display.', true, 'idcInductance');
                return;
            }
            this.showStatus('Generating Idc vs. Inductance chart...', false, 'idcInductance');

            const getLabelText = (series, index) => {
                if (!series || index < 0 || index >= series.idc.length) return '';
                return [
                    `${series.centerLegCoreName}_N${series.nValue} / Shell ${series.model}`,
                    `Idc=${series.idc[index].toFixed(1)} A`,
                    `Inductance=${series.inductance[index].toFixed(1)} μH`,
                    `N=${series.nValue}`
                ];
            };

            const datasets = filteredRawSeries.map((series, idx) => {
                const coreIndex = allCenterLegs.indexOf(`${series.centerLegCoreName}_N${series.nValue}`);
                const color = this.defaultColors[coreIndex % this.defaultColors.length];
                const pointStyle = this.pointStyles[coreIndex % this.pointStyles.length];
                const data = series.idc.map((idc, i) => ({
                    x: idc,
                    y: series.inductance[i],
                    raw: { series, index: i }
                }));
                return {
                    label: `${series.centerLegCoreName}_N${series.nValue} / Shell ${series.model}`,
                    data,
                    backgroundColor: color,
                    borderColor: color,
                    pointStyle: pointStyle,
                    radius: 6,
                    hoverRadius: 9,
                    showLine: true,
                    fill: false,
                    tension: 0.4
                };
            });

            const annotationPlugin = {
                id: 'idcInductanceAnnotations',
                afterDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.save();
                    // --- [수정 시작] 폰트 크기 2배 증가 ---
                    ctx.font = '40px Inter'; // 20px -> 40px
                    // --- [수정 끝] ---
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'bottom';

                    this.idcInductanceAnnotations.forEach(annotation => {
                        const model = chart.getDatasetMeta(annotation.datasetIndex).data[annotation.index];
                        if (!model) return;

                        const x = model.x + 10;
                        const y = model.y;
                        const textLines = annotation.text;
                        // --- [수정 시작] 폰트 크기 2배 증가 ---
                        const lineHeight = 28; // 14 -> 28
                        // --- [수정 끝] ---
                        const textWidth = Math.max(...textLines.map(line => ctx.measureText(line).width));
                        
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                        ctx.fillRect(x - 3, y - (lineHeight * textLines.length) - 3, textWidth + 6, (lineHeight * textLines.length) + 6);
                        ctx.strokeStyle = '#999';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x - 3, y - (lineHeight * textLines.length) - 3, textWidth + 6, (lineHeight * textLines.length) + 6);

                        ctx.fillStyle = '#333';
                        textLines.forEach((line, i) => {
                            ctx.fillText(line, x, y - (lineHeight * (textLines.length - 1 - i)));
                        });
                    });
                    ctx.restore();
                }
            };

            this.idcInductanceChartInstance = new Chart(this.elements.idcInductanceChart, {
                type: 'scatter',
                data: { datasets },
                plugins: [annotationPlugin],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const { datasetIndex, index } = elements[0];
                            const { series, index: dataIndex } = this.idcInductanceChartInstance.data.datasets[datasetIndex].data[index].raw;

                            const existingAnnotationIndex = this.idcInductanceAnnotations.findIndex(
                                a => a.datasetIndex === datasetIndex && a.index === index
                            );

                            if (existingAnnotationIndex > -1) {
                                this.idcInductanceAnnotations.splice(existingAnnotationIndex, 1);
                            } else {
                                this.idcInductanceAnnotations.push({
                                    datasetIndex,
                                    index,
                                    text: getLabelText(series, dataIndex)
                                });
                            }
                            this.idcInductanceChartInstance.update('none');
                        }
                    },
                    // --- [수정 시작] 폰트 크기 2배 증가 ---
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { 
                                usePointStyle: true, 
                                padding: 20,
                                font: { size: baseFontSize } // 폰트 크기 적용
                            }
                        },
                        tooltip: {
                            titleFont: { size: titleFontSize }, // 폰트 크기 적용
                            bodyFont: { size: baseFontSize }, // 폰트 크기 적용
                            callbacks: {
                                label: (context) => {
                                    const { series, index } = context.raw?.raw;
                                    return getLabelText(series, index);
                                }
                            }
                        }
                    },
                    scales: {
                        x: { 
                            title: { display: true, text: 'Idc (A)', font: { size: titleFontSize } }, // 폰트 크기 적용
                            ticks: { font: { size: baseFontSize } } // 폰트 크기 적용
                        },
                        y: { 
                            title: { display: true, text: 'Inductance (μH)', font: { size: titleFontSize } }, // 폰트 크기 적용
                            ticks: { font: { size: baseFontSize } } // 폰트 크기 적용
                        }
                    }
                    // --- [수정 끝] ---
                }
            });
            setTimeout(() => this.elements.idcInductanceChartStatus.style.display = 'none', 1000);
        },
        exportCSV() { 
            const data = this.getFilteredData(); 
            if (data.length === 0) { 
                alert('No data selected to export.'); 
                return; 
            } 
            const headers = "CenterLegCore,OuterCoreShell,L_initial(uH),Idc_70%(A),Idc_80%(A),Gap(mm),N,FoM"; 
            const rows = data.map(d => `${d.centerLegCore},${d.outerCoreShell},${d.L_initial},${d.Idc_70},${d.Idc_80},${d.Gap},${d.N},${d.FoM.toFixed(2)}`); 
            const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n"); 
            const encodedUri = encodeURI(csvContent); 
            const link = document.createElement("a"); 
            link.setAttribute("href", encodedUri); 
            link.setAttribute("download", "inductance_data_export.csv"); 
            document.body.appendChild(link); 
            link.click(); 
            document.body.removeChild(link); 
        },
        exportPNG() { 
            if (!this.chartInstance || !this.getFilteredData().length) { 
                alert('No chart available to export.'); 
                return; 
            } 
            const url = this.chartInstance.toBase64Image(); 
            const link = document.createElement('a'); 
            link.download = 'inductance_chart.png'; 
            link.href = url; 
            link.click(); 
        }
    };
    app.init();
});
