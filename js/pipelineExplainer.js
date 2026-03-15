const PipelineExplainer = {
    init() {
        console.log("PipelineExplainer initialized");
        this.injectButton();
    },

    injectButton() {
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar) return;

        // Check if button already exists
        if (toolbar.querySelector('.explainer-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'secondary explainer-btn';
        btn.innerHTML = '<i class="fas fa-book-reader"></i> Explain Pipeline';
        btn.title = "Get a plain-English explanation of your pipeline";
        btn.onclick = () => this.showExplanation();

        // Insert before the Export YAML button
        const exportBtn = toolbar.querySelector('button[onclick*="exportYaml"]');
        if (exportBtn) {
            toolbar.insertBefore(btn, exportBtn);
        } else {
            toolbar.appendChild(btn);
        }
    },

    generateExplanation() {
        if (!window.AppState || window.AppState.jobs.length === 0) {
            return "Your pipeline is currently empty. Add some jobs to get started!";
        }

        const jobs = window.AppState.jobs;
        const platform = window.AppState.platform || 'github';
        const pipelineCfg = window.AppState.pipeline || { branch: 'main', triggers: { push: true, pr: false }, stages: ['build', 'test', 'deploy'] };
        const branch = pipelineCfg.branch || 'main';
        const stages = pipelineCfg.stages || ['build', 'test', 'deploy'];

        let narrative = `<h3>Overview</h3><p>This pipeline runs automatically in <strong>${platform === 'github' ? 'GitHub Actions' : 'GitLab CI'}</strong> `;
        
        const push = pipelineCfg.triggers ? pipelineCfg.triggers.push : true;
        const pr = pipelineCfg.triggers ? pipelineCfg.triggers.pr : false;
        
        if (push && pr) narrative += `whenever you <strong>push code</strong> or <strong>open a pull request</strong> `;
        else if (push) narrative += `whenever you <strong>push code</strong> `;
        else if (pr) narrative += `whenever you <strong>open a pull request</strong> `;
        
        narrative += `targeting the <strong>'${branch}'</strong> branch.</p>`;

        narrative += `<h3>Pipeline Flow</h3>`;

        stages.forEach(stage => {
            const stageJobs = jobs.filter(j => j.stage === stage);
            if (stageJobs.length > 0) {
                narrative += `<div class="explainer-stage">`;
                narrative += `<h4>${stage.toUpperCase()} Stage</h4>`;
                
                stageJobs.forEach(job => {
                    narrative += `<div class="explainer-job">`;
                    narrative += `<p><strong>Job: ${job.name}</strong> runs on ${job.os}. It performs these actions:</p>`;
                    if (job.steps.length > 0) {
                        narrative += `<ul>`;
                        
                        job.steps.forEach(step => {
                            let stepDesc = "";
                            if (step.type === 'checkout') stepDesc = "Downloads your code from the repository.";
                            else if (step.type === 'run') stepDesc = `Runs the command: <code>${step.val}</code>`;
                            else if (step.type === 'action') stepDesc = `Uses the pre-built action: <code>${step.val}</code>`;
                            
                            narrative += `<li>${step.name || stepDesc}: ${stepDesc}</li>`;
                        });
                        
                        narrative += `</ul>`;
                    } else {
                        narrative += `<p style="color:var(--warning-color); font-style:italic;">This job has no steps configured yet.</p>`;
                    }
                    
                    // Dependencies
                    const deps = window.AppState.connections.filter(c => c.to === job.internalId);
                    if (deps.length > 0) {
                        const parentNames = deps.map(d => {
                            const p = jobs.find(j => j.internalId === d.from);
                            return p ? p.name : 'Unknown';
                        });
                        narrative += `<p class="explainer-note"><i class="fas fa-link"></i> This job waits for <strong>${parentNames.join(', ')}</strong> to finish first.</p>`;
                    }
                    
                    // Advanced features
                    if (job.matrix && job.matrix.enabled) {
                        narrative += `<p class="explainer-note"><i class="fas fa-table"></i> This job runs multiple times in parallel for different settings.</p>`;
                    }
                    if (job.retry && job.retry.enabled) {
                        narrative += `<p class="explainer-note"><i class="fas fa-redo"></i> If it fails, it will automatically try again up to ${job.retry.attempts} times.</p>`;
                    }
                    
                    narrative += `</div>`;
                });
                
                narrative += `</div>`;
            }
        });

        narrative += `<div class="explainer-summary">`;
        narrative += `<p><strong>Total:</strong> ${jobs.length} jobs across ${stages.length} stages.</p>`;
        narrative += `</div>`;

        return narrative;
    },

    showExplanation() {
        const overlay = document.createElement('div');
        overlay.className = 'onboarding-overlay'; // Re-use
        overlay.id = 'explainer-modal';
        overlay.style.zIndex = '110000';
        
        const card = document.createElement('div');
        card.className = 'onboarding-card explainer-card';
        card.style.maxWidth = '700px';
        card.style.maxHeight = '90vh';
        card.style.overflowY = 'auto';
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; position:sticky; top:0; background:var(--panel-bg); z-index:10; padding-bottom:10px; border-bottom:1px solid var(--border-color);">
                <h2 style="margin:0;"><i class="fas fa-book-reader"></i> What Does This Pipeline Do?</h2>
                <span class="wizard-close" onclick="this.closest('#explainer-modal').remove()">&times;</span>
            </div>
            <div class="explainer-content">
                ${this.generateExplanation()}
            </div>
            <div class="onboarding-actions" style="position:sticky; bottom:0; background:var(--panel-bg); padding-top:20px; border-top:1px solid var(--border-color);">
                <button class="onboarding-btn onboarding-btn-secondary" onclick="PipelineExplainer.copyExplanation()">
                    <i class="fas fa-copy"></i> Copy as Text
                </button>
                <button class="onboarding-btn onboarding-btn-primary" onclick="this.closest('#explainer-modal').remove()">
                    Got it, thanks!
                </button>
            </div>
        `;
        
        overlay.appendChild(card);
        document.body.appendChild(overlay);
    },

    copyExplanation() {
        const contentEl = document.querySelector('.explainer-content');
        if (!contentEl) return;
        
        // Get plain text version (strip HTML tags)
        const text = contentEl.innerText || contentEl.textContent;
        navigator.clipboard.writeText(text).then(() => {
            if (typeof EnhancedUI !== 'undefined') {
                EnhancedUI.showNotification('Explanation copied to clipboard!', 'success');
            }
        }).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            if (typeof EnhancedUI !== 'undefined') {
                EnhancedUI.showNotification('Explanation copied to clipboard!', 'success');
            }
        });
    }
};

window.PipelineExplainer = PipelineExplainer;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        PipelineExplainer.init();
    }, 800);
});
