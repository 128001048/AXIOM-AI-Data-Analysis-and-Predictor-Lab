import React, { useState } from 'react';
import { TrainedModel, solveConcreteMix, MixSolution } from '../utils/mlEngine';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

interface MixCalculatorTabProps {
  activeModel: TrainedModel | null;
  isDark?: boolean;
}

export const MixCalculatorTab: React.FC<MixCalculatorTabProps> = ({ activeModel, isDark }) => {
  const [targetStrength, setTargetStrength] = useState<number>(40.0);
  const [cement, setCement] = useState<number>(280.0);
  const [slag, setSlag] = useState<number>(80.0);
  const [flyAsh, setFlyAsh] = useState<number>(60.0);
  const [coarseAgg, setCoarseAgg] = useState<number>(980.0);
  const [fineAgg, setFineAgg] = useState<number>(760.0);
  const [curingAge, setCuringAge] = useState<number>(28);

  const [solution, setSolution] = useState<MixSolution | null>(() => {
    if (activeModel) {
      return solveConcreteMix(activeModel, 40.0, 280.0, 80.0, 60.0, 980.0, 760.0, 28);
    }
    return null;
  });

  const totalBinder = Math.max(1, cement + slag + flyAsh);
  const cementPct = ((cement / totalBinder) * 100).toFixed(1);
  const slagPct = ((slag / totalBinder) * 100).toFixed(1);
  const flyAshPct = ((flyAsh / totalBinder) * 100).toFixed(1);
  const totalAgg = coarseAgg + fineAgg;

  const handleSolve = () => {
    if (!activeModel) return;
    const sol = solveConcreteMix(
      activeModel,
      targetStrength,
      cement,
      slag,
      flyAsh,
      coarseAgg,
      fineAgg,
      curingAge
    );
    setSolution(sol);
  };

  const applyPreset = (preset: {
    target: number;
    cem: number;
    slg: number;
    fa: number;
    coarse: number;
    fine: number;
    age: number;
  }) => {
    setTargetStrength(preset.target);
    setCement(preset.cem);
    setSlag(preset.slg);
    setFlyAsh(preset.fa);
    setCoarseAgg(preset.coarse);
    setFineAgg(preset.fine);
    setCuringAge(preset.age);

    if (activeModel) {
      const sol = solveConcreteMix(
        activeModel,
        preset.target,
        preset.cem,
        preset.slg,
        preset.fa,
        preset.coarse,
        preset.fine,
        preset.age
      );
      setSolution(sol);
    }
  };

  // IS 456 Durability criteria
  const is456Exposures = [
    { name: 'Mild', maxWb: 0.55, minBinder: 250, desc: 'Protected concrete, interior dry environments' },
    { name: 'Moderate', maxWb: 0.50, minBinder: 300, desc: 'Sheltered from severe rain, foundation in ordinary soil' },
    { name: 'Severe', maxWb: 0.45, minBinder: 320, desc: 'Direct heavy rainfall, cyclic wetting and drying, coastal zones' },
    { name: 'Very Severe', maxWb: 0.40, minBinder: 340, desc: 'Sea water splash, severe freezing conditions' },
    { name: 'Extreme', maxWb: 0.40, minBinder: 360, desc: 'Direct tidal wave contact, corrosive marine structures' },
  ];

  // Embodied carbon calculation (approximate standard coefficients in kg CO2e / kg material)
  // OPC: ~0.86 kg CO2/kg | Slag: ~0.14 kg CO2/kg | Fly Ash: ~0.02 kg CO2/kg | Aggregates: ~0.005 kg CO2/kg
  const currentEmbodiedCO2 =
    cement * 0.86 + slag * 0.14 + flyAsh * 0.02 + (coarseAgg + fineAgg) * 0.005;
  const opcBaselineCO2 = totalBinder * 0.86 + (coarseAgg + fineAgg) * 0.005;
  const co2SavingsPct = Math.max(
    0,
    Math.round(((opcBaselineCO2 - currentEmbodiedCO2) / opcBaselineCO2) * 100)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Inverse Mix Design Optimizer & Supplementary Cementitious Materials
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Formulate concrete mixes by blending Portland Cement with Supplementary Cementitious Materials (Blast Furnace Slag & Fly Ash).
              The inverse solver evaluates the trained model to find the minimum-water, durability-compliant solution.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeModel ? (
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                Active: {activeModel.name}
              </span>
            ) : (
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-md border border-amber-200 dark:border-amber-800/60">
                Train Model First in Model Lab
              </span>
            )}
          </div>
        </div>

        {/* Preset Selector */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
            Standard Presets:
          </span>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                target: 35,
                cem: 340,
                slg: 0,
                fa: 0,
                coarse: 1020,
                fine: 780,
                age: 28,
              })
            }
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Pure OPC (100% Cement)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                target: 40,
                cem: 240,
                slg: 120,
                fa: 0,
                coarse: 990,
                fine: 760,
                age: 28,
              })
            }
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            PSC Slag Mix (33% Slag)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                target: 35,
                cem: 260,
                slg: 0,
                fa: 90,
                coarse: 1000,
                fine: 750,
                age: 28,
              })
            }
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            PPC Fly Ash Mix (25% Fly Ash)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                target: 45,
                cem: 220,
                slg: 110,
                fa: 80,
                coarse: 970,
                fine: 740,
                age: 28,
              })
            }
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Ternary Green Mix (Slag + Fly Ash)
          </button>
          <button
            type="button"
            onClick={() =>
              applyPreset({
                target: 55,
                cem: 380,
                slg: 80,
                fa: 40,
                coarse: 960,
                fine: 720,
                age: 56,
              })
            }
            className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            High Strength (M55 @ 56-Day)
          </button>
        </div>
      </div>

      {/* 2. Interactive Input Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
          Mix Formulation Inputs & SCM Substitution
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Target Strength */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Compressive Strength
              </label>
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">
                {targetStrength} MPa
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={80}
              step={0.5}
              value={targetStrength}
              onChange={(e) => setTargetStrength(parseFloat(e.target.value) || 30)}
              className="w-full accent-blue-600 mb-1"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>15 MPa (M15)</span>
              <span>80 MPa (M80)</span>
            </div>
          </div>

          {/* Cement */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Portland Cement
              </label>
              <span className="text-xs font-mono text-slate-900 dark:text-white font-bold">
                {cement} kg/m³
              </span>
            </div>
            <input
              type="range"
              min={100}
              max={540}
              step={5}
              value={cement}
              onChange={(e) => setCement(parseFloat(e.target.value) || 280)}
              className="w-full accent-slate-700 dark:accent-slate-300 mb-1"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Share: {cementPct}%</span>
              <span>100–540 kg</span>
            </div>
          </div>

          {/* Blast Furnace Slag (GGBS) - NEW */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Blast Furnace Slag</span>
              </label>
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">
                {slag} kg/m³
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={5}
              value={slag}
              onChange={(e) => setSlag(parseFloat(e.target.value) || 0)}
              className="w-full accent-amber-600 mb-1"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Share: {slagPct}%</span>
              <span>0–360 kg</span>
            </div>
          </div>

          {/* Fly Ash - NEW */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Fly Ash (Class F / C)</span>
              </label>
              <span className="text-xs font-mono text-teal-600 dark:text-teal-400 font-bold">
                {flyAsh} kg/m³
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              step={5}
              value={flyAsh}
              onChange={(e) => setFlyAsh(parseFloat(e.target.value) || 0)}
              className="w-full accent-teal-600 mb-1"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Share: {flyAshPct}%</span>
              <span>0–200 kg</span>
            </div>
          </div>

          {/* Coarse Aggregate */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Coarse Aggregate (20mm / 10mm)
              </label>
              <span className="text-xs font-mono text-slate-900 dark:text-white font-bold">
                {coarseAgg} kg/m³
              </span>
            </div>
            <input
              type="range"
              min={800}
              max={1150}
              step={10}
              value={coarseAgg}
              onChange={(e) => setCoarseAgg(parseFloat(e.target.value) || 980)}
              className="w-full accent-slate-700 dark:accent-slate-300 mb-1"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>800–1150 kg</span>
              <span>Bulk Skeleton</span>
            </div>
          </div>

          {/* Fine Aggregate */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Fine Aggregate (River / M-Sand)
              </label>
              <span className="text-xs font-mono text-slate-900 dark:text-white font-bold">
                {fineAgg} kg/m³
              </span>
            </div>
            <input
              type="range"
              min={590}
              max={990}
              step={10}
              value={fineAgg}
              onChange={(e) => setFineAgg(parseFloat(e.target.value) || 760)}
              className="w-full accent-slate-700 dark:accent-slate-300 mb-1"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>590–990 kg</span>
              <span>Mortar Void Matrix</span>
            </div>
          </div>

          {/* Curing Age */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Design Curing Age
              </label>
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {curingAge} Days
              </span>
            </div>
            <select
              value={curingAge}
              onChange={(e) => setCuringAge(parseInt(e.target.value, 10))}
              aria-label="Design Curing Age"
              className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value={3}>3 Days (Early Formwork Removal)</option>
              <option value={7}>7 Days (Standard Construction Control)</option>
              <option value={14}>14 Days (Intermediate)</option>
              <option value={28}>28 Days (Standard Structural Benchmark)</option>
              <option value={56}>56 Days (Pozzolanic Maturity Design)</option>
              <option value={90}>90 Days (Mass / Dam Concrete)</option>
            </select>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              Fly Ash & Slag peak at 28–90d
            </div>
          </div>

          {/* Total Binder Strip & Solve Button */}
          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/40 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total Binder Content
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1">
                {totalBinder} <span className="text-xs font-normal text-slate-500">kg/m³</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                C: {cement} · Slag: {slag} · FA: {flyAsh}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSolve}
              disabled={!activeModel}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              <Calculator className="w-4 h-4" />
              <span>Optimize Water & SP</span>
            </button>
          </div>
        </div>

        {/* Binder Composition Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Binder Composition Breakdown
            </span>
            <span className="font-mono text-slate-500">
              Cement {cementPct}% · Slag {slagPct}% · Fly Ash {flyAshPct}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${cementPct}%` }}
              className="bg-slate-600 dark:bg-slate-400 transition-all duration-300"
              title={`Portland Cement: ${cementPct}%`}
            />
            <div
              style={{ width: `${slagPct}%` }}
              className="bg-amber-500 transition-all duration-300"
              title={`Blast Furnace Slag: ${slagPct}%`}
            />
            <div
              style={{ width: `${flyAshPct}%` }}
              className="bg-teal-500 transition-all duration-300"
              title={`Fly Ash: ${flyAshPct}%`}
            />
          </div>
        </div>
      </div>

      {/* 3. Optimized Mix Results */}
      {solution && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Optimized Water Content
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 font-mono tabular-nums mt-1">
                {solution.water} <span className="text-sm font-normal text-slate-500">L/m³</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Minimum-water boundary for Abrams' Law
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Superplasticizer Required
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-600 font-mono tabular-nums mt-1">
                {solution.superplasticizer}{' '}
                <span className="text-sm font-normal text-slate-500">kg/m³</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                {solution.spPercentage}% of total binder
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Achieved Strength
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
                {solution.achievedStrength}{' '}
                <span className="text-sm font-normal text-slate-500">MPa</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Target: {targetStrength} MPa @ {curingAge}d {solution.isExact ? '✔' : '(nearest)'}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Water/Binder (w/b) Ratio
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                {solution.wbRatio}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                w/c = {solution.wcRatio} · w/b = {solution.wbRatio}
              </div>
            </div>
          </div>

          {/* Batch Proportions & Sustainability Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Batch Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Batch Mix Design Proportion per 1 m³ Concrete
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Field batching weights and dry mix proportions normalized against total binder
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                      <th className="py-2.5 px-3">Ingredient</th>
                      <th className="py-2.5 px-3 text-right">Mass (kg/m³)</th>
                      <th className="py-2.5 px-3 text-right">Ratio (by Binder)</th>
                      <th className="py-2.5 px-3">Role & Function</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                        Portland Cement (OPC)
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold">{cement}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {(cement / totalBinder).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                        Primary early hydration (C3S / C2S)
                      </td>
                    </tr>
                    {slag > 0 && (
                      <tr>
                        <td className="py-2.5 px-3 font-sans font-medium text-amber-700 dark:text-amber-400">
                          Blast Furnace Slag (GGBS)
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-amber-700 dark:text-amber-400">
                          {slag}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {(slag / totalBinder).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                          Latent hydraulic binder, chloride & sulfate barrier
                        </td>
                      </tr>
                    )}
                    {flyAsh > 0 && (
                      <tr>
                        <td className="py-2.5 px-3 font-sans font-medium text-teal-700 dark:text-teal-400">
                          Fly Ash (PFA)
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-teal-700 dark:text-teal-400">
                          {flyAsh}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {(flyAsh / totalBinder).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                          Spherical ball-bearing workability, pozzolanic C-S-H
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-medium text-blue-700 dark:text-blue-400">
                        Mixing Water
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-blue-700 dark:text-blue-400">
                        {solution.water}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{solution.wbRatio}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                        w/b = {solution.wbRatio} (Target: {targetStrength} MPa)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                        Coarse Aggregate
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{coarseAgg}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {(coarseAgg / totalBinder).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                        Coarse load-bearing skeleton (20mm down)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-slate-100">
                        Fine Aggregate (Sand)
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{fineAgg}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {(fineAgg / totalBinder).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                        Interstitial void filling (Zone II sand)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-medium text-amber-600 dark:text-amber-400">
                        Superplasticizer (Admixture)
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-amber-600 dark:text-amber-400">
                        {solution.superplasticizer}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-mono text-[11px]">
                        {solution.spPercentage}%
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                        Electrostatic & steric dispersion
                      </td>
                    </tr>
                    <tr className="bg-slate-50/70 dark:bg-slate-800/50 font-bold">
                      <td className="py-2.5 px-3 font-sans text-slate-900 dark:text-white">
                        Estimated Wet Unit Weight
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-900 dark:text-white">
                        {(
                          totalBinder +
                          solution.water +
                          coarseAgg +
                          fineAgg +
                          solution.superplasticizer
                        ).toFixed(0)}{' '}
                        kg/m³
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">—</td>
                      <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                        Standard normal concrete density (~2350–2450 kg/m³)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Environmental & Durability Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Embodied Carbon & Sustainability
                  </h3>
                </div>

                <div className="p-4 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 mt-3">
                  <div className="text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                    CO₂ Emission Reduction
                  </div>
                  <div className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    -{co2SavingsPct}%
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300/80 mt-1">
                    Compared to traditional 100% OPC mix with same total binder
                  </div>
                </div>

                <div className="space-y-3 mt-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Estimated Carbon:</span>
                    <span className="font-mono font-bold">
                      {Math.round(currentEmbodiedCO2)} kg CO₂e / m³
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Standard OPC Benchmark:</span>
                    <span className="font-mono text-slate-400">
                      {Math.round(opcBaselineCO2)} kg CO₂e / m³
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">SCM Replacement Level:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {(parseFloat(slagPct) + parseFloat(flyAshPct)).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                Substituting Portland cement with industrial byproducts (GGBS & PFA) drastically reduces clinker calcination emissions while improving long-term microstructural density.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. IS 456 Durability Compliance Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            IS 456:2000 Durability Compliance Matrix (Table 5)
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Automated evaluation of maximum w/b ratio and minimum cementitious content for reinforced concrete
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-2.5 px-3">Exposure Category</th>
                <th className="py-2.5 px-3 text-right">Max w/b Ratio</th>
                <th className="py-2.5 px-3 text-right">Min Binder (kg/m³)</th>
                <th className="py-2.5 px-3">Environmental Conditions</th>
                {solution && <th className="py-2.5 px-3 text-center">Mix Status</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {is456Exposures.map((exp) => {
                const compliesWb = solution ? solution.wbRatio <= exp.maxWb : false;
                const compliesBinder = totalBinder >= exp.minBinder;
                const complies = compliesWb && compliesBinder;

                return (
                  <tr
                    key={exp.name}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 dark:text-slate-100">
                      {exp.name}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{exp.maxWb.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{exp.minBinder}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">{exp.desc}</td>
                    {solution && (
                      <td className="py-2.5 px-3 text-center">
                        {complies ? (
                          <span className="font-sans font-semibold text-emerald-600 dark:text-emerald-400 text-[11px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Compliant
                          </span>
                        ) : (
                          <span className="font-sans text-slate-400 text-[11px]">
                            Non-compliant
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Mandatory Trial Batch Notice:</strong> ML inverse mix solutions are optimization guides. Laboratory trial batches conforming to IS 10262 and cube compression tests according to IS 516 must be tested under qualified supervision prior to field batching.
          </span>
        </div>
      </div>
    </div>
  );
};
