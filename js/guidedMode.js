const GuidedMode = {
    enabled: false,
    currentGoal: 'create',
    flags: {
        reviewedJob: false,
        viewedValidation: false,
        exportedYaml: false
    },
    progressSteps: [
        { id: 'create', label: 'Create a pipeline', done: false },
        { id: 'review', label: 'Review your jobs', done: false },
        { id: 'validate', label: 'Check for problems', done: false },
        { id: 'export', label: 'Export your YAML', done: false }
    ],

    enable() {
        if (this.enabled) return;
        this.enabled = true;
        document.body.classList.add('guided-mode');
        
        this.renderProgressBar();
        this.renderCoachMessage();
        this.patchDestructiveActions();
        this.applyBegineerUI();
        this.updateProgress();

        console.log("Guided Mode enabled");
    },

    disable() {
        this.enabled = false;
        document.body.classList.remove('guided-mode');
        
        const bar = document.getElementById('guided-progress-bar');
        if (bar) bar.remove();
        
        const coach = document.getElementById('coach-message');
        if (coach) coach.remove();
        
        // Remove advanced badges
        document.querySelectorAll('.advanced-badge').forEach(b => b.remove());
    },

    toggle() {
        if (this.enabled) this.disable();
        else this.enable();
    },

    applyBegineerUI() {
        // Collapse advanced sections
        const headers = document.querySelectorAll('.collapsible-header');
        headers.forEach(header => {
            const span = header.querySelector('span');
            if (!span) return;
            const text = span.textContent.toLowerCase();
            
            // Sections to add "Advanced" badge and collapse
            if (text.includes('matrix') || text.includes('environment variables') || text.includes('retry')) {
                // Add badge if not present
                if (!header.querySelector('.advanced-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'advanced-badge';
                    badge.textContent = 'Advanced';
                    header.appendChild(badge);
                }
                
                // Collapse if expanded
                if (header.classList.contains('active')) {
                    header.click(); // Toggle it closed
                }
            }
        });
    },

    updateProgress() {
        if (!this.enabled) return;

        // Determine completeness
        // 1. Create: AppState has jobs
        if (window.AppState && window.AppState.jobs && window.AppState.jobs.length > 0) {
            this.progressSteps[0].done = true;
        }

        // 2. Review: Selected a job at least once
        if (window.AppState && window.AppState.selectedId) {
            this.flags.reviewedJob = true;
        }
        if (this.flags.reviewedJob) {
            this.progressSteps[1].done = true;
        }

        // 3. Validate: Validation tab viewed
        if (this.flags.viewedValidation) {
            this.progressSteps[2].done = true;
        }

        // 4. Export: YAML exported
        if (this.flags.exportedYaml) {
            this.progressSteps[3].done = true;
        }

        // Find current goal
        let nextGoal = null;
        for (const step of this.progressSteps) {
            if (!step.done) {
                nextGoal = step.id;
                break;
            }
        }
        this.currentGoal = nextGoal;

        this.refreshUI();
    },

    refreshUI() {
        this.renderProgressBar();
        this.renderCoachMessage();
    },

    renderProgressBar() {
        let bar = document.getElementById('guided-progress-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'guided-progress-bar';
            document.body.appendChild(bar);
        }

        bar.innerHTML = '';
        
        this.progressSteps.forEach((step, index) => {
            const stepEl = document.createElement('div');
            stepEl.className = `progress-step ${step.done ? 'done' : ''} ${this.currentGoal === step.id ? 'active' : ''}`;
            
            const circle = document.createElement('div');
            circle.className = 'progress-circle';
            circle.innerHTML = step.done ? '<i class="fas fa-check"></i>' : (index + 1);
            
            const label = document.createElement('div');
            label.className = 'progress-label';
            label.textContent = step.label;
            
            stepEl.appendChild(circle);
            stepEl.appendChild(label);
            bar.appendChild(stepEl);
            
            if (index < this.progressSteps.length - 1) {
                const line = document.createElement('div');
                line.className = 'progress-line';
                bar.appendChild(line);
            }
        });

        const toggleLink = document.createElement('a');
        toggleLink.className = 'guided-off-link';
        toggleLink.href = '#';
        toggleLink.textContent = 'Turn off Guided Mode';
        toggleLink.onclick = (e) => {
            e.preventDefault();
            this.disable();
            localStorage.setItem('pipelinepro_experience', 'intermediate');
        };
        bar.appendChild(toggleLink);
    },

    renderCoachMessage() {
        let coach = document.getElementById('coach-message');
        if (!coach) {
            coach = document.createElement('div');
            coach.id = 'coach-message';
            document.body.appendChild(coach);
        }

        let title = "Coach";
        let message = "";
        let termKey = null;

        switch (this.currentGoal) {
            case 'create':
                title = "Let's Start!";
                message = "First, let's create your pipeline! Click the green <strong>'Quick Start Wizard'</strong> button in the toolbar, or click <strong>'+ New Job'</strong> to start from scratch.";
                termKey = "Pipeline";
                break;
            case 'review':
                title = "Good Job!";
                message = "Great, you have jobs! Click on any <strong>job box</strong> on the canvas to see its settings in the sidebar on the right.";
                termKey = "Job";
                break;
            case 'validate':
                title = "Almost There...";
                message = "Now let's make sure everything is correct. Click the <strong>'Validation'</strong> tab in the sidebar to check for problems.";
                termKey = "CI/CD";
                break;
            case 'export':
                title = "Ready to Go!";
                message = "Your pipeline looks good! Click <strong>'Export YAML'</strong> in the toolbar to download the file you will add to your code repository.";
                termKey = "YAML";
                break;
            default:
                title = "All Done!";
                message = "Congratulations! You have built and exported your first pipeline. You can keep editing, or save your project for later.";
                break;
        }

        let actionBtn = '';
        switch (this.currentGoal) {
            case 'create':
                actionBtn = `<button class="onboarding-btn onboarding-btn-primary" style="margin-top:12px; padding:6px 14px; font-size:12px; width:100%;" onclick="if(typeof openWizard==='function')openWizard();">Open Wizard for Me</button>`;
                break;
            case 'review':
                actionBtn = `<button class="onboarding-btn onboarding-btn-primary" style="margin-top:12px; padding:6px 14px; font-size:12px; width:100%;" onclick="if(window.AppState && window.AppState.jobs.length > 0 && typeof JobManager !== 'undefined') JobManager.selectJob(window.AppState.jobs[0].internalId);">Select First Job for Me</button>`;
                break;
            case 'validate':
                actionBtn = `<button class="onboarding-btn onboarding-btn-primary" style="margin-top:12px; padding:6px 14px; font-size:12px; width:100%;" onclick="if(typeof switchTab==='function')switchTab('validation');">Open Validation Tab</button>`;
                break;
            case 'export':
                actionBtn = `<button class="onboarding-btn onboarding-btn-primary" style="margin-top:12px; padding:6px 14px; font-size:12px; width:100%;" onclick="if(typeof exportYaml==='function')exportYaml();">Export YAML Now</button>`;
                break;
        }

        coach.innerHTML = `
            <div class="coach-dismiss" onclick="this.parentElement.remove()">&times;</div>
            <div class="coach-title"><i class="fas fa-info-circle"></i> ${title}</div>
            <div class="coach-body">${message}</div>
            ${termKey ? `<div class="coach-help-link" onclick="if(typeof Glossary!=='undefined')Glossary.showDefinitionByKey('${termKey}')">What does this mean?</div>` : ''}
            ${actionBtn}
        `;
    },

    patchDestructiveActions() {
        // Patch UIManager.clearAll
        if (window.UIManager && window.UIManager.clearAll && !UIManager.clearAll._patched) {
            const originalClearAll = UIManager.clearAll;
            UIManager.clearAll = function() {
                if (GuidedMode.enabled) {
                    if (confirm("This will delete ALL jobs and connections in your pipeline. Your exported YAML file (if you already downloaded one) will NOT be affected. Are you sure?")) {
                        originalClearAll.apply(this, arguments);
                    }
                } else {
                    originalClearAll.apply(this, arguments);
                }
            };
            UIManager.clearAll._patched = true;
        }

        // Patch JobManager.deleteJob
        if (window.JobManager && window.JobManager.deleteJob && !JobManager.deleteJob._patched) {
            const originalDeleteJob = JobManager.deleteJob;
            JobManager.deleteJob = function() {
                if (GuidedMode.enabled) {
                    if (confirm("This will remove the selected job and all its steps. You can undo this with Ctrl+Z.")) {
                        originalDeleteJob.apply(this, arguments);
                    }
                } else {
                    originalDeleteJob.apply(this, arguments);
                }
            };
            JobManager.deleteJob._patched = true;
        }
    },

    // Tracking hooks
    trackTabChange(tabName) {
        if (tabName === 'validation') {
            this.flags.viewedValidation = true;
            this.updateProgress();
        }
    },

    trackExport() {
        this.flags.exportedYaml = true;
        this.updateProgress();
    }
};

window.GuidedMode = GuidedMode;

// Integration with existing systems
document.addEventListener('DOMContentLoaded', () => {
    // Wait for all systems to load
    setTimeout(() => {
        const exp = localStorage.getItem('pipelinepro_experience');
        if (exp === 'beginner') {
            GuidedMode.enable();
        }
        
        // Hook into job creation
        if (window.JobManager) {
            const originalAddJob = window.JobManager.addJob;
            if (originalAddJob) {
                window.JobManager.addJob = function() {
                    originalAddJob.apply(this, arguments);
                    if (GuidedMode.enabled) GuidedMode.updateProgress();
                };
            }
            
            const originalSelectJob = window.JobManager.selectJob;
            if (originalSelectJob) {
                window.JobManager.selectJob = function() {
                    originalSelectJob.apply(this, arguments);
                    if (GuidedMode.enabled) GuidedMode.updateProgress();
                };
            }
        }
        
        // Hook into tab switching
        if (window.switchTab) {
            const originalSwitchTab = window.switchTab;
            window.switchTab = function(tabName) {
                originalSwitchTab.apply(this, arguments);
                if (GuidedMode.enabled) GuidedMode.trackTabChange(tabName);
            };
        } else if (window.UIManager && window.UIManager.switchTab) {
            const originalSwitchTab = window.UIManager.switchTab;
            window.UIManager.switchTab = function(tabName) {
                originalSwitchTab.apply(this, arguments);
                if (GuidedMode.enabled) GuidedMode.trackTabChange(tabName);
            };
        }

        // Hook into export
        if (window.exportYaml) {
            const originalExport = window.exportYaml;
            window.exportYaml = function() {
                originalExport.apply(this, arguments);
                if (GuidedMode.enabled) GuidedMode.trackExport();
            };
        } else if (window.YamlGenerator && window.YamlGenerator.exportYaml) {
            const originalExport = window.YamlGenerator.exportYaml;
            window.YamlGenerator.exportYaml = function() {
                originalExport.apply(this, arguments);
                if (GuidedMode.enabled) GuidedMode.trackExport();
            };
        }
    }, 500);
});
