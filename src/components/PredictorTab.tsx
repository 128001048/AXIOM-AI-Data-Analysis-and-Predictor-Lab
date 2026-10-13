import React, { useState, useMemo } from 'react';
import { FEATURES_META, FeatureMeta } from '../data/concreteDataset';
import { TrainedModel } from '../utils/mlEngine';
import { AgeStrengthCurve } from './Charts';
import { Sliders, Sparkles, AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface PredictorTabProps {
  activeModel: TrainedModel | null;
  isDark?: boolean;
}

export const PredictorTab: React.FC<PredictorTabProps> = ({ activeModel, isDark }) => {
  // 8 inputs state
  const [inputs, setInputs] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    FEATURES_META.forEach((f) => {
      init[f.key] = f.defaultValue;
    });
    return init;
  });

  const handleInputChange = (key: string, val: number, meta: FeatureMeta) => {
    const clamped = Math.max(meta.min, Math.min(meta.max, val));
    setInputs((prev) => ({ ...prev, [key]: clamped }));
  };

  // Presets
  const applyPreset = (preset: Record<string, number>) => {
    setInputs((prev) => ({ ...prev, ...preset }));
  };

  const featureVector = useMemo(() => {
    return [
      inputs.cement,
      inputs.slag,
      inputs.flyAsh,
      inputs.water,
      inputs.superplasticizer,
      inputs.coarseAggregate,
      inputs.fineAggregate,
      inputs.age,
    ];
  }, [inputs]);

  // Derived engineering parameters
  const totalBinder = inputs.cement + inputs.slag + inputs.flyAsh;
  const wcRatio = parseFloat((inputs.water / inputs.cement).toFixed(2));
  const wbRatio = parseFloat((inputs.water / totalBinder).toFixed(2));
  const totalAggregates = inputs.coarseAggregate + inputs.fineAggregate;
  const fineRatio = parseFloat(((inputs.fineAggregate / totalAggregates) * 100).toFixed(1));

  // Prediction calculation
  const prediction = useMemo(() => {
    if (!activeModel) return null;

    const pred = activeModel.predict(featureVector);

    // Compute 90% confidence interval: 1.645 * standard error
    let margin = 1.645 * activeModel.metrics.residualStd;
    if (activeModel.predictAll) {
      const treePreds = activeModel.predictAll(featureVector);
      const treeStd = Math.sqrt(
        treePreds.reduce((a, b) => a + (b - pred) ** 2, 0) / treePreds.length
      );
      margin = Math.max(margin, 1.645 * treeStd);
    }

    const lowerCI = Math.max(0, pred - margin);
    const upperCI = pred + margin;

    // IS 456 Grade Classification (M10 to M80)
    const grades = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
    let grade = '< M10';
    for (const g of grades) {
      if (pred >= g) grade = `M${g}`;
    }

    return {
      value: parseFloat(pred.toFixed(1)),
      lowerCI: parseFloat(lowerCI.toFixed(1)),
      upperCI: parseFloat(upperCI.toFixed(1)),
      grade,
    };
  }, [activeModel, featureVector]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Header with Model Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Concrete Compressive Strength Predictor</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live regression inference with 90% confidence interval and IS 456 grade mapping
            </p>
          </div>

          {activeModel ? (
            <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
              Active: {activeModel.name} (R² = {activeModel.metrics.r2})
            </div>
          ) : (
            <div className="text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60">
              No trained model yet. Please train one in Model Lab.
            </div>
          )}
        </div>

        {/* Quick Presets Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-400 font-medium mr-1">Engineering Presets:</span>
          <button
            onClick={() =>
              applyPreset({
                cement: 280,
                slag: 0,
                flyAsh: 0,
                water: 185,
                superplasticizer: 0,
                coarseAggregate: 1040,
                fineAggregate: 780,
                age: 28,
              })
            }
            className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            M20 Standard Slab
          </button>
          <button
            onClick={() =>
              applyPreset({
                cement: 340,
                slag: 70,
                flyAsh: 0,
                water: 165,
                superplasticizer: 6.5,
                coarseAggregate: 980,
                fineAggregate: 760,
                age: 28,
              })
            }
            className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            M35 High Durability
          </button>
          <button
            onClick={() =>
              applyPreset({
                cement: 420,
                slag: 0,
                flyAsh: 80,
                water: 150,
                superplasticizer: 12.0,
                coarseAggregate: 950,
                fineAggregate: 740,
                age: 28,
              })
            }
            className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            M50 High-Performance
          </button>
        </div>
      </div>

      {/* 2. Primary Layout: Parameters Column (Left) + Prediction Display (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sliders Grid (8 columns on lg) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Mix Proportions & Age Controls</h3>
          </div>

          <div className="space-y-4">
            {FEATURES_META.map((meta) => {
              const val = inputs[meta.key];
              return (
                <div key={meta.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {meta.name}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <input
                        type="number"
                        min={meta.min}
                        max={meta.max}
                        step={meta.step}
                        value={val}
                        onChange={(e) =>
                          handleInputChange(meta.key, parseFloat(e.target.value) || 0, meta)
                        }
                        className="w-20 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400"
                      />
                      <span className="text-slate-400 text-[11px] w-12">{meta.unit}</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={meta.min}
                    max={meta.max}
                    step={meta.step}
                    value={val}
                    onChange={(e) =>
                      handleInputChange(meta.key, parseFloat(e.target.value), meta)
                    }
                    className="w-full accent-blue-600 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Min: {meta.min}</span>
                    <span>Max: {meta.max}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prediction Results & Hydration Curve (5 columns on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Prediction Scoreboard */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Predicted Compressive Strength
            </div>

            {prediction ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tabular-nums tracking-tight">
                    {prediction.value}
                  </span>
                  <span className="text-lg font-medium text-slate-500">MPa</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[10px]">90% CONFIDENCE INTERVAL</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {prediction.lowerCI} – {prediction.upperCI} MPa
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[10px]">IS 456 CONCRETE GRADE</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Approx. {prediction.grade}
                    </div>
                  </div>
                </div>

                {/* Derived Concrete Matrix Telemetry */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div>
                    <div className="text-slate-400 text-[10px]">w/c RATIO</div>
                    <div className={`font-bold mt-0.5 ${wcRatio > 0.55 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                      {wcRatio}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">w/b RATIO</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{wbRatio}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">SAND RATIO</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{fineRatio}%</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Train a model in the Model Lab tab to activate live inference.
              </div>
            )}
          </div>

          {/* Hydration Age Gain Curve */}
          {activeModel && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Hydration Strength-Gain Curve (1 → 365 Days)
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Dynamic curing response for this exact mix proportion
              </p>
              <AgeStrengthCurve
                predictFn={activeModel.predict}
                currentMix={featureVector}
                isDark={isDark}
              />
            </div>
          )}

          {/* Engineering Evaluation Note */}
          {prediction && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold text-blue-600 dark:text-blue-400">Engineering Assessment: </span>
              {wcRatio <= 0.45 ? (
                <>Low w/c ratio ({wcRatio}) produces a dense, impermeable microstructure. Highly durable against chloride attack and carbonation.</>
              ) : wcRatio <= 0.55 ? (
                <>Moderate w/c ratio ({wcRatio}) suitable for standard reinforced building construction (M20–M35 classes per IS 456).</>
              ) : (
                <>High w/c ratio ({wcRatio}) causes elevated capillary porosity. Suitable only for lean mass concrete or levelling courses.</>
              )}
              {inputs.age < 28 && (
                <> Note: At {inputs.age} days, hydration is incomplete. Standard design reference is 28 days.</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
