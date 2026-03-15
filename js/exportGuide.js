const ExportGuide = {
    init() {
        console.log("ExportGuide initialized");
        this.hookExport();
    },

    hookExport() {
        if (window.YamlGenerator && window.YamlGenerator.exportYaml) {
            const original = window.YamlGenerator.exportYaml;
            window.YamlGenerator.exportYaml = function() {
                original.apply(this, arguments);
                
                const exp = localStorage.getItem('pipelinepro_experience');
                const skip = localStorage.getItem('pipelinepro_skip_export_guide');
                
                if (exp !== 'advanced' && !skip) {
                    setTimeout(() => ExportGuide.showGuide(), 1000);
                }
            };
        } else if (window.exportYaml) {
            // Global alias version
            const original = window.exportYaml;
            window.exportYaml = function() {
                original.apply(this, arguments);
                const exp = localStorage.getItem('pipelinepro_experience');
                const skip = localStorage.getItem('pipelinepro_skip_export_guide');
                if (exp !== 'advanced' && !skip) {
                    setTimeout(() => ExportGuide.showGuide(), 1000);
                }
            };
        }
    },

    showGuide() {
        const platform = (window.AppState && window.AppState.platform) || 'github';
        
        const overlay = document.createElement('div');
        overlay.id = 'export-guide-modal';
        overlay.className = 'onboarding-overlay';
        overlay.style.zIndex = '120000';
        
        const card = document.createElement('div');
        card.className = 'onboarding-card export-guide-card';
        card.style.maxWidth = '600px';
        
        let content = "";
        let filePath = "";
        
        if (platform === 'github') {
            filePath = ".github/workflows/pipeline.yml";
            content = `
                <div class="export-guide-step">
                    <div class="export-guide-number">1</div>
                    <div class="export-guide-text">In your code repository, create a folder called <strong>'.github'</strong> (with the dot).</div>
                </div>
                <div class="export-guide-step">
                    <div class="export-guide-number">2</div>
                    <div class="export-guide-text">Inside '.github', create another folder called <strong>'workflows'</strong>.</div>
                </div>
                <div class="export-guide-step">
                    <div class="export-guide-number">3</div>
                    <div class="export-guide-text">Put the file you just downloaded into this folder.</div>
                </div>
                <div class="export-guide-path">
                    <code>${filePath}</code>
                    <button class="secondary" style="padding:4px 8px; font-size:11px;" onclick="ExportGuide.copyPath('${filePath}')">Copy Path</button>
                </div>
                <div class="export-guide-step">
                    <div class="export-guide-number">4</div>
                    <div class="export-guide-text">Commit and push the changes to your repository. Action tab in GitHub will show your pipeline run!</div>
                </div>
            `;
        } else {
            filePath = ".gitlab-ci.yml";
            content = `
                <div class="export-guide-step">
                    <div class="export-guide-number">1</div>
                    <div class="export-guide-text">Put the file you just downloaded in the <strong>ROOT</strong> of your repository (the top-level folder).</div>
                </div>
                <div class="export-guide-step">
                    <div class="export-guide-number">2</div>
                    <div class="export-guide-text">Rename the file exactly to <strong>'.gitlab-ci.yml'</strong> (with the dot).</div>
                </div>
                <div class="export-guide-path">
                    <code>${filePath}</code>
                    <button class="secondary" style="padding:4px 8px; font-size:11px;" onclick="ExportGuide.copyPath('${filePath}')">Copy Name</button>
                </div>
                <div class="export-guide-step">
                    <div class="export-guide-number">3</div>
                    <div class="export-guide-text">Commit and push. Go to <strong>CI/CD > Pipelines</strong> in GitLab to see it run!</div>
                </div>
            `;
        }

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
                <h2 style="margin:0;"><i class="fas fa-file-export"></i> Pipeline Exported!</h2>
                <span class="wizard-close" onclick="this.closest('#export-guide-modal').remove()">&times;</span>
            </div>
            <div class="onboarding-body" style="margin-bottom: 20px;">
                <p>Great! You've downloaded your configuration file. Here is exactly where to put it in your project:</p>
            </div>
            <div class="export-guide-content">
                ${content}
            </div>
            <div style="margin-top:20px; display:flex; align-items:center; gap:10px;">
                <input type="checkbox" id="skip-guide-cb" onchange="localStorage.setItem('pipelinepro_skip_export_guide', this.checked ? 'true' : '')">
                <label for="skip-guide-cb" style="margin:0; font-size:12px; color:var(--text-secondary);">Don't show this again</label>
            </div>
            <div class="onboarding-actions">
                <button class="onboarding-btn onboarding-btn-primary" onclick="this.closest('#export-guide-modal').remove()">
                    I Understand
                </button>
            </div>
        `;
        
        overlay.appendChild(card);
        document.body.appendChild(overlay);
    },

    copyPath(path) {
        navigator.clipboard.writeText(path).then(() => {
            if (window.showNotification) window.showNotification("Path copied to clipboard!", "success");
        });
    }
};

window.ExportGuide = ExportGuide;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        ExportGuide.init();
    }, 1000);
});
