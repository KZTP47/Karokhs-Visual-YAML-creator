const MistakeDetector = {
    rules: [
        {
            id: 'test-before-install',
            check(job) {
                if (job.isExternal) return null;
                let installIdx = -1;
                let testIdx = -1;
                
                job.steps.forEach((s, i) => {
                    const cmd = (s.val || '').toLowerCase();
                    if (cmd.includes('install') || cmd.includes('npm ci') || cmd.includes('pip install')) {
                        if (installIdx === -1) installIdx = i;
                    }
                    if (cmd.includes('test') || cmd.includes('pytest') || cmd.includes('jest')) {
                        if (testIdx === -1) testIdx = i;
                    }
                });
                
                if (testIdx !== -1 && installIdx !== -1 && testIdx < installIdx) {
                    return { jobName: job.name, jobId: job.internalId };
                }
                return null;
            },
            title: 'Tests run before packages are installed',
            explanation: 'Your test step comes before the install step. Tests need packages to be installed first. Move the install step above the test step.',
            severity: 'error',
            fixLabel: 'Move Install Above Test'
        },
        {
            id: 'no-checkout-step',
            check(job) {
                if (job.isExternal) return null;
                if (job.steps.length === 0) return null;
                
                const hasCheckout = job.steps.some(s => 
                    s.type === 'checkout' || 
                    (s.val || '').toLowerCase().includes('actions/checkout') ||
                    (s.val || '').toLowerCase().includes('git clone')
                );
                
                if (!hasCheckout) {
                    return { jobName: job.name, jobId: job.internalId };
                }
                return null;
            },
            title: 'No code download step',
            explanation: 'This job does not download your code first. Without a checkout step, the job has no code to work with. Add "Checkout Code" as the first step.',
            severity: 'error',
            fixLabel: 'Add Checkout Step'
        },
        {
            id: 'npm-install-over-ci',
            check(job) {
                const hasInstall = job.steps.some(s => (s.val || '') === 'npm install');
                if (hasInstall) {
                    return { jobName: job.name, jobId: job.internalId };
                }
                return null;
            },
            title: 'Consider using "npm ci" instead of "npm install"',
            explanation: '"npm ci" is faster and more reliable in pipelines because it installs exact versions from package-lock.json. "npm install" can produce different results on different runs.',
            severity: 'info',
            fixLabel: 'Switch to npm ci'
        },
        {
            id: 'build-but-no-test',
            check(job) {
                if (job.stage !== 'test') return null;
                const hasBuild = job.steps.some(s => (s.val || '').toLowerCase().includes('build'));
                const hasTest = job.steps.some(s => (s.val || '').toLowerCase().includes('test'));
                
                if (hasBuild && !hasTest) {
                    return { jobName: job.name, jobId: job.internalId };
                }
                return null;
            },
            title: 'This test-stage job has no tests',
            explanation: 'This job is in the Test stage but it does not run any tests. Either add test steps or move it to the Build stage.',
            severity: 'warning'
        }
    ],

    init() {
        console.log("MistakeDetector initialized");
        this.hookValidation();
    },

    hookValidation() {
        if (window.Validation && window.Validation.updateValidation) {
            const originalUpdate = window.Validation.updateValidation;
            window.Validation.updateValidation = function() {
                originalUpdate.apply(this, arguments);
                MistakeDetector.detect();
            };
        }
    },

    detect() {
        const jobs = window.AppState.getAllJobs();
        const findings = [];

        jobs.forEach(job => {
            this.rules.forEach(rule => {
                const result = rule.check(job);
                if (result) {
                    findings.push({ rule, ...result });
                }
            });
        });

        if (findings.length > 0) {
            this.renderFindings(findings);
        }
    },

    renderFindings(findings) {
        const results = document.getElementById('validation-results');
        if (!results) return;

        findings.forEach(finding => {
            const { rule, jobName, jobId } = finding;
            
            const div = document.createElement('div');
            div.className = `validation-item ${rule.severity}`;
            
            let iconText = 'CHECK';
            if (rule.severity === 'warning') iconText = 'WARNING';
            if (rule.severity === 'error') iconText = 'ERROR';
            if (rule.severity === 'info') iconText = 'INFO';

            div.innerHTML = `
                <div class="validation-icon">${iconText}</div>
                <div class="validation-content">
                    <div class="validation-title">${rule.title} (${jobName})</div>
                    <div class="validation-desc">Possible mistake detected in your pipeline logic.</div>
                    <div class="mistake-explanation">
                        <strong>What went wrong?</strong><br>
                        ${rule.explanation}
                    </div>
                    ${rule.fixLabel ? `<button class="mistake-fix-btn" onclick="MistakeDetector.autoFix('${jobId}', '${rule.id}')">
                        <i class="fas fa-magic"></i> ${rule.fixLabel}
                    </button>` : ''}
                </div>
            `;
            results.appendChild(div);
        });
    },

    autoFix(jobId, ruleId) {
        const job = window.AppState.getJob(jobId);
        if (!job) return;

        let fixed = false;

        if (ruleId === 'test-before-install') {
            const installIdx = job.steps.findIndex(s => {
                const cmd = (s.val || '').toLowerCase();
                return cmd.includes('install') || cmd.includes('npm ci') || cmd.includes('pip install');
            });
            const testIdx = job.steps.findIndex(s => {
                const cmd = (s.val || '').toLowerCase();
                return cmd.includes('test') || cmd.includes('pytest') || cmd.includes('jest');
            });
            
            if (installIdx !== -1 && testIdx !== -1 && testIdx < installIdx) {
                const step = job.steps.splice(installIdx, 1)[0];
                job.steps.splice(testIdx, 0, step);
                fixed = true;
            }
        } else if (ruleId === 'no-checkout-step') {
            job.steps.unshift({ type: 'checkout', name: 'Checkout Code', val: '' });
            fixed = true;
        } else if (ruleId === 'npm-install-over-ci') {
            job.steps.forEach(s => {
                if ((s.val || '') === 'npm install') s.val = 'npm ci';
            });
            fixed = true;
        }

        if (fixed) {
            window.JobManager.renderStepsList(job);
            window.YamlGenerator.updateYaml();
            if (window.EnhancedUI && window.EnhancedUI.saveState) window.EnhancedUI.saveState();
            if (window.showNotification) window.showNotification("Mistake fixed automatically", "success");
        }
    }
};

window.MistakeDetector = MistakeDetector;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => MistakeDetector.init(), 1800);
});
