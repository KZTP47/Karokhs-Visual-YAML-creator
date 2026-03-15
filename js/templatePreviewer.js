const TemplatePreviewer = {
    hoverTimer: null,

    init() {
        console.log("TemplatePreviewer initialized");
        this.setupObserver();
    },

    setupObserver() {
        const wizardModal = document.getElementById('wizard-modal');
        if (!wizardModal) return;

        const observer = new MutationObserver(() => {
            const grid = document.getElementById('template-grid');
            if (grid) {
                this.attachToCards(grid);
            }
        });

        observer.observe(wizardModal, { childList: true, subtree: true });
    },

    attachToCards(grid) {
        const cards = grid.querySelectorAll('.template-card');
        cards.forEach(card => {
            if (card.classList.contains('preview-attached')) return;
            card.classList.add('preview-attached');

            const onclickAttr = card.getAttribute('onclick') || '';
            const match = onclickAttr.match(/'([^']+)'/);
            if (!match) return;
            const templateId = match[1];

            card.onmouseenter = () => {
                this.hoverTimer = setTimeout(() => {
                    this.showPreview(templateId, card);
                }, 500);
            };

            card.onmouseleave = () => {
                clearTimeout(this.hoverTimer);
                this.hidePreview();
            };
        });
    },

    showPreview(templateId, anchor) {
        if (!window.Templates || !window.Templates[templateId]) return;
        const template = window.Templates[templateId];

        this.hidePreview();

        const popup = document.createElement('div');
        popup.className = 'template-preview-popup';
        
        // Count jobs and steps
        let totalJobs = template.jobs.length;
        let totalSteps = template.jobs.reduce((sum, job) => sum + (job.steps ? job.steps.length : 0), 0);
        let stages = [...new Set(template.jobs.map(j => j.stage))];

        // Group jobs by stage
        const jobsByStage = {};
        template.jobs.forEach(job => {
            if (!jobsByStage[job.stage]) jobsByStage[job.stage] = [];
            jobsByStage[job.stage].push(job);
        });

        let diagramHtml = '';
        stages.forEach((stage, i) => {
            diagramHtml += `
                <div class="template-preview-stage">
                    <div class="template-preview-stage-label">${stage}</div>
                    <div style="display:flex; gap:4px; flex-wrap:wrap;">
                        ${(jobsByStage[stage] || []).map(j => `
                            <div class="template-preview-job-block stage-${stage}">${j.name}</div>
                        `).join('')}
                    </div>
                </div>
            `;
            if (i < stages.length - 1) {
                diagramHtml += `<div class="template-preview-arrow"><i class="fas fa-arrow-down"></i></div>`;
            }
        });

        popup.innerHTML = `
            <div class="template-preview-title">Pipeline Preview</div>
            <div class="template-preview-diagram">
                ${diagramHtml}
            </div>
            <div class="template-preview-summary">
                This template creates <strong>${totalJobs} job${totalJobs > 1 ? 's' : ''}</strong> across <strong>${stages.length} stage${stages.length > 1 ? 's' : ''}</strong> with ${totalSteps} actions.
            </div>
            <div class="template-preview-job-list">
                ${template.jobs.slice(0, 3).map(j => `• <strong>${j.name}</strong>: ${j.steps ? j.steps.length : 0} steps`).join('<br>')}
                ${template.jobs.length > 3 ? '<br>• ...and more' : ''}
            </div>
        `;

        const rect = anchor.getBoundingClientRect();
        popup.style.top = rect.top + 'px';
        popup.style.left = (rect.right + 20) + 'px';

        document.body.appendChild(popup);
        
        // Adjust if out of bounds
        const popupRect = popup.getBoundingClientRect();
        if (popupRect.right > window.innerWidth) {
            popup.style.left = (rect.left - popupRect.width - 20) + 'px';
        }
    },

    hidePreview() {
        document.querySelectorAll('.template-preview-popup').forEach(p => p.remove());
    }
};

window.TemplatePreviewer = TemplatePreviewer;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => TemplatePreviewer.init(), 2000);
});
