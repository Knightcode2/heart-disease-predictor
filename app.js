// Fallback: Ensure slider values are shown on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const sliders = [
        { id: 'age', displayId: 'ageValue' },
        { id: 'cholesterol', displayId: 'cholesterolValue' },
        { id: 'bloodPressure', displayId: 'bloodPressureValue' },
        { id: 'heartRate', displayId: 'heartRateValue' },
        { id: 'bloodSugar', displayId: 'bloodSugarValue' },
        { id: 'exercise', displayId: 'exerciseValue' },
        { id: 'stress', displayId: 'stressValue' }
    ];
    sliders.forEach(slider => {
        const sliderElement = document.getElementById(slider.id);
        const displayElement = document.getElementById(slider.displayId);
        if (sliderElement && displayElement) {
            displayElement.textContent = sliderElement.value;
        }
    });
});
// Heart Disease Prediction App JavaScript

/* =========================================
REMOVE LOADER AFTER PAGE LOAD
Purpose:
Hide the loading animation once the website finishes loading
========================================= */

window.addEventListener("load", function () {

  const loader = document.getElementById("pageLoader");

  setTimeout(() => {
    loader.style.opacity = "0";
    loader.style.transition = "opacity 0.5s";

    setTimeout(() => {
      loader.style.display = "none";
    }, 500);

  }, 500); // delay for smoother experience
});


/* ==================================
RISK PERCENTAGE COUNTER ANIMATION
Place this in: app.js
================================== */

/*
Purpose:
Animates the risk percentage counting from 0 to the predicted value.
Example:
0% → 1% → 2% → ... → 65%

This makes the result feel dynamic and professional.
*/

function animateRisk(targetValue) {

  const element = document.getElementById("riskPercentage"); 
  let current = 0;

  const interval = setInterval(() => {

    current++;

    element.textContent = current + "%";

    if (current >= targetValue) {
      clearInterval(interval); // stop animation
    }

  }, 20); // animation speed
}

/*
Purpose:
Ensures recommendations appear as list items so CSS animation works.
*/
function displayRecommendations(recommendations) {

  const container = document.getElementById("recommendations");

  container.innerHTML = "<ul></ul>";

  const list = container.querySelector("ul");

  recommendations.forEach(text => {

    const li = document.createElement("li");
    li.textContent = text;

    list.appendChild(li);

  });

}

// Heart Disease Prediction App JavaScript

class HeartDiseasePredictor {
    constructor() {
        this.form = document.getElementById('predictionForm');
        this.resultsSection = document.getElementById('resultsSection');
        this.predictBtn = document.getElementById('predictBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.defaultValues = {};
        
        this.fetchDefaultValues()
            .then(() => {
                this.initializeEventListeners();
                this.initializeSliders();
            })
            .catch(error => {
                console.error('Error fetching default values:', error);
                // Initialize with empty values if fetch fails
                this.initializeEventListeners();
                this.initializeSliders();
            });
    }
    
    async fetchDefaultValues() {
        try {
            // Use absolute URL to ensure correct path
            const response = await fetch(window.location.origin + '/api/default_values');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.status === 'success') {
                this.defaultValues = data.default_values;
                console.log('Default values loaded:', this.defaultValues);
                this.populateFormWithDefaults();
            } else {
                console.error('Failed to load default values:', data.message);
            }
        } catch (error) {
            console.error('Error fetching default values:', error);
            // Don't throw error, just continue with empty defaults
            this.defaultValues = {};
        }
    }

    // Theme tab initialization moved here so it can be called during setup
    initThemeTab() {
        const themeTab = document.getElementById('themeTab');
        if (!themeTab) return;

        const applyTheme = (mode) => {
            if (mode === 'dark') {
                document.documentElement.setAttribute('data-color-scheme', 'dark');
                themeTab.textContent = '🌞';
                themeTab.setAttribute('aria-pressed', 'true');
            } else {
                document.documentElement.setAttribute('data-color-scheme', 'light');
                themeTab.textContent = '🌙';
                themeTab.setAttribute('aria-pressed', 'false');
            }
            localStorage.setItem('color-scheme', mode);
        };

        // Initialize from localStorage or prefer-dark
        const saved = localStorage.getItem('color-scheme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial = saved || (prefersDark ? 'dark' : 'light');
        applyTheme(initial);

        themeTab.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-color-scheme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    }
    
    populateFormWithDefaults() {
        // Only populate if we have default values
        if (!this.defaultValues || Object.keys(this.defaultValues).length === 0) {
            return;
        }
        
        // Set form field values from default values
        const defaults = this.defaultValues;
        
        // Set numeric input values
        document.getElementById('age').value = defaults.age || '';
        const cholesterolInput = document.getElementById('cholesterol');
        const heartRateInput = document.getElementById('heartRate');
        const bloodSugarInput = document.getElementById('bloodSugar');
        if (cholesterolInput) cholesterolInput.max = 400;
        if (heartRateInput) {
            heartRateInput.max = 120;
            // Change label to 'Resting Heart Rate'
            const heartRateLabel = document.querySelector("label[for='heartRate']");
        }
        if (bloodSugarInput) bloodSugarInput.max = 450;
        document.getElementById('cholesterol').value = defaults.cholesterol || '';
        document.getElementById('bloodPressure').value = defaults.bloodPressure || '';
        document.getElementById('heartRate').value = defaults.heartRate || '';
        document.getElementById('exercise').value = defaults.exerciseHours || '';
        document.getElementById('bloodSugar').value = defaults.bloodSugar || '';
        
        // Set sliders
        document.getElementById('stress').value = defaults.stressLevel || 1;
        
        // Set select dropdowns
        this.setSelectValue('smoking', defaults.smoking);
        this.setSelectValue('alcohol', defaults.alcoholIntake);
        this.setSelectValue('chestPain', defaults.chestPainType);
        
        // Set radio buttons
        this.setRadioValue('gender', defaults.gender);
        this.setRadioValue('familyHistory', defaults.familyHistory);
    // Set diabetes toggle to 'No' by default
    this.setRadioValue('diabetes', 'No');
        this.setRadioValue('obesity', defaults.obesity);
        this.setRadioValue('angina', defaults.exerciseInducedAngina);
    }
    
    setSelectValue(id, value) {
        const select = document.getElementById(id);
        if (select && value) {
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].value === value) {
                    select.selectedIndex = i;
                    break;
                }
            }
        }
    }
    
    setRadioValue(name, value) {
        if (value) {
            const radios = document.getElementsByName(name);
            for (let radio of radios) {
                if (radio.value === value) {
                    radio.checked = true;
                    break;
                }
            }
        }
    }

    initializeEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Reset button
        this.resetBtn.addEventListener('click', () => this.resetForm());
        
        // Slider value updates
        this.initializeSliders();
    }

    initializeSliders() {
        const sliders = [
            { id: 'age', displayId: 'ageValue', unit: 'years' },
            { id: 'cholesterol', displayId: 'cholesterolValue', unit: 'mg/dL' },
            { id: 'bloodPressure', displayId: 'bloodPressureValue', unit: 'mmHg' },
            { id: 'heartRate', displayId: 'heartRateValue', unit: 'bpm', label: 'Resting Heart Rate' },
            { id: 'bloodSugar', displayId: 'bloodSugarValue', unit: 'mg/dL' },
            { id: 'exercise', displayId: 'exerciseValue', unit: 'hours' },
            { id: 'stress', displayId: 'stressValue', unit: '/10' }
        ];

        sliders.forEach(slider => {
            const sliderElement = document.getElementById(slider.id);
            const displayElement = document.getElementById(slider.displayId);

            if (sliderElement && displayElement) {
                // Set initial value (fix: always show number on load)
                displayElement.textContent = sliderElement.value;

                // Update on input
                sliderElement.addEventListener('input', (e) => {
                    displayElement.textContent = e.target.value;
                });

                // Allow direct input from keyboard (click to edit)
                displayElement.style.cursor = 'pointer';
                displayElement.title = 'Click to edit';
                displayElement.addEventListener('click', () => {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.value = sliderElement.value;
                    input.min = sliderElement.min;
                    input.max = sliderElement.max;
                    input.style.width = '60px';
                    displayElement.replaceWith(input);
                    input.focus();
                    input.addEventListener('blur', () => {
                        let val = input.value;
                        if (val < input.min) val = input.min;
                        if (val > input.max) val = input.max;
                        sliderElement.value = val;
                        input.replaceWith(displayElement);
                        displayElement.textContent = val;
                    });
                    input.addEventListener('keydown', (ev) => {
                        if (ev.key === 'Enter') {
                            input.blur();
                        }
                    });
                });
            }
        });

        // Auto-select diabetes if blood sugar > 125
        const bloodSugarInput = document.getElementById('bloodSugar');
        if (bloodSugarInput) {
            bloodSugarInput.addEventListener('input', (e) => {
                const diabetesYes = document.querySelector('input[name="diabetes"][value="Yes"]');
                const diabetesNo = document.querySelector('input[name="diabetes"][value="No"]');
                if (parseInt(e.target.value) > 125 && diabetesYes) {
                    diabetesYes.checked = true;
                } else if (diabetesNo) {
                    diabetesNo.checked = true;
                }
            });
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.validateForm()) {
            await this.performPrediction();
        }
    }

    validateForm() {
        // Check if all required radio buttons are selected
        const requiredRadioGroups = ['gender', 'familyHistory', 'diabetes', 'obesity', 'angina'];
        
        for (let group of requiredRadioGroups) {
            const checked = document.querySelector(`input[name="${group}"]:checked`);
            if (!checked) {
                alert(`Please select an option for ${group.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return false;
            }
        }
        
        return true;
    }

    async performPrediction() {
        // Show loading state
        this.showLoading(true);

        // Collect form data
        const formData = this.collectFormData();

        // Prepare payload for backend
        // Send frontend field names that backend expects
        const payload = {
            "age": formData.age,
            "gender": formData.gender,
            "cholesterol": formData.cholesterol,
            "bloodPressure": formData.bloodPressure,
            "heartRate": formData.heartRate,
            "smoking": formData.smoking,
            "alcoholIntake": formData.alcohol,
            "exerciseHours": formData.exercise,
            "familyHistory": formData.familyHistory,
            "diabetes": formData.diabetes,
            "obesity": formData.obesity,
            "stressLevel": formData.stress,
            "bloodSugar": formData.bloodSugar,
            "exerciseInducedAngina": formData.angina,
            "chestPainType": formData.chestPain
        };

        let result = null;
        try {
            // Send POST request to backend
            // use same-origin relative path so deployment (Render, etc.) calls the correct backend
            const response = await fetch(window.location.origin + '/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Prediction request failed (${response.status}): ${text}`);
            }
            result = await response.json();
        } catch (error) {
            // Fallback: show error message
            const msg = error && error.message ? error.message : 'Prediction service error';
            result = {
                risk_percentage: '--',
                risk_category: 'Error',
                color: '#ef4444',
                recommendations: [msg],
                disclaimer: ''
            };
        }

        // Display results from backend
        this.displayResultsFromBackend(result);

        // Hide loading state
        this.showLoading(false);

        // Show results section
        this.resultsSection.classList.remove('hidden');
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    collectFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        // Collect all form values
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Convert numeric values
        const numericFields = ['age', 'cholesterol', 'bloodPressure', 'heartRate', 'bloodSugar', 'exercise', 'stress'];
        numericFields.forEach(field => {
            if (data[field]) {
                data[field] = parseInt(data[field]);
            }
        });
        
        return data;
    }


    displayResultsFromBackend(result) {
        const riskPercentageEl = document.getElementById('riskPercentage');
        const riskCategoryEl = document.getElementById('riskCategory');
        const recommendationsEl = document.getElementById('recommendations');

        // Display risk percentage with animation
        animateRisk(result.risk_percentage);

        // Display risk category
        riskCategoryEl.textContent = result.risk_category;

        // Apply risk category styling
        const riskDisplay = riskPercentageEl.parentElement.parentElement;
        let categoryClass = 'risk-low';
        if (result.risk_category === 'Moderate Risk') categoryClass = 'risk-moderate';
        if (result.risk_category === 'High Risk' || result.risk_category === 'Error') categoryClass = 'risk-high';
        riskDisplay.className = `risk-display ${categoryClass}`;

        // Show recommendations
        if (Array.isArray(result.recommendations)) {
            displayRecommendations(result.recommendations);
        } else {
            recommendationsEl.innerHTML = `<p>${result.recommendations}</p>`;
        }
    }

    generateRecommendations(riskScore, formData) {
        let recommendations = [];
        
        // Risk-based recommendations
        if (riskScore <= 30) {
            recommendations.push('Your cardiovascular risk is currently low. Continue your healthy lifestyle habits.');
        } else if (riskScore <= 60) {
            recommendations.push('Your cardiovascular risk is moderate. Consider lifestyle modifications and regular monitoring.');
        } else {
            recommendations.push('Your cardiovascular risk is high. Consult with a healthcare provider immediately for comprehensive evaluation.');
        }

        // Specific factor-based recommendations
        if (formData.smoking === 'Current') {
            recommendations.push('Smoking cessation is critical - it\'s the single most important step to reduce your risk.');
        }
        
        if (formData.cholesterol > 240) {
            recommendations.push('Your cholesterol level is high. Consider dietary changes and discuss medication options with your doctor.');
        }
        
        if (formData.bloodPressure > 140) {
            recommendations.push('Your blood pressure is elevated. Monitor regularly and consider lifestyle modifications.');
        }
        
        if (formData.exercise < 3) {
            recommendations.push('Increase physical activity to at least 150 minutes of moderate exercise per week.');
        }
        
        if (formData.stress > 7) {
            recommendations.push('High stress levels can impact heart health. Consider stress management techniques like meditation or yoga.');
        }
        
        if (formData.bloodSugar > 140) {
            recommendations.push('Elevated blood sugar levels require attention. Maintain a healthy diet and regular monitoring.');
        }

        if (formData.diabetes === 'Yes') {
            recommendations.push('Diabetes management is crucial for heart health. Work closely with your healthcare team.');
        }

        if (formData.obesity === 'Yes') {
            recommendations.push('Weight management through diet and exercise can significantly improve cardiovascular health.');
        }

        // General recommendations
        if (riskScore > 30) {
            recommendations.push('Schedule regular check-ups with your healthcare provider for ongoing monitoring.');
            recommendations.push('Consider a heart-healthy diet rich in fruits, vegetables, whole grains, and lean proteins.');
            recommendations.push('Limit sodium intake and avoid processed foods when possible.');
        }

        // Format recommendations as HTML
        const title = `<h3>Personalized Recommendations</h3>`;
        const list = `<ul>${recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>`;
        
        return title + list;
    }

    showLoading(show) {
        const btnText = document.querySelector('.btn-text');
        
        if (show) {
            this.predictBtn.classList.add('loading');
            this.predictBtn.disabled = true;
            btnText.textContent = 'Analyzing...';
            this.loadingSpinner.classList.remove('hidden');
        } else {
            this.predictBtn.classList.remove('loading');
            this.predictBtn.disabled = false;
            btnText.textContent = 'Predict Risk';
            this.loadingSpinner.classList.add('hidden');
        }
    }

    resetForm() {
        // Reset form
        this.form.reset();
        
        // Use default values from backend if available
        if (this.defaultValues && Object.keys(this.defaultValues).length > 0) {
            // Populate form with default values from backend
            this.populateFormWithDefaults();
            
            // Update slider displays to match default values
            const defaults = this.defaultValues;
            document.getElementById('ageValue').textContent = defaults.age || '';
            document.getElementById('cholesterolValue').textContent = defaults.cholesterol || '';
            document.getElementById('bloodPressureValue').textContent = defaults.bloodPressure || '';
            document.getElementById('heartRateValue').textContent = defaults.heartRate || '';
            document.getElementById('bloodSugarValue').textContent = defaults.bloodSugar || '';
            document.getElementById('exerciseValue').textContent = defaults.exerciseHours || '';
            document.getElementById('stressValue').textContent = defaults.stressLevel || '';
        } else {
            // Reset slider displays to default values
            document.getElementById('ageValue').textContent = '52';
            document.getElementById('cholesterolValue').textContent = '249';
            document.getElementById('bloodPressureValue').textContent = '134';
            document.getElementById('heartRateValue').textContent = '79';
            document.getElementById('bloodSugarValue').textContent = '134';
            document.getElementById('exerciseValue').textContent = '4';
            document.getElementById('stressValue').textContent = '5';

            // Reset sliders to default values and max values
            document.getElementById('age').value = '52';
            const cholesterolInput = document.getElementById('cholesterol');
            if (cholesterolInput) cholesterolInput.max = 400;
            cholesterolInput.value = '249';
            document.getElementById('bloodPressure').value = '134';
            const heartRateInput = document.getElementById('heartRate');
            if (heartRateInput) heartRateInput.max = 120;
            heartRateInput.value = '79';
            const heartRateLabel = document.querySelector("label[for='heartRate']");
            const bloodSugarInput = document.getElementById('bloodSugar');
            if (bloodSugarInput) bloodSugarInput.max = 450;
            bloodSugarInput.value = '134';
            document.getElementById('exercise').value = '4';
            document.getElementById('stress').value = '5';

            // Set default radio button selections
            document.querySelector('input[name="gender"][value="Male"]').checked = true;
            document.querySelector('input[name="familyHistory"][value="No"]').checked = true;
            document.querySelector('input[name="diabetes"][value="No"]').checked = true;
            document.querySelector('input[name="obesity"][value="No"]').checked = true;
            document.querySelector('input[name="angina"][value="No"]').checked = true;

            // Reset dropdowns
            document.getElementById('smoking').value = 'Never';
            document.getElementById('alcohol').value = 'None';
            document.getElementById('chestPain').value = 'Asymptomatic';
        }
        
        // Hide results
        this.resultsSection.classList.add('hidden');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HeartDiseasePredictor();
});

// Additional utility functions for enhanced interactivity
function addTooltips() {
    // Add tooltips to form elements for better user experience
    const tooltips = {
        age: 'Age is a significant risk factor for heart disease',
        cholesterol: 'Normal: <200 mg/dL, Borderline: 200-239 mg/dL, High: ≥240 mg/dL',
        bloodPressure: 'Normal: <120/80 mmHg, Elevated: 120-129/<80 mmHg, High: ≥130/80 mmHg',
        heartRate: 'Normal resting heart rate for adults: 60-100 bpm',
        bloodSugar: 'Normal: 70-100 mg/dL, Pre-diabetes: 100-125 mg/dL, Diabetes: ≥126 mg/dL',
        exercise: 'Recommended: At least 150 minutes of moderate exercise per week',
        stress: 'High stress levels can contribute to cardiovascular disease'
    };
    
    Object.entries(tooltips).forEach(([id, text]) => {
        const element = document.getElementById(id);
        if (element) {
            element.title = text;
        }
    });
}

// Initialize tooltips after DOM load
document.addEventListener('DOMContentLoaded', addTooltips);

// Theme toggle handling
function initThemeToggle() {
    const switchBtn = document.getElementById('themeSwitch');
    if (!switchBtn) return;

    const setTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-color-scheme', 'dark');
            switchBtn.textContent = '☀️';
            switchBtn.setAttribute('aria-pressed', 'true');
        } else {
            document.documentElement.setAttribute('data-color-scheme', 'light');
            switchBtn.textContent = '🌙';
            switchBtn.setAttribute('aria-pressed', 'false');
        }
        localStorage.setItem('theme', theme);
    };

    // Initialize from saved preference or system
    const saved = localStorage.getItem('theme');
    if (saved) setTheme(saved);
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
    else setTheme('light');

    switchBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-color-scheme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });
}

document.addEventListener('DOMContentLoaded', initThemeToggle);

// Patient management: allow multiple patient tabs with separate form state
class PatientManager {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.tabsContainer = document.getElementById('patientTabs');
        this.addBtn = document.getElementById('addPatientBtn');
        this.patients = []; // {id, name, data}
        this.activeId = null;

        if (this.addBtn) this.addBtn.addEventListener('click', () => this.addPatient());

        // create initial patient
        this.addPatient('Patient 1');
    }

    addPatient(defaultName) {
        const id = 'p' + Date.now();
        const name = defaultName || `Patient ${this.patients.length + 1}`;
        const patient = { id, name, data: {} };
        this.patients.push(patient);
        this.renderTabs();
        this.activatePatient(id);
    }

    renderTabs() {
        if (!this.tabsContainer) return;
        this.tabsContainer.innerHTML = '';
        this.patients.forEach(p => {
            const el = document.createElement('div');
            el.className = 'patient-tab' + (p.id === this.activeId ? ' active' : '');
            el.dataset.id = p.id;

            // add name label (editable on double-click)
            const label = document.createElement('span');
            label.textContent = p.name;
            label.style.cursor = "pointer";
            label.title = "Click to edit name";

            // allow editing patient name (single click)
            label.addEventListener("click", (e) => {
                e.stopPropagation();

                const input = document.createElement("input");
                input.type = "text";
                input.value = p.name;
                input.style.width = "90px";

                label.replaceWith(input);
                input.focus();

                input.addEventListener("blur", () => {
                    p.name = input.value || p.name;
                    this.renderTabs();
                });

                input.addEventListener("keydown", (ev) => {
                    if (ev.key === "Enter") input.blur();
                });
            });

            el.appendChild(label);

            // include remove button if more than one patient exists
            if (this.patients.length > 1) {
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-patient';
                removeBtn.type = 'button';
                removeBtn.title = 'Remove this patient';
                removeBtn.textContent = '✂';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removePatient(p.id);
                });
                el.appendChild(removeBtn);
            }

            el.addEventListener('click', () => this.activatePatient(p.id));
            this.tabsContainer.appendChild(el);
        });
    }

    activatePatient(id) {
        // save current form
        if (this.activeId) this.saveFormToPatient(this.activeId);

        this.activeId = id;
        // load form for active
        this.loadPatientToForm(id);
        this.renderTabs();
    }

    saveFormToPatient(id) {
        const patient = this.patients.find(p => p.id === id);
        if (!patient) return;
        const formData = new FormData(this.form);
        const data = {};
        for (let [key, val] of formData.entries()) data[key] = val;
        patient.data = data;
    }

    loadPatientToForm(id) {
        const patient = this.patients.find(p => p.id === id);
        if (!patient) return;
        // Reset form
        this.form.reset();
        // populate
        const data = patient.data || {};
        for (const [k, v] of Object.entries(data)) {
            const el = this.form.elements[k];
            if (!el) continue;
            if (el.type === 'radio') {
                const radios = this.form.querySelectorAll(`input[name="${k}"]`);
                radios.forEach(r => r.checked = (r.value === v));
            } else {
                el.value = v;
            }
        }
        // update displayed slider numbers
        const sliders = ['age','cholesterol','bloodPressure','heartRate','bloodSugar','exercise','stress'];
        sliders.forEach(id => {
            const s = document.getElementById(id);
            const disp = document.getElementById(id + 'Value');
            if (s && disp) disp.textContent = s.value;
        });
    }

    /**
     * Remove a patient tab and its associated data. Adjusts names and
     * activates an adjacent patient or creates a fresh entry if none remain.
     */
    removePatient(id) {
        const index = this.patients.findIndex(p => p.id === id);
        if (index === -1) return;

        // drop the patient record
        this.patients.splice(index, 1);

        // renumber the remaining patients
        this.patients.forEach((p, i) => {
            p.name = `Patient ${i + 1}`;
        });

        // if the deleted patient was active, pick a neighbor
        if (this.activeId === id) {
            if (this.patients.length > 0) {
                const newIdx = index > 0 ? index - 1 : 0;
                this.activatePatient(this.patients[newIdx].id);
            } else {
                // ensure there is always at least one patient
                this.addPatient();
            }
        } else {
            this.renderTabs();
        }
    }
}

// initialize patient manager after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.patientManager = new PatientManager('predictionForm');
    // initialize theme tab (standalone)
    if (typeof initThemeTabStandalone === 'function') initThemeTabStandalone();
});

// Standalone theme tab initializer (keeps parity with initThemeTab in the class)
function initThemeTabStandalone() {
    const themeTab = document.getElementById('themeTab');
    if (!themeTab) return;

    const applyTheme = (mode) => {
        if (mode === 'dark') {
            document.documentElement.setAttribute('data-color-scheme', 'dark');
            themeTab.textContent = '🌞';
            themeTab.setAttribute('aria-pressed', 'true');
        } else {
            document.documentElement.setAttribute('data-color-scheme', 'light');
            themeTab.textContent = '🌙';
            themeTab.setAttribute('aria-pressed', 'false');
        }
        localStorage.setItem('color-scheme', mode);
    };

    const saved = localStorage.getItem('color-scheme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(initial);

    themeTab.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-color-scheme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    });
}