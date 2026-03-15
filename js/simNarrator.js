const SimNarrator = {
    panel: null,
    body: null,
    startTime: 0,

    init() {
        console.log("SimNarrator initialized");
        this.hookSimulator();
    },

    hookSimulator() {
        if (window.Simulator && window.Simulator.simulatePipeline) {
            const originalSimulate = window.Simulator.simulatePipeline;
            const originalRunJob = window.Simulator.runJob;

            window.Simulator.simulatePipeline = async function() {
                SimNarrator.showPanel();
                SimNarrator.addEntry("Pipeline simulation started...", "info");
                
                // Temporarily disable the build-in alert by wrapping in try/catch if needed
                // or just let it happen. The original uses alert('Simulation completed successfully!');
                
                try {
                    await originalSimulate.apply(this, arguments);
                    SimNarrator.addSummary();
                } catch (e) {
                    SimNarrator.addEntry("Simulation encountered an unexpected problem.", "error");
                }
            };

            window.Simulator.runJob = async function(jobId) {
                const job = window.AppState.getJob(jobId);
                if (job) {
                    SimNarrator.narrateJobStart(job);
                }
                
                const result = await originalRunJob.apply(this, arguments);
                
                if (job) {
                    SimNarrator.addEntry(`Job <strong>${job.name}</strong> completed successfully.`, "success");
                }
                return result;
            };
        }
    },

    showPanel() {
        if (this.panel) this.panel.remove();

        this.panel = document.createElement('div');
        this.panel.className = 'sim-narrator-panel';
        this.panel.innerHTML = `
            <div class="sim-narrator-header">
                <span><i class="fas fa-comment-dots"></i> Simulation Guide</span>
                <span class="sim-narrator-close" onclick="SimNarrator.hidePanel()">&times;</span>
            </div>
            <div class="sim-narrator-body" id="sim-narrator-body"></div>
        `;

        document.body.appendChild(this.panel);
        this.body = document.getElementById('sim-narrator-body');
        this.startTime = Date.now();
    },

    hidePanel() {
        if (this.panel) {
            this.panel.classList.add('fade-out');
            setTimeout(() => {
                if (this.panel) this.panel.remove();
                this.panel = null;
                this.body = null;
            }, 300);
        }
    },

    addEntry(text, type = '') {
        if (!this.body) return;

        const entry = document.createElement('div');
        entry.className = `sim-narrator-entry ${type}`;
        entry.innerHTML = text;
        this.body.appendChild(entry);
        
        // Auto-scroll
        this.body.scrollTop = this.body.scrollHeight;
    },

    narrateJobStart(job) {
        let text = `Starting job: <strong>${job.name}</strong> on <strong>${job.os}</strong>.`;
        this.addEntry(text, "job-start");

        if (job.steps && job.steps.length > 0) {
            job.steps.forEach(step => {
                let stepDesc = "";
                if (step.type === 'checkout') {
                    stepDesc = "Downloading your source code from the repository.";
                } else if (step.type === 'run') {
                    // Try to get explanation from StepExplainer if it exists
                    if (window.StepExplainer && window.StepExplainer.commands) {
                        const cmd = step.val.split(' ')[0];
                        const explanation = window.StepExplainer.commands[cmd];
                        if (explanation) {
                            stepDesc = `Running command <code>${step.val}</code>: ${explanation.short}`;
                        } else {
                            stepDesc = `Executing command: <code>${step.val}</code>`;
                        }
                    } else {
                        stepDesc = `Executing command: <code>${step.val}</code>`;
                    }
                } else if (step.type === 'action') {
                    stepDesc = `Running pre-built action: <strong>${step.val}</strong>`;
                }

                if (stepDesc) {
                    setTimeout(() => {
                        this.addEntry(stepDesc, "step-run");
                    }, 500); // Slight offset for visual flow
                }
            });
        }
    },

    addSummary() {
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        const jobsCount = window.AppState.getAllJobs().length;
        
        const text = `
            <div style="font-size: 16px; margin-bottom: 5px;">Simulation Finished!</div>
            <div>All ${jobsCount} jobs passed in approx. ${duration}s (simulated).</div>
            <div style="margin-top: 10px; font-size: 11px; opacity: 0.8;">In a real environment, this might take several minutes depending on your code size.</div>
        `;
        
        this.addEntry(text, "summary");
    }
};

window.SimNarrator = SimNarrator;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => SimNarrator.init(), 2600);
});
