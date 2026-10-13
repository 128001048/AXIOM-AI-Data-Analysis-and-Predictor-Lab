import React, { useState } from 'react';
import { ConcreteSample, FEATURES_META } from '../data/concreteDataset';
import { calculateSummaryStats } from '../utils/mlEngine';
import { HistogramChart, ScatterPlotChart, CorrelationHeatmap } from './Charts';
import { Search, ChevronLeft, ChevronRight, BarChart3, ScatterChart as ScatterIcon, Grid, Table } from 'lucide-react';

interface EdaTabProps {
  samples: ConcreteSample[];
  isDark?: boolean;
}

export const EdaTab: React.FC<EdaTabProps> = ({ samples, isDark }) => {
  const [selectedHistFeat, setSelectedHistFeat] = useState<string>('cement');
  const [scatterX, setScatterX] = useState<string>('water');
  const [scatterY, setScatterY] = useState<string>('strength');
  const [showTrendline, setShowTrendline] = useState<boolean>(true);

  // Raw table state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const rowsPerPage = 10;

  const stats = calculateSummaryStats(samples);

  const allVars = [
    ...FEATURES_META.map((f) => ({ key: f.key, name: f.name, unit: f.unit })),
    { key: 'strength', name: 'Compressive Strength', unit: 'MPa' },
  ];

  // Engineering interpretation generator for Histogram
  const getHistInterpretation = (featKey: string) => {
    const s = stats.find((st) => st.key === featKey);
    if (!s) return '';
    const skewText =
      Math.abs(s.skew) < 0.4
        ? 'near-symmetric distribution indicating balanced coverage across typical mix ranges.'
        : s.skew > 0
        ? 'right-skewed distribution where low dosages are frequent, with fewer high-performance mixes.'
        : 'left-skewed distribution where higher dosages dominate.';

    let civilNote = '';
    if (featKey === 'cement') {
      civilNote = 'Cement spans from lean mixes (102 kg/m³) up to rich high-strength concrete (540 kg/m³), covering standard IS 456 grades M15 through M60+.';
    } else if (featKey === 'water') {
      civilNote = 'Water clusters predominantly between 150 and 200 L/m³, balancing hydration needs with workability constraints.';
    } else if (featKey === 'superplasticizer') {
      civilNote = 'Bimodal pattern: ~18% of mixes use no chemical admixture, while modern high-workability mixes utilize dosages up to 25–30 kg/m³.';
    } else if (featKey === 'age') {
      civilNote = 'Discrete multi-modal testing intervals (3, 7, 14, 28, 56, 90, 365 days), with 28 days being the benchmark design reference under standard curing.';
    } else if (featKey === 'strength') {
      civilNote = 'Compressive strengths range from 2.3 MPa (early demoulding test) up to 82.6 MPa (advanced silica-fume/superplasticized HPC).';
    }

    return `Observation: ${s.name} exhibits mean ${s.mean} ${s.unit} (σ = ${s.std}, skew = ${s.skew}). Reasoning: ${skewText} ${civilNote}`;
  };

  // Engineering interpretation for Scatter Plot
  const getScatterInterpretation = (xKey: string, yKey: string) => {
    const key = [xKey, yKey].sort().join('-');
    let note = '';
    if (key === 'strength-water') {
      note = "Abrams’ Law (1918) in action: Higher water content increases capillary porosity upon evaporation, drastically reducing compressive strength. This negative slope confirms the fundamental water-binder ratio dependency.";
    } else if (key === 'cement-strength') {
      note = "Gel-Space Ratio: Additional cement increases the volumetric fraction of hydration products (calcium-silicate-hydrate gel) relative to interstitial voids, directly raising compressive strength.";
    } else if (key === 'age-strength') {
      note = "Hydration Kinetics: Strength increases logarithmically with curing age as tricalcium and dicalcium silicates hydrate continuously over 1 to 365 days under moist conditions.";
    } else if (key === 'strength-superplasticizer') {
      note = "Indirect Strength Enhancement: Superplasticizers do not inherently add binding strength, but disperse cement grains, allowing mix designers to drastically lower water content while preserving slump.";
    } else if (key === 'flyAsh-strength' || key === 'slag-strength') {
      note = "Pozzolanic Reaction: Slag and fly ash consume calcium hydroxide to form secondary C-S-H. Their full contribution is realized primarily at curing ages beyond 28 days.";
    } else {
      note = "Physical Interaction: The two parameters co-vary based on mix design proportioning methods to achieve target workability and aggregate packing density.";
    }
    return note;
  };

  // Filter raw data
  const filteredSamples = samples.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.cement.toString().includes(term) ||
      s.water.toString().includes(term) ||
      s.age.toString().includes(term) ||
      s.strength.toString().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredSamples.length / rowsPerPage);
  const paginatedRows = filteredSamples.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Descriptive Statistics Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Descriptive Statistics</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Summary metrics across all {samples.length} experimental samples (essential for boundary validation)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-2.5 px-3">Variable</th>
                <th className="py-2.5 px-2">Unit</th>
                <th className="py-2.5 px-2 text-right">Mean</th>
                <th className="py-2.5 px-2 text-right">Std (σ)</th>
                <th className="py-2.5 px-2 text-right">Min</th>
                <th className="py-2.5 px-2 text-right">25%</th>
                <th className="py-2.5 px-2 text-right">Median</th>
                <th className="py-2.5 px-2 text-right">75%</th>
                <th className="py-2.5 px-2 text-right">Max</th>
                <th className="py-2.5 px-2 text-right">Skewness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {stats.map((s) => (
                <tr
                  key={s.key}
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                    s.key === 'strength' ? 'bg-blue-50/40 dark:bg-blue-950/20 font-semibold' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                    {s.name}
                  </td>
                  <td className="py-2.5 px-2 text-slate-500">{s.unit}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{s.mean}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-slate-500">{s.std}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{s.min}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-slate-500">{s.p25}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{s.median}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-slate-500">{s.p75}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                    {s.max}
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums">
                    <span className={s.skew > 0.5 ? 'text-amber-600' : s.skew < -0.5 ? 'text-blue-600' : 'text-slate-500'}>
                      {s.skew}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Visualizations Grid (Histogram + Scatter Plot) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Histogram Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Feature Distribution (Histogram)</h3>
              </div>

              <select
                value={selectedHistFeat}
                onChange={(e) => setSelectedHistFeat(e.target.value)}
                className="text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500"
              >
                {allVars.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.name} ({v.unit})
                  </option>
                ))}
              </select>
            </div>

            <HistogramChart samples={samples} selectedFeature={selectedHistFeat} isDark={isDark} />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg">
            <span className="font-semibold text-blue-600 dark:text-blue-400">Engineering Interpretation: </span>
            {getHistInterpretation(selectedHistFeat)}
          </div>
        </div>

        {/* Scatter Plot Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <ScatterIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bivariate Correlation (Scatter)</h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">X:</span>
                  <select
                    value={scatterX}
                    onChange={(e) => setScatterX(e.target.value)}
                    className="text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 font-medium text-slate-700 dark:text-slate-200"
                  >
                    {allVars.map((v) => (
                      <option key={v.key} value={v.key}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">Y:</span>
                  <select
                    value={scatterY}
                    onChange={(e) => setScatterY(e.target.value)}
                    className="text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 font-medium text-slate-700 dark:text-slate-200"
                  >
                    {allVars.map((v) => (
                      <option key={v.key} value={v.key}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <ScatterPlotChart
              samples={samples}
              xKey={scatterX}
              yKey={scatterY}
              showTrendline={showTrendline}
              isDark={isDark}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg">
            <span className="font-semibold text-blue-600 dark:text-blue-400">Civil Engineering Reasoning: </span>
            {getScatterInterpretation(scatterX, scatterY)}
          </div>
        </div>
      </div>

      {/* 3. Pearson Correlation Heatmap */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pearson Correlation Matrix Heatmap</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full pairwise linear correlation coefficients (-1.0 to +1.0) across all 8 inputs and target strength
          </p>
        </div>

        <CorrelationHeatmap samples={samples} isDark={isDark} />

        <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="font-semibold text-slate-900 dark:text-white mb-1">
            Correlation Matrix Engineering Takeaways:
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Cement (r ≈ +0.50) & Age (r ≈ +0.33):</strong> Highest positive linear drivers of compressive strength. More hydration products (C-S-H) form as cement content and curing time increase.</li>
            <li><strong>Water (r ≈ -0.29):</strong> Strongest negative influence on compressive strength, validating Abrams’ law (excess capillary pore formation).</li>
            <li><strong>Superplasticizer (r ≈ +0.37):</strong> Positively correlated with strength because high-performance mixes with superplasticizer allow low w/c ratios.</li>
            <li><strong>Coarse & Fine Aggregates:</strong> Show weak direct linear correlation with strength (they act as inert filler skeletal structure), though their grading controls packing density and workability.</li>
          </ul>
        </div>
      </div>

      {/* 4. Raw Data Preview Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Raw Data Explorer</h3>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredSamples.length} matching samples)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search values..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                className="text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-8 pr-3 py-1.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 text-xs">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-slate-500 px-1">
                {page + 1}/{Math.max(1, totalPages)}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold font-mono">
                <th className="py-2 px-2.5">#</th>
                <th className="py-2 px-2 text-right">Cement</th>
                <th className="py-2 px-2 text-right">Slag</th>
                <th className="py-2 px-2 text-right">FlyAsh</th>
                <th className="py-2 px-2 text-right">Water</th>
                <th className="py-2 px-2 text-right">SP</th>
                <th className="py-2 px-2 text-right">Coarse</th>
                <th className="py-2 px-2 text-right">Fine</th>
                <th className="py-2 px-2 text-right">Age</th>
                <th className="py-2 px-2.5 text-right font-bold text-blue-600">Strength (MPa)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {paginatedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-2 px-2.5 text-slate-400">{page * rowsPerPage + idx + 1}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{row.cement}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-slate-500">{row.slag}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-slate-500">{row.flyAsh}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{row.water}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{row.superplasticizer}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-slate-500">{row.coarseAggregate}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-slate-500">{row.fineAggregate}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{row.age}d</td>
                  <td className="py-2 px-2.5 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                    {row.strength}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
