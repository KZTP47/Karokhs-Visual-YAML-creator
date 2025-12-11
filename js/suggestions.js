/**
 * Suggestions Module
 * Provides intelligent suggestions for pipeline improvements
 */

const Suggestions = {
    /**
     * Toggle suggestions panel visibility
     */
    toggleSuggestions() {
        const panel = document.getElementById('suggestions-panel');
        if (panel.style.display === 'block') {
            panel.style.display = 'none';
        } else {
            panel.style.display = 'block';
            this.updateSuggestions();
        }
    },

    /**
     * Update and display suggestions
     */
    updateSuggestions() {
        const list = document.getElementById('suggestions-list');
        list.innerHTML = '';

        const suggestions = this.generateSuggestions();

        if (suggestions.length === 0) {
            list.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-secondary);">âœ¨ Your pipeline looks great!</div>';
            return;
        }

        suggestions.forEach(s => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.onclick = s.action;
            div.innerHTML = `
                <div class="suggestion-title">
                    <span>${s.icon}</span>
                    <span>${s.title}</span>
                </div>
                <div class="suggestion-desc">${s.desc}</div>
            `;
            list.appendChild(div);
        });
    },

    /**
     * Generate suggestions based on current pipeline state
     */
    generateSuggestions() {
        const suggestions = [];
        const jobs = AppState.getAllJobs();
        const connections = AppState.getConnections();

        // Suggest starting with a template if empty
        if (jobs.length === 0) {
            suggestions.push({
                icon: '',
                title: 'Start with a template',
                desc: 'Use the Quick Start Wizard for pre-configured pipelines',
                action: () => Wizard.openWizard()
            });
            return suggestions;
        }

        // Check for checkout step
        const hasCheckoutStep = jobs.some(j =>
            j.steps.some(s => s.type === 'checkout')
        );

        if (!hasCheckoutStep && jobs.length > 0) {
            suggestions.push({
                icon: '',
                title: 'Add checkout step',
                desc: 'Most jobs need to checkout code first',
                action: () => {
                    if (AppState.selectedId) {
                        const job = AppState.getJob(AppState.selectedId);
                        if (!job.steps.some(s => s.type === 'checkout')) {
                            job.steps.unshift({ type: 'checkout', name: 'Checkout Code', val: '' });
                            JobManager.renderStepsList(job);
                            YamlGenerator.updateYaml();
                        }
                    }
                }
            });
        }

        // Check for caching
        const hasCaching = jobs.some(j =>
            j.steps.some(s =>
                s.val && (s.val.includes('cache') || s.type === 'action' && s.val.includes('cache'))
            )
        );

        if (!hasCaching && jobs.length > 2) {
            suggestions.push({
                icon: '',
                title: 'Add dependency caching',
                desc: 'Speed up builds by caching node_modules or pip packages',
                action: () => alert('Add a caching action/step to your build job')
            });
        }

        // Check for parallel testing
        const hasParallelTests = jobs.some(j => j.matrix);

        if (!hasParallelTests && jobs.filter(j => j.category === 'unit' || j.category === 'integration').length >= 2) {
            suggestions.push({
                icon: '',
                title: 'Enable parallel testing',
                desc: 'Run tests faster with matrix builds',
                action: () => {
                    if (AppState.selectedId) {
                        const job = AppState.getJob(AppState.selectedId);
                        if (!job.matrix) {
                            job.matrix = { version: ['14', '16', '18'] };
                            JobManager.renderMatrixConfig(job);
                            YamlGenerator.updateYaml();
                        }
                    }
                }
            });
        }

        // Check for disconnected jobs
        const disconnectedJobs = jobs.filter(j =>
            jobs.length > 1 &&
            !connections.some(c => c.from === j.internalId || c.to === j.internalId)
        );

        if (disconnectedJobs.length > 1) {
            suggestions.push({
                icon: '',
                title: 'Connect your jobs',
                desc: 'Create dependencies between jobs to control execution order',
                action: () => LayoutManager.autoLayout()
            });
        }

        // Check for artifacts
        const hasArtifacts = jobs.some(j => j.artifacts && j.artifacts.length > 0);
        const hasTestJobs = jobs.some(j =>
            j.category === 'unit' ||
            j.category === 'integration' ||
            j.category === 'e2e'
        );

        if (hasTestJobs && !hasArtifacts) {
            suggestions.push({
                icon: '',
                title: 'Save test artifacts',
                desc: 'Upload test reports and coverage data',
                action: () => {
                    if (AppState.selectedId) {
                        const job = AppState.getJob(AppState.selectedId);
                        if (!job.artifacts) job.artifacts = [];
                        job.artifacts.push('test-results/**');
                        JobManager.renderArtifactsList(job);
                        YamlGenerator.updateYaml();
                    }
                }
            });
        }

        // Check for retry configuration on flaky tests
        const hasRetry = jobs.some(j => j.retry);
        const hasE2E = jobs.some(j => j.category === 'e2e');

        if (hasE2E && !hasRetry) {
            suggestions.push({
                icon: '',
                title: 'Add retry for E2E tests',
                desc: 'E2E tests can be flaky - consider adding retry logic',
                action: () => {
                    if (AppState.selectedId) {
                        const job = AppState.getJob(AppState.selectedId);
                        if (!job.retry && job.category === 'e2e') {
                            job.retry = { attempts: 2 };
                            JobManager.renderRetryConfig(job);
                            YamlGenerator.updateYaml();
                        }
                    }
                }
            });
        }

        // Check for environment variables
        const hasEnvVars = jobs.some(j => j.envVars && j.envVars.length > 0);

        if (jobs.length > 2 && !hasEnvVars) {
            suggestions.push({
                icon: '',
                title: 'Configure environment variables',
                desc: 'Store API keys, database URLs, and other configuration',
                action: () => {
                    if (AppState.selectedId) {
                        JobManager.addEnvVar();
                    }
                }
            });
        }

        // Check for build job
        const hasBuildJob = jobs.some(j =>
            j.stage === 'build' ||
            j.steps.some(s => s.val && (s.val.includes('build') || s.val.includes('compile')))
        );

        if (jobs.length > 2 && !hasBuildJob) {
            suggestions.push({
                icon: '',
                title: 'Add build job',
                desc: 'Separate building from testing for better pipeline organization',
                action: () => JobManager.addJob()
            });
        }

        // Check for deployment
        const hasDeployJob = jobs.some(j =>
            j.stage === 'deploy' ||
            j.steps.some(s => s.val && s.val.includes('deploy'))
        );

        if (hasTestJobs && !hasDeployJob && jobs.length > 3) {
            suggestions.push({
                icon: '',
                title: 'Add deployment job',
                desc: 'Automatically deploy after successful tests',
                action: () => JobManager.addJob()
            });
        }

        return suggestions;
    }
};

// Make it available globally
window.Suggestions = Suggestions;
