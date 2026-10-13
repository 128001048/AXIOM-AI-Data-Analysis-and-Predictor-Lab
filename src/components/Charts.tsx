import React, { useRef, useEffect, useState } from 'react';
import { ConcreteSample, FEATURES_META } from '../data/concreteDataset';
import { mean, standardDeviation, pearsonCorrelation } from '../utils/mlEngine';

// --- 1. HISTOGRAM CHART ---
interface HistogramProps {
  samples: ConcreteSample[];
  selectedFeature: string;
  isDark?: boolean;
}

export const HistogramChart: React.FC<HistogramProps> = ({ samples, selectedFeature, isDark }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredBin, setHoveredBin] = useState<{ label: string; count: number; pct: number } | null>(null);

  const values = samples.map((s) => (s as any)[selectedFeature] ?? 0);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const numBins = 14;
  const binWidth = (maxVal - minVal) / numBins || 1;

  const bins: number[] = Array(numBins).fill(0);
  values.forEach((v) => {
    const idx = Math.min(numBins - 1, Math.max(0, Math.floor((v - minVal) / binWidth)));
    bins[idx]++;
  });
  const maxCount = Math.max(...bins, 1);

  const featMeta =
    selectedFeature === 'strength'
      ? { name: 'Compressive Strength', unit: 'MPa' }
      : FEATURES_META.find((f) => f.key === selectedFeature) || { name: selectedFeature, unit: '' };

  const svgWidth = 600;
  const svgHeight = 260;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 40;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;
  const barWidth = plotWidth / numBins;

  return (
    <div ref={containerRef} className="w-full relative">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-mono">
        <span>Min: {minVal.toFixed(1)} {featMeta.unit}</span>
        <span>Mean: {mean(values).toFixed(1)} {featMeta.unit}</span>
        <span>Max: {maxVal.toFixed(1)} {featMeta.unit}</span>
      </div>

      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padTop + plotHeight * (1 - ratio);
          const countLabel = Math.round(maxCount * ratio);
          return (
            <g key={ratio}>
              <line
                x1={padLeft}
                y1={y}
                x2={svgWidth - padRight}
                y2={y}
                stroke={isDark ? '#334155' : '#e2e8f0'}
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className={`text-[10px] font-mono ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}
              >
                {countLabel}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {bins.map((count, i) => {
          const barH = (count / maxCount) * plotHeight;
          const x = padLeft + i * barWidth;
          const y = padTop + plotHeight - barH;
          const binStart = minVal + i * binWidth;
          const binEnd = binStart + binWidth;
          const isHovered = hoveredBin?.label === `${binStart.toFixed(1)}–${binEnd.toFixed(1)}`;

          return (
            <g
              key={i}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() =>
                setHoveredBin({
                  label: `${binStart.toFixed(1)}–${binEnd.toFixed(1)}`,
                  count,
                  pct: parseFloat(((count / values.length) * 100).toFixed(1)),
                })
              }
              onMouseLeave={() => setHoveredBin(null)}
            >
              <rect
                x={x + 1}
                y={y}
                width={Math.max(1, barWidth - 2)}
                height={barH}
                fill={isHovered ? '#2563eb' : isDark ? '#3b82f6' : '#2563eb'}
                opacity={isHovered ? 1 : 0.8}
                rx={2}
              />
            </g>
          );
        })}

        {/* X-axis baseline */}
        <line
          x1={padLeft}
          y1={padTop + plotHeight}
          x2={svgWidth - padRight}
          y2={padTop + plotHeight}
          stroke={isDark ? '#475569' : '#cbd5e1'}
        />

        {/* X-axis tick labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const x = padLeft + plotWidth * ratio;
          const val = minVal + (maxVal - minVal) * ratio;
          return (
            <text
              key={ratio}
              x={x}
              y={padTop + plotHeight + 18}
              textAnchor="middle"
              className={`text-[10px] font-mono ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}
            >
              {val.toFixed(0)}
            </text>
          );
        })}

        {/* Axis titles */}
        <text
          x={padLeft + plotWidth / 2}
          y={svgHeight - 4}
          textAnchor="middle"
          className={`text-[11px] font-medium ${isDark ? 'fill-slate-300' : 'fill-slate-700'}`}
        >
          {featMeta.name} ({featMeta.unit})
        </text>
      </svg>

      {hoveredBin && (
        <div className="absolute top-2 right-2 bg-slate-900/90 text-white text-xs px-2.5 py-1.5 rounded shadow backdrop-blur font-mono pointer-events-none">
          Range: {hoveredBin.label} {featMeta.unit} · {hoveredBin.count} samples ({hoveredBin.pct}%)
        </div>
      )}
    </div>
  );
};

// --- 2. SCATTER PLOT WITH REGRESSION TRENDLINE ---
interface ScatterPlotProps {
  samples: ConcreteSample[];
  xKey: string;
  yKey: string;
  showTrendline?: boolean;
  isDark?: boolean;
}

export const ScatterPlotChart: React.FC<ScatterPlotProps> = ({
  samples,
  xKey,
  yKey,
  showTrendline = true,
  isDark,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number } | null>(null);

  const xVals = samples.map((s) => (s as any)[xKey] ?? 0);
  const yVals = samples.map((s) => (s as any)[yKey] ?? 0);

  const xMin = Math.min(...xVals);
  const xMax = Math.max(...xVals);
  const yMin = Math.min(...yVals);
  const yMax = Math.max(...yVals);

  const r = pearsonCorrelation(xVals, yVals);

  // Linear Regression: y = slope * x + intercept
  const mx = mean(xVals);
  const my = mean(yVals);
  const sx = standardDeviation(xVals) || 1;
  const sy = standardDeviation(yVals) || 1;
  const slope = r * (sy / sx);
  const intercept = my - slope * mx;

  const svgWidth = 600;
  const svgHeight = 280;
  const padLeft = 50;
  const padRight = 25;
  const padTop = 20;
  const padBottom = 45;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const scaleX = (x: number) => padLeft + ((x - xMin) / (xMax - xMin || 1)) * plotWidth;
  const scaleY = (y: number) => padTop + plotHeight - ((y - yMin) / (yMax - yMin || 1)) * plotHeight;

  // Trendline endpoints
  const lineY1 = slope * xMin + intercept;
  const lineY2 = slope * xMax + intercept;

  const xMeta =
    xKey === 'strength'
      ? { name: 'Compressive Strength', unit: 'MPa' }
      : FEATURES_META.find((f) => f.key === xKey) || { name: xKey, unit: '' };

  const yMeta =
    yKey === 'strength'
      ? { name: 'Compressive Strength', unit: 'MPa' }
      : FEATURES_META.find((f) => f.key === yKey) || { name: yKey, unit: '' };

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-mono">
        <span>Pearson r = <strong className={r > 0 ? 'text-emerald-600' : 'text-rose-600'}>{r.toFixed(3)}</strong></span>
        <span>Trend: y = {slope.toFixed(3)}x {intercept >= 0 ? '+' : '-'} {Math.abs(intercept).toFixed(2)}</span>
      </div>

      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padTop + plotHeight * (1 - ratio);
          const yVal = yMin + (yMax - yMin) * ratio;
          return (
            <g key={`y-${ratio}`}>
              <line
                x1={padLeft}
                y1={y}
                x2={svgWidth - padRight}
                y2={y}
                stroke={isDark ? '#334155' : '#e2e8f0'}
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className={`text-[10px] font-mono ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}
              >
                {yVal.toFixed(0)}
              </text>
            </g>
          );
        })}

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const x = padLeft + plotWidth * ratio;
          const xVal = xMin + (xMax - xMin) * ratio;
          return (
            <g key={`x-${ratio}`}>
              <line
                x1={x}
                y1={padTop}
                x2={x}
                y2={padTop + plotHeight}
                stroke={isDark ? '#334155' : '#e2e8f0'}
                strokeDasharray="3 3"
              />
              <text
                x={x}
                y={padTop + plotHeight + 16}
                textAnchor="middle"
                className={`text-[10px] font-mono ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}
              >
                {xVal.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Data points */}
        {samples.map((s, idx) => {
          const x = (s as any)[xKey];
          const y = (s as any)[yKey];
          const px = scaleX(x);
          const py = scaleY(y);
          return (
            <circle
              key={idx}
              cx={px}
              cy={py}
              r={2.4}
              fill={isDark ? '#38bdf8' : '#0284c7'}
              opacity={0.55}
              className="hover:r-4 hover:opacity-100 cursor-pointer transition-all"
              onMouseEnter={() => setHoveredPoint({ x, y })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          );
        })}

        {/* Trendline */}
        {showTrendline && (
          <line
            x1={scaleX(xMin)}
            y1={scaleY(lineY1)}
            x2={scaleX(xMax)}
            y2={scaleY(lineY2)}
            stroke="#f59e0b"
            strokeWidth={2.5}
            strokeDasharray="6 3"
          />
        )}

        {/* Axis titles */}
        <text
          x={padLeft + plotWidth / 2}
          y={svgHeight - 4}
          textAnchor="middle"
          className={`text-[11px] font-medium ${isDark ? 'fill-slate-300' : 'fill-slate-700'}`}
        >
          {xMeta.name} ({xMeta.unit})
        </text>
        <text
          x={12}
          y={padTop + plotHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90 12 ${padTop + plotHeight / 2})`}
          className={`text-[11px] font-medium ${isDark ? 'fill-slate-300' : 'fill-slate-700'}`}
        >
          {yMeta.name} ({yMeta.unit})
        </text>
      </svg>

      {hoveredPoint && (
        <div className="absolute top-2 right-2 bg-slate-900/90 text-white text-xs px-2.5 py-1.5 rounded shadow backdrop-blur font-mono pointer-events-none">
          X: {hoveredPoint.x.toFixed(1)} {xMeta.unit} · Y: {hoveredPoint.y.toFixed(1)} {yMeta.unit}
        </div>
      )}
    </div>
  );
};

// --- 3. CORRELATION HEATMAP ---
interface CorrelationHeatmapProps {
  samples: ConcreteSample[];
  isDark?: boolean;
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ samples, isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ xName: string; yName: string; r: number } | null>(null);

  const keys: (keyof ConcreteSample)[] = [
    'cement',
    'slag',
    'flyAsh',
    'water',
    'superplasticizer',
    'coarseAggregate',
    'fineAggregate',
    'age',
    'strength',
  ];

  const labels = [
    'Cement',
    'Slag',
    'FlyAsh',
    'Water',
    'SP',
    'CoarseAgg',
    'FineAgg',
    'Age',
    'Strength',
  ];

  const matrix: number[][] = [];
  for (let i = 0; i < keys.length; i++) {
    const row: number[] = [];
    const colI = samples.map((s) => s[keys[i]]);
    for (let j = 0; j < keys.length; j++) {
      const colJ = samples.map((s) => s[keys[j]]);
      row.push(pearsonCorrelation(colI, colJ));
    }
    matrix.push(row);
  }

  // Draw Heatmap Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.clientWidth || 540;
    const displayH = 420;

    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, displayW, displayH);

    const leftMargin = 78;
    const topMargin = 55;
    const rightMargin = 60;
    const cellW = (displayW - leftMargin - rightMargin) / 9;
    const cellH = (displayH - topMargin - 20) / 9;

    function getColor(val: number): string {
      // Diverging: Negative (Blue) -> 0 (White/Slate) -> Positive (Crimson/Red)
      const t = (val + 1) / 2; // [0, 1]
      if (t < 0.5) {
        // Blue to neutral
        const ratio = t * 2;
        const r = Math.round(30 + (240 - 30) * ratio);
        const g = Math.round(58 + (244 - 58) * ratio);
        const b = Math.round(138 + (246 - 138) * ratio);
        return `rgb(${r}, ${g}, ${b})`;
      } else {
        // Neutral to Red/Crimson
        const ratio = (t - 0.5) * 2;
        const r = Math.round(240 + (220 - 240) * ratio);
        const g = Math.round(244 - (244 - 38) * ratio);
        const b = Math.round(246 - (246 - 38) * ratio);
        return `rgb(${r}, ${g}, ${b})`;
      }
    }

    // Cells
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const val = matrix[i][j];
        const x = leftMargin + j * cellW;
        const y = topMargin + i * cellH;

        ctx.fillStyle = getColor(val);
        ctx.fillRect(x, y, cellW - 1, cellH - 1);

        // Text
        ctx.fillStyle = Math.abs(val) > 0.45 ? '#ffffff' : '#0f172a';
        ctx.font = '600 11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val.toFixed(2), x + cellW / 2, y + cellH / 2);
      }
    }

    // Labels
    ctx.fillStyle = isDark ? '#94a3b8' : '#334155';
    ctx.font = '500 11px Plus Jakarta Sans, sans-serif';

    // Row labels
    ctx.textAlign = 'right';
    for (let i = 0; i < 9; i++) {
      ctx.fillText(labels[i], leftMargin - 8, topMargin + i * cellH + cellH / 2);
    }

    // Column labels
    ctx.textAlign = 'left';
    for (let j = 0; j < 9; j++) {
      ctx.save();
      ctx.translate(leftMargin + j * cellW + cellW / 2, topMargin - 8);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(labels[j], 0, 0);
      ctx.restore();
    }

    // Color bar legend on right
    const legX = leftMargin + 9 * cellW + 16;
    const legW = 12;
    const legH = 9 * cellH;
    for (let y = 0; y < legH; y++) {
      const val = 1 - (y / legH) * 2;
      ctx.fillStyle = getColor(val);
      ctx.fillRect(legX, topMargin + y, legW, 1);
    }
    ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
    ctx.font = '500 10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('+1.0', legX + legW + 4, topMargin + 8);
    ctx.fillText(' 0.0', legX + legW + 4, topMargin + legH / 2 + 3);
    ctx.fillText('-1.0', legX + legW + 4, topMargin + legH);
  }, [samples, isDark]);

  return (
    <div className="w-full overflow-x-auto">
      <canvas
        ref={canvasRef}
        className="w-full h-[420px] max-w-[700px] mx-auto block cursor-crosshair"
      />
    </div>
  );
};

// --- 4. LOSS / CONVERGENCE CURVE ---
interface LossCurveProps {
  history: { step: number; trainLoss: number; valLoss?: number }[];
  yLabel?: string;
  xLabel?: string;
  isDark?: boolean;
}

export const LossCurveChart: React.FC<LossCurveProps> = ({
  history,
  yLabel = 'Loss / RMS',
  xLabel = 'Stage / Epoch',
  isDark,
}) => {
  if (!history || history.length === 0) {
    return <div className="p-8 text-center text-xs text-slate-400">No training loss history available.</div>;
  }

  const svgWidth = 600;
  const svgHeight = 240;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 40;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const allVals = history.flatMap((h) => [h.trainLoss, ...(h.valLoss !== undefined ? [h.valLoss] : [])]);
  const minVal = Math.min(...allVals, 0);
  const maxVal = Math.max(...allVals, 1);
  const minStep = history[0].step;
  const maxStep = history[history.length - 1].step;

  const scaleX = (s: number) => padLeft + ((s - minStep) / (maxStep - minStep || 1)) * plotWidth;
  const scaleY = (v: number) => padTop + plotHeight - ((v - minVal) / (maxVal - minVal || 1)) * plotHeight;

  const trainPoints = history.map((h) => `${scaleX(h.step)},${scaleY(h.trainLoss)}`).join(' ');
  const hasVal = history.some((h) => h.valLoss !== undefined);
  const valPoints = hasVal
    ? history
        .filter((h) => h.valLoss !== undefined)
        .map((h) => `${scaleX(h.step)},${scaleY(h.valLoss!)}`)
        .join(' ')
    : '';

  return (
    <div className="w-full relative">
      <div className="flex items-center gap-4 text-xs font-mono mb-2">
        <span className="flex items-center gap-1.5 text-blue-600">
          <span className="w-3 h-0.5 bg-blue-600 inline-block"></span> Train Loss: {history[history.length - 1].trainLoss.toFixed(2)}
        </span>
        {hasVal && (
          <span className="flex items-center gap-1.5 text-amber-500">
            <span className="w-3 h-0.5 bg-amber-500 inline-block"></span> Validation Loss: {history[history.length - 1].valLoss?.toFixed(2)}
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
        {/* Y Gridlines */}
        {[0, 0.33, 0.66, 1].map((r) => {
          const y = padTop + plotHeight * (1 - r);
          const v = minVal + (maxVal - minVal) * r;
          return (
            <g key={r}>
              <line
                x1={padLeft}
                y1={y}
                x2={svgWidth - padRight}
                y2={y}
                stroke={isDark ? '#334155' : '#e2e8f0'}
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 6}
                y={y + 3}
                textAnchor="end"
                className={`text-[10px] font-mono ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}
              >
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Lines */}
        <polyline fill="none" stroke="#2563eb" strokeWidth={2.2} points={trainPoints} />
        {hasVal && (
          <polyline fill="none" stroke="#f59e0b" strokeWidth={2.2} strokeDasharray="4 2" points={valPoints} />
        )}

        {/* Axis labels */}
        <text
          x={padLeft + plotWidth / 2}
          y={svgHeight - 4}
          textAnchor="middle"
          className={`text-[11px] font-medium ${isDark ? 'fill-slate-300' : 'fill-slate-700'}`}
        >
          {xLabel}
        </text>
      </svg>
    </div>
  );
};

// --- 5. FEATURE IMPORTANCE BAR CHART ---
interface FeatureImportanceProps {
  importances: { name: string; percentage: number }[];
  isDark?: boolean;
}

export const FeatureImportanceChart: React.FC<FeatureImportanceProps> = ({ importances, isDark }) => {
  const maxPct = Math.max(...importances.map((i) => i.percentage), 1);

  return (
    <div className="w-full space-y-2 py-2">
      {importances.map((item, idx) => {
        const widthPct = Math.max(3, (item.percentage / maxPct) * 100);
        return (
          <div key={item.name} className="flex items-center gap-3 text-xs">
            <span className="w-24 truncate text-right font-medium text-slate-700 dark:text-slate-300">
              {item.name}
            </span>
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor:
                    idx === 0 ? '#2563eb' : idx === 1 ? '#0284c7' : idx === 2 ? '#0d9488' : '#f59e0b',
                }}
              />
            </div>
            <span className="w-12 font-mono text-slate-500 text-right tabular-nums">
              {item.percentage}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

// --- 6. PREDICTED STRENGTH GAIN OVER CURING AGE ---
interface AgeStrengthCurveProps {
  predictFn: (features: number[]) => number;
  currentMix: number[]; // [Cement, Slag, FlyAsh, Water, SP, CA, FA, Age]
  isDark?: boolean;
}

export const AgeStrengthCurve: React.FC<AgeStrengthCurveProps> = ({ predictFn, currentMix, isDark }) => {
  const ages = [1, 3, 7, 14, 28, 56, 90, 180, 365];
  const points = ages.map((a) => {
    const mixAtAge = [...currentMix.slice(0, 7), a];
    return { age: a, strength: parseFloat(predictFn(mixAtAge).toFixed(1)) };
  });

  const svgWidth = 600;
  const svgHeight = 250;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 20;
  const padBottom = 40;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const minStr = Math.min(...points.map((p) => p.strength), 0);
  const maxStr = Math.max(...points.map((p) => p.strength), 50) * 1.1;

  // Log scale for age axis (1 to 365 days)
  const logMin = Math.log10(1);
  const logMax = Math.log10(365);
  const scaleX = (age: number) =>
    padLeft + ((Math.log10(age) - logMin) / (logMax - logMin)) * plotWidth;
  const scaleY = (str: number) =>
    padTop + plotHeight - ((str - minStr) / (maxStr - minStr || 1)) * plotHeight;

  const polylinePoints = points.map((p) => `${scaleX(p.age)},${scaleY(p.strength)}`).join(' ');

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-mono">
        <span>3d: {points[1].strength} MPa</span>
        <span>7d: {points[2].strength} MPa</span>
        <span className="text-blue-600 font-bold">28d: {points[4].strength} MPa</span>
        <span>90d: {points[6].strength} MPa</span>
        <span>365d: {points[8].strength} MPa</span>
      </div>

      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
        {/* Y Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r) => {
          const y = padTop + plotHeight * (1 - r);
          const v = minStr + (maxStr - minStr) * r;
          return (
            <g key={r}>
              <line
                x1={padLeft}
                y1={y}
                x2={svgWidth - padRight}
                y2={y}
                stroke={isDark ? '#334155' : '#e2e8f0'}
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 6}
                y={y + 3}
                textAnchor="end"
                className={`text-[10px] font-mono ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}
              >
                {v.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* X Ticks (Days) */}
        {ages.map((a) => {
          const x = scaleX(a);
          return (
            <g key={a}>
              <line
                x1={x}
                y1={padTop}
                x2={x}
                y2={padTop + plotHeight}
                stroke={isDark ? '#334155' : '#e2e8f0'}
                strokeDasharray="2 2"
              />
              <text
                x={x}
                y={padTop + plotHeight + 16}
                textAnchor="middle"
                className={`text-[10px] font-mono ${a === 28 ? 'font-bold fill-blue-600' : isDark ? 'fill-slate-400' : 'fill-slate-500'}`}
              >
                {a}d
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <polygon
          points={`${scaleX(1)},${padTop + plotHeight} ${polylinePoints} ${scaleX(365)},${padTop + plotHeight}`}
          fill="url(#ageGradient)"
          opacity={0.25}
        />

        <defs>
          <linearGradient id="ageGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Curve */}
        <polyline fill="none" stroke="#2563eb" strokeWidth={2.8} points={polylinePoints} />

        {/* Markers */}
        {points.map((p) => (
          <circle
            key={p.age}
            cx={scaleX(p.age)}
            cy={scaleY(p.strength)}
            r={p.age === 28 ? 5 : 3.5}
            fill={p.age === 28 ? '#2563eb' : '#ffffff'}
            stroke="#2563eb"
            strokeWidth={2}
          />
        ))}

        {/* Axis titles */}
        <text
          x={padLeft + plotWidth / 2}
          y={svgHeight - 4}
          textAnchor="middle"
          className={`text-[11px] font-medium ${isDark ? 'fill-slate-300' : 'fill-slate-700'}`}
        >
          Curing Duration (Log Scale, Days)
        </text>
      </svg>
    </div>
  );
};
