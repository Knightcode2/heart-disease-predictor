// ============================================================
// Cardiovascular Risk Prediction — app.js
// Rewritten for the cardio_train model.
//
// Fields sent to /api/predict:
//   age (years int), gender ("Male"/"Female"),
//   height (cm), weight (kg),
//   ap_hi (systolic), ap_lo (diastolic),
//   cholesterol (1/2/3), gluc (1/2/3),
//   smoke (0/1), alco (0/1), active (0/1)
//
// REMOVED: heartRate, bloodSugar slider, stressLevel,
//   familyHistory, diabetes(yes/no), obesity, angina, chestPain
// ============================================================

// Page loader
window.addEventListener("load", function () {
    const loader = document.getElementById("pageLoader");
    setTimeout(() => {
        loader.style.opacity = "0";
        loader.style.transition = "opacity 0.5s";
        setTimeout(() => { loader.style.display = "none"; }, 500);
    }, 400);
});

// Animated risk counter
function animateRisk(target) {
    const el = document.getElementById("riskPercentage");
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 60));
    const iv = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current + "%";
        if (current >= target) clearInterval(iv);
    }, 18);
}

// Recommendations renderer
function displayRecommendations(recs) {
    const c = document.getElementById("recommendations");
    c.innerHTML = "<ul>" + recs.map(r => "<li>" + r + "</li>").join("") + "</ul>";
}

// BMI helpers
function calcBMI(h, w) {
    if (!h || !w) return null;
    return w / Math.pow(h / 100, 2);
}
function bmiCategory(bmi) {
    if (bmi < 18.5) return { label: "Underweight", cls: "bmi-under" };
    if (bmi < 25)   return { label: "Normal",      cls: "bmi-normal" };
    if (bmi < 30)   return { label: "Overweight",  cls: "bmi-over" };
    return               { label: "Obese",         cls: "bmi-obese" };
}
function updateBMI() {
    const h = parseFloat(document.getElementById("height").value);
    const w = parseFloat(document.getElementById("weight").value);
    const bmi = calcBMI(h, w);
    if (!bmi) return;
    const cat   = bmiCategory(bmi);
    const valEl = document.getElementById("bmiValue");
    const catEl = document.getElementById("bmiCategory");
    const box   = document.getElementById("bmiDisplay");
    valEl.textContent = bmi.toFixed(1);
    catEl.textContent = cat.label;
    box.className     = "bmi-display " + cat.cls;
}

// Main predictor class
class CardioPredictor {
    constructor() {
        this.form           = document.getElementById("predictionForm");
        this.resultsSection = document.getElementById("resultsSection");
        this.predictBtn     = document.getElementById("predictBtn");
        this.resetBtn       = document.getElementById("resetBtn");
        this.loadingSpinner = document.getElementById("loadingSpinner");

        this.initTheme();
        this.initSliders();
        this.initEventListeners();
    }

    initTheme() {
        const btn = document.getElementById("themeTab");
        if (!btn) return;
        const apply = mode => {
            document.documentElement.setAttribute("data-color-scheme", mode);
            btn.textContent = mode === "dark" ? "🌞" : "🌙";
            btn.setAttribute("aria-pressed", mode === "dark" ? "true" : "false");
            localStorage.setItem("color-scheme", mode);
        };
        const saved = localStorage.getItem("color-scheme");
        const sys   = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        apply(saved || (sys ? "dark" : "light"));
        btn.addEventListener("click", () => {
            const cur = document.documentElement.getAttribute("data-color-scheme") || "light";
            apply(cur === "dark" ? "light" : "dark");
        });
    }

    initSliders() {
        const sliders = [
            { id: "age",    displayId: "ageValue"    },
            { id: "height", displayId: "heightValue" },
            { id: "weight", displayId: "weightValue" },
            { id: "ap_hi",  displayId: "apHiValue"   },
            { id: "ap_lo",  displayId: "apLoValue"   },
        ];

        sliders.forEach(s => {
            const slider = document.getElementById(s.id);
            const disp   = document.getElementById(s.displayId);
            if (!slider || !disp) return;

            disp.textContent = slider.value;
            slider.addEventListener("input", e => {
                disp.textContent = e.target.value;
                if (s.id === "height" || s.id === "weight") updateBMI();
            });

            // Click to type exact number
            disp.style.cursor = "pointer";
            disp.title = "Click to type exact value";
            disp.addEventListener("click", () => {
                const inp     = document.createElement("input");
                inp.type      = "number";
                inp.value     = slider.value;
                inp.min       = slider.min;
                inp.max       = slider.max;
                inp.style.width = "64px";
                disp.replaceWith(inp);
                inp.focus();
                const commit = () => {
                    let v = parseFloat(inp.value);
                    v = Math.max(parseFloat(inp.min), Math.min(parseFloat(inp.max), v));
                    if (isNaN(v)) v = parseFloat(slider.value);
                    slider.value     = v;
                    inp.replaceWith(disp);
                    disp.textContent = v;
                    if (s.id === "height" || s.id === "weight") updateBMI();
                };
                inp.addEventListener("blur",    commit);
                inp.addEventListener("keydown", ev => { if (ev.key === "Enter") inp.blur(); });
            });
        });
        updateBMI();
    }

    initEventListeners() {
        this.form.addEventListener("submit", e => { e.preventDefault(); this.predict(); });
        this.resetBtn.addEventListener("click", () => this.reset());
    }

    collectData() {
        const el  = id => document.getElementById(id);
        const rv  = name => { const r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : null; };
        return {
            age:         parseInt(el("age").value,    10),
            gender:      rv("gender"),
            height:      parseFloat(el("height").value),
            weight:      parseFloat(el("weight").value),
            ap_hi:       parseInt(el("ap_hi").value,  10),
            ap_lo:       parseInt(el("ap_lo").value,  10),
            cholesterol: parseInt(el("cholesterol").value, 10),
            gluc:        parseInt(el("gluc").value,   10),
            smoke:       parseInt(rv("smoke")  || "0", 10),
            alco:        parseInt(rv("alco")   || "0", 10),
            active:      parseInt(rv("active") || "1", 10),
        };
    }

    validate(d) {
        if (!d.gender) { alert("Please select a gender."); return false; }
        if (d.ap_hi <= d.ap_lo) {
            alert("Systolic BP must be greater than diastolic BP.");
            return false;
        }
        return true;
    }

    async predict() {
        const data = this.collectData();
        if (!this.validate(data)) return;
        this.setLoading(true);
        let result = null;
        try {
            const res = await fetch(window.location.origin + "/api/predict", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(data),
            });
            if (!res.ok) throw new Error("HTTP " + res.status);
            result = await res.json();
        } catch (err) {
            result = {
                risk_percentage: "--",
                risk_category:   "Error",
                color:           "#ef4444",
                recommendations: ["Could not reach prediction server: " + err.message],
            };
        }
        this.setLoading(false);
        this.showResults(result);
    }

    showResults(result) {
        const pctEl = document.getElementById("riskPercentage");
        const catEl = document.getElementById("riskCategory");
        const disp  = document.getElementById("riskDisplay");

        const pct = parseFloat(result.risk_percentage);
        if (!isNaN(pct)) {
            animateRisk(Math.round(pct));
        } else {
            pctEl.textContent = result.risk_percentage;
        }

        catEl.textContent = result.risk_category;
        disp.className    = "risk-display";
        if      (result.risk_category === "Low Risk")      disp.classList.add("risk-low");
        else if (result.risk_category === "Moderate Risk") disp.classList.add("risk-moderate");
        else                                               disp.classList.add("risk-high");

        if (Array.isArray(result.recommendations)) {
            displayRecommendations(result.recommendations);
        } else {
            document.getElementById("recommendations").innerHTML = "<p>" + (result.recommendations || "") + "</p>";
        }

        const sec = document.getElementById("resultsSection");
        sec.classList.remove("hidden");
        sec.scrollIntoView({ behavior: "smooth" });
    }

    setLoading(on) {
        const txt = document.querySelector(".btn-text");
        this.predictBtn.disabled = on;
        txt.textContent = on ? "Analysing…" : "Predict Risk";
        this.loadingSpinner.classList.toggle("hidden", !on);
    }

    reset() {
        this.form.reset();
        const defaults    = { age: 45, height: 165, weight: 70, ap_hi: 120, ap_lo: 80 };
        const displayMap  = { age: "ageValue", height: "heightValue", weight: "weightValue", ap_hi: "apHiValue", ap_lo: "apLoValue" };
        Object.entries(defaults).forEach(([id, val]) => {
            const el = document.getElementById(id);
            const dp = document.getElementById(displayMap[id]);
            if (el) el.value = val;
            if (dp) dp.textContent = val;
        });
        updateBMI();
        document.getElementById("resultsSection").classList.add("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

// Patient tabs
class PatientManager {
    constructor(formId) {
        this.form     = document.getElementById(formId);
        this.tabsCont = document.getElementById("patientTabs");
        this.addBtn   = document.getElementById("addPatientBtn");
        this.patients = [];
        this.activeId = null;
        if (this.addBtn) this.addBtn.addEventListener("click", () => this.add());
        this.add("Patient 1");
    }

    add(name) {
        const id = "p" + Date.now();
        this.patients.push({ id, name: name || ("Patient " + (this.patients.length + 1)), data: {} });
        this.render();
        this.activate(id);
    }

    render() {
        if (!this.tabsCont) return;
        this.tabsCont.innerHTML = "";
        this.patients.forEach(p => {
            const el = document.createElement("div");
            el.className = "patient-tab" + (p.id === this.activeId ? " active" : "");
            const lbl = document.createElement("span");
            lbl.textContent = p.name;
            lbl.style.cursor = "pointer";
            lbl.addEventListener("click", ev => {
                ev.stopPropagation();
                const inp = document.createElement("input");
                inp.type = "text"; inp.value = p.name; inp.style.width = "90px";
                lbl.replaceWith(inp); inp.focus();
                inp.addEventListener("blur", () => { p.name = inp.value || p.name; this.render(); });
                inp.addEventListener("keydown", ev2 => { if (ev2.key === "Enter") inp.blur(); });
            });
            el.appendChild(lbl);
            if (this.patients.length > 1) {
                const x = document.createElement("button");
                x.className = "remove-patient"; x.type = "button"; x.title = "Remove"; x.textContent = "✂";
                x.addEventListener("click", ev => { ev.stopPropagation(); this.remove(p.id); });
                el.appendChild(x);
            }
            el.addEventListener("click", () => this.activate(p.id));
            this.tabsCont.appendChild(el);
        });
    }

    activate(id) {
        if (this.activeId) this.save(this.activeId);
        this.activeId = id;
        this.load(id);
        this.render();
    }

    save(id) {
        const p = this.patients.find(x => x.id === id);
        if (!p) return;
        const fd = new FormData(this.form);
        const d = {};
        for (const [k, v] of fd.entries()) d[k] = v;
        p.data = d;
    }

    load(id) {
        const p = this.patients.find(x => x.id === id);
        if (!p) return;
        this.form.reset();
        const d = p.data || {};
        for (const [k, v] of Object.entries(d)) {
            const el = this.form.elements[k];
            if (!el) continue;
            if (el.type === "radio") {
                this.form.querySelectorAll('input[name="' + k + '"]').forEach(r => { r.checked = (r.value === v); });
            } else {
                el.value = v;
            }
        }
        ["age","height","weight","ap_hi","ap_lo"].forEach(sid => {
            const s = document.getElementById(sid);
            const dispMap = { age: "ageValue", height: "heightValue", weight: "weightValue", ap_hi: "apHiValue", ap_lo: "apLoValue" };
            const dp = document.getElementById(dispMap[sid]);
            if (s && dp) dp.textContent = s.value;
        });
        updateBMI();
    }

    remove(id) {
        const idx = this.patients.findIndex(x => x.id === id);
        if (idx === -1) return;
        this.patients.splice(idx, 1);
        this.patients.forEach((p, i) => { p.name = "Patient " + (i + 1); });
        if (this.activeId === id) {
            if (this.patients.length > 0) {
                this.activate(this.patients[Math.max(0, idx - 1)].id);
            } else {
                this.add();
            }
        } else {
            this.render();
        }
    }
}

// Tooltips
const TIPS = {
    age:    "Age range in this model: 30–65 years",
    height: "Enter height in centimetres (130–207 cm)",
    weight: "Enter weight in kilograms (40–200 kg)",
    ap_hi:  "Systolic (top) blood pressure. Normal < 120 mmHg",
    ap_lo:  "Diastolic (lower) blood pressure. Normal < 80 mmHg",
};
document.addEventListener("DOMContentLoaded", () => {
    Object.entries(TIPS).forEach(([id, tip]) => {
        const el = document.getElementById(id);
        if (el) el.title = tip;
    });
});

// Boot
document.addEventListener("DOMContentLoaded", () => {
    new CardioPredictor();
    window.patientManager = new PatientManager("predictionForm");
});
