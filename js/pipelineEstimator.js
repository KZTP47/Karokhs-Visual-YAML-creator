const PipelineEstimator = {
    stepTimes: {
        'checkout': 10,
        'run': 30,
        'action': 20
    },

    commandTimes: {
        'npm ci': 45,
        'npm install': 60,
        'npm test': 90,
        'npm run build': 120,
        'npm run lint': 30,
        'pytest': 60,
        'pip install': 40,
        'mvn test': 180,
        'docker build': 120,
        'npx cypress run': 300,
        'npm audit': 15
    },

    init() {
        console.log("PipelineEstimator initialized");
        this.injectWidget();
        this.hookUpdateYaml();
        this.update();
    },

    hookUpdateYaml() {
        if (window.YamlGenerator && window.YamlGenerator.updateYaml) {
            const originalUpdate = window.YamlGenerator.updateYaml;
            window.YamlGenerator.updateYaml = function() {
                originalUpdate.apply(this, arguments);
                try {
                    PipelineEstimator.update();
                } catch (e) {
                    console.log('PipelineEstimator error:', e);
                }
            };
        }
    },

    injectWidget() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        // Find a good place, maybe above the global config or at the bottom
        const container = document.createElement('div');
        container.id = 'estimator-container';
        sidebar.appendChild(container);
    },

    update() {
        const container = document.getElementById('estimator-container');
        if (!container) return;

        const estimate = this.calculate();
        if (!estimate) {
            container.innerHTML = '';
            return;
        }

        const freeTierLimit = 2000; // minutes
        const monthlyMinutes = estimate.billableMinutes * 30; // Assuming 1 run/day
        const percentage = Math.min(100, (monthlyMinutes / freeTierLimit) * 100);
        
        let colorClass = 'green';
        if (percentage > 50) colorClass = 'yellow';
        if (percentage > 90) colorClass = 'red';

        container.innerHTML = `
            <div class="estimator-widget">
                <div class="estimator-title">
                    <i class="fas fa-calculator"></i> Efficiency Estimator
                </div>
                <div class="estimator-row">
                    <span>Estimated run time:</span>
                    <span class="estimator-value">~${this.formatTime(estimate.totalTime)}</span>
                </div>
                <div class="estimator-row">
                    <span>Billable minutes / run:</span>
                    <span class="estimator-value">${estimate.billableMinutes} min</span>
                </div>
                <div class="estimator-row">
                    <span>Monthly (1 run/day):</span>
                    <span class="estimator-value">${monthlyMinutes} / ${freeTierLimit} min</span>
                </div>
                <div class="estimator-bar">
                    <div class="estimator-bar-fill ${colorClass}" style="width: ${percentage}%"></div>
                </div>
                <div class="estimator-note">
                    * Estimates are based on average CI performance.
                </div>
            </div>
        `;
    },

    calculate() {
        const jobs = window.AppState.getAllJobs();
        if (jobs.length === 0) return null;

        let totalBillableSeconds = 0;
        const jobTimes = {};

        jobs.forEach(job => {
            let jobSeconds = 0;
            if (job.isExternal) {
                jobSeconds = 60; // Placeholder for external templates
            } else {
                job.steps.forEach(step => {
                    let stepSec = this.stepTimes[step.type] || 20;
                    
                    // Specific command overrides
                    for (const cmd in this.commandTimes) {
                        if (step.val.includes(cmd)) {
                            stepSec = this.commandTimes[cmd];
                            break;
                        }
                    }
                    jobSeconds += stepSec;
                });

                // Matrix multiplier
                if (job.matrix) {
                    let combinations = 1;
                    Object.values(job.matrix).forEach(vals => {
                        if (Array.isArray(vals)) combinations *= vals.length;
                    });
                    jobSeconds *= combinations;
                }

                // Retry overhead
                if (job.retry) {
                    jobSeconds *= 1.1; // 10% overhead for potential retries
                }
            }

            jobTimes[job.internalId] = jobSeconds;
            totalBillableSeconds += jobSeconds;
        });

        // Calculate critical path (total wall-clock time)
        // This is a simplification: sum of max job per stage
        const stages = (window.AppState.pipeline && window.AppState.pipeline.stages) || ['build', 'test', 'deploy'];
        let criticalPathTime = 0;
        stages.forEach(stage => {
            const stageJobs = jobs.filter(j => j.stage === stage);
            if (stageJobs.length > 0) {
                const maxInStage = Math.max(...stageJobs.map(j => jobTimes[j.internalId]));
                criticalPathTime += maxInStage;
            }
        });

        return {
            totalTime: criticalPathTime,
            billableMinutes: Math.ceil(totalBillableSeconds / 60)
        };
    },

    formatTime(seconds) {
        if (seconds < 60) return seconds + 's';
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
};

window.PipelineEstimator = PipelineEstimator;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => PipelineEstimator.init(), 2100);
});
