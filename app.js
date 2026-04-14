"use strict";
/* ═══════════════════════════════════════════════════════
   CardioRisk — Frontend JS
   ═══════════════════════════════════════════════════════ */

// ── DOM refs ──────────────────────────────────────────
const form         = document.getElementById("cardioForm");
const predictBtn   = document.getElementById("predictBtn");
const predictIcon  = document.getElementById("predictIcon");
const predictLabel = document.getElementById("predictLabel");
const placeholder  = document.getElementById("placeholder");
const resultCard   = document.getElementById("resultCard");
const errorCard    = document.getElementById("errorCard");
const errorMsg     = document.getElementById("errorMsg");

const gaugePct       = document.getElementById("gaugePct");
const gaugeCat       = document.getElementById("gaugeCat");
const metricsRow     = document.getElementById("metricsRow");
const recsList       = document.getElementById("recsList");
const disclaimerText = document.getElementById("disclaimerText");

const ageEl    = document.getElementById("age_years");
const heightEl = document.getElementById("height");
const weightEl = document.getElementById("weight");
const apHiEl   = document.getElementById("ap_hi");
const apLoEl   = document.getElementById("ap_lo");
const genderEl = document.getElementById("gender");
const smokeEl  = document.getElementById("smoke");
const alcoEl   = document.getElementById("alco");
const activeEl = document.getElementById("active");
const cholEl   = document.getElementById("cholesterol");
const glucEl   = document.getElementById("gluc");

const bmiPreview = document.getElementById("bmiPreview");
const bmiValue   = document.getElementById("bmiValue");
const bmiCat     = document.getElementById("bmiCat");
const bpHint     = document.getElementById("bpHint");
const formSub    = document.getElementById("formSub");

const cholBadge  = document.getElementById("cholBadge");
const glucBadge  = document.getElementById("glucBadge");

const predictOverlay = document.getElementById("predictOverlay");

let gaugeChart    = null;
let radarChart    = null;
let currentColor  = "#3b82f6";
let lastChartData = null;

// ══════════════════════════════════════════════════════
// THEME TOGGLE
// ══════════════════════════════════════════════════════
const themeToggle = document.getElementById("themeToggle");
const themeIcon   = document.getElementById("themeIcon");
const themeLabel  = document.getElementById("themeLabel");
let isDark = true;

function applyTheme(dark) {
  isDark = dark;
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  themeIcon.textContent  = dark ? "🌙" : "☀️";
  themeLabel.textContent = dark ? "Dark Mode" : "Light Mode";
  localStorage.setItem("cardio_theme", dark ? "dark" : "light");
  if (resultCard.style.display !== "none") {
    const pctNow = parseFloat(gaugePct.textContent) || 0;
    renderGauge(pctNow, currentColor);
    if (lastChartData) renderRadar(lastChartData);
  }
}
themeToggle.addEventListener("click", () => applyTheme(!isDark));
applyTheme(localStorage.getItem("cardio_theme") === "light" ? false : true);

// ══════════════════════════════════════════════════════
// PATIENT STATE
// ══════════════════════════════════════════════════════
/*
  patients = [{
    id:       number,
    name:     string,
    formData: { age_years, gender, height, weight, ap_hi, ap_lo,
                cholesterol, gluc, smoke, alco, active } | null,
    result:   prediction result object | null
  }]
*/
let patients      = [];
let activePatient = null;

// ── Save current form values into the active patient ──
function saveActivePatientData() {
  if (!activePatient) return;
  const p = patients.find(p => p.id === activePatient);
  if (!p) return;
  p.formData = readForm();
}

// ── Restore form + result for a patient ───────────────
function loadPatientData(id) {
  const p = patients.find(p => p.id === id);
  if (!p) return;

  if (p.formData) {
    setForm(p.formData);
  } else {
    // Fresh patient: load defaults
    loadDefaults();
  }

  if (p.result) {
    showResult(p.result, false);
  } else {
    placeholder.style.display = "block";
    resultCard.style.display  = "none";
    errorCard.style.display   = "none";
  }

  // Update form subtitle to show patient name
  formSub.innerHTML = `Editing data for <strong>${p.name}</strong>`;
}

// ── Read all form fields into a plain object ──────────
function readForm() {
  return {
    age_years:   parseFloat(ageEl.value)    || null,
    gender:      parseInt(genderEl.value)   || null,
    height:      parseFloat(heightEl.value) || null,
    weight:      parseFloat(weightEl.value) || null,
    ap_hi:       parseFloat(apHiEl.value)   || null,
    ap_lo:       parseFloat(apLoEl.value)   || null,
    cholesterol: parseInt(cholEl.value),
    gluc:        parseInt(glucEl.value),
    smoke:       parseInt(smokeEl.value),
    alco:        parseInt(alcoEl.value),
    active:      parseInt(activeEl.value),
  };
}

// ── Write a plain object back into all form fields ────
function setForm(d) {
  if (d.age_years !== null && d.age_years !== undefined) ageEl.value    = d.age_years;
  if (d.gender    !== null && d.gender    !== undefined) genderEl.value = d.gender;
  if (d.height    !== null && d.height    !== undefined) heightEl.value = d.height;
  if (d.weight    !== null && d.weight    !== undefined) weightEl.value = d.weight;
  if (d.ap_hi     !== null && d.ap_hi     !== undefined) apHiEl.value   = d.ap_hi;
  if (d.ap_lo     !== null && d.ap_lo     !== undefined) apLoEl.value   = d.ap_lo;
  cholEl.value  = d.cholesterol ?? 1;
  glucEl.value  = d.gluc        ?? 1;
  smokeEl.value = d.smoke       ?? 0;
  alcoEl.value  = d.alco        ?? 0;
  activeEl.value= d.active      ?? 1;
  updateBMI();
  updateBPHint();
  updateSliderBadge(cholEl,  cholBadge,  CHOL_LABELS);
  updateSliderBadge(glucEl,  glucBadge,  GLUC_LABELS);
}

// ── Patient list rendering ─────────────────────────────
const patientList  = document.getElementById("patientList");
const patientEmpty = document.getElementById("patientEmpty");

function renderPatientList() {
  patientList.querySelectorAll(".patient-chip").forEach(c => c.remove());

  if (patients.length === 0) {
    patientEmpty.style.display = "";
    return;
  }
  patientEmpty.style.display = "none";

  patients.forEach(p => {
    const chip = document.createElement("div");
    chip.className = "patient-chip" + (p.id === activePatient ? " active" : "");
    chip.dataset.id = p.id;
    chip.title = p.name;

    const nameSpan = document.createElement("span");
    nameSpan.className = "patient-chip-name";
    nameSpan.textContent = p.name;

    const removeBtn = document.createElement("button");
    removeBtn.className = "patient-chip-remove";
    removeBtn.innerHTML = "✕";
    removeBtn.title = "Remove patient";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removePatient(p.id);
    });

    chip.appendChild(nameSpan);
    chip.appendChild(removeBtn);

    chip.addEventListener("click", () => {
      // Save current patient's form before switching
      saveActivePatientData();
      setActivePatient(p.id);
      loadPatientData(p.id);
    });

    patientList.appendChild(chip);
  });
}

function setActivePatient(id) {
  activePatient = id;
  document.querySelectorAll(".patient-chip").forEach(chip => {
    chip.classList.toggle("active", Number(chip.dataset.id) === id);
  });
}

function addPatient(name) {
  name = name.trim();
  if (!name) return;
  // Save current active patient's data first
  saveActivePatientData();

  const id = Date.now();
  patients.push({ id, name, formData: null, result: null });
  renderPatientList();
  setActivePatient(id);
  loadPatientData(id);   // loads defaults for new patient
}

function removePatient(id) {
  patients = patients.filter(p => p.id !== id);
  if (activePatient === id) {
    activePatient = patients.length ? patients[patients.length - 1].id : null;
    if (activePatient) {
      loadPatientData(activePatient);
    } else {
      // No patients left — reset form sub
      formSub.innerHTML = `Fill in all fields, then click <strong>Assess Risk</strong>.`;
      placeholder.style.display = "block";
      resultCard.style.display  = "none";
    }
  }
  renderPatientList();
}

// ── Modal ──────────────────────────────────────────────
const btnAddPatient    = document.getElementById("btnAddPatient");
const patientModal     = document.getElementById("patientModal");
const patientNameInput = document.getElementById("patientNameInput");
const cancelPatient    = document.getElementById("cancelPatient");
const confirmPatient   = document.getElementById("confirmPatient");

btnAddPatient.addEventListener("click", () => {
  patientNameInput.value = "";
  patientModal.style.display = "flex";
  setTimeout(() => patientNameInput.focus(), 60);
});

cancelPatient.addEventListener("click", () => { patientModal.style.display = "none"; });

confirmPatient.addEventListener("click", () => {
  const name = patientNameInput.value.trim();
  if (!name) { patientNameInput.focus(); return; }
  addPatient(name);
  patientModal.style.display = "none";
});

patientNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter")  confirmPatient.click();
  if (e.key === "Escape") patientModal.style.display = "none";
});

patientModal.addEventListener("click", (e) => {
  if (e.target === patientModal) patientModal.style.display = "none";
});

// ══════════════════════════════════════════════════════
// LAB SLIDERS
// ══════════════════════════════════════════════════════
const CHOL_LABELS = ["Normal", "Above Normal", "Well Above Normal"];
const GLUC_LABELS = ["Normal", "Above Normal", "Well Above Normal"];

function updateSliderBadge(slider, badge, labels) {
  const val = parseInt(slider.value);
  badge.textContent = labels[val - 1];
  badge.className   = "slider-badge" + (val >= 3 ? " level-3" : val === 2 ? " level-2" : "");
  // Update slider fill colour via gradient
  const pct = ((val - 1) / 2) * 100;
  const color = val === 1 ? "var(--green)" : val === 2 ? "var(--amber)" : "var(--red)";
  slider.style.background =
    `linear-gradient(to right, ${color} ${pct}%, var(--slider-track) ${pct}%)`;
}

cholEl.addEventListener("input", () => updateSliderBadge(cholEl, cholBadge, CHOL_LABELS));
glucEl.addEventListener("input", () => updateSliderBadge(glucEl, glucBadge, GLUC_LABELS));

// Initial state
updateSliderBadge(cholEl, cholBadge, CHOL_LABELS);
updateSliderBadge(glucEl, glucBadge, GLUC_LABELS);

// ══════════════════════════════════════════════════════
// LIVE BMI
// ══════════════════════════════════════════════════════
function updateBMI() {
  const h = parseFloat(heightEl.value);
  const w = parseFloat(weightEl.value);
  if (!h || !w || h < 100 || w < 20) { bmiPreview.style.display = "none"; return; }
  const bmi = w / ((h / 100) ** 2);
  bmiValue.textContent = bmi.toFixed(1);
  if      (bmi < 18.5) { bmiCat.textContent = "Underweight"; bmiValue.style.color = "#60a5fa"; }
  else if (bmi < 25)   { bmiCat.textContent = "Normal";      bmiValue.style.color = "var(--green)"; }
  else if (bmi < 30)   { bmiCat.textContent = "Overweight";  bmiValue.style.color = "var(--amber)"; }
  else                 { bmiCat.textContent = "Obese";        bmiValue.style.color = "var(--red)"; }
  bmiPreview.style.display = "flex";
}
heightEl.addEventListener("input", updateBMI);
weightEl.addEventListener("input", updateBMI);

// ══════════════════════════════════════════════════════
// LIVE BP HINT
// ══════════════════════════════════════════════════════
function updateBPHint() {
  const hi = parseFloat(apHiEl.value);
  const lo = parseFloat(apLoEl.value);
  if (!hi || !lo) { bpHint.textContent = ""; bpHint.className = "bp-hint"; return; }
  if (hi <= lo)   { bpHint.textContent = "⚠️ Systolic must be greater than diastolic."; bpHint.className = "bp-hint danger"; return; }
  const pp = hi - lo;
  if      (hi >= 140) { bpHint.textContent = `Stage 2 hypertension · Pulse pressure ${pp} mmHg`; bpHint.className = "bp-hint danger"; }
  else if (hi >= 130) { bpHint.textContent = `Stage 1 hypertension · Pulse pressure ${pp} mmHg`; bpHint.className = "bp-hint warn"; }
  else if (hi >= 120) { bpHint.textContent = `Elevated BP · Pulse pressure ${pp} mmHg`; bpHint.className = "bp-hint warn"; }
  else                { bpHint.textContent = `Normal BP · Pulse pressure ${pp} mmHg`; bpHint.className = "bp-hint"; }
}
apHiEl.addEventListener("input", updateBPHint);
apLoEl.addEventListener("input", updateBPHint);

// ══════════════════════════════════════════════════════
// DEFAULTS
// ══════════════════════════════════════════════════════
async function loadDefaults() {
  try {
    const res  = await fetch("/api/defaults");
    const data = await res.json();
    setForm({
      age_years:   data.age_years   ?? 45,
      gender:      data.gender      ?? 2,
      height:      data.height      ?? 170,
      weight:      data.weight      ?? 75,
      ap_hi:       data.ap_hi       ?? 120,
      ap_lo:       data.ap_lo       ?? 80,
      cholesterol: data.cholesterol ?? 1,
      gluc:        data.gluc        ?? 1,
      smoke:       data.smoke       ?? 0,
      alco:        data.alco        ?? 0,
      active:      data.active      ?? 1,
    });
  } catch { /* ignore */ }
}

// ══════════════════════════════════════════════════════
// FORM VALIDATION
// ══════════════════════════════════════════════════════
function validate() {
  let ok = true;
  [ageEl, heightEl, weightEl, apHiEl, apLoEl, genderEl].forEach(el => {
    if (!el.value) { el.classList.add("invalid"); ok = false; }
    else           { el.classList.remove("invalid"); }
  });
  const hi = parseFloat(apHiEl.value), lo = parseFloat(apLoEl.value);
  if (hi && lo && hi <= lo) {
    apHiEl.classList.add("invalid"); apLoEl.classList.add("invalid"); ok = false;
  }
  return ok;
}

// ══════════════════════════════════════════════════════
// PREDICTION
// ══════════════════════════════════════════════════════
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validate()) return;
  setLoading(true);

  const payload = {
    age_years:   parseFloat(ageEl.value),
    gender:      parseInt(genderEl.value),
    height:      parseFloat(heightEl.value),
    weight:      parseFloat(weightEl.value),
    ap_hi:       parseFloat(apHiEl.value),
    ap_lo:       parseFloat(apLoEl.value),
    cholesterol: parseInt(cholEl.value),
    gluc:        parseInt(glucEl.value),
    smoke:       parseInt(smokeEl.value),
    alco:        parseInt(alcoEl.value),
    active:      parseInt(activeEl.value),
  };

  try {
    const res  = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) { showError(data.error); return; }

    // Save result on the active patient
    if (activePatient) {
      const p = patients.find(p => p.id === activePatient);
      if (p) { p.formData = readForm(); p.result = data; }
    }

    showResult(data, true);
  } catch (err) {
    showError("Could not reach the server: " + err.message);
  } finally {
    setLoading(false);
  }
});

// ══════════════════════════════════════════════════════
// RENDER RESULT
// ══════════════════════════════════════════════════════
function showResult(data, scroll) {
  placeholder.style.display = "none";
  errorCard.style.display   = "none";
  resultCard.style.display  = "block";

  const pct = data.risk_percentage;
  currentColor = data.color;

  gaugePct.textContent = pct + "%";
  gaugePct.style.color = data.color;
  gaugeCat.textContent = data.risk_category;

  renderGauge(pct, data.color);

  // Metrics row: BMI | Risk Level | Pulse Pressure
  metricsRow.innerHTML = "";
  const pp  = (parseFloat(apHiEl.value) - parseFloat(apLoEl.value)) || "–";
  const bmi = data.bmi ?? "–";

  const metricDefs = [
    { val: String(bmi),    lbl: "BMI",           cls: "" },
    { val: data.icon,      lbl: data.risk_category,
      cls: "risk-box",     color: data.color },
    { val: pp + (pp !== "–" ? " mmHg" : ""), lbl: "Pulse Pressure", cls: "" },
  ];

  metricDefs.forEach(m => {
    const box = document.createElement("div");
    box.className = "metric-box " + m.cls;
    if (m.color) box.style.setProperty("--risk-color", m.color);
    box.innerHTML = `<div class="metric-val">${m.val}</div><div class="metric-lbl">${m.lbl}</div>`;
    metricsRow.appendChild(box);
  });

  // Radar
  if (data.chart_data) { lastChartData = data.chart_data; renderRadar(data.chart_data); }

  // Recommendations
  recsList.innerHTML = "";
  (data.recommendations || []).forEach(rec => {
    const li = document.createElement("li");
    li.textContent = rec;
    recsList.appendChild(li);
  });

  disclaimerText.textContent = data.disclaimer || "";
  if (scroll) resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showError(msg) {
  placeholder.style.display = "none";
  resultCard.style.display  = "none";
  errorCard.style.display   = "block";
  errorMsg.textContent      = msg;
}

// ══════════════════════════════════════════════════════
// CHARTS
// ══════════════════════════════════════════════════════
function renderGauge(pct, color) {
  if (gaugeChart) { gaugeChart.destroy(); gaugeChart = null; }
  const trackColor = isDark ? "#273548" : "#e2e8f0";
  const ctx = document.getElementById("gaugeChart").getContext("2d");
  gaugeChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [pct, 100 - pct],
        backgroundColor: [color, trackColor],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      }]
    },
    options: {
      cutout: "72%",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { duration: 800, easing: "easeOutQuart" },
    }
  });
}

function renderRadar(cd) {
  if (radarChart) { radarChart.destroy(); radarChart = null; }
  const gridColor  = isDark ? "#334155" : "#e2e8f0";
  const labelColor = isDark ? "#94a3b8" : "#64748b";
  const ctx = document.getElementById("radarChart").getContext("2d");
  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: cd.labels,
      datasets: [
        {
          label: "You",
          data: cd.user,
          backgroundColor: "rgba(239,68,68,.2)",
          borderColor: "#ef4444",
          borderWidth: 2,
          pointBackgroundColor: "#ef4444",
          pointRadius: 4,
        },
        {
          label: "Healthy norm",
          data: cd.healthy,
          backgroundColor: "rgba(34,197,94,.15)",
          borderColor: "#22c55e",
          borderWidth: 2,
          pointBackgroundColor: "#22c55e",
          pointRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: labelColor, font: { size: 11 } } } },
      scales: {
        r: {
          min: 0, max: 100,
          backgroundColor: isDark ? "rgba(30,41,59,.5)" : "rgba(248,250,252,.8)",
          grid:        { color: gridColor },
          angleLines:  { color: gridColor },
          pointLabels: { color: labelColor, font: { size: 11 } },
          ticks:       { display: false },
        }
      },
      animation: { duration: 700 },
    }
  });
}

// ══════════════════════════════════════════════════════
// LOADING — PULSING HEART OVERLAY
// ══════════════════════════════════════════════════════
function setLoading(on) {
  predictBtn.disabled = on;
  predictOverlay.style.display = on ? "flex" : "none";

  if (on) {
    predictIcon.textContent  = "⏳";
    predictLabel.textContent = "Analysing…";
  } else {
    predictIcon.textContent  = "❤️";
    predictLabel.textContent = "Assess Cardiovascular Risk";
  }
}

// ══════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════
loadDefaults();
renderPatientList();
