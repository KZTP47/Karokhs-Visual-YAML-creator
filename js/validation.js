/**
 * Enhanced Validation Module with AUTO-FIX BUTTONS!
 * Now includes smart detection of fixable empty steps
 */

const Validation = {
    /**
     * Validate job names for duplicates
     */
    validateNames() {
        const jobs = AppState.getAllJobs();
        const names = jobs.map(j => j.yamlId);
        const duplicates = names.filter((item, index) => names.indexOf(item) !== index);

        const errorMsg = document.getElementById('name-error-msg');
        NodeRenderer.clearAllErrors();

        if (duplicates.length > 0) {
            errorMsg.style.display = 'block';
            jobs.forEach(job => {
                if (duplicates.includes(job.yamlId)) {
                    NodeRenderer.markNodeAsError(job.internalId);
                }
            });
        } else {
            errorMsg.style.display = 'none';
        }

        this.updateValidation();
    },

    /**
     * Detect circular dependencies
     */
    detectCircularDependencies() {
        const jobs = AppState.getAllJobs();
        const connections = AppState.getConnections();
        
        const visited = new Set();
        const recursionStack = new Set();
        const cycles = [];

        const adj = {};
        jobs.forEach(j => {
            adj[j.internalId] = [];
        });

        connections.forEach(c => {
            adj[c.from].push(c.to);
        });

        const dfs = (nodeId, path = []) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);

            for (const neighbor of adj[nodeId]) {
                if (!visited.has(neighbor)) {
                    if (dfs(neighbor, [...path])) {
                        return true;
                    }
                } else if (recursionStack.has(neighbor)) {
                    const cycleStart = path.indexOf(neighbor);
                    const cycle = path.slice(cycleStart);
                    cycle.push(neighbor);
                    cycles.push(cycle);
                    return true;
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        jobs.forEach(job => {
            if (!visited.has(job.internalId)) {
                dfs(job.internalId);
            }
        });

        return cycles.length > 0 ? cycles : null;
    },

    /**
     * Validate DAG structure
     */
    validateDAG() {
        const cycles = this.detectCircularDependencies();
        
        if (cycles) {
            const cycleNames = cycles[0].map(id => {
                const job = AppState.getJob(id);
                return job ? job.name : 'Unknown';
            });

            return {
                valid: false,
                error: `${cycleNames.join(' -> ')}`
            };
        }

        return { valid: true };
    },

    /**
     * Check for empty commands (ENHANCED with auto-fix detection)
     */
    validateSteps() {
        const jobs = AppState.getAllJobs();
        const issues = [];

        jobs.forEach(job => {
            if (job.isExternal) return;

            job.steps.forEach((step, idx) => {
                if (step.type === 'run' && !step.val.trim()) {
                    // Check if this looks like it should be a checkout step
                    const isCheckoutName = step.name.toLowerCase().includes('checkout') ||
                                          step.name.toLowerCase().includes('clone') ||
                                          step.name.toLowerCase().includes('pull code') ||
                                          step.name.toLowerCase().includes('get code');
                    
                    issues.push({
                        jobId: job.internalId,
                        jobName: job.name,
                        stepIndex: idx + 1,
                        stepName: step.name,
                        message: `Step ${idx + 1} "${step.name}" has no command`,
                        isCheckoutLike: isCheckoutName,
                        autoFixable: isCheckoutName  // Can auto-fix if it looks like checkout
                    });
                }
                
                if (step.type === 'action' && !step.val.trim()) {
                    issues.push({
                        jobId: job.internalId,
                        jobName: job.name,
                        stepIndex: idx + 1,
                        stepName: step.name,
                        message: `Step ${idx + 1} "${step.name}" has no action specified`,
                        isCheckoutLike: false,
                        autoFixable: false
                    });
                }
            });
        });

        return issues;
    },

    /**
     * Validate logical flow
     */
    validateLogicalFlow() {
        const jobs = AppState.getAllJobs();
        const connections = AppState.getConnections();
        const warnings = [];

        const deployJobs = jobs.filter(j => j.stage === 'deploy');
        deployJobs.forEach(deployJob => {
            const hasTestDependency = connections.some(c => {
                if (c.to === deployJob.internalId) {
                    const parentJob = AppState.getJob(c.from);
                    return parentJob && (
                        parentJob.stage === 'test' ||
                        parentJob.category === 'unit' ||
                        parentJob.category === 'integration' ||
                        parentJob.category === 'e2e'
                    );
                }
                return false;
            });

            if (!hasTestDependency && jobs.some(j => j.stage === 'test' || j.category !== 'none')) {
                warnings.push({
                    type: 'deploy-without-tests',
                    jobName: deployJob.name,
                    message: `Deploy job "${deployJob.name}" should run after test jobs`
                });
            }
        });

        return warnings;
    },

    /**
     * Get fix suggestion
     */
    suggestFixes(issue) {
        const suggestions = {
            'circular-dependency': 'Remove one of the connections in the cycle to break the loop',
            'empty-command': 'Click the Help button to see command suggestions',
            'deploy-without-tests': 'Connect your test jobs to this deploy job to ensure tests pass first',
            'test-without-build': 'Connect your build job to this test job',
            'no-checkout': 'Add a "Checkout Code" step at the beginning',
            'no-artifacts': 'Add test reports or coverage files as artifacts'
        };

        return suggestions[issue] || 'Review your pipeline configuration';
    },

    /**
     * MAIN VALIDATION - now with AUTO-FIX BUTTONS including empty checkout detection!
     */
    updateValidation() {
        const results = document.getElementById('validation-results');
        results.innerHTML = '';

        const validations = [];
        const jobs = AppState.getAllJobs();
        const connections = AppState.getConnections();

        if (jobs.length === 0) {
            validations.push({
                type: 'warning',
                title: 'No jobs defined',
                desc: 'Your pipeline is empty. Use the Quick Start Wizard to get started.',
                fix: 'Click "Quick Start Wizard" to create a pipeline from a template'
            });
            this.renderValidations(validations);
            return;
        }

        // ========== STRUCTURAL VALIDATION ==========

        const dagValidation = this.validateDAG();
        if (!dagValidation.valid) {
            validations.push({
                type: 'error',
                title: 'Circular Dependency Detected',
                desc: dagValidation.error,
                fix: this.suggestFixes('circular-dependency')
            });
        } else {
            validations.push({
                type: 'success',
                title: 'Pipeline structure valid',
                desc: `${jobs.length} job(s) configured with valid dependencies`
            });
        }

        const duplicateNames = [];
        const nameMap = {};
        jobs.forEach(j => {
            if (nameMap[j.yamlId]) {
                duplicateNames.push(j.yamlId);
            } else {
                nameMap[j.yamlId] = true;
            }
        });

        if (duplicateNames.length > 0) {
            validations.push({
                type: 'error',
                title: 'Duplicate job names',
                desc: 'Jobs must have unique names: ' + duplicateNames.join(', '),
                fix: 'Rename duplicate jobs to have unique identifiers'
            });
        }

        // ========== ENHANCED STEP VALIDATION with AUTO-FIX ==========
        const stepIssues = this.validateSteps();
        if (stepIssues.length > 0) {
            stepIssues.forEach(issue => {
                if (issue.isCheckoutLike && issue.autoFixable) {
                    // This can be auto-fixed!
                    validations.push({
                        type: 'error',
                        title: 'Empty command in "' + issue.jobName + '"',
                        desc: issue.message + '. This appears to be a checkout step with the wrong type.',
                        fix: 'Convert this to a proper Checkout step',
                        jobId: issue.jobId,
                        fixType: 'fix-empty-checkout',
                        autoFixable: true
                    });
                } else {
                    // Manual fix required
                    validations.push({
                        type: 'error',
                        title: 'Empty command in "' + issue.jobName + '"',
                        desc: issue.message,
                        fix: 'Click the Help button to see command suggestions',
                        jobId: issue.jobId,
                        autoFixable: false
                    });
                }
            });
        }

        const jobsWithoutSteps = jobs.filter(j => !j.isExternal && j.steps.length === 0);
        if (jobsWithoutSteps.length > 0) {
            validations.push({
                type: 'error',
                title: 'Jobs without steps',
                desc: `${jobsWithoutSteps.length} job(s) have no steps configured`,
                fix: 'Click the job and add steps in the configuration panel'
            });
        }

        // ========== SEMANTIC VALIDATION (with auto-fix!) ==========
        
        if (typeof SemanticValidator !== 'undefined') {
            const semanticIssues = SemanticValidator.validatePipeline();
            validations.push(...semanticIssues);
        }

        // ========== GENERAL CHECKS ==========

        const hasTestJob = jobs.some(j =>
            j.category === 'unit' ||
            j.category === 'integration' ||
            j.category === 'e2e' ||
            j.steps.some(s => s.val && (
                s.val.includes('test') ||
                s.val.includes('jest') ||
                s.val.includes('pytest') ||
                s.val.includes('mocha')
            ))
        );

        if (!hasTestJob && jobs.length > 0) {
            validations.push({
                type: 'warning',
                title: 'No test jobs detected',
                desc: 'Your pipeline should include automated tests',
                fix: 'Add a test job or categorize existing jobs as Unit/Integration/E2E tests'
            });
        } else if (hasTestJob) {
            validations.push({
                type: 'success',
                title: 'Test jobs configured',
                desc: 'Your pipeline includes testing steps'
            });
        }

        const hasCoverage = jobs.some(j =>
            j.artifacts && j.artifacts.some(a =>
                a.includes('coverage') || a.includes('cov')
            )
        );

        if (hasTestJob && !hasCoverage) {
            validations.push({
                type: 'info',
                title: 'Consider adding coverage reports',
                desc: 'Saving test coverage helps track code quality over time',
                fix: 'Add "coverage/**" to artifacts in your test jobs'
            });
        }

        const flowWarnings = this.validateLogicalFlow();
        flowWarnings.forEach(warning => {
            validations.push({
                type: 'warning',
                title: 'Logical Flow Issue',
                desc: warning.message,
                fix: this.suggestFixes(warning.type)
            });
        });

        this.renderValidations(validations);
    },

    /**
     * Render validation results with AUTO-FIX BUTTONS!
     * FIXED: Now uses proper event delegation instead of broken inline onclick
     */
    renderValidations(validations) {
        const results = document.getElementById('validation-results');
        results.innerHTML = '';

        validations.forEach((v, index) => {
            const div = document.createElement('div');
            div.className = `validation-item ${v.type}`;

            let icon = 'CHECK';
            if (v.type === 'warning') icon = 'WARNING';
            if (v.type === 'error') icon = 'ERROR';
            if (v.type === 'info') icon = 'INFO';

            const iconDiv = document.createElement('div');
            iconDiv.className = 'validation-icon';
            iconDiv.textContent = icon;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'validation-content';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'validation-title';
            titleDiv.textContent = v.title;

            const descDiv = document.createElement('div');
            descDiv.className = 'validation-desc';
            descDiv.textContent = v.desc;

            contentDiv.appendChild(titleDiv);
            contentDiv.appendChild(descDiv);

            if (v.fix) {
                const fixDiv = document.createElement('div');
                fixDiv.className = 'validation-fix';
                fixDiv.textContent = v.fix;
                contentDiv.appendChild(fixDiv);
            }

            if (v.autoFixable) {
                const button = document.createElement('button');
                button.className = 'auto-fix-btn';
                button.innerHTML = '<i class="fas fa-magic"></i> Apply Fix';
                
                // Store issue data in the button element using data attribute
                button.dataset.issueData = JSON.stringify({
                    type: v.type,
                    title: v.title,
                    desc: v.desc,
                    fix: v.fix,
                    jobId: v.jobId,
                    fixType: v.fixType,
                    autoFixable: v.autoFixable
                });

                // Add click event listener directly to button
                button.addEventListener('click', function() {
                    try {
                        const issueData = JSON.parse(this.dataset.issueData);
                        AutoFixer.applyFix(issueData);
                    } catch (error) {
                        console.error('Error applying fix:', error);
                        alert('Error applying fix. Please try again.');
                    }
                });

                contentDiv.appendChild(button);
            }

            div.appendChild(iconDiv);
            div.appendChild(contentDiv);
            results.appendChild(div);
        });
    }
};

window.Validation = Validation;
