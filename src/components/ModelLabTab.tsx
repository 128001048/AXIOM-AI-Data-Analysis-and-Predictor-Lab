import React, { useState } from 'react';
import {
  TrainedModel,
  trainRandomForest,
  trainGradientBoosting,
  trainNeuralNetwork,
  benchmarkAllModels,
  trainTestSplit,
} from '../utils/mlEngine';
import { ConcreteSample } from '../data/concreteDataset';
import { LossCurveChart, FeatureImportanceChart } from './Charts';
import { Play, GitCompare, Sparkles, CheckCircle2, AlertTriangle, Layers, Activity, Lock, ShieldCheck } from 'lucide-react';
import { useOwner } from '../context/OwnerContext';

interface ModelLabTabProps {
  samples: ConcreteSample[];
  activeModel: TrainedModel | null;
  setActiveModel: (m: TrainedModel) => void;
  isDark?: boolean;
}

export const ModelLabTab: React.FC<ModelLabTabProps> = ({
  samples,
  activeModel,
  setActiveModel,
  isDark,
}) => {
  const { isOwner, openOwnerModal } = useOwner();
  const [selectedAlgo, setSelectedAlgo] = useState<'rf' | 'gb' | 'nn'>('rf');
  const [seed, setSeed] = useState<number>(42);

  // Hyperparameters
  const [rfTrees, setRfTrees] = useState<number>(100);
  const [rfDepth, setRfDepth] = useState<number>(10);
  const [rfLeaf, setRfLeaf] = useState<number>(3);

  const [gbStages, setGbStages] = useState<number>(120);
  const [gbLR, setGbLR] = useState<number>(0.1);
  const [gbDepth, setGbDepth] = useState<number>(3);

  const [nnHidden, setNnHidden] = useState<number>(20);
  const [nnEpochs, setNnEpochs] = useState<number>(100);
  const [nnLR, setNnLR] = useState<number>(0.01);

  // Training state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainProgress, setTrainProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to train');

  // Benchmark state
  const [benchmarkResults, setBenchmarkResults] = useState<TrainedModel[] | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);

  const handleTrain = async () => {
    if (!isOwner) {
      openOwnerModal();
      return;
    }

    setIsTraining(true);
    setTrainProgress(0);
    setStatusMessage('Partitioning dataset (80% Train / 20% Test)...');

    const split = trainTestSplit(samples, 0.8, seed);

    try {
      let model: TrainedModel;

      if (selectedAlgo === 'rf') {
        setStatusMessage('Fitting Random Forest ensemble (bagged CART trees)...');
        model = await trainRandomForest(
          split.trainX,
          split.trainY,
          split.testX,
          split.testY,
          { numTrees: rfTrees, maxDepth: rfDepth, minLeaf: rfLeaf, seed },
          (ratio) => setTrainProgress(Math.round(ratio * 100))
        );
      } else if (selectedAlgo === 'gb') {
        setStatusMessage('Fitting Gradient Boosting regressor (residual shrinkage)...');
        model = await trainGradientBoosting(
          split.trainX,
          split.trainY,
          split.testX,
          split.testY,
          { stages: gbStages, learningRate: gbLR, maxDepth: gbDepth, seed },
          (ratio) => setTrainProgress(Math.round(ratio * 100))
        );
      } else {
        setStatusMessage('Optimizing Multi-Layer Perceptron (Adam backpropagation)...');
        model = await trainNeuralNetwork(
          split.trainX,
          split.trainY,
          split.testX,
          split.testY,
          { hiddenUnits: nnHidden, epochs: nnEpochs, learningRate: nnLR, seed },
          (ratio) => setTrainProgress(Math.round(ratio * 100))
        );
      }

      setActiveModel(model);
      setStatusMessage(`Trained ${model.name} successfully.`);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsTraining(false);
      setTrainProgress(100);
    }
  };

  const handleBenchmark = async () => {
    if (!isOwner) {
      openOwnerModal();
      return;
    }

    setIsBenchmarking(true);
    try {
      const split = trainTestSplit(samples, 0.8, seed);
      const results = await benchmarkAllModels(split.trainX, split.trainY, split.testX, split.testY, seed);
      setBenchmarkResults(results);
    } catch (err: any) {
      console.error('Benchmark failed:', err);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const generalizationGap = activeModel
    ? activeModel.metrics.trainR2 - activeModel.metrics.r2
    : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Model Configuration & Training Control Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Axiom Machine Learning Model Lab</h2>
              {isOwner ? (
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Owner Access
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Viewer (Evaluation Only)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              80/20 train/test split with Z-score standardization strictly on training partition
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Seed:</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10) || 42)}
              className="w-18 text-xs font-mono bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1.5 text-center text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Algorithm Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setSelectedAlgo('rf')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedAlgo === 'rf'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="font-bold text-sm">Random Forest Regressor</div>
            <div className="text-xs text-slate-500 mt-1 leading-relaxed">
              Ensemble of bagged CART trees with variance reduction splits. Robust to non-linear interactions and outliers.
            </div>
          </button>

          <button
            onClick={() => setSelectedAlgo('gb')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedAlgo === 'gb'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="font-bold text-sm">Gradient Boosting Regressor</div>
            <div className="text-xs text-slate-500 mt-1 leading-relaxed">
              Sequential residual fitting with shrinkage learning rate. Exceptional precision on continuous response surfaces.
            </div>
          </button>

          <button
            onClick={() => setSelectedAlgo('nn')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedAlgo === 'nn'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="font-bold text-sm">Neural Network (MLP)</div>
            <div className="text-xs text-slate-500 mt-1 leading-relaxed">
              Multi-Layer Perceptron with ReLU hidden activations trained via backpropagation with Adam optimizer.
            </div>
          </button>
        </div>

        {/* Hyperparameter Inputs */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 mb-5">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Hyperparameters for {selectedAlgo === 'rf' ? 'Random Forest' : selectedAlgo === 'gb' ? 'Gradient Boosting' : 'Neural Network'}:
          </div>

          {selectedAlgo === 'rf' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Number of Trees</label>
                <input
                  type="number"
                  min={10}
                  max={200}
                  step={10}
                  value={rfTrees}
                  onChange={(e) => setRfTrees(parseInt(e.target.value, 10) || 100)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Max Tree Depth</label>
                <input
                  type="number"
                  min={3}
                  max={15}
                  value={rfDepth}
                  onChange={(e) => setRfDepth(parseInt(e.target.value, 10) || 10)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Min Samples per Leaf</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={rfLeaf}
                  onChange={(e) => setRfLeaf(parseInt(e.target.value, 10) || 3)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono"
                />
              </div>
            </div>
          )}

          {selectedAlgo === 'gb' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Boosting Stages (Trees)</label>
                <input
                  type="number"
                  min={20}
                  max={200}
                  step={10}
                  value={gbStages}
                  onChange={(e) => setGbStages(parseInt(e.target.value, 10) || 120)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Learning Rate (Shrinkage η)</label>
                <input
                  type="number"
                  min={0.01}
                  max={0.3}
                  step={0.01}
                  value={gbLR}
                  onChange={(e) => setGbLR(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Base Tree Depth</label>
                <input
                  type="number"
                  min={2}
                  max={6}
                  value={gbDepth}
                  onChange={(e) => setGbDepth(parseInt(e.target.value, 10) || 3)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono"
                />
              </div>
            </div>
          )}

          {selectedAlgo === 'nn' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Hidden Units (Layer 1)</label>
                <input
                  type="number"
                  min={8}
                  max={48}
                  step={4}
                  value={nnHidden}
                  onChange={(e) => setNnHidden(parseInt(e.target.value, 10) || 20)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Training Epochs</label>
                <input
                  type="number"
                  min={20}
                  max={200}
                  step={10}
                  value={nnEpochs}
                  onChange={(e) => setNnEpochs(parseInt(e.target.value, 10) || 100)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Learning Rate (Adam)</label>
                <input
                  type="number"
                  min={0.001}
                  max={0.05}
                  step={0.001}
                  value={nnLR}
                  onChange={(e) => setNnLR(parseFloat(e.target.value) || 0.01)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Train Trigger & Progress Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>{statusMessage}</span>
              <span className="font-mono">{trainProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${trainProgress}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleTrain}
            disabled={isTraining}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg shadow-sm transition-colors whitespace-nowrap ${
              isOwner
                ? 'text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50'
                : 'text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {isOwner ? (
              <Play className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>
              {isTraining
                ? 'Training...'
                : isOwner
                ? 'Train Model'
                : 'Train Model (Owner Protected)'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Evaluation Metrics Strip */}
      {activeModel && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="text-xs font-medium text-slate-500">Test R² Score</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tabular-nums mt-1">
              {activeModel.metrics.r2}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {Math.round(activeModel.metrics.r2 * 100)}% variance explained
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="text-xs font-medium text-slate-500">Test MAE (Mean Abs. Error)</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono tabular-nums mt-1">
              {activeModel.metrics.mae} <span className="text-sm font-normal text-slate-500">MPa</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Average cube test delta</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="text-xs font-medium text-slate-500">Test RMSE (Root Mean Sq.)</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono tabular-nums mt-1">
              {activeModel.metrics.rmse} <span className="text-sm font-normal text-slate-500">MPa</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Penalizes extreme outliers</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="text-xs font-medium text-slate-500">Train R² / Gap</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
              {activeModel.metrics.trainR2}{' '}
              <span className={`text-xs font-normal ${generalizationGap > 0.12 ? 'text-rose-500' : 'text-emerald-500'}`}>
                (Δ {generalizationGap.toFixed(2)})
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {generalizationGap > 0.12 ? 'Slight overfitting detected' : 'Healthy generalization'}
            </div>
          </div>
        </div>
      )}

      {/* 3. Visuals: Loss Convergence Curve + Feature Importance Bar Chart */}
      {activeModel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Training / Validation Convergence Curve</h3>
            </div>
            <LossCurveChart
              history={activeModel.lossHistory}
              yLabel={activeModel.id === 'nn' ? 'MSE (Normalized)' : 'Residual RMS (MPa)'}
              xLabel={activeModel.id === 'nn' ? 'Epoch' : activeModel.id === 'gb' ? 'Boosting Stage' : 'Ensemble Trees'}
              isDark={isDark}
            />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Feature Importance Ranking</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Contribution of each mix parameter to variance reduction / loss minimization
            </p>
            <FeatureImportanceChart importances={activeModel.featureImportances} isDark={isDark} />
          </div>
        </div>
      )}

      {/* 4. Trained Model Architecture & Node Inspection */}
      {activeModel && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Trained Model Parameters & Internals</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            {Object.entries(activeModel.details).map(([key, val]) => (
              <div key={key} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="text-slate-400 capitalize text-[10px] mb-1">
                  {key.replace(/([A-Z])/g, ' $1')}
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {typeof val === 'number' ? val.toLocaleString() : String(val)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold text-blue-700 dark:text-blue-300">Engineering Interpretation: </span>
            The trained {activeModel.name} achieves a Test R² of <strong>{activeModel.metrics.r2}</strong> and MAE of <strong>{activeModel.metrics.mae} MPa</strong>.
            In civil engineering laboratory practice (per IS 516), standard 3-cube batch testing yields an intrinsic scatter of approximately ±3 to 5 MPa.
            Because the model MAE ({activeModel.metrics.mae} MPa) lies within this empirical laboratory scatter band, it is highly suitable for preliminary mix sizing and what-if sensitivity analysis.
          </div>
        </div>
      )}

      {/* 5. Benchmark Suite (Compares RF, GB, and NN Side-by-Side) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Comparative Model Benchmark</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Train all three architectures side-by-side on identical 80/20 test split to compare accuracy
            </p>
          </div>

          <button
            onClick={handleBenchmark}
            disabled={isBenchmarking}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isBenchmarking ? 'Running Benchmark...' : 'Run Benchmark'}</span>
          </button>
        </div>

        {benchmarkResults && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3 text-right">Test R²</th>
                  <th className="py-2.5 px-3 text-right">Test MAE (MPa)</th>
                  <th className="py-2.5 px-3 text-right">Test RMSE (MPa)</th>
                  <th className="py-2.5 px-3 text-right">Train R²</th>
                  <th className="py-2.5 px-3 text-center">Top Driver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {benchmarkResults.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-slate-100">
                      {m.name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{m.metrics.r2}</td>
                    <td className="py-2.5 px-3 text-right text-blue-600">{m.metrics.mae}</td>
                    <td className="py-2.5 px-3 text-right text-amber-600">{m.metrics.rmse}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{m.metrics.trainR2}</td>
                    <td className="py-2.5 px-3 text-center font-sans text-slate-700 dark:text-slate-300">
                      {m.featureImportances[0]?.name} ({m.featureImportances[0]?.percentage}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
