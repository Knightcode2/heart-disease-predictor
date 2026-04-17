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

const heightUnitCurrent = document.getElementById("heightUnitCurrent");
const weightUnitCurrent = document.getElementById("weightUnitCurrent");
const heightUnitBtn     = document.getElementById("heightUnitBtn");
const weightUnitBtn     = document.getElementById("weightUnitBtn");
const heightUnitMenu    = document.getElementById("heightUnitMenu");
const weightUnitMenu    = document.getElementById("weightUnitMenu");
const radarTitle        = document.getElementById("radarTitle");

const modelStatusToast = document.getElementById("modelStatusToast");
const toastIcon        = document.getElementById("toastIcon");
const toastTitle       = document.getElementById("toastTitle");
const toastMsg         = document.getElementById("toastMsg");

const metricPopupBackdrop = document.getElementById("metricPopupBackdrop");
const metricPopupCard     = document.getElementById("metricPopupCard");
const metricPopupContent  = document.getElementById("metricPopupContent");
const metricPopupClose    = document.getElementById("metricPopupClose");

let gaugeChart    = null;
let radarChart    = null;
let currentColor  = "#3b82f6";
let lastChartData = null;
let heightInCm    = true;
let weightInKg    = true;

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
themeToggle.addEventListener("click", () => {
  applyTheme(!isDark);
  // Re-resolve CSS variable colours for sliders after theme switch
  updateSliderBadge(cholEl, cholBadge, CHOL_LABELS);
  updateSliderBadge(glucEl, glucBadge, GLUC_LABELS);
});
applyTheme(localStorage.getItem("cardio_theme") === "light" ? false : true);

// ══════════════════════════════════════════════════════
// SECRET HEART CLICK — 5 clicks in 2 seconds
// ══════════════════════════════════════════════════════
const brandIcon = document.querySelector(".brand-icon");
let heartClicks = [];
let toastTimeout = null;

brandIcon.style.cursor = "pointer";
brandIcon.addEventListener("click", () => {
  const now = Date.now();
  heartClicks.push(now);
  // Keep only clicks within the last 2 seconds
  heartClicks = heartClicks.filter(t => now - t <= 2000);
  if (heartClicks.length >= 5) {
    heartClicks = [];
    checkModelStatus();
  }
});

async function checkModelStatus() {
  try {
    const res  = await fetch("/api/health");
    const data = await res.json();
    if (data.model_loaded) {
      showToast("✅", "Model Status", "Model is loaded and ready!", "toast-success");
    } else {
      showToast("❌", "Model Status", "Model is NOT loaded.", "toast-error");
    }
  } catch {
    showToast("⚠️", "Model Status", "Could not reach server to check model.", "toast-error");
  }
}

function showToast(icon, title, msg, cls) {
  if (toastTimeout) clearTimeout(toastTimeout);
  toastIcon.textContent  = icon;
  toastTitle.textContent = title;
  toastMsg.textContent   = msg;
  modelStatusToast.className = "model-status-toast " + cls;
  modelStatusToast.style.display = "flex";
  modelStatusToast.style.animation = "toastSlideIn .35s ease forwards";

  toastTimeout = setTimeout(() => {
    modelStatusToast.style.animation = "toastSlideOut .35s ease forwards";
    setTimeout(() => { modelStatusToast.style.display = "none"; }, 350);
  }, 3000);
}

// ══════════════════════════════════════════════════════
// UNIT CONVERSION — Dropdown  (cm ↔ ft)  (kg ↔ lb)
// ══════════════════════════════════════════════════════

// Toggle dropdown menu open/close
heightUnitBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  weightUnitMenu.classList.remove("open");
  heightUnitMenu.classList.toggle("open");
});
weightUnitBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  heightUnitMenu.classList.remove("open");
  weightUnitMenu.classList.toggle("open");
});

// Close dropdowns when clicking outside
document.addEventListener("click", () => {
  heightUnitMenu.classList.remove("open");
  weightUnitMenu.classList.remove("open");
});

// Height unit selection
heightUnitMenu.querySelectorAll(".unit-option").forEach(opt => {
  opt.addEventListener("click", (e) => {
    e.stopPropagation();
    const unit = opt.dataset.unit;
    const val = parseFloat(heightEl.value);

    if (unit === "ft" && heightInCm) {
      if (val && val > 0) {
        const totalInches = val / 2.54;
        heightEl.value = parseFloat((totalInches / 12).toFixed(2));
      }
      heightUnitCurrent.textContent = "ft";
      heightEl.min = 3; heightEl.max = 8.2; heightEl.step = 0.01;
      heightEl.placeholder = "e.g. 5.58";
      heightInCm = false;
    } else if (unit === "cm" && !heightInCm) {
      if (val && val > 0) {
        heightEl.value = Math.round(val * 12 * 2.54);
      }
      heightUnitCurrent.textContent = "cm";
      heightEl.min = 100; heightEl.max = 250; heightEl.step = 1;
      heightEl.placeholder = "e.g. 170";
      heightInCm = true;
    }

    // Update active state
    heightUnitMenu.querySelectorAll(".unit-option").forEach(o => o.classList.remove("active"));
    opt.classList.add("active");
    heightUnitMenu.classList.remove("open");
    updateBMI();
  });
});

// Weight unit selection
weightUnitMenu.querySelectorAll(".unit-option").forEach(opt => {
  opt.addEventListener("click", (e) => {
    e.stopPropagation();
    const unit = opt.dataset.unit;
    const val = parseFloat(weightEl.value);

    if (unit === "lb" && weightInKg) {
      if (val && val > 0) {
        weightEl.value = parseFloat((val * 2.20462).toFixed(1));
      }
      weightUnitCurrent.textContent = "lb";
      weightEl.min = 44; weightEl.max = 660; weightEl.step = 0.1;
      weightEl.placeholder = "e.g. 165";
      weightInKg = false;
    } else if (unit === "kg" && !weightInKg) {
      if (val && val > 0) {
        weightEl.value = parseFloat((val / 2.20462).toFixed(1));
      }
      weightUnitCurrent.textContent = "kg";
      weightEl.min = 20; weightEl.max = 300; weightEl.step = 0.1;
      weightEl.placeholder = "e.g. 75";
      weightInKg = true;
    }

    weightUnitMenu.querySelectorAll(".unit-option").forEach(o => o.classList.remove("active"));
    opt.classList.add("active");
    weightUnitMenu.classList.remove("open");
    updateBMI();
  });
});

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
// Always stores height in cm and weight in kg regardless of display unit
function readForm() {
  let h = parseFloat(heightEl.value) || null;
  let w = parseFloat(weightEl.value) || null;
  // Convert to canonical units (cm / kg) before saving
  if (h !== null && !heightInCm) h = Math.round(h * 12 * 2.54);
  if (w !== null && !weightInKg) w = parseFloat((w / 2.20462).toFixed(1));
  return {
    age_years:   parseFloat(ageEl.value)    || null,
    gender:      parseInt(genderEl.value)   || null,
    height:      h,
    weight:      w,
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
    chip.className = "patient-chip" + (p.id === activePatient ? " active" : "") + (p.result ? " assessed" : "");
    chip.dataset.id = p.id;
    chip.title = p.name;

    const nameSpan = document.createElement("span");
    nameSpan.className = "patient-chip-name";
    nameSpan.textContent = p.name;

    // Green tick shown only when patient has a prediction result
    const tickSpan = document.createElement("span");
    tickSpan.className = "patient-chip-tick";
    tickSpan.textContent = "✓";
    tickSpan.style.display = p.result ? "" : "none";

    const removeBtn = document.createElement("button");
    removeBtn.className = "patient-chip-remove";
    removeBtn.innerHTML = "✕";
    removeBtn.title = "Remove patient";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removePatient(p.id);
    });

    chip.appendChild(nameSpan);
    chip.appendChild(tickSpan);
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
  // Resolve live CSS variable colours — inline styles cannot use CSS vars
  const cs    = getComputedStyle(document.documentElement);
  const green = (cs.getPropertyValue("--green").trim()) || "#22c55e";
  const amber = (cs.getPropertyValue("--amber").trim()) || "#f59e0b";
  const red   = (cs.getPropertyValue("--red").trim())   || "#ef4444";
  const track = (cs.getPropertyValue("--slider-track").trim()) || "#334155";
  const color = val === 1 ? green : val === 2 ? amber : red;
  const pct   = ((val - 1) / 2) * 100;
  slider.style.background =
    `linear-gradient(to right, ${color} ${pct}%, ${track} ${pct}%)`;
}

cholEl.addEventListener("input", () => updateSliderBadge(cholEl, cholBadge, CHOL_LABELS));
glucEl.addEventListener("input", () => updateSliderBadge(glucEl, glucBadge, GLUC_LABELS));

// Initial state
updateSliderBadge(cholEl, cholBadge, CHOL_LABELS);
updateSliderBadge(glucEl, glucBadge, GLUC_LABELS);

// ══════════════════════════════════════════════════════
// LIVE BMI  (handles both cm and ft input)
// ══════════════════════════════════════════════════════
function getHeightCm() {
  const val = parseFloat(heightEl.value);
  if (isNaN(val) || val <= 0) return null;
  return heightInCm ? val : (val * 12 * 2.54);
}

function getWeightKg() {
  const val = parseFloat(weightEl.value);
  if (isNaN(val) || val <= 0) return null;
  return weightInKg ? val : (val / 2.20462);
}

function computeBMI() {
  const h = getHeightCm();
  const w = getWeightKg();
  if (!h || !w || h < 50 || w < 10) return null;
  return w / ((h / 100) ** 2);
}

function updateBMI() {
  const bmi = computeBMI();
  if (bmi === null) { bmiPreview.style.display = "none"; return; }
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

  // Always send in cm/kg to the API
  const heightCm = getHeightCm();
  const weightKg = getWeightKg();

  const payload = {
    age_years:   parseFloat(ageEl.value),
    gender:      parseInt(genderEl.value),
    height:      heightCm,
    weight:      weightKg,
    ap_hi:       parseFloat(apHiEl.value),
    ap_lo:       parseFloat(apLoEl.value),
    cholesterol: parseInt(cholEl.value),
    gluc:        parseInt(glucEl.value),
    smoke:       parseInt(smokeEl.value),
    alco:        parseInt(alcoEl.value),
    active:      parseInt(activeEl.value),
  };

  try {
    // Debug: uncomment to verify smoke/alco values
    // console.log("[CardioRisk] Payload:", payload);
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
  const heightCmVal = getHeightCm();
  const weightKgVal = getWeightKg();
  const bmi = (data.bmi !== undefined && data.bmi !== null) ? data.bmi : "–";

  // BMI category
  let bmiCatStr = "–";
  let bmiColorVar = "var(--sub)";
  if (typeof bmi === "number") {
    if      (bmi < 18.5) { bmiCatStr = "Underweight"; bmiColorVar = "#60a5fa"; }
    else if (bmi < 25)   { bmiCatStr = "Normal";      bmiColorVar = "var(--green)"; }
    else if (bmi < 30)   { bmiCatStr = "Overweight";  bmiColorVar = "var(--amber)"; }
    else                 { bmiCatStr = "Obese";        bmiColorVar = "var(--red)"; }
  }
  const bmiNum = (typeof bmi === "number") ? bmi : null;

  // Pulse pressure category
  let ppCatStr = "–";
  let ppColorVar = "var(--sub)";
  if (typeof pp === "number") {
    if      (pp < 40)  { ppCatStr = "Low";      ppColorVar = "#60a5fa"; }
    else if (pp <= 60) { ppCatStr = "Normal";   ppColorVar = "var(--green)"; }
    else               { ppCatStr = "Elevated"; ppColorVar = "var(--red)"; }
  }

  // ── Build BMI detail HTML (for popup) ──────────────
  function buildBmiDetail(bmiVal) {
    if (bmiVal === null) return null;
    const avgBmi = 22.0;
    const barMin = 15, barMax = 40;
    const yourPct = Math.min(100, Math.max(0, ((bmiVal - barMin) / (barMax - barMin)) * 100));
    const avgPct  = ((avgBmi - barMin) / (barMax - barMin)) * 100;
    const barGradient = `linear-gradient(to right, #60a5fa 0%, #60a5fa 14%, var(--green) 14%, var(--green) 40%, var(--amber) 40%, var(--amber) 60%, var(--red) 60%, var(--red) 100%)`;

    return `
      <div class="metric-detail-title">📊 Body Mass Index (BMI)</div>
      <div class="metric-detail-section">
        <strong>What is BMI?</strong><br>
        BMI (Body Mass Index) is a medical screening tool that estimates body fat based on height and weight. Doctors use it to identify weight categories that may increase the risk of heart disease, diabetes, and other conditions.
      </div>
      <div class="metric-detail-section">
        <strong>Your BMI: ${bmiVal.toFixed(1)}</strong> — <span style="color:${bmiColorVar};font-weight:700">${bmiCatStr}</span><br>
        Height: ${heightCmVal ? heightCmVal.toFixed(0) : '–'} cm · Weight: ${weightKgVal ? weightKgVal.toFixed(1) : '–'} kg
      </div>
      <div class="metric-detail-section">
        <strong>Where you stand vs healthy average:</strong>
        <div class="metric-detail-bar">
          <div class="metric-bar-track" style="background:${barGradient};height:8px">
            <div class="metric-bar-marker" style="left:${avgPct}%;background:var(--green);width:2px;height:14px;top:-3px" title="Healthy avg"></div>
            <div class="metric-bar-marker" style="left:${yourPct}%;background:var(--text)" title="You"></div>
          </div>
        </div>
        <div class="metric-bar-labels">
          <span>15 (Under)</span>
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>40 (Obese)</span>
        </div>
        <div class="metric-detail-note">▲ White = You (${bmiVal.toFixed(1)}) &nbsp;|&nbsp; 🟢 Green = Healthy avg (${avgBmi})</div>
      </div>
      <div class="metric-detail-section">
        <strong>BMI Ranges:</strong><br>
        • < 18.5 — Underweight<br>
        • 18.5–24.9 — Normal weight<br>
        • 25–29.9 — Overweight<br>
        • ≥ 30 — Obese
      </div>
      <div class="metric-detail-note">BMI does not directly measure body fat. Athletes with high muscle mass may have a high BMI without excess fat. Consult a healthcare provider for a complete assessment.</div>
    `;
  }

  // ── Build Pulse Pressure detail HTML (for popup) ───
  function buildPpDetail(ppVal) {
    if (typeof ppVal !== "number") return null;
    const avgPp = 40;
    const barMin = 20, barMax = 100;
    const yourPct = Math.min(100, Math.max(0, ((ppVal - barMin) / (barMax - barMin)) * 100));
    const avgPct  = ((avgPp - barMin) / (barMax - barMin)) * 100;
    const barGradient = `linear-gradient(to right, #60a5fa 0%, #60a5fa 25%, var(--green) 25%, var(--green) 50%, var(--red) 50%, var(--red) 100%)`;

    return `
      <div class="metric-detail-title">💓 Pulse Pressure</div>
      <div class="metric-detail-section">
        <strong>What is Pulse Pressure?</strong><br>
        Pulse pressure is the difference between systolic (top number) and diastolic (bottom number) blood pressure. It reflects the force each heartbeat generates and the stiffness of your arteries.
      </div>
      <div class="metric-detail-section">
        <strong>Your PP: ${ppVal} mmHg</strong> — <span style="color:${ppColorVar};font-weight:700">${ppCatStr}</span><br>
        Systolic: ${parseFloat(apHiEl.value)} mmHg · Diastolic: ${parseFloat(apLoEl.value)} mmHg
      </div>
      <div class="metric-detail-section">
        <strong>Where you stand vs healthy average:</strong>
        <div class="metric-detail-bar">
          <div class="metric-bar-track" style="background:${barGradient};height:8px">
            <div class="metric-bar-marker" style="left:${avgPct}%;background:var(--green);width:2px;height:14px;top:-3px" title="Healthy avg"></div>
            <div class="metric-bar-marker" style="left:${yourPct}%;background:var(--text)" title="You"></div>
          </div>
        </div>
        <div class="metric-bar-labels">
          <span>20 (Low)</span>
          <span>40</span>
          <span>60</span>
          <span>80</span>
          <span>100+ (High)</span>
        </div>
        <div class="metric-detail-note">▲ White = You (${ppVal}) &nbsp;|&nbsp; 🟢 Green = Healthy avg (${avgPp})</div>
      </div>
      <div class="metric-detail-section">
        <strong>PP Ranges:</strong><br>
        • < 40 mmHg — Low (may indicate heart valve issues)<br>
        • 40–60 mmHg — Normal / Healthy<br>
        • > 60 mmHg — Elevated (increased cardiovascular risk)
      </div>
      <div class="metric-detail-note">A consistently wide pulse pressure (>60) is associated with increased risk of heart disease and stroke, especially in older adults.</div>
    `;
  }

  // Store detail HTML for popup
  const bmiDetailHtml = buildBmiDetail(bmiNum);
  const ppDetailHtml  = buildPpDetail(pp);

  const metricDefs = [
    { val: (typeof bmi === 'number') ? bmi.toFixed(1) : '–', lbl: "BMI",
      cls: "",
      popupHtml: bmiDetailHtml },
    { val: data.icon, lbl: data.risk_category,
      cls: "risk-box", color: data.color,
      popupHtml: null },
    { val: pp + (pp !== "–" ? " mmHg" : ""), lbl: "Pulse Pressure",
      cls: "",
      popupHtml: ppDetailHtml },
  ];

  metricDefs.forEach(m => {
    const box = document.createElement("div");
    box.className = "metric-box " + m.cls + (m.popupHtml ? " clickable-metric" : "");
    if (m.color) box.style.setProperty("--risk-color", m.color);
    const infoIcon = m.popupHtml ? `<span class="metric-info-icon">i</span>` : "";
    const hintHtml = m.popupHtml ? `<div class="metric-hover-hint">click for details</div>` : "";
    box.innerHTML = `${infoIcon}<div class="metric-val">${m.val}</div><div class="metric-lbl">${m.lbl}</div>${hintHtml}`;
    if (m.popupHtml) {
      box.addEventListener("click", (e) => {
        e.stopPropagation();
        openMetricPopup(m.popupHtml);
      });
    }
    metricsRow.appendChild(box);
  });

  // Radar — update title with patient name
  const patientName = activePatient ? (patients.find(p => p.id === activePatient)?.name || "Patient") : "Patient";
  radarTitle.textContent = `${patientName} vs Healthy Norms`;
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

  // ── Full-screen risk glow ─────────────────────────
  triggerScreenGlow(data.risk_category);

  // ── Refresh chip tick for active patient ──────────
  renderPatientList();
}

// ══════════════════════════════════════════════════════
// METRIC POPUP MODAL
// ══════════════════════════════════════════════════════
function openMetricPopup(html) {
  metricPopupContent.innerHTML = html;
  metricPopupBackdrop.style.display = "flex";
}

function closeMetricPopup() {
  metricPopupBackdrop.style.display = "none";
  metricPopupContent.innerHTML = "";
}

metricPopupClose.addEventListener("click", closeMetricPopup);
metricPopupBackdrop.addEventListener("click", (e) => {
  if (e.target === metricPopupBackdrop) closeMetricPopup();
});

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
// FULL-SCREEN GLOW
// ══════════════════════════════════════════════════════
function triggerScreenGlow(riskCategory) {
  // Remove any existing glow overlay
  const existing = document.getElementById("screenGlowOverlay");
  if (existing) existing.remove();

  const isRed   = riskCategory === "High Risk";
  const isGreen = riskCategory === "Low Risk";
  const isAmber = riskCategory === "Moderate Risk";
  const duration = isGreen ? 1000 : (isRed ? 1500 : 1100);  // ms

  let shadowStyle;
  if (isRed)        shadowStyle = "box-shadow:inset 0 0 120px 60px rgba(180,20,20,0.65)";
  else if (isAmber)  shadowStyle = "box-shadow:inset 0 0 100px 50px rgba(200,100,0,0.50)";
  else               shadowStyle = "box-shadow:inset 0 0 100px 50px rgba(34,197,94,0.45)";

  const overlay = document.createElement("div");
  overlay.id = "screenGlowOverlay";
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "pointer-events:none",
    "z-index:9999",
    "opacity:0",
    shadowStyle,
    "transition:opacity 0.15s ease"
  ].join(";");

  document.body.appendChild(overlay);

  // Fade in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { overlay.style.opacity = "1"; });
  });

  // Peak at 30% of duration, fade out for the rest
  const peakTime = duration * 0.30;
  setTimeout(() => {
    overlay.style.transition = `opacity ${duration * 0.70}ms ease`;
    overlay.style.opacity = "0";
  }, peakTime);

  // Remove from DOM after full animation
  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, duration + 50);
}

// ══════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════
loadDefaults();
renderPatientList();
