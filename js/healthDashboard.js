const HealthDashboard = {
    init() {
        console.log("HealthDashboard initialized");
        this.hookIntoValidation();
    },

    calculateScore() {
        if (!window.AppState) return { score: 100, grade: 'Unknown', color: 'var(--text-secondary)', summary: 'No data' };

        // Read validation items from the DOM because AppState does not store them
        const validationItems = document.querySelectorAll('.validation-item');
        let score = 100;
        let errors = 0;
        let warnings = 0;
        let infos = 0;
        let successes = 0;

        validationItems.forEach(item => {
            if (item.classList.contains('error')) {
                score -= 20;
                errors++;
            } else if (item.classList.contains('warning')) {
                score -= 5;
                warnings++;
            } else if (item.classList.contains('info')) {
                score -= 1;
                infos++;
            } else if (item.classList.contains('success')) {
                successes++;
            }
        });

        score = Math.max(0, Math.min(100, score));

        let grade = "Perfect";
        let color = "#10b981";
        let summary = "Your pipeline is configured perfectly! No issues found.";

        if (score < 40) {
            grade = "Needs Attention";
            color = "#ef4444";
            summary = `Your pipeline has ${errors} serious problem${errors !== 1 ? 's' : ''} that need${errors === 1 ? 's' : ''} to be fixed before it will run.`;
        } else if (score < 60) {
            grade = "Has Problems";
            color = "#f59e0b";
            summary = `There are ${errors} error${errors !== 1 ? 's' : ''} and ${warnings} warning${warnings !== 1 ? 's' : ''}. Your pipeline may not work as expected.`;
        } else if (score < 80) {
            grade = "Needs Work";
            color = "#f59e0b";
            summary = `Looking good, but there are ${errors + warnings} issue${(errors + warnings) !== 1 ? 's' : ''} to look at.`;
        } else if (score < 100) {
            grade = "Good";
            color = "#6366f1";
            summary = "Your pipeline is almost perfect! Just a few minor suggestions.";
        }

        return { score, grade, color, summary, errors, warnings, infos, successes };
    },

    render() {
        const resultsContainer = document.getElementById('validation-results');
        if (!resultsContainer) return;

        // Remove existing dashboard if any
        const existing = document.getElementById('pipeline-health-dashboard');
        if (existing) existing.remove();

        const health = this.calculateScore();
        
        const dashboard = document.createElement('div');
        dashboard.id = 'pipeline-health-dashboard';
        dashboard.className = 'health-score-card';
        
        // Add dynamic background based on color
        dashboard.style.background = `linear-gradient(135deg, ${health.color}11 0%, ${health.color}22 100%)`;
        dashboard.style.borderColor = `${health.color}44`;

        dashboard.innerHTML = `
            <div class="health-score-circle" style="border-color: ${health.color}; color: ${health.color}">
                ${health.score}%
            </div>
            <div class="health-score-info">
                <div class="health-score-grade" style="color: ${health.color}">${health.grade}</div>
                <div class="health-score-summary">${health.summary}</div>
            </div>
            ${(health.errors > 0 || health.warnings > 0) ? `
                <button class="onboarding-btn onboarding-btn-primary" style="background:${health.color}" onclick="HealthDashboard.fixAll()">
                    Fix All Issues
                </button>
            ` : ''}
        `;

        resultsContainer.insertBefore(dashboard, resultsContainer.firstChild);
    },

    fixAll() {
        if (window.AutoFixer && window.AutoFixer.fixAll) {
            window.AutoFixer.fixAll();
            if (window.showNotification) window.showNotification("Applied all available auto-fixes!", "success");
        } else {
            console.warn("AutoFixer.fixAll not found");
            // Fallback: manually find and click all fix buttons
            const fixButtons = document.querySelectorAll('.auto-fix-btn');
            if (fixButtons.length > 0) {
                fixButtons.forEach(btn => btn.click());
                if (window.showNotification) window.showNotification(`Applied ${fixButtons.length} fixes!`, "success");
            }
        }
    },

    hookIntoValidation() {
        if (window.Validation && window.Validation.updateValidation) {
            const originalUpdate = window.Validation.updateValidation;
            window.Validation.updateValidation = function() {
                originalUpdate.apply(this, arguments);
                // Delay render slightly so other hooks (MistakeDetector) can add their items first
                clearTimeout(HealthDashboard._renderTimeout);
                HealthDashboard._renderTimeout = setTimeout(function() {
                    HealthDashboard.render();
                }, 50);
            };
        }
    }
};

window.HealthDashboard = HealthDashboard;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        HealthDashboard.init();
    }, 700);
});
