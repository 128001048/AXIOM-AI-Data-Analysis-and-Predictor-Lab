import React, { useState } from 'react';
import { TrainedModel, calculateSummaryStats } from '../utils/mlEngine';
import { ConcreteSample } from '../data/concreteDataset';
import { generateLabReportPDF } from '../utils/pdfGenerator';
import {
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Download,
  Brain,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface VivaReportTabProps {
  samples: ConcreteSample[];
  activeModel: TrainedModel | null;
  datasetSource: string;
  onExportReport: () => void;
}

export const VivaReportTab: React.FC<VivaReportTabProps> = ({
  samples,
  activeModel,
  datasetSource,
  onExportReport,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    try {
      generateLabReportPDF({
        samples,
        activeModel,
        datasetSource,
      });
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('Error generating PDF. Please use the Print / Save as PDF button.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const vivaQuestions = [
    {
      q: '1. What role does Artificial Intelligence (AI) play in this concrete engineering application?',
      category: 'AI Engine',
      a: `In ConcreteIQ Lab, AI operates at the cognitive and diagnostic layer:
• Generative Engineering Reasoning: Uses the server-side Gemini generative AI model with deep material science grounding to interpret concrete mix proportions, hydration reactions, and workability issues.
• Standards & Code Compliance Interpreter: Maps calculated parameters (w/c, w/b ratio, binder content) to Indian Standards (IS 456 Table 5, IS 10262) and ACI 211 durability requirements for severe marine and sulfate conditions.
• Interactive Diagnostic Explanations: When a mix exhibits low early strength, poor slump, or high carbon emissions, the AI Assistant articulates the microscopic rationale (e.g. lack of portlandite activation for slag, delayed pozzolanic reaction of fly ash, or excessive water dilution).
• Human-in-the-Loop Safeguard: Bridges complex numerical predictions and site execution, reminding engineers of mandatory trial mixes under IS 516.`,
    },
    {
      q: '2. What do the Machine Learning (ML) algorithms (Random Forest & Gradient Boosting) do behind this application?',
      category: 'Machine Learning',
      a: `The Machine Learning pipeline models the multi-dimensional response surface of concrete strength:
• 8-Parameter Tabular Ingestion: Trains on 1,030 experimental concrete batches from the UCI Machine Learning Repository (#165) featuring 8 continuous variables (Cement, Blast Furnace Slag, Fly Ash, Water, Superplasticizer, Coarse Aggregate, Fine Aggregate, Age).
• Random Forest Regressor: Constructs an ensemble of 80–120 de-correlated CART decision trees using bootstrap aggregating (bagging). By averaging predictions across trees, it suppresses prediction variance and models complex thresholds without overfitting.
• Gradient Boosting Regressor: Optimizes an additive tree ensemble sequentially. Each shallow tree is trained on the negative gradient (residuals) of preceding trees, progressively refining fine-grained predictions with shrinkage (learning rate η = 0.1).
• Physical Verification of Abrams’ Law: The regression surface learns the exponential decay of compressive strength with increasing water-to-cement ratio (fc = A / B^(w/c)), verifying 100+ years of empirical concrete technology.
• Permutation Feature Importance: Empirically measures feature significance, demonstrating that Cement, Age, and Water dominate compressive strength.`,
    },
    {
      q: '3. What does the Artificial Neural Network (ANN / MLP) do and how does its architecture operate?',
      category: 'Deep Learning / ANN',
      a: `The ANN implements a Multi-Layer Perceptron (MLP) trained via Backpropagation:
• Neural Architecture:
  - Input Layer: 8 standardized neurons (Z-score normalized strictly on the training partition).
  - Hidden Layer 1: 20 neurons with ReLU activation (f(z) = max(0, z)).
  - Hidden Layer 2: 12 neurons with ReLU activation.
  - Output Layer: 1 linear neuron yielding the predicted compressive strength in MPa.
• Backpropagation with Adam Optimizer: Gradients of the Mean Squared Error (MSE) loss with respect to all layer weights and biases (∂L/∂W, ∂L/∂b) are computed via the multivariable chain rule. The Adam optimizer updates parameters with adaptive learning rates and momentum (β1 = 0.9, β2 = 0.999).
• Smooth Continuous Manifold: While tree ensembles create piece-wise step functions, the ANN learns a smooth, continuous, differentiable response surface. This enables the inverse mix solver to perform fine-grained parameter searches for minimum water.
• Modeling SCM Kinetics: The hidden non-linear layers naturally capture the time-lagged pozzolanic reactions of Blast Furnace Slag and Fly Ash, where strength gains accelerate after 14–28 days.`,
    },
    {
      q: '4. How does the Inverse Mix Optimizer formulate and solve the mix design problem?',
      category: 'Optimization',
      a: `Unlike forward prediction (given ingredients → predict strength), mix design is an inverse optimization problem:
• Objective: Given target strength f'ck, fixed cement, slag, fly ash, and aggregate contents, determine the minimal water content and corresponding superplasticizer dosage.
• Durability Penalty Function: Min Cost = W + 1.8·SP + Penalty(SP > 2.5% binder).
• Abrams' Law Prioritization: The solver searches for the minimum possible water content to restrict capillary pore volume while determining the exact superplasticizer dosage needed to maintain paste dispersion.
• Multi-Component Binder Integration: Normalizes water demand against Total Cementitious Material (B = Cement + Slag + Fly Ash) to calculate true w/b ratios and ensure compliance with IS 456 Table 5.`,
    },
    {
      q: '5. Why are Blast Furnace Slag (GGBS) and Fly Ash (PFA) crucial in modern concrete, and how are they reflected in the model?',
      category: 'Materials Science',
      a: `Blast Furnace Slag and Fly Ash are Supplementary Cementitious Materials (SCMs) that transform concrete performance:
• Fly Ash (PFA): Spherical glassy particles improve rheology and workability (ball-bearing effect). Reacts pozzolanically with free calcium hydroxide [Ca(OH)₂] generated during cement hydration to form secondary Calcium Silicate Hydrate (C-S-H) gel.
• Ground Granulated Blast Furnace Slag (GGBS): Latent hydraulic binder that refines pore structure, significantly reducing permeability and enhancing resistance against chloride ingress and sulfate attack.
• Carbon Footprint Reduction: Replacing 30–50% of Portland clinker with slag and fly ash cuts embodied CO₂ emissions by 25–45% per m³ of concrete.
• Model Behavior: The ML model and ANN capture the fact that mixes high in slag or fly ash exhibit lower 3-to-7-day strengths but achieve equal or superior 28-to-90-day strengths.`,
    },
    {
      q: '6. What safeguards are built into this application to prevent out-of-distribution or dangerous predictions?',
      category: 'Safety & Verification',
      a: `Multiple physical and algorithmic safeguards are enforced:
• Boundary Clamping: Input sliders are bound to realistic physical domains derived from the UCI #165 dataset (Cement: 100–540 kg/m³, Water: 120–225 L/m³).
• Confidence Interval Quantification: Calculates a 90% confidence interval based on test residual standard error and individual tree variance in Random Forest.
• Durability Code Checks: Automatically flags mixes that violate IS 456 Table 5 minimum binder or maximum w/b ratio limits.
• Mandatory Lab Disclaimer: Explicitly warns that all model outputs are probabilistic guides and that physical cube crushing tests under IS 516 / ASTM C39 remain legally required prior to construction pouring.`,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Actions Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Laboratory Documentation, Report Generation & Viva Voce
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Download formal PDF/TXT lab reports and explore comprehensive theoretical explanations covering AI, ML algorithms, and ANN architecture.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Preview Report</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Educational Architecture Overview Cards: What AI, ML, and ANN do */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: What AI Does */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">What AI Does</h3>
              <span className="text-[11px] text-slate-500">Gemini Foundation Model</span>
            </div>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <li>
              <strong>Conversational Materials Expert:</strong> Evaluates mix proportions, curing regimens, and microstructural C-S-H kinetics in plain language.
            </li>
            <li>
              <strong>Standards Compliance:</strong> Interprets predictions against IS 456, IS 10262, and ACI 211 durability exposure tables.
            </li>
            <li>
              <strong>Diagnostic Troubleshooting:</strong> Suggests corrective admixtures when workability, slump, or strength fails design limits.
            </li>
          </ul>
        </div>

        {/* Card 2: What ML Does */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">What ML Does</h3>
              <span className="text-[11px] text-slate-500">Random Forest & Gradient Boost</span>
            </div>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <li>
              <strong>High-Dimensional Modeling:</strong> Learns non-linear interactions across 8 input features from UCI Dataset #165.
            </li>
            <li>
              <strong>Ensemble Decision Trees:</strong> Averages 80–120 CART trees to eliminate overfitting and capture abrupt mix thresholds.
            </li>
            <li>
              <strong>Abrams' Law Validation:</strong> Confirms the empirical inverse power curve of water-cement ratio on compressive strength.
            </li>
          </ul>
        </div>

        {/* Card 3: What ANN Does */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">What ANN Does</h3>
              <span className="text-[11px] text-slate-500">Multi-Layer Perceptron (MLP)</span>
            </div>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <li>
              <strong>Deep Architecture:</strong> 8 Input → 20 Hidden (ReLU) → 12 Hidden (ReLU) → 1 Output (Linear).
            </li>
            <li>
              <strong>Backpropagation Optimization:</strong> Trains using Adam with adaptive learning rate to minimize Mean Squared Error loss.
            </li>
            <li>
              <strong>Continuous Manifold:</strong> Creates a smooth, differentiable response surface enabling fine inverse mix optimization.
            </li>
          </ul>
        </div>
      </div>

      {/* 3. Viva Voce Q&A Accordion */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
          Comprehensive Viva Voce Examination Questions & Answers
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Theoretical concepts covering civil engineering, machine learning pipelines, neural network mathematics, and optimization
        </p>

        <div className="space-y-3">
          {vivaQuestions.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs sm:text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2 pr-2">
                    <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span>{item.q}</span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 whitespace-pre-line border-t border-slate-100 dark:border-slate-800/60 font-sans">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Export & Download Formats Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Export Complete Laboratory Documentation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Available in publication-ready PDF, raw text summary (.txt), or browser printable view
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF (.pdf)</span>
            </button>

            <button
              type="button"
              onClick={onExportReport}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Raw (.txt)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowPreviewModal(true);
                setTimeout(() => window.print(), 300);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Browser PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. In-App Printable Report Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Laboratory Record Preview
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Download .PDF
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Print View
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Document Content */}
            <div className="space-y-6 text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-sans">
              <div className="p-4 bg-blue-900 text-white rounded-xl">
                <div className="text-lg font-bold">
                  AXIOM — CIVIL ENGINEERING & AI MATERIALS LABORATORY RECORD
                </div>
                <div className="text-xs text-blue-200 mt-1">
                  DATA ANALYTICS LAB, SASTRA DEEMED UNIVERSITY · Developed by Surya.S (III-YEAR B.Tech CIVIL ENGINEERING)
                </div>
                <div className="text-[11px] text-blue-300 mt-2 font-mono">
                  Date: {new Date().toLocaleDateString()} · Dataset: {datasetSource} · Samples: {samples.length}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  1. Laboratory Aim & Objectives
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  To formulate, train, evaluate, and deploy non-linear regression algorithms (Random Forest, Gradient Boosting) and Deep Learning (Multi-Layer Perceptron ANN) on the UCI Concrete Compressive Strength dataset (#165). The model predicts 28-day cylinder compressive strength (MPa), validates Abrams' law, and solves the inverse mix proportion problem with Supplementary Cementitious Materials (Blast Furnace Slag & Fly Ash).
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  2. What Artificial Intelligence (AI) Does in this System
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  The AI layer uses Google's Gemini foundation model running on a secure server-side proxy. It grounds raw numeric predictions into civil engineering domain reasoning, interprets Indian Standards (IS 456 Table 5, IS 10262:2019) durability exposure criteria, diagnoses workability and slump challenges, and guides site batching engineers with contextual advice.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  3. What Machine Learning (ML) & ANN Do Behind the Scenes
                </h4>
                <p className="text-slate-600 dark:text-slate-300 mb-2">
                  <strong>• Machine Learning Regressors:</strong> Random Forest trains 80–120 de-correlated CART trees with bootstrap aggregation to reduce model variance. Gradient Boosting iteratively trains shallow trees on negative loss gradients, achieving R² ≥ 0.88 on test splits.
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>• Artificial Neural Network (MLP):</strong> Features 8 input neurons (Z-score normalized), two hidden layers (20 and 12 neurons with ReLU activation), and 1 linear output neuron. Trained via Backpropagation with the Adam optimizer over 100 epochs, creating a continuous, differentiable response surface that models the non-linear hydration kinetics of slag and fly ash.
                </p>
              </div>

              {activeModel && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                    Active Model Metrics ({activeModel.name})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Test R²</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {activeModel.metrics.r2}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Test MAE</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {activeModel.metrics.mae} MPa
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Test RMSE</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {activeModel.metrics.rmse} MPa
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Train R²</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {activeModel.metrics.trainR2}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg text-red-800 dark:text-red-300 text-[11px]">
                <strong>Mandatory Civil Engineering Notice:</strong> All AI mix solutions are statistical decision-support estimates. Mandatory laboratory trial mixes and standard 28-day cube compression tests (IS 516 / ASTM C39) must be conducted by a qualified engineer before site pouring.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
