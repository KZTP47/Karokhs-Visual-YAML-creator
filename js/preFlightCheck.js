const PreFlightCheck = {
    init() {
        console.log("PreFlightCheck initialized");
        this.hookExport();
    },

    hookExport() {
        // Only hook into the module function to avoid double-firing
        if (window.YamlGenerator && window.YamlGenerator.exportYaml) {
            const originalExportModule = window.YamlGenerator.exportYaml;
            window.YamlGenerator.exportYaml = function() {
                if (PreFlightCheck.shouldShowPreflight()) {
                    PreFlightCheck.showChecklist(function() {
                        originalExportModule.apply(window.YamlGenerator, arguments);
                    });
                } else {
                    originalExportModule.apply(window.YamlGenerator, arguments);
                }
            };
        }
    },

    shouldShowPreflight() {
        const experience = localStorage.getItem('pipelinepro_experience');
        const skip = localStorage.getItem('pipelinepro_skip_preflight') === 'true';
        
        if (skip) return false;
        if (experience === 'beginner' || experience === 'intermediate') return true;
        return false;
    },

    showChecklist(confirmCallback) {
        const overlay = document.createElement('div');
        overlay.id = 'preflight-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.7); backdrop-filter:blur(5px); z-index:200000; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.3s ease-out;';
        
        const card = document.createElement('div');
        card.className = 'onboarding-card';
        card.style.maxWidth = '500px';

        const checks = this.generateChecks();
        let checksHtml = checks.map(check => `
            <div class="preflight-item ${check.passed ? 'pass' : 'fail'}">
                <div class="preflight-icon">
                    <i class="fas ${check.passed ? 'fa-check' : 'fa-exclamation'}"></i>
                </div>
                <div>
                    <div class="preflight-label">${check.label}</div>
                    <div class="preflight-detail">${check.detail}</div>
                </div>
            </div>
        `).join('');

        card.innerHTML = `
            <div class="onboarding-title">Pre-Flight Check</div>
            <div class="onboarding-body">Before you export, let's make sure your pipeline is ready for takeoff.</div>
            
            <div class="preflight-checklist">
                ${checksHtml}
            </div>

            <div class="preflight-manual-check" onclick="document.getElementById('manual-confirm').click(); event.stopPropagation();">
                <input type="checkbox" id="manual-confirm">
                <div style="font-size:13px;">I understand this YAML file must be placed in my code repository (e.g. at <code>.github/workflows/</code>) to work.</div>
            </div>

            <div style="display:flex; align-items:center; gap:8px; margin-bottom:20px; font-size:12px; opacity:0.7;">
                <input type="checkbox" id="skip-future">
                <label for="skip-future">Don't show this checklist again</label>
            </div>

            <div class="onboarding-actions">
                <button class="onboarding-btn onboarding-btn-secondary" onclick="document.getElementById('preflight-overlay').remove()">Go Back</button>
                <button class="onboarding-btn onboarding-btn-primary" id="final-export-btn" disabled>Export Now</button>
            </div>
        `;

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // Logic for enabling export button
        const exportBtn = card.querySelector('#final-export-btn');
        const manualCheck = card.querySelector('#manual-confirm');
        const skipCheck = card.querySelector('#skip-future');
        
        const allAutoPassed = checks.every(c => c.passed || c.optional);

        const updateBtn = () => {
            exportBtn.disabled = !(allAutoPassed && manualCheck.checked);
        };

        manualCheck.onchange = updateBtn;
        
        exportBtn.onclick = () => {
            if (skipCheck.checked) {
                localStorage.setItem('pipelinepro_skip_preflight', 'true');
            }
            overlay.remove();
            confirmCallback();
        };
    },

    generateChecks() {
        const jobs = window.AppState.getAllJobs();
        const errors = document.querySelectorAll('.validation-item.error').length;
        
        return [
            {
                label: "Pipeline Content",
                passed: jobs.length > 0,
                detail: jobs.length > 0 ? `Your pipeline has ${jobs.length} job(s).` : "Your pipeline is currently empty. You need at least one job to export."
            },
            {
                label: "Job Configuration",
                passed: jobs.every(j => j.isExternal || (j.steps && j.steps.length > 0)),
                detail: jobs.every(j => j.isExternal || (j.steps && j.steps.length > 0)) ? "All your jobs have at least one step defined." : "Some of your jobs are empty. Every job needs at least one action to perform."
            },
            {
                label: "Validation Status",
                passed: errors === 0,
                detail: errors === 0 ? "No structural errors were detected in your pipeline." : `There are ${errors} error(s) in your configuration. We recommend fixing these before exporting.`,
                optional: true // Allow export even with errors if they really want to
            },
            {
                label: "Target Platform",
                passed: true,
                detail: `Exporting for <strong>${window.AppState.platform.toUpperCase()}</strong>. Make sure this matches where your code is hosted.`
            }
        ];
    }
};

window.PreFlightCheck = PreFlightCheck;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => PreFlightCheck.init(), 1700);
});
