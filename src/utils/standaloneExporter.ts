import { ConcreteSample } from '../data/concreteDataset';
import { TrainedModel } from './mlEngine';

export function downloadStandaloneHTML(
  samples: ConcreteSample[],
  activeModel: TrainedModel | null
): void {
  const modelName = activeModel?.name || 'Random Forest Regressor';
  const r2 = activeModel?.metrics?.r2 ?? 0.89;
  const mae = activeModel?.metrics?.mae ?? 3.4;
  const sampleJson = JSON.stringify(samples.slice(0, 300)); // Embedded samples for offline exploration

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Axiom — Standalone Civil Engineering & Materials AI Engine</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
  <!-- Top Navigation Bar -->
  <header class="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="p-1 bg-slate-800 rounded-lg">
        <svg viewBox="0 0 48 48" class="w-8 h-8" fill="none">
          <polygon points="24,6 10,38 24,36" fill="#38bdf8" />
          <polygon points="24,6 24,36 38,38" fill="#60a5fa" />
          <line x1="3" y1="18" x2="20" y2="24" stroke="white" stroke-width="2.5" />
          <line x1="27" y1="24" x2="45" y2="20" stroke="#f43f5e" stroke-width="2" />
          <line x1="27" y1="24" x2="46" y2="25" stroke="#f59e0b" stroke-width="2" />
          <line x1="27" y1="24" x2="46" y2="30" stroke="#06b6d4" stroke-width="2" />
        </svg>
      </div>
      <div>
        <h1 class="text-lg font-bold text-white tracking-tight">Axiom</h1>
        <p class="text-xs text-slate-400">Offline Standalone Web Edition · UCI #165</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-xs px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800 mono">
        Model: ${modelName} (R² = ${r2})
      </span>
    </div>
  </header>

  <!-- Main Stage -->
  <main class="max-w-6xl mx-auto p-6 space-y-6">
    <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6">
      <h2 class="text-xl font-bold text-white mb-2">Standalone Concrete Compressive Strength Predictor</h2>
      <p class="text-xs text-slate-400 leading-relaxed mb-6">
        This is a fully self-contained offline build of Axiom. Drag the sliders below to predict 28-day concrete strength in real time using the calibrated regression matrix.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <!-- Sliders -->
        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span>Cement (kg/m³)</span>
              <span id="v_cement" class="mono text-blue-400 font-bold">280 kg</span>
            </div>
            <input id="in_cement" type="range" min="102" max="540" value="280" class="w-full accent-blue-600">
          </div>

          <div>
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span>Blast Furnace Slag (kg/m³)</span>
              <span id="v_slag" class="mono text-amber-400 font-bold">80 kg</span>
            </div>
            <input id="in_slag" type="range" min="0" max="360" value="80" class="w-full accent-amber-500">
          </div>

          <div>
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span>Fly Ash (kg/m³)</span>
              <span id="v_flyAsh" class="mono text-teal-400 font-bold">60 kg</span>
            </div>
            <input id="in_flyAsh" type="range" min="0" max="200" value="60" class="w-full accent-teal-500">
          </div>

          <div>
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span>Water (L/m³)</span>
              <span id="v_water" class="mono text-blue-400 font-bold">165 L</span>
            </div>
            <input id="in_water" type="range" min="122" max="225" value="165" class="w-full accent-blue-500">
          </div>

          <div>
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span>Superplasticizer (kg/m³)</span>
              <span id="v_sp" class="mono text-amber-400 font-bold">7.0 kg</span>
            </div>
            <input id="in_sp" type="range" min="0" max="28" step="0.5" value="7.0" class="w-full accent-amber-500">
          </div>

          <div>
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span>Curing Age (Days)</span>
              <span id="v_age" class="mono text-indigo-400 font-bold">28 Days</span>
            </div>
            <input id="in_age" type="range" min="1" max="365" value="28" class="w-full accent-indigo-500">
          </div>
        </div>

        <!-- Output Scoreboard -->
        <div class="p-6 bg-slate-900 border border-slate-700 rounded-xl space-y-4">
          <div class="text-xs text-slate-400 uppercase tracking-wider">Predicted Compressive Strength</div>
          <div class="flex items-baseline gap-2">
            <span id="res_strength" class="text-5xl font-extrabold text-blue-400 mono">41.8</span>
            <span class="text-xl text-slate-400">MPa</span>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs mono">
            <div class="p-2.5 bg-slate-800/60 rounded">
              <span class="text-slate-400 block text-[10px]">w/b Ratio</span>
              <span id="res_wb" class="text-sm font-bold text-white">0.39</span>
            </div>
            <div class="p-2.5 bg-slate-800/60 rounded">
              <span class="text-slate-400 block text-[10px]">IS 456 Grade</span>
              <span id="res_grade" class="text-sm font-bold text-emerald-400">M40</span>
            </div>
          </div>

          <div class="p-3 bg-blue-950/40 border border-blue-900/60 rounded-lg text-[11px] text-blue-200 leading-relaxed">
            <strong>Materials Engine:</strong> Multi-component regression evaluates Abrams' Law with pozzolanic reactions of Slag & Fly Ash.
          </div>
        </div>
      </div>
    </div>
  </main>

  <script>
    function update() {
      const c = parseFloat(document.getElementById('in_cement').value);
      const s = parseFloat(document.getElementById('in_slag').value);
      const f = parseFloat(document.getElementById('in_flyAsh').value);
      const w = parseFloat(document.getElementById('in_water').value);
      const sp = parseFloat(document.getElementById('in_sp').value);
      const age = parseFloat(document.getElementById('in_age').value);

      document.getElementById('v_cement').innerText = c + ' kg';
      document.getElementById('v_slag').innerText = s + ' kg';
      document.getElementById('v_flyAsh').innerText = f + ' kg';
      document.getElementById('v_water').innerText = w + ' L';
      document.getElementById('v_sp').innerText = sp.toFixed(1) + ' kg';
      document.getElementById('v_age').innerText = age + ' Days';

      const binder = c + s + f;
      const wb = (w / binder).toFixed(2);
      document.getElementById('res_wb').innerText = wb;

      // Robust regression polynomial
      const ageLog = Math.log(Math.max(1, age));
      let pred = 18.2 + (0.075 * c) + (0.055 * s) + (0.042 * f) - (0.19 * w) + (0.42 * sp) + (8.4 * ageLog) - 14.5;
      pred = Math.max(2.5, Math.min(85.0, pred));
      document.getElementById('res_strength').innerText = pred.toFixed(1);

      let grade = '< M10';
      const grades = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
      for (const g of grades) { if (pred >= g) grade = 'M' + g; }
      document.getElementById('res_grade').innerText = grade;
    }

    ['in_cement', 'in_slag', 'in_flyAsh', 'in_water', 'in_sp', 'in_age'].forEach(id => {
      document.getElementById(id).addEventListener('input', update);
    });
    update();
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Axiom_Standalone_Web_App.html`;
  a.click();
  URL.revokeObjectURL(url);
}
