/**
 * ENHANCED Wizard Module
 * Now intelligently applies configurations - won't add pointless matrix configs!
 */

const Wizard = {
    /**
     * Open the wizard modal
     */
    openWizard() {
        document.getElementById('wizard-modal').style.display = 'flex';
        AppState.setWizardStep(1);
        this.renderTemplateGrid();
        this.showWizardStep(1);
    },

    /**
     * Close the wizard modal
     */
    closeWizard() {
        document.getElementById('wizard-modal').style.display = 'none';
        AppState.setWizardStep(1);
        AppState.setSelectedTemplate(null);
    },

    /**
     * Render template selection grid
     */
    renderTemplateGrid() {
        const grid = document.getElementById('template-grid');
        grid.innerHTML = '';

        getTemplateKeys().forEach(key => {
            const template = getTemplate(key);
            const card = document.createElement('div');
            card.className = 'template-card';
            card.onclick = () => this.selectTemplate(key, card);
            card.innerHTML = `
                <div class="template-icon">${template.icon}</div>
                <div class="template-name">${template.name}</div>
                <div class="template-desc">${template.description}</div>
            `;
            grid.appendChild(card);
        });
    },

    /**
     * Select a template
     */
    selectTemplate(key, cardElement) {
        document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
        cardElement.classList.add('selected');
        AppState.setSelectedTemplate(key);
    },

    /**
     * Show a specific wizard step
     */
    showWizardStep(step) {
        document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
        document.getElementById('wizard-step-' + step).classList.add('active');

        document.getElementById('wizard-back-btn').style.display = step > 1 ? 'block' : 'none';
        document.getElementById('wizard-next-btn').style.display = step < 3 ? 'block' : 'none';
        document.getElementById('wizard-finish-btn').style.display = step === 3 ? 'block' : 'none';
    },

    /**
     * Go to next wizard step
     */
    wizardNext() {
        const currentStep = AppState.wizardStep;

        if (currentStep === 1 && !AppState.selectedTemplate) {
            alert('Please select a template first');
            return;
        }

        AppState.setWizardStep(currentStep + 1);
        this.showWizardStep(currentStep + 1);
    },

    /**
     * Go to previous wizard step
     */
    wizardBack() {
        const currentStep = AppState.wizardStep;
        AppState.setWizardStep(currentStep - 1);
        this.showWizardStep(currentStep - 1);
    },

    /**
     * Finish wizard and create pipeline
     */
    wizardFinish() {
        const template = getTemplate(AppState.selectedTemplate);
        if (!template) return;

        // Clear existing pipeline
        UIManager.clearAll();

        // Update pipeline settings
        AppState.pipeline.branch = document.getElementById('wizard-branch').value || 'main';

        // Create jobs from template with proper positioning
        const jobsByStage = {};
        const createdJobs = [];
        
        template.jobs.forEach((jobTemplate, idx) => {
            const job = {
                internalId: 'node_' + Date.now() + '_' + idx,
                yamlId: jobTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                name: jobTemplate.name,
                os: jobTemplate.os,
                stage: jobTemplate.stage,
                category: jobTemplate.category || 'none',
                x: 0,
                y: 0,
                steps: JSON.parse(JSON.stringify(jobTemplate.steps || [])),
                isExternal: false,
                envVars: jobTemplate.envVars || [],
                artifacts: jobTemplate.artifacts || [],
                matrix: jobTemplate.matrix || null,
                retry: jobTemplate.retry || null
            };

            // Group by stage for layout
            if (!jobsByStage[job.stage]) {
                jobsByStage[job.stage] = [];
            }
            jobsByStage[job.stage].push(job);
            createdJobs.push(job);

            AppState.addJob(job);
        });

        // Layout jobs by stage
        this.layoutJobsByStage(jobsByStage);

        // Render all jobs
        createdJobs.forEach(job => {
            NodeRenderer.renderNode(job);
        });

        // Auto-connect jobs based on stage flow
        this.autoConnectJobsByStage(createdJobs);

        // Apply INTELLIGENT wizard configurations
        this.applyWizardConfigurations();

        UIManager.checkEmptyState();
        YamlGenerator.updateYaml();
        Validation.updateValidation();
        this.closeWizard();

        // Show success guide
        setTimeout(() => {
            this.showWelcomeGuide(createdJobs.length);
        }, 300);
    },

    /**
     * Layout jobs by stage
     */
    layoutJobsByStage(jobsByStage) {
        const stageOrder = AppState.pipeline.stages;
        const stageGap = 400;
        const jobGap = 180;
        const startX = 100;
        const startY = 100;

        let currentX = startX;

        stageOrder.forEach(stage => {
            const stageJobs = jobsByStage[stage] || [];
            if (stageJobs.length === 0) return;

            const centerY = startY + (stageJobs.length > 1 ? 0 : jobGap);

            stageJobs.forEach((job, idx) => {
                job.x = currentX;
                job.y = centerY + (idx * jobGap);
            });

            currentX += stageGap;
        });
    },

    /**
     * Auto-connect jobs by stage
     */
    autoConnectJobsByStage(jobs) {
        const stageOrder = AppState.pipeline.stages;
        const jobsByStage = {};

        jobs.forEach(job => {
            if (!jobsByStage[job.stage]) {
                jobsByStage[job.stage] = [];
            }
            jobsByStage[job.stage].push(job);
        });

        // Connect each stage to next stage
        for (let i = 0; i < stageOrder.length - 1; i++) {
            const currentStage = stageOrder[i];
            const nextStage = stageOrder[i + 1];

            const currentJobs = jobsByStage[currentStage] || [];
            const nextJobs = jobsByStage[nextStage] || [];

            currentJobs.forEach(currentJob => {
                nextJobs.forEach(nextJob => {
                    AppState.addConnection(currentJob.internalId, nextJob.internalId);
                });
            });
        }

        ConnectionManager.drawLines();
    },

    /**
     * SMART wizard configuration - only applies where it makes sense!
     */
    applyWizardConfigurations() {
        const codeCoverage = document.getElementById('wizard-code-coverage').checked;
        const parallel = document.getElementById('wizard-parallel').checked;
        const retry = document.getElementById('wizard-retry').checked;
        const projectType = document.getElementById('wizard-project-type').value;

        AppState.getAllJobs().forEach(job => {
            // Add code coverage ONLY to unit test jobs
            if (codeCoverage && job.category === 'unit') {
                if (!job.artifacts) job.artifacts = [];
                if (!job.artifacts.some(a => a.includes('coverage'))) {
                    job.artifacts.push('coverage/**');
                }
            }

            // Add matrix ONLY to jobs that actually run tests
            if (parallel && (job.category === 'unit' || job.category === 'integration')) {
                // Check if this job ACTUALLY runs tests (not Docker scans, not builds)
                const isActualTest = job.steps.some(s => 
                    s.val && (
                        s.val.includes('npm test') ||
                        s.val.includes('npm run test') ||
                        s.val.includes('jest') ||
                        s.val.includes('pytest') ||
                        s.val.includes('mvn test') ||
                        s.val.includes('gradle test') ||
                        s.val.includes('go test') ||
                        s.val.includes('dotnet test') ||
                        s.val.includes('rspec')
                    )
                );

                // DON'T add matrix to Docker scans or builds!
                const isDockerScan = job.steps.some(s => 
                    s.val && s.val.includes('docker scan')
                );

                const isBuild = job.steps.some(s => 
                    s.val && s.val.includes('docker build')
                );

                if (isActualTest && !isDockerScan && !isBuild && !job.matrix) {
                    // Add appropriate matrix based on project type
                    if (projectType === 'nodejs') {
                        job.matrix = { node: ['16', '18', '20'] };
                    } else if (projectType === 'python') {
                        job.matrix = { python: ['3.9', '3.10', '3.11'] };
                    } else if (projectType === 'java') {
                        job.matrix = { java: ['11', '17', '21'] };
                    } else if (projectType === 'ruby') {
                        job.matrix = { ruby: ['3.0', '3.1', '3.2'] };
                    }
                }
            }

            // Add retry ONLY to E2E and integration tests (flaky tests)
            if (retry && (job.category === 'e2e' || job.category === 'integration')) {
                if (!job.retry) {
                    job.retry = { attempts: 2 };
                }
            }

            // Add notifications option (if enabled)
            const notifications = document.getElementById('wizard-notifications').checked;
            if (notifications && job.stage === 'test') {
                // Add a notification step at the end if tests fail
                const hasNotification = job.steps.some(s => 
                    s.val && s.val.includes('slack') || s.val.includes('notify')
                );
                
                if (!hasNotification) {
                    // Note: This would require action step support
                    // For now, just flag it for the user to add manually
                }
            }
        });
    },

    /**
     * Show welcome guide after pipeline creation
     */
    showWelcomeGuide(jobCount) {
        const message = `✅ Pipeline Created Successfully!

📊 ${jobCount} jobs created and automatically connected
🔗 Jobs linked by stages: build → test → deploy
🎯 Click any job to customize
💡 Check "Validation" tab for any improvements

Next Steps:
1. Review the "Validation" tab (it now checks if your pipeline will ACTUALLY work!)
2. Click "Simulate" to preview execution
3. Customize jobs as needed
4. Export YAML when ready!`;

        alert(message);
        
        // Switch to validation tab to show semantic checks
        UIManager.switchTab('validation');
    }
};

// Make it available globally
window.Wizard = Wizard;
