import React, { useRef } from 'react';
import { Upload, ArrowRight, ShieldAlert, Database, Compass, Lock, ShieldCheck } from 'lucide-react';
import { ConcreteSample } from '../data/concreteDataset';
import { mean } from '../utils/mlEngine';
import { TabKey } from './Navbar';
import { useOwner } from '../context/OwnerContext';
import { PrismLogo } from './PrismLogo';

interface OverviewTabProps {
  samples: ConcreteSample[];
  onUploadCSV: (file: File) => void;
  setActiveTab: (tab: TabKey) => void;
  datasetSource: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  samples,
  onUploadCSV,
  setActiveTab,
  datasetSource,
}) => {
  const { isOwner, openOwnerModal } = useOwner();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meanStrength = mean(samples.map((s) => s.strength)).toFixed(1);
  const maxStrength = Math.max(...samples.map((s) => s.strength)).toFixed(1);
  const minStrength = Math.min(...samples.map((s) => s.strength)).toFixed(1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCSV(file);
    }
  };

  const handleUploadClick = () => {
    if (isOwner) {
      fileInputRef.current?.click();
    } else {
      openOwnerModal();
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Aim & Context Hero Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
                DATA ANALYTICS LAB, SASTRA DEEMED UNIVERSITY · Developed by Surya.S (III-YEAR B.Tech CIVIL ENGINEERING)
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                {isOwner ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Owner Mode
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Viewer Mode
                  </span>
                )}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3 flex items-center gap-3">
              <span>Axiom — AI Concrete Compressive Strength Engine</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              Precision materials platform combining machine learning ensembles, deep artificial neural networks,
              and inverse mix design optimization for concrete compressive strength based on the benchmark
              UCI Dataset #165. Formulate high-performance and pozzolanic mixes (Cement, Blast Furnace Slag, Fly Ash)
              and validate compliance with IS 456 / IS 10262 standards.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>Source: {datasetSource}</span>
              <span aria-hidden="true">·</span>
              <span>Instances: {samples.length}</span>
              <span aria-hidden="true">·</span>
              <span>8 Inputs + 1 Target (MPa)</span>
              <span aria-hidden="true">·</span>
              <span>Standards: IS 456, IS 10262, IS 516</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 shrink-0 hidden lg:flex flex-col items-center justify-center text-center w-48">
            <PrismLogo className="w-14 h-14 mb-2" />
            <div className="font-bold text-slate-900 dark:text-white text-sm">Axiom Lab</div>
            <div className="text-[11px] text-slate-500">First-Principles ML</div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Samples</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {samples.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Experimental mixes</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Mean Strength</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tabular-nums mt-1">
            {meanStrength} <span className="text-sm font-normal text-slate-500">MPa</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Dataset average</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Peak Strength</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
            {maxStrength} <span className="text-sm font-normal text-slate-500">MPa</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">High-performance mixes</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Design Features</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            8 <span className="text-sm font-normal text-slate-500">inputs</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">7 mix proportions + Age</div>
        </div>
      </div>

      {/* 3-Column Info Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dataset Card & CSV Uploader */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Dataset Management</h2>
              </div>
              {isOwner ? (
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Owner Editable
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Read-Only
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Ships with an authentic 1030-sample statistical replica of Prof. I-Cheng Yeh's original UCI #165 dataset.
              {isOwner
                ? ' As the owner, you can upload and overwrite with custom laboratory batch CSV records.'
                : ' As a viewer, you have full access to explore distributions, run live predictions, and calculate mixes with this dataset.'}
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.txt"
              className="hidden"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={handleUploadClick}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
                isOwner
                  ? 'text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                  : 'text-slate-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isOwner ? <Upload className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isOwner ? 'Upload Custom CSV (Owner)' : 'Upload CSV (Owner Protected)'}</span>
            </button>
            <div className="text-[10px] text-slate-400 mt-2 text-center">
              {isOwner ? 'Owner authorized: 9 numerical columns' : 'Owner access required to upload'}
            </div>
          </div>
        </div>

        {/* 7-Step Lab Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Axiom 7-Step Lab Workflow</h2>
          </div>
          <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="font-mono text-blue-600 font-bold">1.</span>
              <span><strong>EDA & Stats:</strong> Inspect distributions, skewness, and Pearson correlation matrix.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-blue-600 font-bold">2.</span>
              <span><strong>Train Models:</strong> Train Random Forest, Gradient Boosting, or Neural Network on 80/20 split.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-blue-600 font-bold">3.</span>
              <span><strong>Evaluate:</strong> Review Test R², MAE, RMSE, and the generalization gap.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-blue-600 font-bold">4.</span>
              <span><strong>Predict:</strong> Test hypothetical mixes with live 90% confidence intervals.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-blue-600 font-bold">5.</span>
              <span><strong>Optimize Mix:</strong> Inverse solver finds minimum-water mix with Slag & Fly Ash.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-blue-600 font-bold">6.</span>
              <span><strong>Consult AI:</strong> Ask questions grounded in civil engineering standards.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-blue-600 font-bold">7.</span>
              <span><strong>Export Report:</strong> Download comprehensive PDF lab record.</span>
            </li>
          </ol>
        </div>

        {/* Engineering Governance & Disclaimer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-amber-600 dark:text-amber-500">
              <ShieldAlert className="w-4 h-4" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Engineering Governance</h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              All machine learning predictions and mix proportion recommendations generated by Axiom
              are <strong>advisory decision-support tools only</strong>.
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2.5">
              Concrete mixes for civil engineering structures <strong>must always be validated by physical trial mixes, standard curing, and compression tests</strong> per IS 516 / IS 10086 / ASTM C39 under a certified engineer.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => setActiveTab('model')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <span>Explore Model Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
