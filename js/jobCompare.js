const JobCompare = {
    modal: null,
    jobA: null,
    jobB: null,

    init() {
        console.log("JobCompare initialized");
        this.injectButton();
    },

    injectButton() {
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            const btn = document.createElement('button');
            btn.className = 'secondary icon-btn';
            btn.title = 'Compare two jobs side-by-side';
            btn.innerHTML = '<i class="fas fa-columns"></i>';
            btn.onclick = () => this.open();
            
            // Insert before the settings button
            const settingsBtn = toolbar.querySelector('button[onclick="toggleSettings()"]');
            if (settingsBtn) settingsBtn.before(btn);
            else toolbar.appendChild(btn);
        }
    },

    open() {
        const jobs = window.AppState.getAllJobs();
        if (jobs.length < 2) {
            if (window.showNotification) window.showNotification("You need at least 2 jobs to compare!", "warning");
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'recipe-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) this.close(); };

        const modal = document.createElement('div');
        modal.className = 'job-compare-modal';
        modal.innerHTML = `
            <div class="job-compare-header">
                <h3>Job Comparison</h3>
                <div class="job-compare-selectors">
                    <select id="select-job-a" class="job-compare-select" onchange="JobCompare.update()"></select>
                    <select id="select-job-b" class="job-compare-select" onchange="JobCompare.update()"></select>
                </div>
                <span class="recipe-modal-close" onclick="JobCompare.close()" style="cursor:pointer; font-size:24px;">&times;</span>
            </div>
            <div class="job-compare-content">
                <div id="compare-pane-a" class="job-compare-pane"></div>
                <div id="compare-pane-b" class="job-compare-pane"></div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        this.modal = overlay;

        const selA = document.getElementById('select-job-a');
        const selB = document.getElementById('select-job-b');
        
        jobs.forEach((job, i) => {
            const optA = new Option(job.name, job.internalId);
            const optB = new Option(job.name, job.internalId);
            selA.add(optA);
            selB.add(optB);
        });

        selB.selectedIndex = 1;

        this.update();
    },

    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    },

    update() {
        const idA = document.getElementById('select-job-a').value;
        const idB = document.getElementById('select-job-b').value;
        
        this.jobA = window.AppState.getJob(idA);
        this.jobB = window.AppState.getJob(idB);

        this.renderPane('a', this.jobA, this.jobB);
        this.renderPane('b', this.jobB, this.jobA);
    },

    renderPane(paneId, job, otherJob) {
        const container = document.getElementById(`compare-pane-${paneId}`);
        if (!container) return;

        container.innerHTML = `
            <div class="compare-section">
                <div class="compare-label">Job Name</div>
                <div class="compare-value ${job.name !== otherJob.name ? 'compare-diff-changed' : ''}">${job.name}</div>
            </div>
            
            <div class="compare-section">
                <div class="compare-label">Operating System</div>
                <div class="compare-value ${job.os !== otherJob.os ? 'compare-diff-changed' : ''}">${job.os}</div>
            </div>
            
            <div class="compare-section">
                <div class="compare-label">Stage</div>
                <div class="compare-value ${job.stage !== otherJob.stage ? 'compare-diff-changed' : ''}">${job.stage}</div>
            </div>

            <div class="compare-section">
                <div class="compare-label">Steps History</div>
                <div class="compare-steps">
                    ${this.renderStepsDiff(job.steps, otherJob.steps)}
                </div>
            </div>
            
            <div class="compare-section">
                <div class="compare-label">Environment Variables</div>
                <div class="compare-value">
                    ${this.renderObjectDiff(job.env || {}, otherJob.env || {})}
                </div>
            </div>
        `;
    },

    renderStepsDiff(stepsA, stepsB) {
        // Simple comparison by index
        const max = Math.max(stepsA.length, stepsB.length);
        let html = '';
        
        for (let i = 0; i < max; i++) {
            const sA = stepsA[i];
            const sB = stepsB[i];
            
            if (sA && !sB) {
                html += `<div class="compare-value compare-diff-added" style="margin-bottom:4px;">+ ${sA.name}: ${sA.val}</div>`;
            } else if (!sA && sB) {
                html += `<div class="compare-value compare-diff-removed" style="margin-bottom:4px;">- (Missing)</div>`;
            } else if (sA.val !== sB.val || sA.name !== sB.name) {
                html += `<div class="compare-value compare-diff-changed" style="margin-bottom:4px;">~ ${sA.name}: ${sA.val}</div>`;
            } else {
                html += `<div class="compare-value" style="margin-bottom:4px;">${sA.name}: ${sA.val}</div>`;
            }
        }
        
        return html || '<div class="compare-value">No steps defined.</div>';
    },

    renderObjectDiff(objA, objB) {
        const keys = Array.from(new Set([...Object.keys(objA), ...Object.keys(objB)]));
        if (keys.length === 0) return 'None';
        
        return keys.map(k => {
            if (objA[k] !== undefined && objB[k] === undefined) {
                return `<div class="compare-diff-added">${k}: ${objA[k]}</div>`;
            } else if (objA[k] === undefined && objB[k] !== undefined) {
                return `<div class="compare-diff-removed">${k}: ---</div>`;
            } else if (objA[k] !== objB[k]) {
                return `<div class="compare-diff-changed">${k}: ${objA[k]}</div>`;
            }
            return `<div>${k}: ${objA[k]}</div>`;
        }).join('');
    }
};

window.JobCompare = JobCompare;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => JobCompare.init(), 3000);
});
