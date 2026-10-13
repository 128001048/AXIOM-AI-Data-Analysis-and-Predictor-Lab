import { ConcreteSample, FEATURES_META } from '../data/concreteDataset';

// Numerical & Statistical Helpers
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function variance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
}

export function standardDeviation(arr: number[]): number {
  return Math.sqrt(variance(arr));
}

export function skewness(arr: number[]): number {
  if (arr.length < 3) return 0;
  const m = mean(arr);
  const s = standardDeviation(arr) || 1e-9;
  return arr.reduce((acc, v) => acc + ((v - m) / s) ** 3, 0) / arr.length;
}

export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0 || n !== y.length) return 0;
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

// Deterministic PRNG
export function createRNG(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface VariableStats {
  key: string;
  name: string;
  unit: string;
  mean: number;
  std: number;
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  skew: number;
}

export function calculateSummaryStats(samples: ConcreteSample[]): VariableStats[] {
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

  return keys.map((key) => {
    const values = samples.map((s) => s[key]);
    const meta =
      key === 'strength'
        ? { name: 'Compressive Strength (Target)', unit: 'MPa' }
        : FEATURES_META.find((f) => f.key === key) || { name: key, unit: '' };

    return {
      key,
      name: meta.name,
      unit: meta.unit,
      mean: parseFloat(mean(values).toFixed(2)),
      std: parseFloat(standardDeviation(values).toFixed(2)),
      min: parseFloat(Math.min(...values).toFixed(2)),
      p25: parseFloat(percentile(values, 25).toFixed(2)),
      median: parseFloat(percentile(values, 50).toFixed(2)),
      p75: parseFloat(percentile(values, 75).toFixed(2)),
      max: parseFloat(Math.max(...values).toFixed(2)),
      skew: parseFloat(skewness(values).toFixed(2)),
    };
  });
}

// Convert sample to feature vector
export function sampleToFeatures(s: ConcreteSample): number[] {
  return [s.cement, s.slag, s.flyAsh, s.water, s.superplasticizer, s.coarseAggregate, s.fineAggregate, s.age];
}

// Z-Score Normalizer (Fit strictly on Train, transform on Test)
export interface Normalizer {
  means: number[];
  stds: number[];
}

export function fitNormalizer(X: number[][]): Normalizer {
  const p = X[0].length;
  const means: number[] = [];
  const stds: number[] = [];
  for (let j = 0; j < p; j++) {
    const col = X.map((r) => r[j]);
    const m = mean(col);
    const s = standardDeviation(col) || 1.0;
    means.push(m);
    stds.push(s);
  }
  return { means, stds };
}

export function transformFeatures(X: number[][], norm: Normalizer): number[][] {
  return X.map((row) => row.map((val, j) => (val - norm.means[j]) / norm.stds[j]));
}

export function transformSingle(row: number[], norm: Normalizer): number[] {
  return row.map((val, j) => (val - norm.means[j]) / norm.stds[j]);
}

// Split dataset
export function trainTestSplit(
  samples: ConcreteSample[],
  trainRatio: number = 0.8,
  seed: number = 42
): {
  trainX: number[][];
  trainY: number[];
  testX: number[][];
  testY: number[];
} {
  const rng = createRNG(seed);
  const n = samples.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  // Fisher-Yates shuffle
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const trainCount = Math.floor(n * trainRatio);
  const trainIndices = indices.slice(0, trainCount);
  const testIndices = indices.slice(trainCount);

  return {
    trainX: trainIndices.map((i) => sampleToFeatures(samples[i])),
    trainY: trainIndices.map((i) => samples[i].strength),
    testX: testIndices.map((i) => sampleToFeatures(samples[i])),
    testY: testIndices.map((i) => samples[i].strength),
  };
}

// Metrics
export interface ModelMetrics {
  r2: number;
  mae: number;
  rmse: number;
  mse: number;
  trainR2: number;
  residualStd: number;
}

export function evaluatePredictions(pred: number[], actual: number[], trainR2: number = 0): ModelMetrics {
  const n = actual.length;
  if (n === 0) return { r2: 0, mae: 0, rmse: 0, mse: 0, trainR2: 0, residualStd: 0 };

  let ssRes = 0;
  let sae = 0;
  const residuals: number[] = [];
  for (let i = 0; i < n; i++) {
    const diff = pred[i] - actual[i];
    residuals.push(diff);
    ssRes += diff * diff;
    sae += Math.abs(diff);
  }

  const actualMean = mean(actual);
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    ssTot += (actual[i] - actualMean) ** 2;
  }

  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  const mae = sae / n;
  const mse = ssRes / n;
  const rmse = Math.sqrt(mse);
  const residualStd = standardDeviation(residuals);

  return {
    r2: parseFloat(r2.toFixed(3)),
    mae: parseFloat(mae.toFixed(2)),
    rmse: parseFloat(rmse.toFixed(2)),
    mse: parseFloat(mse.toFixed(2)),
    trainR2: parseFloat(trainR2.toFixed(3)),
    residualStd: parseFloat(residualStd.toFixed(2)),
  };
}

// --- DECISION TREE REGRESSOR (CART) ---
interface TreeNode {
  isLeaf: boolean;
  value: number;
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

function buildTree(
  X: number[][],
  y: number[],
  indices: number[],
  depth: number,
  maxDepth: number,
  minSamplesLeaf: number,
  featureImportances: number[],
  rng: () => number
): TreeNode {
  if (depth >= maxDepth || indices.length <= minSamplesLeaf * 2) {
    const vals = indices.map((i) => y[i]);
    return { isLeaf: true, value: mean(vals) };
  }

  const p = X[0].length;
  let bestScore = Infinity;
  let bestFeature = -1;
  let bestThreshold = 0;
  let bestLeft: number[] = [];
  let bestRight: number[] = [];

  // Random feature subset (mtry = sqrt(p) + 1)
  const candidateFeatures: number[] = [];
  const pool = Array.from({ length: p }, (_, i) => i);
  const mtry = Math.min(p, Math.floor(Math.sqrt(p)) + 2);
  for (let k = 0; k < mtry; k++) {
    const idx = Math.floor(rng() * pool.length);
    candidateFeatures.push(pool.splice(idx, 1)[0]);
  }

  const currentMean = mean(indices.map((i) => y[i]));
  const currentVariance = indices.reduce((acc, i) => acc + (y[i] - currentMean) ** 2, 0);

  for (const feat of candidateFeatures) {
    const sorted = indices.map((i) => ({ val: X[i][feat], y: y[i], idx: i })).sort((a, b) => a.val - b.val);

    let sumLeft = 0;
    let sumRight = sorted.reduce((a, b) => a + b.y, 0);
    let countLeft = 0;
    let countRight = sorted.length;
    let sumSqLeft = 0;
    let sumSqRight = sorted.reduce((a, b) => a + b.y * b.y, 0);

    const step = Math.max(1, Math.floor(sorted.length / 16));

    for (let k = 0; k < sorted.length - 1; k++) {
      const cur = sorted[k];
      sumLeft += cur.y;
      sumRight -= cur.y;
      sumSqLeft += cur.y * cur.y;
      sumSqRight -= cur.y * cur.y;
      countLeft++;
      countRight--;

      if (k % step !== 0 && k !== sorted.length - 2) continue;
      if (sorted[k + 1].val === cur.val) continue;

      if (countLeft < minSamplesLeaf || countRight < minSamplesLeaf) continue;

      const varLeft = sumSqLeft - (sumLeft * sumLeft) / countLeft;
      const varRight = sumSqRight - (sumRight * sumRight) / countRight;
      const score = varLeft + varRight;

      if (score < bestScore) {
        bestScore = score;
        bestFeature = feat;
        bestThreshold = (cur.val + sorted[k + 1].val) / 2.0;
      }
    }
  }

  if (bestFeature === -1 || bestScore >= currentVariance) {
    return { isLeaf: true, value: mean(indices.map((i) => y[i])) };
  }

  featureImportances[bestFeature] += Math.max(0, currentVariance - bestScore);

  for (const i of indices) {
    if (X[i][bestFeature] <= bestThreshold) {
      bestLeft.push(i);
    } else {
      bestRight.push(i);
    }
  }

  if (bestLeft.length === 0 || bestRight.length === 0) {
    return { isLeaf: true, value: mean(indices.map((i) => y[i])) };
  }

  return {
    isLeaf: false,
    value: mean(indices.map((i) => y[i])),
    featureIndex: bestFeature,
    threshold: bestThreshold,
    left: buildTree(X, y, bestLeft, depth + 1, maxDepth, minSamplesLeaf, featureImportances, rng),
    right: buildTree(X, y, bestRight, depth + 1, maxDepth, minSamplesLeaf, featureImportances, rng),
  };
}

function predictTree(node: TreeNode, x: number[]): number {
  if (node.isLeaf || node.featureIndex === undefined || node.threshold === undefined) {
    return node.value;
  }
  if (x[node.featureIndex] <= node.threshold) {
    return predictTree(node.left || node, x);
  } else {
    return predictTree(node.right || node, x);
  }
}

function countTreeNodes(node: TreeNode): number {
  if (node.isLeaf) return 1;
  return 1 + countTreeNodes(node.left || node) + countTreeNodes(node.right || node);
}

// --- MODEL INTERFACES & IMPLEMENTATIONS ---
export interface TrainedModel {
  id: 'rf' | 'gb' | 'nn';
  name: string;
  predict: (features: number[]) => number;
  predictAll?: (features: number[]) => number[]; // For ensemble prediction interval
  featureImportances: { name: string; percentage: number }[];
  metrics: ModelMetrics;
  lossHistory: { step: number; trainLoss: number; valLoss?: number }[];
  details: Record<string, any>;
}

// 1. Random Forest Regressor
export async function trainRandomForest(
  trainX: number[][],
  trainY: number[],
  testX: number[][],
  testY: number[],
  params: { numTrees: number; maxDepth: number; minLeaf: number; seed: number },
  onProgress?: (ratio: number) => void
): Promise<TrainedModel> {
  const norm = fitNormalizer(trainX);
  const normTrainX = transformFeatures(trainX, norm);
  const normTestX = transformFeatures(testX, norm);

  const rng = createRNG(params.seed);
  const n = normTrainX.length;
  const trees: TreeNode[] = [];
  const rawImportances = Array(8).fill(0);

  const batchSize = Math.max(1, Math.floor(params.numTrees / 20));
  for (let b = 0; b < params.numTrees; b++) {
    // Bootstrap sample
    const sampleIndices: number[] = [];
    for (let k = 0; k < n; k++) {
      sampleIndices.push(Math.floor(rng() * n));
    }

    const tree = buildTree(
      normTrainX,
      trainY,
      sampleIndices,
      0,
      params.maxDepth,
      params.minLeaf,
      rawImportances,
      rng
    );
    trees.push(tree);

    if (onProgress && (b % batchSize === 0 || b === params.numTrees - 1)) {
      onProgress((b + 1) / params.numTrees);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const predictSample = (feat: number[]) => {
    const xNorm = transformSingle(feat, norm);
    let sum = 0;
    for (const t of trees) {
      sum += predictTree(t, xNorm);
    }
    return sum / trees.length;
  };

  const predictAllTrees = (feat: number[]) => {
    const xNorm = transformSingle(feat, norm);
    return trees.map((t) => predictTree(t, xNorm));
  };

  // Evaluate
  const testPreds = testX.map(predictSample);
  const trainPreds = trainX.map(predictSample);
  const trainR2 = evaluatePredictions(trainPreds, trainY).r2;
  const metrics = evaluatePredictions(testPreds, testY, trainR2);

  // Normalize feature importances
  const totalImp = rawImportances.reduce((a, b) => a + b, 0) || 1;
  const featureImportances = FEATURES_META.map((f, idx) => ({
    name: f.shortName,
    percentage: parseFloat(((rawImportances[idx] / totalImp) * 100).toFixed(1)),
  })).sort((a, b) => b.percentage - a.percentage);

  const totalNodes = trees.reduce((acc, t) => acc + countTreeNodes(t), 0);

  // Convergence loss: cumulative tree test RMSE
  const lossHistory: { step: number; trainLoss: number }[] = [];
  const stepInterval = Math.max(1, Math.floor(trees.length / 15));
  let runningSum = Array(testX.length).fill(0);
  for (let i = 0; i < trees.length; i++) {
    for (let j = 0; j < testX.length; j++) {
      runningSum[j] += predictTree(trees[i], normTestX[j]);
    }
    if ((i + 1) % stepInterval === 0 || i === trees.length - 1) {
      const curPreds = runningSum.map((s) => s / (i + 1));
      lossHistory.push({
        step: i + 1,
        trainLoss: parseFloat(evaluatePredictions(curPreds, testY).rmse.toFixed(2)),
      });
    }
  }

  return {
    id: 'rf',
    name: 'Random Forest Regressor',
    predict: predictSample,
    predictAll: predictAllTrees,
    featureImportances,
    metrics,
    lossHistory,
    details: {
      numTrees: trees.length,
      maxDepth: params.maxDepth,
      minSamplesLeaf: params.minLeaf,
      totalNodes,
      avgNodesPerTree: Math.round(totalNodes / trees.length),
    },
  };
}

// 2. Gradient Boosting Regressor
export async function trainGradientBoosting(
  trainX: number[][],
  trainY: number[],
  testX: number[][],
  testY: number[],
  params: { stages: number; learningRate: number; maxDepth: number; seed: number },
  onProgress?: (ratio: number) => void
): Promise<TrainedModel> {
  const norm = fitNormalizer(trainX);
  const normTrainX = transformFeatures(trainX, norm);

  const rng = createRNG(params.seed);
  const n = normTrainX.length;
  const F0 = mean(trainY);
  let currentPreds = Array(n).fill(F0);
  const trees: TreeNode[] = [];
  const rawImportances = Array(8).fill(0);
  const lossHistory: { step: number; trainLoss: number }[] = [];

  const batchSize = Math.max(1, Math.floor(params.stages / 20));
  for (let s = 0; s < params.stages; s++) {
    // Compute pseudo-residuals r_i = y_i - F_{s-1}(x_i)
    const residuals = trainY.map((y, i) => y - currentPreds[i]);

    const allIndices = Array.from({ length: n }, (_, i) => i);
    const tree = buildTree(
      normTrainX,
      residuals,
      allIndices,
      0,
      params.maxDepth,
      4,
      rawImportances,
      rng
    );
    trees.push(tree);

    // Update predictions with shrinkage
    for (let i = 0; i < n; i++) {
      currentPreds[i] += params.learningRate * predictTree(tree, normTrainX[i]);
    }

    const currentRMS = Math.sqrt(residuals.reduce((a, b) => a + b * b, 0) / n);
    if ((s + 1) % 5 === 0 || s === params.stages - 1) {
      lossHistory.push({
        step: s + 1,
        trainLoss: parseFloat(currentRMS.toFixed(2)),
      });
    }

    if (onProgress && (s % batchSize === 0 || s === params.stages - 1)) {
      onProgress((s + 1) / params.stages);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const predictSample = (feat: number[]) => {
    const xNorm = transformSingle(feat, norm);
    let pred = F0;
    for (const t of trees) {
      pred += params.learningRate * predictTree(t, xNorm);
    }
    return pred;
  };

  const testPreds = testX.map(predictSample);
  const trainPreds = trainX.map(predictSample);
  const trainR2 = evaluatePredictions(trainPreds, trainY).r2;
  const metrics = evaluatePredictions(testPreds, testY, trainR2);

  const totalImp = rawImportances.reduce((a, b) => a + b, 0) || 1;
  const featureImportances = FEATURES_META.map((f, idx) => ({
    name: f.shortName,
    percentage: parseFloat(((rawImportances[idx] / totalImp) * 100).toFixed(1)),
  })).sort((a, b) => b.percentage - a.percentage);

  return {
    id: 'gb',
    name: 'Gradient Boosting Regressor',
    predict: predictSample,
    featureImportances,
    metrics,
    lossHistory,
    details: {
      stages: trees.length,
      learningRate: params.learningRate,
      maxDepth: params.maxDepth,
      initialPredictionF0: parseFloat(F0.toFixed(2)),
      finalResidualRMS: lossHistory[lossHistory.length - 1]?.trainLoss ?? 0,
    },
  };
}

// 3. Multi-Layer Perceptron (Neural Network)
export async function trainNeuralNetwork(
  trainX: number[][],
  trainY: number[],
  testX: number[][],
  testY: number[],
  params: { hiddenUnits: number; epochs: number; learningRate: number; seed: number },
  onProgress?: (ratio: number) => void
): Promise<TrainedModel> {
  const norm = fitNormalizer(trainX);
  const normTrainX = transformFeatures(trainX, norm);
  const normTestX = transformFeatures(testX, norm);

  const yMean = mean(trainY);
  const yStd = standardDeviation(trainY) || 1.0;
  const normTrainY = trainY.map((y) => (y - yMean) / yStd);

  const rng = createRNG(params.seed);
  const layerSizes = [8, params.hiddenUnits, Math.max(4, Math.round(params.hiddenUnits / 2)), 1];

  // He Initialization
  const weights: number[][][] = [];
  const biases: number[][] = [];
  const mWeights: number[][][] = [];
  const vWeights: number[][][] = [];
  const mBiases: number[][] = [];
  const vBiases: number[][] = [];

  for (let l = 0; l < layerSizes.length - 1; l++) {
    const inDim = layerSizes[l];
    const outDim = layerSizes[l + 1];
    const std = Math.sqrt(2.0 / inDim);

    const wMat: number[][] = [];
    const bVec: number[] = [];
    for (let o = 0; o < outDim; o++) {
      const row: number[] = [];
      for (let i = 0; i < inDim; i++) {
        row.push((rng() * 2 - 1) * std);
      }
      wMat.push(row);
      bVec.push(0);
    }
    weights.push(wMat);
    biases.push(bVec);

    mWeights.push(wMat.map((r) => r.map(() => 0)));
    vWeights.push(wMat.map((r) => r.map(() => 0)));
    mBiases.push(bVec.map(() => 0));
    vBiases.push(bVec.map(() => 0));
  }

  function forward(x: number[]) {
    const activations: number[][] = [x];
    for (let l = 0; l < weights.length; l++) {
      const prev = activations[l];
      const wMat = weights[l];
      const bVec = biases[l];
      const isOutput = l === weights.length - 1;

      const act: number[] = [];
      for (let o = 0; o < wMat.length; o++) {
        let z = bVec[o];
        for (let i = 0; i < prev.length; i++) {
          z += wMat[o][i] * prev[i];
        }
        act.push(isOutput ? z : Math.max(0, z)); // ReLU hidden, linear out
      }
      activations.push(act);
    }
    return activations;
  }

  const lossHistory: { step: number; trainLoss: number; valLoss?: number }[] = [];
  const n = normTrainX.length;
  const batchSize = 32;
  let t = 0;

  const progressInterval = Math.max(1, Math.floor(params.epochs / 25));
  for (let epoch = 0; epoch < params.epochs; epoch++) {
    // Shuffle indices
    const indices = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    let epochLoss = 0;
    for (let b = 0; b < n; b += batchSize) {
      const batchIndices = indices.slice(b, b + batchSize);
      t++;

      // Accumulate gradients
      const gradW = weights.map((wMat) => wMat.map((r) => r.map(() => 0)));
      const gradB = biases.map((bVec) => bVec.map(() => 0));

      for (const idx of batchIndices) {
        const x = normTrainX[idx];
        const yTarget = normTrainY[idx];
        const acts = forward(x);
        const yPred = acts[acts.length - 1][0];
        const err = yPred - yTarget;
        epochLoss += err * err;

        // Backprop
        let delta = [err];
        for (let l = weights.length - 1; l >= 0; l--) {
          const actPrev = acts[l];
          const nextDelta: number[] = Array(actPrev.length).fill(0);

          for (let o = 0; o < delta.length; o++) {
            gradB[l][o] += delta[o] / batchIndices.length;
            for (let i = 0; i < actPrev.length; i++) {
              gradW[l][o][i] += (delta[o] * actPrev[i]) / batchIndices.length;
              if (l > 0) {
                nextDelta[i] += weights[l][o][i] * delta[o];
              }
            }
          }

          if (l > 0) {
            delta = nextDelta.map((val, i) => (actPrev[i] > 0 ? val : 0)); // ReLU derivative
          }
        }
      }

      // Adam parameter update
      const beta1 = 0.9;
      const beta2 = 0.999;
      const eps = 1e-8;
      for (let l = 0; l < weights.length; l++) {
        for (let o = 0; o < weights[l].length; o++) {
          mBiases[l][o] = beta1 * mBiases[l][o] + (1 - beta1) * gradB[l][o];
          vBiases[l][o] = beta2 * vBiases[l][o] + (1 - beta2) * gradB[l][o] * gradB[l][o];
          const mHatB = mBiases[l][o] / (1 - Math.pow(beta1, t));
          const vHatB = vBiases[l][o] / (1 - Math.pow(beta2, t));
          biases[l][o] -= (params.learningRate * mHatB) / (Math.sqrt(vHatB) + eps);

          for (let i = 0; i < weights[l][o].length; i++) {
            mWeights[l][o][i] = beta1 * mWeights[l][o][i] + (1 - beta1) * gradW[l][o][i];
            vWeights[l][o][i] = beta2 * vWeights[l][o][i] + (1 - beta2) * gradW[l][o][i] * gradW[l][o][i];
            const mHatW = mWeights[l][o][i] / (1 - Math.pow(beta1, t));
            const vHatW = vWeights[l][o][i] / (1 - Math.pow(beta2, t));
            weights[l][o][i] -= (params.learningRate * mHatW) / (Math.sqrt(vHatW) + eps);
          }
        }
      }
    }

    if ((epoch + 1) % 5 === 0 || epoch === params.epochs - 1) {
      // Compute validation MSE
      let valMSE = 0;
      for (let i = 0; i < normTestX.length; i++) {
        const p = forward(normTestX[i])[layerSizes.length - 1][0] * yStd + yMean;
        valMSE += (p - testY[i]) ** 2;
      }
      valMSE /= normTestX.length;

      lossHistory.push({
        step: epoch + 1,
        trainLoss: parseFloat((epochLoss / n).toFixed(4)),
        valLoss: parseFloat(valMSE.toFixed(2)),
      });
    }

    if (onProgress && (epoch % progressInterval === 0 || epoch === params.epochs - 1)) {
      onProgress((epoch + 1) / params.epochs);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const predictSample = (feat: number[]) => {
    const xNorm = transformSingle(feat, norm);
    const rawOut = forward(xNorm)[layerSizes.length - 1][0];
    return rawOut * yStd + yMean;
  };

  const testPreds = testX.map(predictSample);
  const trainPreds = trainX.map(predictSample);
  const trainR2 = evaluatePredictions(trainPreds, trainY).r2;
  const metrics = evaluatePredictions(testPreds, testY, trainR2);

  // Permutation feature importance for neural net
  const baseR2 = metrics.r2;
  const rawImportances: number[] = [];
  for (let j = 0; j < 8; j++) {
    const permX = testX.map((row) => [...row]);
    const pIndices = Array.from({ length: testX.length }, (_, i) => i);
    for (let i = testX.length - 1; i > 0; i--) {
      const k = Math.floor(rng() * (i + 1));
      [pIndices[i], pIndices[k]] = [pIndices[k], pIndices[i]];
    }
    permX.forEach((row, i) => (row[j] = testX[pIndices[i]][j]));
    const permR2 = evaluatePredictions(permX.map(predictSample), testY).r2;
    rawImportances.push(Math.max(0, baseR2 - permR2));
  }

  const totalImp = rawImportances.reduce((a, b) => a + b, 0) || 1;
  const featureImportances = FEATURES_META.map((f, idx) => ({
    name: f.shortName,
    percentage: parseFloat(((rawImportances[idx] / totalImp) * 100).toFixed(1)),
  })).sort((a, b) => b.percentage - a.percentage);

  const totalParams = weights.reduce(
    (acc, wMat, l) => acc + wMat.length * wMat[0].length + biases[l].length,
    0
  );

  return {
    id: 'nn',
    name: 'Neural Network (MLP)',
    predict: predictSample,
    featureImportances,
    metrics,
    lossHistory,
    details: {
      architecture: layerSizes.join(' → '),
      totalParameters: totalParams,
      epochs: params.epochs,
      learningRate: params.learningRate,
      hiddenUnits: params.hiddenUnits,
      finalTrainLoss: lossHistory[lossHistory.length - 1]?.trainLoss ?? 0,
      finalValMSE: lossHistory[lossHistory.length - 1]?.valLoss ?? 0,
    },
  };
}

// Benchmark Suite
export async function benchmarkAllModels(
  trainX: number[][],
  trainY: number[],
  testX: number[][],
  testY: number[],
  seed: number = 42
): Promise<TrainedModel[]> {
  const rf = await trainRandomForest(
    trainX,
    trainY,
    testX,
    testY,
    { numTrees: 80, maxDepth: 9, minLeaf: 3, seed }
  );

  const gb = await trainGradientBoosting(
    trainX,
    trainY,
    testX,
    testY,
    { stages: 100, learningRate: 0.1, maxDepth: 3, seed }
  );

  const nn = await trainNeuralNetwork(
    trainX,
    trainY,
    testX,
    testY,
    { hiddenUnits: 20, epochs: 80, learningRate: 0.01, seed }
  );

  return [rf, gb, nn];
}

// Inverse Mix Solver
export interface MixSolution {
  water: number;
  superplasticizer: number;
  achievedStrength: number;
  wcRatio: number;
  wbRatio: number;
  totalBinder: number;
  spPercentage: number;
  exposureSuitability: string;
  isExact: boolean;
  predicted28Day?: number;
  curingAge: number;
  cement: number;
  slag: number;
  flyAsh: number;
  coarseAgg: number;
  fineAgg: number;
}

export function solveConcreteMix(
  model: TrainedModel,
  targetStrength: number,
  cement: number,
  slag: number = 0,
  flyAsh: number = 0,
  coarseAgg: number = 973,
  fineAgg: number = 774,
  curingAge: number = 28
): MixSolution {
  let bestSolution: { w: number; sp: number; pred: number } | null = null;
  let minCost = Infinity;

  const totalBinder = Math.max(1, cement + slag + flyAsh);

  // Search grid: water (120 to 226 L/m³ in 2L steps), superplasticizer (0 to 26 kg/m³ in 0.5kg steps)
  for (let w = 120; w <= 226; w += 2) {
    for (let sp = 0; sp <= 26; sp += 0.5) {
      const feat = [cement, slag, flyAsh, w, sp, coarseAgg, fineAgg, curingAge];
      const pred = model.predict(feat);

      if (pred >= targetStrength) {
        // Durability cost function: prioritize lower water (Abrams' law), penalize excessive SP (>2.5% of binder)
        const spDose = (sp / totalBinder) * 100;
        const spPenalty = spDose > 2.5 ? (spDose - 2.5) * 20 : 0;
        const cost = w + 1.8 * sp + spPenalty;
        if (cost < minCost) {
          minCost = cost;
          bestSolution = { w, sp, pred };
        }
      }
    }
  }

  // If target strength is not reachable, find mix that gets closest
  let isExact = true;
  if (!bestSolution) {
    isExact = false;
    let closestDiff = Infinity;
    for (let w = 120; w <= 226; w += 2) {
      for (let sp = 0; sp <= 30; sp += 1) {
        const feat = [cement, slag, flyAsh, w, sp, coarseAgg, fineAgg, curingAge];
        const pred = model.predict(feat);
        const diff = Math.abs(pred - targetStrength);
        if (diff < closestDiff) {
          closestDiff = diff;
          bestSolution = { w, sp, pred };
        }
      }
    }
  }

  const finalW = bestSolution ? bestSolution.w : 180;
  const finalSP = bestSolution ? bestSolution.sp : 6;
  const finalPred = bestSolution
    ? bestSolution.pred
    : model.predict([cement, slag, flyAsh, finalW, finalSP, coarseAgg, fineAgg, curingAge]);

  const wcRatio = parseFloat((finalW / Math.max(1, cement)).toFixed(2));
  const wbRatio = parseFloat((finalW / totalBinder).toFixed(2));
  const spPercentage = parseFloat(((finalSP / totalBinder) * 100).toFixed(2));

  let exposureSuitability = 'Severe to Extreme';
  if (wbRatio <= 0.40 && totalBinder >= 360) {
    exposureSuitability = 'Extreme (IS 456 Table 5 compliant)';
  } else if (wbRatio <= 0.45 && totalBinder >= 340) {
    exposureSuitability = 'Very Severe (IS 456 Table 5 compliant)';
  } else if (wbRatio <= 0.45 && totalBinder >= 320) {
    exposureSuitability = 'Severe (IS 456 Table 5 compliant)';
  } else if (wbRatio <= 0.50 && totalBinder >= 300) {
    exposureSuitability = 'Moderate (IS 456 Table 5 compliant)';
  } else if (wbRatio <= 0.55 && totalBinder >= 250) {
    exposureSuitability = 'Mild (IS 456 Table 5 compliant)';
  } else {
    exposureSuitability = 'Non-structural / Exceeds IS 456 durability limit';
  }

  return {
    water: finalW,
    superplasticizer: parseFloat(finalSP.toFixed(1)),
    achievedStrength: parseFloat(finalPred.toFixed(1)),
    wcRatio,
    wbRatio,
    totalBinder: parseFloat(totalBinder.toFixed(1)),
    spPercentage,
    exposureSuitability,
    isExact,
    curingAge,
    cement,
    slag,
    flyAsh,
    coarseAgg,
    fineAgg,
  };
}
