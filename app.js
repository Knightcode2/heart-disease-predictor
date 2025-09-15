// Heart Disease Prediction App JavaScript

class HeartDiseasePredictor {
    constructor() {
        this.form = document.getElementById('predictionForm');
        this.resultsSection = document.getElementById('resultsSection');
        this.predictBtn = document.getElementById('predictBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        
        this.initializeEventListeners();
        this.initializeSliders();
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
            { id: 'heartRate', displayId: 'heartRateValue', unit: 'bpm' },
            { id: 'bloodSugar', displayId: 'bloodSugarValue', unit: 'mg/dL' },
            { id: 'exercise', displayId: 'exerciseValue', unit: 'hours' },
            { id: 'stress', displayId: 'stressValue', unit: '/10' }
        ];

        sliders.forEach(slider => {
            const sliderElement = document.getElementById(slider.id);
            const displayElement = document.getElementById(slider.displayId);
            
            if (sliderElement && displayElement) {
                // Set initial value
                displayElement.textContent = sliderElement.value;
                
                // Update on input
                sliderElement.addEventListener('input', (e) => {
                    displayElement.textContent = e.target.value;
                });
            }
        });
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
            const response = await fetch('http://localhost:5000/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Prediction request failed');
            result = await response.json();
        } catch (error) {
            // Fallback: show error message
            result = {
                risk_percentage: '--',
                risk_category: 'Error',
                color: '#ef4444',
                recommendations: ['Could not connect to prediction service. Please try again later.'],
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

    calculateRiskScore(data) {
        let riskScore = 0;
        let maxScore = 100;

        // Age factor (25% of total risk)
        const ageRisk = Math.min((data.age - 25) / (79 - 25) * 25, 25);
        riskScore += ageRisk;

        // Gender factor (5% of total risk)
        if (data.gender === 'Male') {
            riskScore += 5; // Males generally have higher risk
        }

        // Cholesterol factor (15% of total risk)
        if (data.cholesterol > 300) {
            riskScore += 15;
        } else if (data.cholesterol > 240) {
            riskScore += 10;
        } else if (data.cholesterol > 200) {
            riskScore += 5;
        }

        // Blood Pressure factor (15% of total risk)
        if (data.bloodPressure > 160) {
            riskScore += 15;
        } else if (data.bloodPressure > 140) {
            riskScore += 10;
        } else if (data.bloodPressure > 130) {
            riskScore += 5;
        }

        // Blood Sugar factor (10% of total risk)
        if (data.bloodSugar > 180) {
            riskScore += 10;
        } else if (data.bloodSugar > 140) {
            riskScore += 7;
        } else if (data.bloodSugar > 100) {
            riskScore += 3;
        }

        // Heart Rate factor (5% of total risk)
        if (data.heartRate > 90 || data.heartRate < 65) {
            riskScore += 5;
        }

        // Smoking factor (15% of total risk)
        switch (data.smoking) {
            case 'Current':
                riskScore += 15;
                break;
            case 'Former':
                riskScore += 7;
                break;
            case 'Never':
                riskScore += 0;
                break;
        }

        // Alcohol factor (3% of total risk)
        switch (data.alcohol) {
            case 'Heavy':
                riskScore += 3;
                break;
            case 'Moderate':
                riskScore += 1;
                break;
            case 'None':
                riskScore += 0;
                break;
        }

        // Exercise factor (protective, -10% potential)
        const exerciseProtection = Math.min(data.exercise * 1.2, 10);
        riskScore -= exerciseProtection;

        // Stress factor (7% of total risk)
        riskScore += (data.stress - 1) * 0.8;

        // Medical history factors
        if (data.familyHistory === 'Yes') riskScore += 8;
        if (data.diabetes === 'Yes') riskScore += 12;
        if (data.obesity === 'Yes') riskScore += 8;
        if (data.angina === 'Yes') riskScore += 10;

        // Chest pain factor
        switch (data.chestPain) {
            case 'Typical Angina':
                riskScore += 12;
                break;
            case 'Atypical Angina':
                riskScore += 8;
                break;
            case 'Non-anginal Pain':
                riskScore += 4;
                break;
            case 'Asymptomatic':
                riskScore += 0;
                break;
        }

        // Ensure score is within bounds
        riskScore = Math.max(0, Math.min(100, riskScore));
        
        return Math.round(riskScore);
    }

    displayResultsFromBackend(result) {
        const riskPercentageEl = document.getElementById('riskPercentage');
        const riskCategoryEl = document.getElementById('riskCategory');
        const recommendationsEl = document.getElementById('recommendations');

        // Display risk percentage
        riskPercentageEl.textContent = `${result.risk_percentage}%`;

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
            const title = `<h3>Personalized Recommendations</h3>`;
            const list = `<ul>${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>`;
            recommendationsEl.innerHTML = title + list;
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
        
        // Reset slider displays to default values
        document.getElementById('ageValue').textContent = '52';
        document.getElementById('cholesterolValue').textContent = '249';
        document.getElementById('bloodPressureValue').textContent = '134';
        document.getElementById('heartRateValue').textContent = '79';
        document.getElementById('bloodSugarValue').textContent = '134';
        document.getElementById('exerciseValue').textContent = '4';
        document.getElementById('stressValue').textContent = '5';
        
        // Reset sliders to default values
        document.getElementById('age').value = '52';
        document.getElementById('cholesterol').value = '249';
        document.getElementById('bloodPressure').value = '134';
        document.getElementById('heartRate').value = '79';
        document.getElementById('bloodSugar').value = '134';
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