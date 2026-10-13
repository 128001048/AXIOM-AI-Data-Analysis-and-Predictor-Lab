import { jsPDF } from 'jspdf';
import { ConcreteSample } from '../data/concreteDataset';
import { TrainedModel, calculateSummaryStats } from './mlEngine';

export interface PDFReportOptions {
  samples: ConcreteSample[];
  activeModel: TrainedModel | null;
  datasetSource: string;
}

export function generateLabReportPDF({
  samples,
  activeModel,
  datasetSource,
}: PDFReportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 18;
      // Header on subsequent pages
      doc.setFontSize(8);
      doc.setTextColor(140, 150, 160);
      doc.text('Axiom Lab · Civil Engineering & AI Materials Report', margin, 12);
      doc.setDrawColor(220, 225, 230);
      doc.line(margin, 14, pageWidth - margin, 14);
    }
  };

  // Header Banner
  doc.setFillColor(30, 58, 138); // Deep Navy (#1E3A8A)
  doc.rect(margin, y, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AXIOM — CIVIL ENGINEERING & AI MATERIALS REPORT', margin + 6, y + 9);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'DATA ANALYTICS LAB, SASTRA DEEMED UNIVERSITY · Developed by Surya.S (III-YEAR B.Tech CIVIL ENGINEERING)',
    margin + 6,
    y + 15
  );
  doc.text(
    `Generated: ${new Date().toLocaleString()} · Dataset: UCI #165 (${samples.length} samples)`,
    margin + 6,
    y + 20
  );

  y += 30;

  // Section 1: Executive Overview
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('1. EXECUTIVE LABORATORY OVERVIEW', margin, y);
  y += 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const introText =
    'This laboratory system integrates Classical Civil Engineering Concrete Technology (IS 456:2000, IS 10262:2019, ASTM C39) with contemporary Machine Learning and Artificial Neural Networks. The objective is to accurately predict the 28-day compressive strength of high-performance and pozzolanic concrete from mix proportions, validate empirical laws of hydration (Abrams\' Law), and solve inverse mix designs that maximize durability while reducing carbon emissions.';
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, y);
  y += splitIntro.length * 4.2 + 4;

  // Section 2: What the AI Does in this Application
  checkPageBreak(40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('2. WHAT THE ARTIFICIAL INTELLIGENCE (AI) DOES', margin, y);
  y += 5;

  const aiPoints = [
    '• Generative Civil Engineering Assistant: Uses the server-side Gemini foundation model grounded in material science to diagnose mix issues, predict slump loss, and evaluate workability.',
    '• Standards & Code Grounding: Interprets live ML predictions against Indian Standard (IS 456 Table 5, IS 10262) and ACI 211 durability benchmarks for aggressive marine, sulfate, and freeze-thaw exposures.',
    '• Natural Language Explanations: Translates complex mathematical models into actionable guidance for site batching engineers, explaining why specific w/b ratios cause strength drops or bleeding.',
    '• Interactive Sensitivity Diagnostics: Answers complex engineering queries regarding secondary C-S-H formation, aggregate interlock, and optimal superplasticizer dosages.',
  ];

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  for (const pt of aiPoints) {
    const lines = doc.splitTextToSize(pt, contentWidth);
    checkPageBreak(lines.length * 4);
    doc.text(lines, margin, y);
    y += lines.length * 3.8 + 1.5;
  }
  y += 4;

  // Section 3: What Machine Learning (ML) Does in this Application
  checkPageBreak(50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('3. WHAT THE MACHINE LEARNING (ML) ALGORITHMS DO', margin, y);
  y += 5;

  const mlPoints = [
    '• Multi-Variable Regression Modeling: Captures complex non-linear interactions across 8 physical parameters (Cement, Blast Furnace Slag, Fly Ash, Water, Superplasticizer, Coarse Aggregate, Fine Aggregate, Age).',
    '• Random Forest Regressor (Ensemble Bagging): Trains 80–120 de-correlated CART decision trees using bootstrap aggregating. Reduces prediction variance and prevents overfitting.',
    '• Gradient Tree Boosting (Sequential Boosting): Iteratively fits shallow regression trees on negative gradients (residuals) of previous stages with learning rate shrinkage (eta = 0.1), minimizing Mean Squared Error.',
    '• Empirical Verification of Abrams\' Law: Confirms the fundamental civil engineering rule: compressive strength fc decreases inversely as water-to-cementitious ratio increases, moderated by superplasticizer dispersion.',
    '• Permutation Feature Importance: Empirically measures drop in R² when shuffling features. Accurately identifies Cement, Age, and Water as the primary physical drivers.',
  ];

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  for (const pt of mlPoints) {
    const lines = doc.splitTextToSize(pt, contentWidth);
    checkPageBreak(lines.length * 4);
    doc.text(lines, margin, y);
    y += lines.length * 3.8 + 1.5;
  }
  y += 4;

  // Section 4: What the Artificial Neural Network (ANN) Does
  checkPageBreak(55);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('4. WHAT THE ARTIFICIAL NEURAL NETWORK (ANN) DOES', margin, y);
  y += 5;

  const annPoints = [
    '• Multi-Layer Perceptron (MLP) Architecture: 8 Input Neurons (standardized via Z-score) -> Dense Hidden Layer 1 (20 units with ReLU activation) -> Dense Hidden Layer 2 (12 units with ReLU) -> 1 Output Linear Neuron.',
    '• Non-Linear Activation Mapping: ReLU(z) = max(0, z) enables the network to learn intricate threshold interactions, such as delayed strength activation from Fly Ash and Slag pozzolanic reactions.',
    '• Backpropagation & Adam Optimizer: Computes exact gradients via the chain rule (dL/dW, dL/db) and updates weights using first and second moment moving averages with learning rate alpha = 0.01.',
    '• Continuous Response Surface: Unlike step-wise decision trees, the trained ANN establishes a smooth, differentiable manifold across the entire 8-dimensional material space, enabling fine inverse optimization.',
  ];

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  for (const pt of annPoints) {
    const lines = doc.splitTextToSize(pt, contentWidth);
    checkPageBreak(lines.length * 4);
    doc.text(lines, margin, y);
    y += lines.length * 3.8 + 1.5;
  }
  y += 4;

  // Section 5: Current Trained Model Benchmark & Metrics
  checkPageBreak(45);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('5. ACTIVE MODEL EVALUATION & VALIDATION METRICS', margin, y);
  y += 5;

  if (activeModel) {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 22, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 22, 'S');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Active Model: ${activeModel.name}`, margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      `Test R²: ${activeModel.metrics.r2}   |   Test MAE: ${activeModel.metrics.mae} MPa   |   Test RMSE: ${activeModel.metrics.rmse} MPa`,
      margin + 4,
      y + 12
    );
    doc.text(
      `Train R²: ${activeModel.metrics.trainR2}   |   Generalization Gap: ${(activeModel.metrics.trainR2 - activeModel.metrics.r2).toFixed(3)}   |   Residual Std: ${activeModel.metrics.residualStd} MPa`,
      margin + 4,
      y + 17
    );

    y += 26;

    // Feature Importances
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Feature Importance Ranking:', margin, y);
    y += 4;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const impStr = activeModel.featureImportances
      .map((f, i) => `${i + 1}. ${f.name} (${f.percentage}%)`)
      .join('   ·   ');
    const splitImp = doc.splitTextToSize(impStr, contentWidth);
    doc.text(splitImp, margin, y);
    y += splitImp.length * 4 + 4;
  } else {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No model currently trained in this session.', margin, y);
    y += 8;
  }

  // Section 6: Descriptive Statistics of UCI Dataset #165
  checkPageBreak(50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('6. DATASET DESCRIPTIVE STATISTICS (UCI #165)', margin, y);
  y += 5;

  const stats = calculateSummaryStats(samples);

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 5, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Variable Name', margin + 2, y + 3.8);
  doc.text('Unit', margin + 55, y + 3.8);
  doc.text('Mean', margin + 80, y + 3.8);
  doc.text('Std Dev', margin + 105, y + 3.8);
  doc.text('Min', margin + 130, y + 3.8);
  doc.text('Max', margin + 155, y + 3.8);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  for (let i = 0; i < stats.length; i++) {
    checkPageBreak(5);
    const s = stats[i];
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 0.5, contentWidth, 4.5, 'F');
    }
    doc.text(s.name, margin + 2, y + 3);
    doc.text(s.unit || '-', margin + 55, y + 3);
    doc.text(s.mean.toString(), margin + 80, y + 3);
    doc.text(s.std.toString(), margin + 105, y + 3);
    doc.text(s.min.toString(), margin + 130, y + 3);
    doc.text(s.max.toString(), margin + 155, y + 3);
    y += 4.5;
  }
  y += 4;

  // Section 7: Mandatory Civil Engineering Safety Notice
  checkPageBreak(30);
  doc.setFillColor(254, 242, 242);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setDrawColor(252, 165, 165);
  doc.rect(margin, y, contentWidth, 20, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('MANDATORY STRUCTURAL & COMPLIANCE DISCLAIMER', margin + 4, y + 5.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 29, 29);
  const disclaimer =
    'All numerical predictions and optimized mix proportions generated by this laboratory platform are probabilistic estimates intended solely for research, academic evaluation, and preliminary trial proportioning. Physical laboratory trial batches, standard moist curing (28 days), and cube/cylinder compression tests complying with IS 516 / ASTM C39 supervised by a licensed professional civil engineer remain strictly mandatory before commercial batching or site structural casting.';
  const splitDisc = doc.splitTextToSize(disclaimer, contentWidth - 8);
  doc.text(splitDisc, margin + 4, y + 10.5);

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Axiom Lab · Report ID: AXIOM-${Date.now().toString().slice(-6)} · Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Trigger browser download
  const filename = `Axiom_Lab_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
