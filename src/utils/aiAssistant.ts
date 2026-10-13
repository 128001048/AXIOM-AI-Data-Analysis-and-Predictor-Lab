import { TrainedModel, solveConcreteMix } from './mlEngine';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const SUGGESTED_QUESTIONS = [
  'I want to design a mix for a column that needs 40 MPa at 28 days with 300 kg cement, 1000 kg coarse aggregate, and 800 kg fine aggregate. How much water & superplasticizer? Can we pour based purely on AI?',
  'Explain Abrams’ water-cement ratio law and how it connects to the dataset.',
  'What do R², MAE, and RMSE tell us about concrete strength prediction models?',
  'How was the model trained and tested to prevent data leakage and overfitting?',
  'What is the pozzolanic effect of Fly Ash and GGBS on early vs. long-term strength?',
  'What are the IS 456:2000 durability requirements for minimum cement and maximum w/c ratio?',
];

// Offline knowledge base
const OFFLINE_KNOWLEDGE = [
  {
    triggers: ['abram', 'w/c', 'water cement', 'water-cement', 'wc ratio', 'water ratio'],
    answer: `**Abrams’ Law (1918):**
Abrams' law states that for fully compacted fresh concrete, compressive strength is inversely and exponentially related to the water-cement (w/c) ratio:
$$f_c = \\frac{A}{B^{w/c}}$$
where $A$ and $B$ are empirical constants. Excess mixing water beyond that needed for cement hydration leaves behind interconnected capillary pores after drying. Higher capillary porosity drastically weakens the hardened paste. In our UCI #165 dataset, water vs. compressive strength exhibits a strong negative Pearson correlation, validating Abrams' law statistically. 

*Practical note:* Modern high-performance concrete uses superplasticizers to lower w/c to 0.30–0.40 while preserving workability.`,
  },
  {
    triggers: ['fly ash', 'slag', 'ggbs', 'pfa', 'pozzolan', 'supplementary', 'scm'],
    answer: `**Supplementary Cementitious Materials (SCMs):**
1. **Fly Ash (Class F):** Pozzolanic material containing reactive siliceous glass. It reacts with free calcium hydroxide ($Ca(OH)_2$) liberated during cement hydration to form secondary calcium-silicate-hydrate ($C-S-H$) gel. This reduces heat of hydration and pore size, but delays early strength (≤7 days) while boosting 56–365 day strength.
2. **Blast Furnace Slag (GGBS):** Latent hydraulic binder that hydrates in the presence of alkali activators. It refines the gel pore network, drastically improving chloride and sulphate resistance.

In the model, SCMs interact strongly with the **Age** feature: their relative strength contribution increases markedly past 28 days.`,
  },
  {
    triggers: ['superplasticizer', 'plasticizer', 'admixture', 'sp', 'water reducer'],
    answer: `**Superplasticizers (High-Range Water Reducers):**
Superplasticizers (typically polycarboxylate ethers - PCE or sulfonated naphthalene formaldehydes - SNF) adsorb onto cement particles and introduce electrostatic and steric repulsion. This deflocculates the agglomerated cement grains, releasing trapped mixing water.

**Key benefits in mix design:**
- Enables a 15% to 30% reduction in mixing water without losing slump (workability).
- Lowers the w/c ratio down to 0.32–0.40, achieving M40–M60+ compressive strengths.
- Typical dosage ranges between 0.4% to 2.5% of binder mass. Overdosing can cause severe segregation, bleeding, and set retardation.`,
  },
  {
    triggers: ['r2', 'mae', 'rmse', 'metric', 'accuracy', 'evaluation'],
    answer: (metrics?: any) => {
      const active = metrics
        ? `\n\n**Current Trained Model Metrics:**\n- **Test R²:** ${metrics.r2} (explains ${Math.round(metrics.r2 * 100)}% of compressive strength variance)\n- **Test MAE:** ${metrics.mae} MPa (average deviation per prediction)\n- **Test RMSE:** ${metrics.rmse} MPa (heavily penalizes outlier errors)\n- **Train R²:** ${metrics.trainR2}`
        : '';
      return `**Model Evaluation Metrics in Civil Engineering:**
1. **R² (Coefficient of Determination):** Measures the proportion of variance in compressive strength explained by the mix features. $R^2 > 0.85$ indicates strong predictive capability on concrete trial data.
2. **MAE (Mean Absolute Error, in MPa):** Average absolute difference between predicted and actual cube strength. An MAE under 3.5–4.5 MPa is within standard laboratory testing scatter (IS 516 permits ~5% within-batch variation).
3. **RMSE (Root Mean Squared Error, in MPa):** Penalizes larger forecasting errors more severely than MAE. A small difference between RMSE and MAE indicates consistent error distribution without extreme outliers.${active}`;
    },
  },
  {
    triggers: ['overfit', 'generaliz', 'train test', 'split', 'seed', 'leakage'],
    answer: `**Data Splitting & Overfitting Prevention:**
- **80/20 Train-Test Split:** The dataset (1030 samples) is divided into 824 training records and 206 unseen test records using a fixed pseudo-random seed (default: 42) for scientific reproducibility.
- **Data Leakage Prevention:** Z-score normalization parameters (means $\\mu$ and standard deviations $\\sigma$) are fitted strictly on the training partition and then applied to the test partition.
- **Generalization Gap:** Monitored via $(\\text{Train } R^2 - \\text{Test } R^2)$. A gap under 0.08 indicates healthy generalization; a gap $> 0.15$ signals tree depth overfitting or excessive neural network training epochs.`,
  },
  {
    triggers: ['durab', 'exposure', 'is 456', 'code', 'standard', 'table 5', 'limit'],
    answer: `**IS 456:2000 Durability Requirements (Table 5):**
For plain and reinforced concrete exposed to environmental attack:
- **Mild Exposure:** Max w/c = 0.55, Min Cement = 250 kg/m³
- **Moderate Exposure:** Max w/c = 0.50, Min Cement = 300 kg/m³
- **Severe Exposure:** Max w/c = 0.45, Min Cement = 320 kg/m³
- **Very Severe Exposure:** Max w/c = 0.40, Min Cement = 340 kg/m³
- **Extreme Exposure (Tidal/Marine):** Max w/c = 0.40, Min Cement = 360 kg/m³

ConcreteIQ Lab checks every mix solution against these boundaries to guarantee durable structural design.`,
  },
  {
    triggers: ['safe', 'rely', 'pour', 'trust', 'only on ai', 'decision', 'mandat'],
    answer: `**CRITICAL CIVIL ENGINEERING NOTICE:**
Under **NO circumstances** should concrete be batched or poured for permanent civil structures based solely on machine learning predictions.

**Why Laboratory Testing is Mandatory:**
1. **Material Specificity:** Real cements have varying C3S/C2S contents, and sand fineness modulus differs across quarries.
2. **Environmental Effects:** Ambient temperature, relative humidity, mixing energy, and compaction vibrator efficiency directly influence in-situ strength.
3. **Legal & Code Compliance:** Standards (IS 456, IS 10262, IS 516, ACI 318, Eurocode 2) mandate certified cube/cylinder laboratory trial mixes and quality control testing before structural approval.

AI models provide valuable decision-support and trial optimization, but a licensed civil engineer remains solely responsible.`,
  },
];

function extractNumber(text: string, keyword: string): number | null {
  const regex = new RegExp(`(?:${keyword})[^\\d]{0,25}(\\d+(?:\\.\\d+)?)`, 'i');
  const match = text.match(regex);
  if (match) return parseFloat(match[1]);

  const revRegex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:kg|mpa)?\\s*(?:of\\s*)?(?:${keyword})`, 'i');
  const revMatch = text.match(revRegex);
  if (revMatch) return parseFloat(revMatch[1]);

  return null;
}

export function parseNaturalMixQuery(
  text: string,
  model?: TrainedModel | null
): string | null {
  const isMixQuery =
    (text.toLowerCase().includes('water') ||
      text.toLowerCase().includes('mix') ||
      text.toLowerCase().includes('design') ||
      text.toLowerCase().includes('column') ||
      text.toLowerCase().includes('superplasticizer')) &&
    /\d/.test(text);

  if (!isMixQuery) return null;

  const target = extractNumber(text, 'mpa|strength|target');
  const cement = extractNumber(text, 'cement');
  const slag = extractNumber(text, 'slag|ggbs') || 0;
  const flyAsh = extractNumber(text, 'fly\\s*ash|pfa') || 0;
  const coarse = extractNumber(text, 'coarse') || 973;
  const fine = extractNumber(text, 'fine|sand') || 774;

  if (!target || !cement) return null;

  if (!model) {
    return `### Concrete Mix Query Detected
- **Target Strength:** ${target} MPa
- **Cement:** ${cement} kg/m³
${slag > 0 ? `- **Blast Furnace Slag:** ${slag} kg/m³\n` : ''}${flyAsh > 0 ? `- **Fly Ash:** ${flyAsh} kg/m³\n` : ''}- **Coarse Aggregate:** ${coarse} kg/m³
- **Fine Aggregate:** ${fine} kg/m³

*Note:* Please click **"Train Model"** in the **Model Lab** tab first so that ConcreteIQ Lab can solve the response surface with your trained regressor!`;
  }

  const solution = solveConcreteMix(model, target, cement, slag, flyAsh, coarse, fine, 28);

  return `### AI Mix Design Recommendation (Inverse ML Solver)
Based on the trained ${model.name} response surface:

- **Target 28-Day Strength:** ${target} MPa
- **Cement Content:** ${cement} kg/m³
${slag > 0 ? `- **Blast Furnace Slag:** ${slag} kg/m³\n` : ''}${flyAsh > 0 ? `- **Fly Ash:** ${flyAsh} kg/m³\n` : ''}- **Total Cementitious Material:** ${solution.totalBinder} kg/m³
- **Recommended Water:** **${solution.water} L/m³**
- **Recommended Superplasticizer:** **${solution.superplasticizer} kg/m³** (${solution.spPercentage}% of binder mass)
- **Achieved Predicted Strength:** **${solution.achievedStrength} MPa**
- **Water-to-Binder (w/b) Ratio:** **${solution.wbRatio}** (w/c: ${solution.wcRatio})
- **IS 456 Durability Exposure:** ${solution.exposureSuitability}

**Engineering Rationale:**
The solver minimizes mixing water to restrict capillary porosity (per Abrams' Law), while adjusting superplasticizer dosage to ensure flowability and full compaction without bleeding. Supplementary cementitious materials reduce heat of hydration and densify the C-S-H microstructure.

⚠️ **MANDATORY SAFETY DISCLAIMER:**
AI-generated proportions are statistical estimates for preliminary trial design. **Laboratory trial mixes (IS 10262) and 28-day cube crushing tests (IS 516) are mandatory** prior to any structural batching or pouring.`;
}

export async function askAssistant(
  prompt: string,
  model: TrainedModel | null,
  history: ChatMessage[]
): Promise<string> {
  // First check if it's an explicit mix design query
  const mixAnswer = parseNaturalMixQuery(prompt, model);
  if (mixAnswer) {
    return mixAnswer;
  }

  // Try calling the full-stack server-side Gemini API
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        modelMetrics: model ? { ...model.metrics, modelName: model.name } : null,
        history: history.slice(-6).map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          text: m.content,
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.response) {
        return data.response;
      }
    }
  } catch (err) {
    console.warn('Server-side Gemini request failed, using civil engineering expert engine:', err);
  }

  // Fallback to built-in civil engineering knowledge base
  const lower = prompt.toLowerCase();
  for (const entry of OFFLINE_KNOWLEDGE) {
    if (entry.triggers.some((tr) => lower.includes(tr))) {
      const ans =
        typeof entry.answer === 'function'
          ? entry.answer(model ? model.metrics : undefined)
          : entry.answer;
      return `${ans}\n\n*Note: AI outputs are for decision support only. Laboratory validation per IS 516 is mandatory before site implementation.*`;
    }
  }

  return `I am the ConcreteIQ Civil Engineering Specialist. I can assist you with:

1. **Concrete Mix Proportions & Inverse Design:** e.g., "How much water and superplasticizer for a 40 MPa column with 300 kg cement?"
2. **Hydration & Durability Principles:** Abrams' Law, Gel-Space ratio, C-S-H formation, curing age kinetics, and IS 456:2000 exposure criteria.
3. **Admixtures & SCMs:** Polycarboxylate ether superplasticizers, GGBS, and Fly Ash pozzolanic reactions.
4. **Machine Learning Model Diagnostics:** R², MAE, RMSE, train-test splitting, feature importance rankings, and overfitting diagnostics.

*Disclaimer: AI predictions are decision-support estimates only. Field implementation mandates laboratory trial mixes and cube compressive testing per IS 516 / IS 10262.*`;
}
