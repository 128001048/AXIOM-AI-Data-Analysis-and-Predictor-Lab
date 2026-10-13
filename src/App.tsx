import React, { useState, useEffect } from 'react';
import { ConcreteSample, generateUCIDataset, parseCSV } from './data/concreteDataset';
import {
  TrainedModel,
  trainRandomForest,
  trainTestSplit,
  calculateSummaryStats,
} from './utils/mlEngine';
import { generateLabReportPDF } from './utils/pdfGenerator';
import { downloadStandaloneHTML } from './utils/standaloneExporter';
import { OwnerProvider } from './context/OwnerContext';
import { OwnerAuthModal } from './components/OwnerAuthModal';
import { Navbar, TabKey } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { EdaTab } from './components/EdaTab';
import { ModelLabTab } from './components/ModelLabTab';
import { PredictorTab } from './components/PredictorTab';
import { MixCalculatorTab } from './components/MixCalculatorTab';
import { AiAssistantTab } from './components/AiAssistantTab';
import { VivaReportTab } from './components/VivaReportTab';

function AppContent() {
  const [samples, setSamples] = useState<ConcreteSample[]>(() => generateUCIDataset(42));
  const [datasetSource, setDatasetSource] = useState<string>('UCI ML Repository #165 (1030 samples)');
  const [activeModel, setActiveModel] = useState<TrainedModel | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  
  // Theme state with localStorage persistence and system preference fallback
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('axiom_theme') || localStorage.getItem('concreteiq_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Sync dark mode class on html root and persist
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('axiom_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('axiom_theme', 'light');
    }
  }, [isDark]);

  // Train an initial baseline model on boot
  useEffect(() => {
    const initModel = async () => {
      try {
        const split = trainTestSplit(samples, 0.8, 42);
        const model = await trainRandomForest(
          split.trainX,
          split.trainY,
          split.testX,
          split.testY,
          { numTrees: 80, maxDepth: 9, minLeaf: 3, seed: 42 }
        );
        setActiveModel(model);
      } catch (e) {
        console.error('Initial model training failed:', e);
      }
    };
    initModel();
  }, [samples]);

  // CSV upload handler
  const handleUploadCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const { samples: parsed, error } = parseCSV(text);
      if (error) {
        alert(error);
        return;
      }
      setSamples(parsed);
      setDatasetSource(`Uploaded: ${file.name} (${parsed.length} samples)`);
      alert(`Successfully loaded ${parsed.length} samples from ${file.name}.`);
    };
    reader.readAsText(file);
  };

  // One-click Laboratory PDF Report Generation
  const handleExportPDF = () => {
    try {
      generateLabReportPDF({
        samples,
        activeModel,
        datasetSource,
      });
    } catch (e) {
      console.error('PDF export error:', e);
      handleExportTXT();
    }
  };

  // Plain Text (.txt) Report fallback export
  const handleExportTXT = () => {
    const stats = calculateSummaryStats(samples);
    const dateStr = new Date().toLocaleString();

    const reportLines: string[] = [
      '========================================================================',
      'AXIOM — CIVIL ENGINEERING & AI MATERIALS LABORATORY REPORT',
      'EXPERIMENT NO: 11 — CONCRETE COMPRESSIVE STRENGTH PREDICTION (UCI #165)',
      '========================================================================',
      `Date & Timestamp: ${dateStr}`,
      `Platform: Axiom Precision Engineering Engine`,
      `Active Dataset Source: ${datasetSource}`,
      `Total Instances: ${samples.length} | Features: 8 Inputs | Target: 1 Output (MPa)`,
      '',
      '------------------------------------------------------------------------',
      '1. EXPERIMENTAL AIM & OBJECTIVES',
      '------------------------------------------------------------------------',
      'Develop, train, evaluate, and deploy regression machine learning models to',
      'predict concrete compressive strength from mix proportions (Cement, Slag, Fly Ash,',
      'Water, Superplasticizer, Coarse Aggregate, Fine Aggregate) and curing Age.',
      'Explore non-linear feature interactions, validate Abrams\' water-cement ratio law,',
      'and formulate an inverse optimization solver for minimum-water mix design.',
      '',
      '------------------------------------------------------------------------',
      '2. WHAT THE ARTIFICIAL INTELLIGENCE (AI) DOES',
      '------------------------------------------------------------------------',
      '• Generative Civil Engineering Assistant: Uses the server-side Gemini model',
      '  grounded in materials science to diagnose mix issues, slump, and workability.',
      '• Standards Grounding: Interprets ML predictions against IS 456 Table 5, IS 10262,',
      '  and ACI 211 durability benchmarks for severe marine and aggressive environments.',
      '• Human-in-the-Loop Safeguard: Translates statistical model behaviors into practical',
      '  site advice, highlighting mandatory physical trial casting under IS 516.',
      '',
      '------------------------------------------------------------------------',
      '3. WHAT THE MACHINE LEARNING (ML) & ANN DO BEHIND THE APPLICATION',
      '------------------------------------------------------------------------',
      '• Random Forest (Ensemble Bagging): 80–120 de-correlated CART trees with bootstrap',
      '  sampling, suppressing prediction variance and capturing complex threshold interactions.',
      '• Gradient Boosting (Residual Descent): Sequentially minimizes MSE loss on residuals',
      '  with learning rate shrinkage (eta = 0.1).',
      '• Artificial Neural Network (MLP): 8 Input -> 20 Hidden (ReLU) -> 12 Hidden (ReLU) -> 1 Output (Linear)',
      '  Trained via Backpropagation with Adam optimizer, creating a continuous, differentiable',
      '  response surface for fine inverse mix proportioning.',
      '',
      '------------------------------------------------------------------------',
      '4. DESCRIPTIVE STATISTICS OF EXPERIMENTAL VARIABLES',
      '------------------------------------------------------------------------',
      'Variable                 | Unit    | Mean   | Std    | Min    | Max',
      '-------------------------+---------+--------+--------+--------+--------',
      ...stats.map(
        (s) =>
          `${s.name.padEnd(25)} | ${s.unit.padEnd(7)} | ${s.mean
            .toString()
            .padStart(6)} | ${s.std.toString().padStart(6)} | ${s.min
            .toString()
            .padStart(6)} | ${s.max.toString().padStart(6)}`
      ),
      '',
      '------------------------------------------------------------------------',
      '5. ACTIVE MODEL EVALUATION & VALIDATION METRICS',
      '------------------------------------------------------------------------',
    ];

    if (activeModel) {
      reportLines.push(
        `Selected Model: ${activeModel.name}`,
        `Test Coefficient of Determination (R²): ${activeModel.metrics.r2}`,
        `Test Mean Absolute Error (MAE): ${activeModel.metrics.mae} MPa`,
        `Test Root Mean Squared Error (RMSE): ${activeModel.metrics.rmse} MPa`,
        `Training R²: ${activeModel.metrics.trainR2}`,
        `Generalization Gap (Train R² - Test R²): ${(
          activeModel.metrics.trainR2 - activeModel.metrics.r2
        ).toFixed(3)}`,
        '',
        'Feature Importance Ranking:',
        ...activeModel.featureImportances.map(
          (fi, idx) => `  ${idx + 1}. ${fi.name}: ${fi.percentage}%`
        )
      );
    } else {
      reportLines.push('No model trained yet.');
    }

    reportLines.push(
      '',
      '------------------------------------------------------------------------',
      '6. CIVIL ENGINEERING CONCLUSIONS & REASONING',
      '------------------------------------------------------------------------',
      '• Abrams\' Law Validation: Higher water content consistently produces higher',
      '  capillary porosity and sharply lowers compressive strength.',
      '• Superplasticizer Action: Enables water reduction of 15–25% while maintaining',
      '  workability, yielding denser C-S-H microstructure and higher strength.',
      '• Pozzolanic Maturity: SCMs (Fly Ash & GGBS) consume calcium hydroxide to form',
      '  secondary C-S-H gel; their full contribution develops beyond 28 days.',
      '',
      '------------------------------------------------------------------------',
      '7. MANDATORY CODES & SAFETY DISCLAIMER',
      '------------------------------------------------------------------------',
      'All predictions and inverse mix proportions generated by Axiom Lab are',
      'decision-support estimates. Mandatory physical trial mixes, standard curing,',
      'and 28-day cube crushing tests under IS 516 / IS 10262 / ASTM C39 supervised',
      'by a licensed civil engineer are legally required prior to site pouring.',
      '========================================================================'
    );

    const blob = new Blob([reportLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Axiom_Lab_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <OwnerAuthModal />

      {/* Navigation Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        setIsDark={setIsDark}
        onExportReport={handleExportPDF}
        onDownloadApp={() => downloadStandaloneHTML(samples, activeModel)}
      />

      {/* Main Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <OverviewTab
            samples={samples}
            onUploadCSV={handleUploadCSV}
            setActiveTab={setActiveTab}
            datasetSource={datasetSource}
          />
        )}

        {activeTab === 'eda' && <EdaTab samples={samples} isDark={isDark} />}

        {activeTab === 'model' && (
          <ModelLabTab
            samples={samples}
            activeModel={activeModel}
            setActiveModel={setActiveModel}
            isDark={isDark}
          />
        )}

        {activeTab === 'predictor' && (
          <PredictorTab activeModel={activeModel} isDark={isDark} />
        )}

        {activeTab === 'mix' && (
          <MixCalculatorTab activeModel={activeModel} isDark={isDark} />
        )}

        {activeTab === 'assistant' && (
          <AiAssistantTab activeModel={activeModel} isDark={isDark} />
        )}

        {activeTab === 'viva' && (
          <VivaReportTab
            samples={samples}
            activeModel={activeModel}
            datasetSource={datasetSource}
            onExportReport={handleExportTXT}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-6 text-xs text-slate-500 text-center px-4 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
            <span className="font-bold text-blue-600 dark:text-blue-400">Axiom</span>
            <span>·</span>
            <span>DATA ANALYTICS LAB, SASTRA DEEMED UNIVERSITY, Developed by Surya.S (III-YEAR B.Tech CIVIL ENGINEERING)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Advisory tool only · Physical trial testing per IS 516 & IS 10262 is mandatory
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <OwnerProvider>
      <AppContent />
    </OwnerProvider>
  );
}
